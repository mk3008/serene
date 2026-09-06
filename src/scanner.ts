import { SereneError } from './error.js';

export type ParameterStyle = 'named' | 'indexed' | 'anonymous' | 'at-named';
export type Parameter = { start: number; end: number; name: string };
export type Scanned = { sourceText: string; parameters: Parameter[]; terminated: boolean;
  native: { style: ParameterStyle; start: number }[] };
const identifier = (c: string) => /[A-Za-z0-9_$\u0080-\uffff]/.test(c);

/** Locate requested names, not SQL grammar. Other source characters pass through. */
export function scan(sourceText: string, requested?: ReadonlySet<string>): Scanned {
  const parameters: Parameter[] = [];
  const native: Scanned['native'] = [];
  let i = 0;
  let terminated = false;
  while (i < sourceText.length) {
    const c = sourceText[i]!;
    const n = sourceText[i + 1] ?? '';
    if (c === '-' && n === '-') {
      while (i < sourceText.length && !/[\r\n]/.test(sourceText[i]!)) i++;
      continue;
    }
    if (c === '/' && n === '*') {
      let depth = 1;
      i += 2;
      while (i < sourceText.length && depth) {
        if (sourceText.startsWith('/*', i)) { depth++; i += 2; }
        else if (sourceText.startsWith('*/', i)) { depth--; i += 2; }
        else i++;
      }
      continue;
    }
    if (c === '$' && !identifier(sourceText[i - 1] ?? '')) {
      const delimiter = /^(?:\$\$|\$[A-Za-z_][A-Za-z0-9_]*\$)/.exec(sourceText.slice(i))?.[0];
      if (delimiter) {
        const end = sourceText.indexOf(delimiter, i + delimiter.length);
        i = end < 0 ? sourceText.length : end + delimiter.length;
        continue;
      }
    }
    if (c === "'" || c === '"' || c === '`') {
      const escape = c === "'" && /(?:^|[^A-Za-z0-9_$\u0080-\uffff])E$/i.test(sourceText.slice(0, i));
      i++;
      while (i < sourceText.length) {
        if (escape && sourceText[i] === '\\') { i += 2; continue; }
        if (sourceText[i++] === c) {
          if (sourceText[i] === c) { i++; continue; }
          break;
        }
      }
      continue;
    }
    if (c === ';') terminated = true;
    if (c === ':' && n === ':') { i += 2; continue; }
    if (c === '$' && /[0-9]/.test(n) && !identifier(sourceText[i - 1] ?? '')) native.push({ style: 'indexed', start: i });
    if (c === '?') native.push({ style: 'anonymous', start: i });
    if (c === '@' && n === '@') { i += 2; continue; }
    if (c === '@' && /[A-Za-z_]/.test(n)) native.push({ style: 'at-named', start: i });
    if (c === ':' && !identifier(sourceText[i - 1] ?? '')) {
      const name = /^[A-Za-z_][A-Za-z0-9_]*/.exec(sourceText.slice(i + 1))?.[0];
      if (name && !identifier(sourceText[i + 1 + name.length] ?? '') && (!requested || requested.has(name))) {
        const end = i + 1 + name.length;
        parameters.push({ start: i, end, name });
        i = end;
        continue;
      }
    }
    i++;
  }
  return { sourceText, parameters, terminated, native };
}

/** Lower only located spans. Neither parameter names nor values supply SQL syntax. */
export function compile(data: Scanned, style: ParameterStyle): { text: string; names: string[] } {
  if (!['named', 'indexed', 'anonymous', 'at-named'].includes(style)) {
    throw new SereneError('PARAMETER_STYLE', 'Unknown parameter output style.');
  }
  const collision = data.parameters.length && data.native.find(marker => marker.style === style);
  if (collision) throw new SereneError('MIXED_PARAMETERS', 'Existing markers conflict with generated output markers.', collision.start);
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
