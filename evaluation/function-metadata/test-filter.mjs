import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { filterRows } from './filter.mjs';

const load = p => readFileSync(new URL(p, import.meta.url), 'utf8');
const rows = (source, file) => source.split(/\r?\n/).map((text, i) => ({ file, line: i + 1, text }));
const visibleText = output => output.rows.map(r => r.text ?? r.parts?.map(p => p.text).join('') ?? '').join('\n');
const cases = JSON.parse(load('./adversarial/cases.json')).cases;
for (const c of cases) test(c.id, () => {
  const source = load('./adversarial/' + c.file);
  const output = filterRows(source, c.file, 'a'.repeat(40), rows(source, c.file));
  assert.equal(output.inputRecords, output.representedRecords);
  assert.equal(output.correspondence.length, rows(source,c.file).length);
  for (const map of output.correspondence) {
    assert(map.outputs.length > 0);
    for (const o of map.outputs) assert(o >= 0 && o < output.rows.length);
  }
  assert.deepEqual(output.masks.map(m => [m.startLine,m.endLine]),
    c.maskableSpans.map(s => [s.start.line,s.end.line]));
  for (const span of c.nonmaskableSpans) {
    if (!span.start) { assert.equal(output.masks.length, 0); continue; }
    const lines = source.split(/\r?\n/);
    for (let line = span.start.line; line <= span.end.line; line++) {
      const begin = line === span.start.line ? span.start.column - 1 : 0;
      const end = line === span.end.line ? span.end.column - 1 : lines[line - 1].length;
      const expected = lines[line-1].slice(begin,end);
      if (expected.trim()) assert(visibleText(output).includes(expected), c.id + ' lost source');
    }
  }
  for (const m of output.masks) {
    assert(!visibleText(output).includes(source.slice(m.start,m.end)));
    // No SQL template contents from a compressed function may leak.
    for (const line of source.slice(m.start,m.end).split('\n').filter(s=>/SELECT|INSERT|UPDATE|DELETE/.test(s)))
      assert(!visibleText(output).includes(line.trim()), c.id + ' leaked SQL');
  }
});

test('stale snapshot and altered primitive records never get ordinary suppression', () => {
  const source=load('./adversarial/ordinary-fixed.ts'),file='ordinary-fixed.ts',input=rows(source,file);
  assert.deepEqual(filterRows(source,file,'old',input,false).rows,input);
  const changed=input.map(r=>({...r,text:'unverified '+r.text}));
  assert.deepEqual(filterRows(source,file,'revision',changed).rows,changed);
});

test('default-argument hidden execution remains visible', () => {
  const source=load('./adversarial/ordinary-fixed.ts').replace('id: string','id: string = db.query("select " + input)');
  assert.equal(filterRows(source,'default.ts','rev',rows(source,'default.ts')).masks.length,0);
});

test('real ten-site primitive hits preserve candidates and compress full reads', () => {
  let primitive=0, represented=0, ordinary=0, retained=0, rawBytes=0, filteredBytes=0;
  for (const file of ['operations.ts','reporting.ts','maintenance.ts']) {
    const source=load('../end-to-end/tasks/ticketing/serene/'+file);
    const input=rows(source,file).filter(r=>/\bdb\.(query|execute|sendSql)\(/.test(r.text));
    const output=filterRows(source,file,'rev',input);
    primitive+=input.length;represented+=output.representedRecords;
    ordinary+=output.rows.filter(r=>r.ordinary).length;
    retained+=output.rows.filter(r=>!r.ordinary).length;
    const full=rows(source,file),masked=filterRows(source,file,'rev',full);
    rawBytes+=Buffer.byteLength(JSON.stringify({rows:full}));
    filteredBytes+=Buffer.byteLength(JSON.stringify({rows:masked.rows}));
  }
  assert.deepEqual({primitive,represented,ordinary,retained},{primitive:10,represented:10,ordinary:7,retained:3});
  assert(filteredBytes < rawBytes * 0.65, 'full source response must shrink meaningfully');
});


test('function metadata is authoritative at all seven ordinary ticketing sites', () => {
  const expected = new Map([
    ['operations.ts:12','listOpenTickets'], ['operations.ts:22','findTicketById'],
    ['operations.ts:32','assignTicket'], ['operations.ts:42','closeResolvedTickets'],
    ['reporting.ts:12','loadRequesterHistory'], ['reporting.ts:22','countQueueByPriority'],
    ['maintenance.ts:12','reopenTicket'],
  ]);
  const seen = new Map();
  for (const file of ['operations.ts','reporting.ts','maintenance.ts']) {
    const source = load('../end-to-end/tasks/ticketing/serene/' + file);
    const result = filterRows(source, file, 'rev', rows(source, file));
    for (const marker of result.rows.filter(r => r.ordinary)) for (const site of marker.sites)
      seen.set(`${file}:${site.line}`, site.function);
  }
  assert.deepEqual(seen, expected);
});

test('metadata adds only deterministic site fields and bounded wire overhead', () => {
  const source = load('../end-to-end/tasks/ticketing/serene/operations.ts');
  const current = filterRows(source, 'operations.ts', 'rev', rows(source, 'operations.ts'));
  const legacy = structuredClone(current);
  for (const marker of legacy.rows.filter(r => r.ordinary)) for (const site of marker.sites) delete site.function;
  assert.deepEqual(current.masks.map(m => [m.startLine,m.endLine]), legacy.masks.map(m => [m.startLine,m.endLine]));
  assert.deepEqual(current.rows.map(r => r.ordinary ? ['ordinary',r.file,r.sites.map(s => [s.line,s.column])] : ['text',r.file,r.line,r.parts]),
    legacy.rows.map(r => r.ordinary ? ['ordinary',r.file,r.sites.map(s => [s.line,s.column])] : ['text',r.file,r.line,r.parts]));
  const before = Buffer.byteLength(JSON.stringify(legacy.rows)), after = Buffer.byteLength(JSON.stringify(current.rows));
  const expectedOverhead = [...current.rows.filter(r => r.ordinary)].flatMap(r => r.sites).reduce((n, site) => n + Buffer.byteLength(',' + JSON.stringify({ function: site.function }).slice(1, -1)), 0);
  assert.equal(after - before, expectedOverhead);
  assert(after < before * 1.25);
});
