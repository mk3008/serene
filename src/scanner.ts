import { SereneError } from './error.js';

export type ParameterStyle = 'named' | 'indexed' | 'anonymous' | 'at-named';
export type Parameter = { start: number; end: number; name: string };
export type Scanned = { sourceText: string; parameters: Parameter[]; terminated: boolean };
const start = (c: string) => /[A-Za-z_]/.test(c);
const part = (c: string) => /[A-Za-z0-9_]/.test(c);
const identifier = (c: string) => /[A-Za-z0-9_$\u0080-\uffff]/.test(c);

/** A deliberately bounded lexical contract, independent of output markers. */
export function scan(sourceText: string): Scanned {
  const parameters: Parameter[] = [];
  let i = 0;
  let terminated = false;
  const fail = (code: string, message: string): never => { throw new SereneError(code, message, i); };
  if (sourceText.includes('\0')) fail('NUL', 'NUL is not supported in SQL text.');
  while (i < sourceText.length) {
    const c = sourceText[i]!;
    const n = sourceText[i + 1] ?? '';
    if (c === '-' && n === '-') {
      if (!/\s/.test(sourceText[i + 2] ?? '\n')) {
        fail('AMBIGUOUS_COMMENT', 'Use whitespace after --; comment interpretation must not depend on the database.');
      }
      while (i < sourceText.length && !/[\r\n]/.test(sourceText[i]!)) i++;
      continue;
    }
    if (c === '/' && n === '*') {
      if (/[!+M]/.test(sourceText[i + 2] ?? '')) fail('EXECUTABLE_COMMENT', 'Executable/hint comments require additional review.');
      i += 2;
      while (i < sourceText.length && !sourceText.startsWith('*/', i)) {
        if (sourceText.startsWith('/*', i)) fail('NESTED_COMMENT', 'Nested comments require additional review.');
        i++;
      }
      if (i === sourceText.length) fail('UNCLOSED', 'Unclosed block comment.');
      i += 2;
      continue;
    }
    if (c === "'" && /(?:^|[^A-Za-z0-9_$\u0080-\uffff])n?q$/i.test(sourceText.slice(0, i))) {
      fail('UNSUPPORTED_LEXICAL', 'Alternative quote delimiters require additional review.');
    }
    if (c === "'" || c === '"') {
      i++;
      let closed = false;
      while (i < sourceText.length) {
        if (sourceText[i] === '\\') fail('BACKSLASH_QUOTE', 'Backslashes in quoted SQL require additional review; bind values instead.');
        if (sourceText[i++] === c) {
          if (sourceText[i] === c) { i++; continue; }
          closed = true; break;
        }
      }
      if (!closed) fail('UNCLOSED', 'Unclosed quoted SQL.');
      continue;
    }
    if (c === ';') terminated = true;
    if (c === ':' && n === ':') { i += 2; continue; }
    if (c === '?' || (c === '$' && /[0-9]/.test(n)) || (c === '@' && (start(n) || n === '@'))) {
      fail('MIXED_PARAMETERS', 'Author parameters as :name; output markers are selected at bind.');
    }
    // These forms have incompatible quote/comment/operator meanings across SQL implementations.
    // Reject rather than silently hide or rewrite a potential parameter.
    if (c === '`' || c === '[' || c === ']' || c === '#' || c === '$' || c === '\\') {
      fail('UNSUPPORTED_LEXICAL', 'This lexical form requires additional review outside the common SQL tag.');
    }
    if (c === ':' && /[0-9\u0080-\uffff]/.test(n)) fail('PARAMETER_NAME', 'Use meaningful ASCII parameter names.');
    if (c === ':' && start(n)) {
      if (identifier(sourceText[i - 1] ?? '')) fail('PARAMETER_BOUNDARY', 'Separate named parameters from identifiers.');
      let end = i + 2;
      while (part(sourceText[end] ?? '')) end++;
      if (identifier(sourceText[end] ?? '')) fail('PARAMETER_NAME', 'Parameter names must be ASCII identifiers.');
      parameters.push({ start: i, end, name: sourceText.slice(i + 1, end) });
      i = end;
      continue;
    }
    i++;
  }
  return { sourceText, parameters, terminated };
}

/** Lower only already identified parameter spans; never search rendered text. */
export function compile(data: Scanned, style: ParameterStyle): { text: string; names: string[] } {
  if (!['named', 'indexed', 'anonymous', 'at-named'].includes(style)) {
    throw new SereneError('PARAMETER_STYLE', 'Unknown parameter output style.');
  }
  const names: string[] = [];
  const positions = new Map<string, number>();
  let text = '';
  let cursor = 0;
  for (const parameter of data.parameters) {
    let position = positions.get(parameter.name);
    if (style === 'anonymous' || position === undefined) {
      names.push(parameter.name);
      position = names.length;
      positions.set(parameter.name, position);
    }
    const marker = style === 'indexed' ? `$${position}` : style === 'anonymous' ? '?' :
      `${style === 'at-named' ? '@' : ':'}${parameter.name}`;
    text += data.sourceText.slice(cursor, parameter.start) + marker;
    cursor = parameter.end;
  }
  return { text: text + data.sourceText.slice(cursor), names };
}
