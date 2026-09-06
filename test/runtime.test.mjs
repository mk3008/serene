import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sql, sort, orderBy, bind, review, SereneError } from '../dist/index.js';
import { scan, compile } from '../dist/scanner.js';

const throwsCode = (fn, code) => assert.throws(fn, error => error instanceof SereneError && error.level === 'violation' && error.code === code);

test('canonical source survives every output contract and hostile values stay separate', () => {
  const hostile = "x'); DROP TABLE users; --";
  const stmt = sql`SELECT :id::int, :id, :name`;
  for (const [style, text, names, values] of [
    ['named', 'SELECT :id::int, :id, :name', ['id', 'name'], [7, hostile]],
    ['indexed', 'SELECT $1::int, $1, $2', ['id', 'name'], [7, hostile]],
    ['anonymous', 'SELECT ?::int, ?, ?', ['id', 'id', 'name'], [7, 7, hostile]],
    ['at-named', 'SELECT @id::int, @id, @name', ['id', 'name'], [7, hostile]],
  ]) {
    const q = bind(stmt, { name: hostile, id: 7 }, style);
    assert.equal(q.text, text);
    assert.equal(q.sourceText, stmt.sourceText);
    assert.deepEqual(q.names, names);
    assert.deepEqual(q.values, values);
    assert.deepEqual(q.params, { id: 7, name: hostile });
    assert.equal(review(q).level, 'ordinary');
    assert.equal('dialect' in q, false);
  }
  assert.equal(bind(stmt, { id: 7, name: hostile }).text, stmt.sourceText);
  throwsCode(() => bind(stmt, { id: 7, name: hostile }, 'postgres'), 'PARAMETER_STYLE');
});
test('requested own names are validated; omitted and inherited names are not bindings', () => {
  const q = sql`SELECT :id`;
  assert.equal(bind(q, {}, 'indexed').text, 'SELECT :id');
  assert.deepEqual(bind(q, Object.create({ id: 7 })).values, []);
  throwsCode(() => bind(q, { id: 7, extra: 8 }), 'UNUSED_PARAMETER');
  throwsCode(() => bind(q, { id: undefined }), 'PARAMETER_VALUE');
  throwsCode(() => bind(q, { get id() { throw Error('must not execute'); } }), 'PARAMETER_VALUE');
  throwsCode(() => bind(q, { id: 7, [Symbol()]: 1 }), 'PARAMETER_NAME');
  throwsCode(() => bind(q, null), 'PARAMETERS');
  assert.deepEqual(bind(q, { id: null }).values, [null]);
});
test('prototype-sensitive parameter names remain own data properties', () => {
  const params = Object.create(null);
  params.__proto__ = 1; params.constructor = 2; params.toString = 3;
  const q = bind(sql`SELECT :__proto__, :constructor, :toString`, params);
  assert.deepEqual(q.values, [1, 2, 3]);
  assert.equal(Object.hasOwn(q.params, '__proto__'), true);
  assert.equal(q.params.__proto__, 1);
  assert.equal(Object.getPrototypeOf(q.params), Object.prototype);
});
test('interpolation and common fake literals fail at runtime', () => {
  throwsCode(() => sql`SELECT ${'bad'}`, 'LITERAL_ONLY');
  throwsCode(() => sort`${'id'}`, 'LITERAL_ONLY');
  throwsCode(() => sql('SELECT 1'), 'LITERAL_ONLY');
  throwsCode(() => sql(Object.assign(['SELECT 1'], { raw: ['SELECT 1'] })), 'LITERAL_ONLY');
});
test('opaque identity cannot be supplied by shape, spreading, proxies or casting', () => {
  for (const fake of [{}, { sourceText: 'SELECT 1' }, { ...sql`SELECT 1` }, new Proxy(sql`SELECT 1`, {})]) {
    throwsCode(() => bind(fake), 'UNSCREENED');
    throwsCode(() => orderBy(fake, {}, []), 'UNSCREENED');
    assert.equal(review(fake).level, 'review-required');
  }
  assert.equal(review('SELECT 1').level, 'review-required');
  assert.equal(review(null).level, 'review-required');
});
test('source, text, params and names are immutable; values are driver-friendly copies', () => {
  const stmt = sql`SELECT :id`;
  const params = { id: 1 };
  const q = bind(stmt, params);
  params.id = 2;
  assert.equal(q.params.id, 1);
  assert.throws(() => { stmt.sourceText = 'changed'; }, TypeError);
  assert.throws(() => { q.text = 'changed'; }, TypeError);
  assert.throws(() => { q.params.id = 2; }, TypeError);
  assert.throws(() => q.names.push('extra'), TypeError);
  q.values[0] = 2;
  assert.deepEqual(bind(stmt, { id: 1 }).values, [1]);
  assert.equal(review({ ...q }).level, 'review-required');
});
test('whitelisted terms follow arbitrary selection order without enumerating complete clauses', () => {
  const base = sql`SELECT id, name FROM users WHERE id > :min -- tail`;
  const choices = { name: sort`name ASC`, id: sort`users.id DESC` };
  for (const [keys, expected] of [
    [['name', 'id'], 'name ASC, users.id DESC'],
    [['id', 'name'], 'users.id DESC, name ASC'],
    [['name'], 'name ASC'],
    ['id', 'users.id DESC'],
  ]) {
    const selected = orderBy(base, choices, keys);
    assert.equal(selected.sourceText, base.sourceText + '\nORDER BY ' + expected);
    const q = bind(selected, { min: 1 }, 'indexed');
    assert.equal(q.text, 'SELECT id, name FROM users WHERE id > $1 -- tail\nORDER BY ' + expected);
    assert.equal(q.sourceText, selected.sourceText);
    assert.deepEqual(q.values, [1]);
  }
  assert.equal(orderBy(base, choices, []), base);
  const keys = ['name', 'id'];
  const selected = orderBy(base, choices, keys);
  choices.name = sort`id ASC`; keys.reverse();
  assert.ok(selected.sourceText.endsWith('ORDER BY name ASC, users.id DESC'));
  assert.equal(base.sourceText.includes('ORDER BY'), false);
});
test('sort keys and maps fail closed including later unknown keys and duplicate selections', () => {
  const base = sql`SELECT id FROM users`;
  const choices = { id: sort`id ASC` };
  for (const keys of ['__proto__', 'id; DROP TABLE users', ['id', 'unknown'], [1], Array(1), null, {}]) {
    throwsCode(() => orderBy(base, choices, keys), 'SORT_KEY');
  }
  throwsCode(() => orderBy(base, choices, ['id', 'id']), 'SORT_DUPLICATE');
  for (const map of [{ id: {} }, { id: sort`id`, bad: 'text' }, { get id() { throw Error('not called'); } }, null]) {
    throwsCode(() => orderBy(base, map, 'id'), 'SORT_CHOICES');
  }
  throwsCode(() => orderBy(base, { [Symbol()]: sort`id` }, []), 'SORT_CHOICES');
  throwsCode(() => orderBy(orderBy(base, choices, 'id'), choices, 'id'), 'SORT_POSITION');
  throwsCode(() => orderBy(sql`SELECT 1;`, choices, 'id'), 'SORT_POSITION');
});
test('static compound sorts remain supported and general SQL fragments remain rejected', () => {
  assert.ok(orderBy(sql`SELECT id FROM users`, { pair: sort`name ASC, id DESC` }, ['pair']).sourceText.endsWith('name ASC, id DESC'));
  for (const fn of [() => sort`id; DROP TABLE users`, () => sort`id -- comment`, () => sort`random()`, () => sort`:column`, () => sort``]) throwsCode(fn, 'SORT_TERMS');
});
test('runtime template authenticity is not a security boundary: audit must catch spoofing', () => {
  const text = 'SELECT 1';
  const forged = Object.freeze(Object.assign([text], { raw: Object.freeze([text]) }));
  assert.equal(review(sql(forged)).level, 'ordinary');
});

