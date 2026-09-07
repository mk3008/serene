import { DatabaseSync } from 'node:sqlite';
import { bind, sql } from '@mk3008/serene';

export function openContacts() {
  const db = new DatabaseSync(':memory:');
  db.exec(`CREATE TABLE contacts (id INTEGER PRIMARY KEY, email TEXT NOT NULL, display_name TEXT NOT NULL);
    INSERT INTO contacts (email, display_name) VALUES ('maya@example.test', 'Maya Patel'), ('lee@example.test', 'Lee Tran');`);
  return db;
}

export function listContacts(db) {
  return db.prepare('SELECT id, email, display_name FROM contacts ORDER BY id').all();
}

const contactByEmail = sql`
  SELECT id, email, display_name
  FROM contacts
  WHERE email = :email
`;

export function findContactByEmail(db, email) {
  if (typeof email !== 'string' || !/^[^\s@]+@(?:[^\s@.]+\.)+[^\s@.]+$/.test(email)) {
    throw new TypeError('Email must be a valid address.');
  }

  const query = bind(contactByEmail, { email });
  return db.prepare(query.text).get(query.params) ?? null;
}
