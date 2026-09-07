import { bind, sql } from '@mk3008/serene';
import { openDatabase } from './database.mjs';

export function openBilling() {
  return openDatabase(`CREATE TABLE invoices (id INTEGER PRIMARY KEY, account TEXT, state TEXT, amount INTEGER);
    INSERT INTO invoices (account, state, amount) VALUES ('acme', 'open', 120), ('orbit', 'paid', 75);`);
}
export function invoice(db, id) {
  const query = bind(sql`SELECT id, account, state, amount FROM invoices WHERE id = :id`, { id });
  return db.query(query.text, query.params).at(0) ?? null;
}
export function forAccount(db, account) {
  const statement = 'SELECT id, account, state, amount FROM invoices WHERE account = \'' + account + '\'';
  return db.query(statement);
}
export function paid(db) {
  const statement = "SELECT id, account, state, amount FROM invoices WHERE state = 'paid'";
  return db.query(statement);
}
