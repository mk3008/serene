import { compile, type Compiled, type Dialect } from './scanner.js';
import { SereneError } from './error.js';
export { SereneError } from './error.js';
export type { Dialect } from './scanner.js';

declare const sqlBrand: unique symbol;
declare const sortBrand: unique symbol;
export type Sql = { readonly [sqlBrand]: true };
export type Sort = { readonly [sortBrand]: true };
type Statement = Compiled & { dialect: Dialect; sorted: boolean };
const statements = new WeakMap<Sql, Statement>();
const sorts = new WeakMap<Sort, string>();
const bound = new WeakSet<BoundSql>();

function literal(strings: TemplateStringsArray, values: readonly unknown[]): string {
  if (!Array.isArray(strings) || !Object.isFrozen(strings) || strings.length !== 1 ||
      !Array.isArray(strings.raw) || !Object.isFrozen(strings.raw) || strings.raw.length !== 1 ||
      typeof strings.raw[0] !== 'string' || typeof strings[0] !== 'string' || values.length) {
    throw new SereneError('LITERAL_ONLY', 'Use a template literal without interpolation; bind named values separately.');
  }
  // Standard JavaScript template escaping; source auditing excludes fabricated tag calls.
  return strings[0];
}
function create(data: Statement): Sql {
  const sql = Object.freeze({}) as Sql;
  statements.set(sql, data);
  return sql;
}
function tag(dialect: Dialect) {
  return (strings: TemplateStringsArray, ...values: never[]): Sql =>
    create({ ...compile(literal(strings, values), dialect), dialect, sorted: false });
}
export const postgres = tag('postgres');
export const mysql = tag('mysql');
export const mssql = tag('mssql');

/** Static, deliberately limited ORDER BY terms; no arbitrary fragments. */
export function sort(strings: TemplateStringsArray, ...values: never[]): Sort {
  const text = literal(strings, values).trim();
  const id = '[A-Za-z_][A-Za-z0-9_]*(?:\\.[A-Za-z_][A-Za-z0-9_]*)*';
  const term = `${id}(?:\\s+(?:ASC|DESC))?`;
  if (!new RegExp(`^${term}(?:\\s*,\\s*${term})*$`, 'i').test(text)) {
    throw new SereneError('SORT_TERMS', 'Sort terms must be unquoted column paths with optional ASC/DESC.');
  }
  const result = Object.freeze({}) as Sort;
  sorts.set(result, text);
  return result;
}

/** Append one finite, explicitly listed ordering. No WHERE/query composition. */
export function orderBy(sql: Sql, choices: Readonly<Record<string, Sort>>, key: string): Sql {
  const data = statements.get(sql);
  if (!data) throw new SereneError('UNSCREENED', 'Expected a Serene SQL object.');
  if (data.sorted || data.terminated) throw new SereneError('SORT_POSITION', 'Append ORDER BY once, before any statement terminator.');
  if (!choices || !Object.hasOwn(choices, key)) throw new SereneError('SORT_KEY', 'Unknown sort key.');
  const descriptors = Object.getOwnPropertyDescriptors(choices);
  for (const descriptor of Object.values(descriptors)) {
    if (!('value' in descriptor) || !sorts.has(descriptor.value)) {
      throw new SereneError('SORT_CHOICES', 'Every sort choice must be a static Serene sort; accessors are unsupported.');
    }
  }
  const selected = sorts.get(descriptors[key]!.value)!;
  return create({ ...data, text: `${data.text}\nORDER BY ${selected}`, sorted: true });
}

export interface BoundSql {
  readonly text: string;
  /** Positional for pg/mysql2; paired with names for mssql.request.input(). */
  readonly values: unknown[];
  readonly names: readonly string[];
  readonly dialect: Dialect;
}
export function bind(sql: Sql, params: Readonly<Record<string, unknown>> = {}): BoundSql {
  const data = statements.get(sql);
  if (!data) throw new SereneError('UNSCREENED', 'Expected a Serene SQL object.');
  if (!params || typeof params !== 'object') throw new SereneError('PARAMETERS', 'Expected named parameters.');
  const descriptors = Object.getOwnPropertyDescriptors(params);
  const required = new Set(data.names);
  for (const name of required) {
    const descriptor = descriptors[name];
    if (!Object.hasOwn(descriptors, name)) throw new SereneError('MISSING_PARAMETER', `Missing parameter: ${name}`);
    if (!descriptor || !('value' in descriptor) || descriptor.value === undefined) {
      throw new SereneError('PARAMETER_VALUE', `Parameter ${name} must be an own data property, not undefined.`);
    }
  }
  for (const name of Reflect.ownKeys(params)) {
    if (typeof name !== 'string' || !required.has(name)) throw new SereneError('UNUSED_PARAMETER', `Unused parameter: ${String(name)}`);
  }
  const result: BoundSql = Object.freeze({ text: data.text, dialect: data.dialect,
    names: Object.freeze([...data.names]), values: data.names.map(name => descriptors[name]!.value) });
  bound.add(result);
  return result;
}

/** Runtime provenance only; ordinary source review also requires serene-audit. */
export function review(value: unknown): { level: 'ordinary' | 'review-required'; code: string } {
  const known = value !== null && typeof value === 'object' &&
    (statements.has(value as Sql) || bound.has(value as BoundSql));
  return known ? { level: 'ordinary', code: 'SERENE_PROVENANCE' } :
    { level: 'review-required', code: 'UNSCREENED' };
}
