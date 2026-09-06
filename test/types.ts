import { sql, bind, sort, orderBy, type Sql, type ParameterStyle } from '../src/index.js';
const stmt: Sql = sql`SELECT :id`;
const selection: readonly string[] = ['id'];
const q = bind(orderBy(stmt, { id: sort`id DESC` }, selection), { id: 1 }, 'indexed');
const text: string = q.text;
const source: string = stmt.sourceText;
const driverValues: unknown[] = q.values;
const params: Readonly<Record<string, unknown>> = q.params;
for (const style of ['named', 'indexed', 'anonymous', 'at-named'] satisfies ParameterStyle[]) bind(stmt, { id: 1 }, style);
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
