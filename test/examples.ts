import { postgres, mysql, mssql, sort, orderBy, bind } from '@mk3008/serene';

// Type-checkable native boundary signatures. No driver is implemented here.
declare const pg: { query(text: string, values: unknown[]): Promise<unknown> };
declare const my: { execute(text: string, values: unknown[]): Promise<unknown> };
declare const request: { input(name: string, value: unknown): unknown; query(text: string): Promise<unknown> };
declare const input: { tenant: number; sort: string };

const base = postgres`SELECT id FROM users WHERE tenant_id = :tenant`;
const sorted = orderBy(base, { newest: sort`created_at DESC, id DESC`, id: sort`id ASC` }, input.sort);
const p = bind(sorted, { tenant: input.tenant });
await pg.query(p.text, p.values);

const m = bind(mysql`SELECT id FROM users WHERE tenant_id = :tenant`, { tenant: input.tenant });
await my.execute(m.text, m.values);

const s = bind(mssql`SELECT id FROM users WHERE tenant_id = @tenant`, { tenant: input.tenant });
s.names.forEach((name, i) => request.input(name, s.values[i]));
await request.query(s.text);
