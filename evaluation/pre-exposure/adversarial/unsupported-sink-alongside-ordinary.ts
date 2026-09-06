import { bind, sql } from '@mk3008/serene';

declare const opaqueGateway: { send(text: string): Promise<unknown> };

export async function loadThroughGateway(id: string) {
  const statement = sql`SELECT id FROM users WHERE id = :id`;
  const query = bind(statement, { id }, 'indexed');
  return opaqueGateway.send(query.text);
}
