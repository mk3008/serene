import { DatabaseSync } from 'node:sqlite';

export function openDatabase(schema) {
  const native = new DatabaseSync(':memory:');
  native.exec(schema);
  return {
    query(text, params = {}) {
      return native.prepare(text).all(params);
    },
  };
}
