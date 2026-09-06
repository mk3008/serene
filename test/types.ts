import { postgres, mysql, mssql, bind, sort, orderBy, type Sql } from '../src/index.js';
const sql: Sql = postgres`SELECT :id`;
const q = bind(orderBy(sql, { id: sort`id DESC` }, 'id'), { id: 1 });
const text: string = q.text;
const driverValues: unknown[] = q.values;
bind(mysql`SELECT :id`, { id: 1 });
bind(mssql`SELECT @id`, { id: 1 });
void text; void driverValues;
// @ts-expect-error Runtime strings cannot be passed as SQL.
bind('SELECT 1');
// @ts-expect-error Shape is not provenance.
const forged: Sql = {};
// @ts-expect-error SQL interpolation is prohibited.
postgres`SELECT ${1}`;
// @ts-expect-error Sort interpolation is prohibited.
sort`${'id'}`;
// @ts-expect-error Strings cannot stand in for sort tokens.
orderBy(sql, { id: 'id ASC' }, 'id');
// @ts-expect-error Literal-only tag does not accept strings.
postgres('SELECT 1');