for (const [source, expected, names] of [
  ["SELECT ':no', 'it''s :no', \"x:no\", :id::int -- :no\rSELECT :id", "SELECT ':no', 'it''s :no', \"x:no\", $1::int -- :no\rSELECT $1", ['id']],
  ['SELECT /* :no */ :id, :other, :id', 'SELECT /* :no */ $1, $2, $1', ['id', 'other']],
  ["SELECT N':no', :id", "SELECT N':no', $1", ['id']],
  ['SELECT :id -- :no\n', 'SELECT $1 -- :no\n', ['id']],
  ['SELECT 1', 'SELECT 1', []],
]) test(`bounded lexing preserves nonparameter text: ${source}`, () => {
  const data = scan(source);
  assert.equal(data.sourceText, source);
  assert.deepEqual(compile(data, 'indexed'), { text: expected, names });
  assert.equal(compile(data, 'named').text, source);
});
test('hostile corpus cannot change generated SQL in any output style', () => {
  const payloads = ["'", '\\', '\0', '--', '/*', ':id', '$1', '?', '@id', '日本', '😀', 'x; DELETE FROM users'];
  for (const style of ['named', 'indexed', 'anonymous', 'at-named']) {
    const stmt = sql`SELECT :value, :value`;
    const expected = bind(stmt, { value: null }, style).text;
    for (const value of payloads) assert.equal(bind(stmt, { value }, style).text, expected);
  }
});
