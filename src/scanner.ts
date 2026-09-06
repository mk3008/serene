import { SereneError } from './error.js';

export type Dialect = 'postgres' | 'mysql' | 'mssql';
export type Compiled = { text: string; names: string[]; terminated: boolean };
const start = (c: string) => /[A-Za-z_]/.test(c);
const part = (c: string) => /[A-Za-z0-9_]/.test(c);
const identifier = (c: string) => /[A-Za-z0-9_$\u0080-\uffff]/.test(c);

/** Lexical binding only. This is deliberately not a SQL parser. */
export function compile(sql: string, dialect: Dialect): Compiled {
  let text = '';
  let i = 0;
  let terminated = false;
  const names: string[] = [];
  const positions = new Map<string, number>();
  const fail = (code: string, message: string): never => {
    throw new SereneError(code, message, i);
  };
  while (i < sql.length) {
    const c = sql[i]!;
    const n = sql[i + 1] ?? '';
    if (c === '\0') fail('NUL', 'NUL is not supported in SQL text.');
    const line = (c === '-' && n === '-' &&
      (dialect !== 'mysql' || /[\s\x00-\x20]/.test(sql[i + 2] ?? '\n'))) ||
      (dialect === 'mysql' && c === '#');
    if (line) {
      const from = i;
      while (i < sql.length && sql[i] !== '\n' && sql[i] !== '\r') i++;
      text += sql.slice(from, i);
      continue;
    }
    if (c === '/' && n === '*') {
      const from = i;
      if (dialect === 'mysql' && /[!+M]/.test(sql[i + 2] ?? '')) {
        fail('EXECUTABLE_COMMENT', 'Executable/hint comments require additional review.');
      }
      i += 2;
      let depth = 1;
      while (i < sql.length && depth) {
        if (sql.startsWith('/*', i)) {
          if (dialect === 'mysql') fail('NESTED_COMMENT', 'Nested MySQL comments are unsupported.');
          depth++; i += 2;
        } else if (sql.startsWith('*/', i)) { depth--; i += 2; }
        else i++;
      }
      if (depth) fail('UNCLOSED', 'Unclosed block comment.');
      text += sql.slice(from, i);
      continue;
    }
    if (dialect === 'postgres' && c === '$' && !identifier(sql[i - 1] ?? '')) {
      const tag = sql.slice(i).match(/^\$(?:[A-Za-z_\u0080-\uffff][A-Za-z0-9_\u0080-\uffff]*)?\$/)?.[0];
      if (tag) {
        const end = sql.indexOf(tag, i + tag.length);
        if (end < 0) fail('UNCLOSED', 'Unclosed dollar quote.');
        text += sql.slice(i, end + tag.length); i = end + tag.length;
        continue;
      }
    }
    if (c === "'" || c === '"' || (dialect === 'mysql' && c === '`') ||
      (dialect === 'mssql' && c === '[')) {
      const from = i++;
      const close = c === '[' ? ']' : c;
      let closed = false;
      while (i < sql.length) {
        // Reject mode-dependent escaping rather than guess connection settings.
        if (sql[i] === '\\' && dialect !== 'mssql') {
          fail('BACKSLASH_QUOTE', 'Backslashes in quoted SQL require additional review; bind values instead.');
        }
        if (sql[i] === close) {
          i++;
          if (sql[i] === close) { i++; continue; }
          closed = true; break;
        }
        i++;
      }
      if (!closed) fail('UNCLOSED', 'Unclosed quoted SQL.');
      text += sql.slice(from, i);
      continue;
    }
    if (c === ';') terminated = true;
    if (dialect === 'postgres' && c === ':' && n === ':') {
      text += '::'; i += 2; continue;
    }
    if (dialect === 'mssql' && c === '@' && n === '@') {
      const from = i; i += 2;
      while (part(sql[i] ?? '')) i++;
      text += sql.slice(from, i); continue;
    }
    if ((dialect === 'postgres' && c === '$' && /[0-9]/.test(n)) ||
      (dialect === 'mysql' && c === '?')) {
      fail('MIXED_PARAMETERS', 'Use named parameters exclusively in screened SQL.');
    }
    if ((c === ':' || (dialect === 'mssql' && c === '@')) && start(n)) {
      if (identifier(sql[i - 1] ?? '')) fail('PARAMETER_BOUNDARY', 'Separate named parameters from identifiers.');
      let end = i + 2;
      while (part(sql[end] ?? '')) end++;
      const name = sql.slice(i + 1, end);
      if (identifier(sql[end] ?? '')) fail('PARAMETER_NAME', 'Parameter names must be ASCII identifiers.');
      if (dialect === 'mysql') { names.push(name); text += '?'; }
      else {
        let position = positions.get(name);
        if (position === undefined) {
          names.push(name); position = names.length; positions.set(name, position);
        }
        text += dialect === 'postgres' ? `$${position}` : `@${name}`;
      }
      i = end; continue;
    }
    text += c; i++;
  }
  if (sql.includes('\0')) fail('NUL', 'NUL is not supported in SQL text.');
  return { text, names, terminated };
}
