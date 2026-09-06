// Independent preflight probes. These document current behavior; run explicitly.
import test from 'node:test';
import assert from 'node:assert/strict';
import { filterRows } from './filter.mjs';

const rows = (source, file = 'review.ts') => source.split(/\r?\n/).map((text, i) => ({ file, line: i + 1, text }));
const visible = result => result.rows.map(row => row.text ?? row.parts?.map(part => part.text).join('') ?? '').join('\n');
const ordinaryPreamble = "import { bind, sql } from '@mk3008/serene';\ndeclare const term: string;\n";

test('REGRESSION: default-parameter assignment with dynamic SQL prevents masking', () => {
  const source = ordinaryPreamble + `
export async function load(
  db: { query(text: string, values: unknown[]): Promise<unknown> },
  id: string = (globalThis.lastSql = 'SELECT id FROM users WHERE name = ' + term),
) {
  const statement = sql\`SELECT id FROM users WHERE id = :id\`;
  const query = bind(statement, { id }, 'indexed');
  return db.query(query.text, query.values);
}
`;
  const result = filterRows(source, 'default-assignment.ts', 'review', rows(source, 'default-assignment.ts'));
  assert.equal(result.masks.length, 0, 'a parameter initializer prevents whole-function masking');
  assert(visible(result).includes("'SELECT id FROM users WHERE name = ' + term"), 'the dynamic construction remains visible');
});

test('REGRESSION: driver-argument assignment with dynamic SQL prevents masking', () => {
  const source = ordinaryPreamble + `
export async function load(db: { query(text: string, values: unknown[]): Promise<unknown> }, id: string) {
  const statement = sql\`SELECT id FROM users WHERE id = :id\`;
  const query = bind(statement, { id }, 'indexed');
  return db.query(query.text, (globalThis.lastSql = 'SELECT ' + term));
}
`;
  const result = filterRows(source, 'argument-assignment.ts', 'review', rows(source, 'argument-assignment.ts'));
  assert.equal(result.masks.length, 0, 'assignment expressions and non-simple driver arguments prevent masking');
  assert(visible(result).includes("globalThis.lastSql = 'SELECT ' + term"), 'the unreviewed assignment remains visible');
});

test('REGRESSION: arbitrary values property in a driver argument prevents masking', () => {
  const source = ordinaryPreamble + `
declare const other: { values: unknown[] };
export async function load(db: { query(text: string, values: unknown[]): Promise<unknown> }, id: string) {
  const statement = sql\`SELECT id FROM users WHERE id = :id\`;
  const query = bind(statement, { id }, 'indexed');
  return db.query(query.text, other.values);
}
`;
  const result = filterRows(source, 'mismatched-values.ts', 'review', rows(source, 'mismatched-values.ts'));
  assert.equal(result.masks.length, 0, 'only values/params from the same bound object are eligible');
  assert(visible(result).includes('other.values'), 'the unmatched driver argument remains visible');
});

test('REVIEW SCOPE: syntactic query receiver identity is not established before masking', () => {
  const source = ordinaryPreamble + `
export async function load(unverifiedClient: { query(text: string, values: unknown[]): Promise<unknown> }, id: string) {
  const statement = sql\`SELECT id FROM users WHERE id = :id\`;
  const query = bind(statement, { id }, 'indexed');
  return unverifiedClient.query(query.text, query.values);
}
`;
  const result = filterRows(source, 'receiver-identity.ts', 'review', rows(source, 'receiver-identity.ts'));
  assert.equal(result.masks.length, 1, 'ordinary driver-candidate audit is syntactic, not proof of native-driver identity');
});
