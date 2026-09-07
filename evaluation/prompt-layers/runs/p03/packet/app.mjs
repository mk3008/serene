import { openDatabase } from './database.mjs';

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

  const rows = db.query(
    'SELECT id, email, name FROM customers WHERE email = $email',
    { email },
  );
  if (rows.length === 0) return null;

  const { id, email: selectedEmail, name } = rows[0];
  return { id, email: selectedEmail, name };
}
