import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { filterConstructionSource } from '@mk3008/serene/filter';

// Reuse the committed PR #4 fixture, not a new AI cohort or a production dependency.
const expected = {
  'operations.ts': [['listOpenTickets', 12], ['findTicketById', 22], ['assignTicket', 32], ['closeResolvedTickets', 42]],
  'reporting.ts': [['loadRequesterHistory', 12], ['countQueueByPriority', 22]],
  'maintenance.ts': [['reopenTicket', 12]],
};

test('production boundary gate: seven hidden bodies, ten represented hits, all remaining source exact', t => {
  let ordinary = 0, hits = 0, visibleHits = 0;
  const bytes = [];
  for (const [file, names] of Object.entries(expected)) {
    const source = readFileSync(new URL(`../evaluation/end-to-end/tasks/ticketing/serene/${file}`, import.meta.url), 'utf8');
    const snapshot = { file, revision: 'r1', source };
    const ranges = [{ start: 0, end: source.length, text: source }];
    const result = filterConstructionSource(snapshot, { ...snapshot, ranges });
    assert.equal(result.filtered, true);
    const parts = result.ranges[0].parts;
    const markers = parts.filter(p => p.kind === 'ordinary');
    assert.deepEqual(markers.map(p => [p.function, p.sites[0].line]), names);
    for (const [name, line] of names) {
      const start = source.indexOf(`export async function ${name}(`);
      const end = source.indexOf('\n}', start) + 2;
      const marker = markers.find(p => p.function === name);
      assert.deepEqual([marker.start, marker.end], [start, end]);
      assert.deepEqual(marker.sites, [{ line, column: 9 }]);
      for (const p of parts.filter(p => p.kind === 'source')) {
        assert(p.end <= start || p.start >= end, 'no ordinary body offset may remain source-visible');
      }
    }
    // Parts form an exact partition: no actionable/unmatched byte or neighboring trivia is lost.
    let cursor = 0;
    for (const p of parts) {
      assert.equal(p.start, cursor);
      if (p.kind === 'source') assert.equal(p.text, source.slice(p.start, p.end));
      cursor = p.end;
    }
    assert.equal(cursor, source.length);
    const search = [];
    let offset = 0;
    for (const text of source.split('\n')) {
      if (/\bdb\.(query|execute|sendSql)\(/.test(text)) search.push({ start: offset, end: offset + text.length, text });
      offset += text.length + 1;
    }
    const filteredSearch = filterConstructionSource(snapshot, { ...snapshot, ranges: search });
    assert.equal(filteredSearch.ranges.length, search.length);
    for (let i = 0; i < search.length; i++) {
      const item = filteredSearch.ranges[i];
      assert.deepEqual([item.start, item.end], [search[i].start, search[i].end]);
      if (item.parts.some(p => p.kind === 'ordinary')) ordinary++;
      else { assert.equal(item.parts.map(p => p.text).join(''), search[i].text); visibleHits++; }
    }
    hits += search.length;
    assert.deepEqual(filterConstructionSource(snapshot, { ...snapshot, ranges }), result);
    const stale = filterConstructionSource(snapshot, { ...snapshot, revision: 'r2', ranges });
    assert.deepEqual(stale.ranges, ranges);
    bytes.push({ file, rawBytes: Buffer.byteLength(JSON.stringify({ ranges })), filteredBytes: Buffer.byteLength(JSON.stringify(result)) });
  }
  assert.deepEqual({ ordinary, hits, visibleHits }, { ordinary: 7, hits: 10, visibleHits: 3 });
  assert(bytes.reduce((n, b) => n + b.filteredBytes, 0) < bytes.reduce((n, b) => n + b.rawBytes, 0));
  t.diagnostic(JSON.stringify({ ordinaryBodiesExposed: 0, representedHits: hits, preservedNonordinaryHits: visibleHits, bytes }));
});
