import { DatabaseSync } from 'node:sqlite';

export function openContacts() {
  const db = new DatabaseSync(':memory:');
  db.exec(`CREATE TABLE contacts (id INTEGER PRIMARY KEY, email TEXT NOT NULL, display_name TEXT NOT NULL);
    INSERT INTO contacts (email, display_name) VALUES ('maya@example.test', 'Maya Patel'), ('lee@example.test', 'Lee Tran');`);
  return db;
}

export function listContacts(db) {
  return db.prepare('SELECT id, email, display_name FROM contacts ORDER BY id').all();
}
