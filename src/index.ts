import { scan, compile, type Scanned, type ParameterStyle } from './scanner.js';
import { SereneError } from './error.js';
export { SereneError } from './error.js';
export type { ParameterStyle } from './scanner.js';

declare const sqlBrand: unique symbol;
declare const sortBrand: unique symbol;
export type Sql = { readonly [sqlBrand]: true; readonly sourceText: string };
export type Sort = { readonly [sortBrand]: true };
type Statement = Scanned & { sorted: boolean };
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
  const sql = Object.freeze({ sourceText: data.sourceText }) as Sql;
  statements.set(sql, data);
  return sql;
}
/** Ordinary SQL with :name parameters; no runtime interpolation. */
export function sql(strings: TemplateStringsArray, ...values: never[]): Sql {
  return create({ ...scan(literal(strings, values)), sorted: false });
}

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

/** Select finite reviewed terms in caller-specified order; no arbitrary fragments. */
export function orderBy(sql: Sql, choices: Readonly<Record<string, Sort>>, selection: string | readonly string[]): Sql {
  const data = statements.get(sql);
  if (!data) throw new SereneError('UNSCREENED', 'Expected a Serene SQL object.');
  if (!choices || typeof choices !== 'object') throw new SereneError('SORT_CHOICES', 'Expected a finite sort map.');
  const descriptors = Object.getOwnPropertyDescriptors(choices);
  for (const key of Reflect.ownKeys(descriptors)) {
    const descriptor = descriptors[key as string]!;
    if (typeof key !== 'string' || !('value' in descriptor) || !sorts.has(descriptor.value)) {
      throw new SereneError('SORT_CHOICES', 'Every sort choice must be a static Serene sort; accessors are unsupported.');
    }
  }
  if (typeof selection !== 'string' && !Array.isArray(selection)) {
    throw new SereneError('SORT_KEY', 'Expected a sort key or array of sort keys.');
  }
  const keys = typeof selection === 'string' ? [selection] : [...selection];
  const seen = new Set<string>();
  const selected: string[] = [];
  for (const key of keys) {
    if (typeof key !== 'string' || !Object.hasOwn(descriptors, key)) throw new SereneError('SORT_KEY', 'Unknown sort key.');
    if (seen.has(key)) throw new SereneError('SORT_DUPLICATE', 'Repeated sort keys are unsupported.');
    seen.add(key);
    selected.push(sorts.get(descriptors[key]!.value)!);
  }
  if (!selected.length) return sql;
  if (data.sorted || data.terminated) throw new SereneError('SORT_POSITION', 'Append ORDER BY once, before any statement terminator.');
  return create({ ...data, sourceText: `${data.sourceText}\nORDER BY ${selected.join(', ')}`, sorted: true });
}

export interface BoundSql {
  readonly text: string;
  /** Review/debug SQL before output-marker lowering; contains no bound values. */
  readonly sourceText: string;
  /** Driver-facing ordered values; anonymous output repeats values per occurrence. */
  readonly values: unknown[];
  readonly names: readonly string[];
  readonly params: Readonly<Record<string, unknown>>;
}
export function bind(sql: Sql, params: Readonly<Record<string, unknown>> = {}, style: ParameterStyle = 'named'): BoundSql {
  const data = statements.get(sql);
  if (!data) throw new SereneError('UNSCREENED', 'Expected a Serene SQL object.');
  if (!params || typeof params !== 'object') throw new SereneError('PARAMETERS', 'Expected named parameters.');
  const descriptors = Object.getOwnPropertyDescriptors(params);
  const rendered = compile(data, style);
  const required = new Set(rendered.names);
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
  const result: BoundSql = Object.freeze({ text: rendered.text, sourceText: data.sourceText,
    names: Object.freeze([...rendered.names]), values: rendered.names.map(name => descriptors[name]!.value),
    params: Object.freeze(Object.fromEntries([...required].map(name => [name, descriptors[name]!.value]))) });
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
