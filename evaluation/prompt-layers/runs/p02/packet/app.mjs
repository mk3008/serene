import { openDatabase } from './database.mjs';
import { bind, sql } from '@mk3008/serene';

export function openCustomers() {
  return openDatabase();
}

export function listCustomers(db) {
  return db.query('SELECT id, email, name FROM customers ORDER BY id');
}

export function findCustomerByEmail(db, email) {
  if (typeof email !== 'string' || email.length === 0) {
    throw new TypeError('email must not be empty');
  }

  const query = bind(sql`SELECT id, email, name FROM customers WHERE email = :email`, { email });
  const customer = db.query(query.text, query.params)[0];
  if (!customer) return null;

  const { id, email: customerEmail, name } = customer;
  return { id, email: customerEmail, name };
}
