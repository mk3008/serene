import { bind, sql } from '@mk3008/serene';
import { openDatabase } from './database.mjs';

export function openQueue() {
  return openDatabase(`CREATE TABLE shipments (id INTEGER PRIMARY KEY, region TEXT, status TEXT);
    INSERT INTO shipments (region, status) VALUES ('east', 'queued'), ('west', 'sent');`);
}
export function byId(db, id) {
  const query = bind(sql`SELECT id, region, status FROM shipments WHERE id = :id`, { id });
  return db.query(query.text, query.params).at(0) ?? null;
}
export function byRegion(db, region) {
  const statement = "SELECT id, region, status FROM shipments WHERE region = '" + region + "'";
  return db.query(statement);
}
export function queued(db) {
  return db.query("SELECT id, region, status FROM shipments WHERE status = 'queued'");
}
