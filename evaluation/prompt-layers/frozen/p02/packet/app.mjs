import { openDatabase } from './database.mjs';

export function openCustomers() {
  return openDatabase();
}

export function listCustomers(db) {
  return db.query('SELECT id, email, name FROM customers ORDER BY id');
}
