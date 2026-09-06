import { sql, sort, orderBy, bind } from '@mk3008/serene';

// Type-checkable native boundary signatures. No driver is implemented here.
declare const pg: { query(text: string, values: unknown[]): Promise<unknown> };
declare const my: { execute(text: string, values: unknown[]): Promise<unknown> };
declare const request: { input(name: string, value: unknown): unknown; query(text: string): Promise<unknown> };
declare const input: { tenant: number; sorts: readonly string[] };

const base = sql`SELECT id FROM users WHERE tenant_id = :tenant`;
const sorted = orderBy(base, { newest: sort`created_at DESC`, id: sort`id ASC` }, input.sorts);
const p = bind(sorted, { tenant: input.tenant }, 'indexed');
await pg.query(p.text, p.values);

const m = bind(base, { tenant: input.tenant }, 'anonymous');
await my.execute(m.text, m.values);

const s = bind(base, { tenant: input.tenant }, 'at-named');
s.names.forEach((name, i) => request.input(name, s.values[i]));
await request.query(s.text);

// Carry this SQL and parameters separately to an external investigation tool.
const original: string = s.sourceText;
const namedValues: Readonly<Record<string, unknown>> = s.params;
void original; void namedValues;
