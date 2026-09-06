import { bind, sql } from '@mk3008/serene';

export async function fixedMarkerText(db: { query(text: string, values: unknown[]): Promise<unknown> }, id: string) { const statement = sql`SELECT '[[MASK:ordinary]]' AS note, id FROM users WHERE id = :id`; const query = bind(statement, { id }, 'indexed'); return db.query(query.text, query.values); } export async function dynamicNeighbor(db: { query(text: string): Promise<unknown> }, name: string) { return db.query('SELECT id FROM users WHERE name = ' + name); }
