import { sql, bind, sort, orderBy, type Sql, type ParameterStyle } from '../src/index.js';
const stmt: Sql = sql`SELECT :id`;
const selection: readonly string[] = ['id'];
const q = bind(orderBy(stmt, { id: sort`id DESC` }, selection), { id: 1 }, 'indexed');
const text: string = q.text;
const source: string = stmt.sourceText;
const driverValues: unknown[] = q.values;
const params: Readonly<Record<string, unknown>> = q.params;
for (const style of ['indexed', 'anonymous'] satisfies ParameterStyle[]) bind(stmt, { id: 1 }, style);
void text; void source; void driverValues; void params;
// @ts-expect-error Runtime strings cannot be passed as SQL.
bind('SELECT 1');
// @ts-expect-error Shape is not provenance.
const forged: Sql = { sourceText: 'SELECT 1' };
// @ts-expect-error SQL interpolation is prohibited.
sql`SELECT ${1}`;
// @ts-expect-error Sort interpolation is prohibited.
sort`${'id'}`;
// @ts-expect-error Strings cannot stand in for sort tokens.
orderBy(stmt, { id: 'id ASC' }, 'id');
// @ts-expect-error Literal-only tag does not accept strings.
sql('SELECT 1');
// @ts-expect-error Database names are not parameter contracts.
bind(stmt, { id: 1 }, 'postgres');
// @ts-expect-error Selection is restricted to keys.
orderBy(stmt, { id: sort`id` }, [1]);
// @ts-expect-error Canonical source cannot be overwritten.
stmt.sourceText = 'SELECT 2';
// @ts-expect-error Named parameter snapshot is read-only.
q.params.id = 2;
// @ts-expect-error Database-specific tags were removed.
import { postgres, mysql, mssql, type Dialect } from '../src/index.js';

const native = bind(sql`SELECT [customer:id], @id, @@ROWCOUNT`, { id: 1 });
bind(stmt, { id: 1 }, undefined);
void native;
// @ts-expect-error No legacy named style remains.
bind(stmt, { id: 1 }, 'named');
// @ts-expect-error No legacy at-named conversion remains.
bind(stmt, { id: 1 }, 'at-named');
// @ts-expect-error Passthrough is omission, not another ParameterStyle.
bind(stmt, { id: 1 }, 'passthrough');

import { filterConstructionSource, type SourceSnapshot, type FilterResult } from '@mk3008/serene/filter';
const snapshot: SourceSnapshot = { file: 'app.ts', revision: 'r1', source: '' };
const filtered: FilterResult = filterConstructionSource(snapshot, { ...snapshot, ranges: [] });
if (filtered.filtered) {
  for (const range of filtered.ranges) for (const part of range.parts) {
    if (part.kind === 'ordinary') { const name: string | null = part.function; void name; }
    else { const text: string = part.text; void text; }
  }
}
// @ts-expect-error A revision is required, not an optional freshness flag.
filterConstructionSource({ file: 'app.ts', source: '' }, { ...snapshot, ranges: [] });
// @ts-expect-error Ranges need exact text as well as offsets.
filterConstructionSource(snapshot, { ...snapshot, ranges: [{ start: 0, end: 1 }] });

import { filterConstructionDiff, type DiffSnapshot, type DiffFilterResult } from '@mk3008/serene/filter';
const diffSnapshot: DiffSnapshot = { base: snapshot, head: { ...snapshot, revision: 'r2' } };
const diffResult: DiffFilterResult = filterConstructionDiff(diffSnapshot, { ...diffSnapshot, changes: [] });
for (const change of diffResult.changes) {
  if (change.kind === 'ordinary') {
    const revision: string = change.head.function.revision;
    const kind: 'addition' | 'deletion' | 'modification' = change.change;
    void revision; void kind;
    // @ts-expect-error Suppressed source must not be available on an ordinary change.
    change.head.text;
  } else { const original: string = change.base.text; void original; }
}
// @ts-expect-error Both current full-source contexts are mandatory.
filterConstructionDiff(diffSnapshot, { base: snapshot, changes: [] });
// @ts-expect-error Patch text alone is not a complete paired edit range.
filterConstructionDiff(diffSnapshot, { ...diffSnapshot, changes: [{ base: { text: '' }, head: { text: '' } }] });
