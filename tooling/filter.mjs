import ts from 'typescript';
import { auditSource } from './audit.mjs';

// This recognizer deliberately covers less syntax than auditSource. An ordinary
// execution alone is insufficient evidence for hiding the surrounding function.
function constructionFunctions(source, file) {
  const sf = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true,
    /\.[cm]?jsx?$/.test(file) ? ts.ScriptKind.JS : file.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  if (sf.parseDiagnostics.length) return null;
  const findings = auditSource(source, file);
  const position = offset => {
    const p = sf.getLineAndCharacterOfPosition(offset);
    return { line: p.line + 1, column: p.character + 1 };
  };
  const at = node => {
    const p = position(node.getStart(sf));
    return findings.filter(f => f.line === p.line && f.column === p.column);
  };
  const ordinary = (node, boundary) => at(node).find(f => f.boundary === boundary && f.level === 'ordinary' && !f.reviewSignals?.length);
  const simpleDriverArguments = call => {
    const [first, ...rest] = call.arguments;
    if (!first || !ts.isPropertyAccessExpression(first) || !ts.isIdentifier(first.expression) || first.name.text !== 'text') return false;
    return rest.every(arg => ts.isIdentifier(arg) || ts.isStringLiteral(arg) || ts.isNumericLiteral(arg) ||
      [ts.SyntaxKind.NullKeyword, ts.SyntaxKind.TrueKeyword, ts.SyntaxKind.FalseKeyword].includes(arg.kind) ||
      ts.isPropertyAccessExpression(arg) && ts.isIdentifier(arg.expression) &&
      arg.expression.text === first.expression.text && ['values', 'params'].includes(arg.name.text));
  };
  const masks = [];
  for (const fn of sf.statements) {
    if (!ts.isFunctionDeclaration(fn) || !fn.name || !fn.body || !fn.body.statements.length) continue;
    let valid = fn.parameters.every(p => ts.isIdentifier(p.name) && !p.initializer);
    const sites = [];
    for (const statement of fn.body.statements) {
      if (ts.isVariableStatement(statement) && statement.declarationList.flags & ts.NodeFlags.Const) {
        for (const decl of statement.declarationList.declarations) {
          if (!ts.isIdentifier(decl.name) || !decl.initializer ||
              !(ts.isCallExpression(decl.initializer) || ts.isTaggedTemplateExpression(decl.initializer)) ||
              !ordinary(decl.initializer, 'serene')) valid = false;
        }
      } else {
        let call = ts.isExpressionStatement(statement) || ts.isReturnStatement(statement) ? statement.expression : undefined;
        if (call && ts.isAwaitExpression(call)) call = call.expression;
        if (!call || !ts.isCallExpression(call) || !simpleDriverArguments(call) || !ordinary(call, 'driver-candidate')) valid = false;
      }
    }
    const visit = node => {
      if (node !== fn && (ts.isFunctionLike(node) || ts.isClassLike(node))) valid = false;
      if (ts.isCallExpression(node)) {
        const execution = ordinary(node, 'driver-candidate');
        if (!execution && !ordinary(node, 'serene')) valid = false;
        if (execution) sites.push({ line: execution.line, column: execution.column, function: execution.function });
      }
      if (ts.isTaggedTemplateExpression(node) && !ordinary(node, 'serene')) valid = false;
      if (ts.isNewExpression(node) || ts.isYieldExpression(node) || ts.isDeleteExpression(node) ||
          ts.isSpreadAssignment(node) || ts.isSpreadElement(node) || ts.isComputedPropertyName(node) ||
          (ts.isBinaryExpression(node) && node.operatorToken.kind >= ts.SyntaxKind.FirstAssignment &&
            node.operatorToken.kind <= ts.SyntaxKind.LastAssignment) ||
          (ts.isPrefixUnaryExpression(node) || ts.isPostfixUnaryExpression(node)) &&
            [ts.SyntaxKind.PlusPlusToken, ts.SyntaxKind.MinusMinusToken].includes(node.operator)) valid = false;
      ts.forEachChild(node, visit);
    };
    visit(fn);
    if (!valid || !sites.length) continue;
    // Names and execution coordinates come from the audit, not hidden-name inference.
    const start = fn.getStart(sf), end = fn.end;
    masks.push({ kind: 'ordinary', scope: 'sql-construction', file, start, end,
      function: sites[0].function, sites: sites.map(({ line, column }) => ({ line, column })) });
  }
  return masks;
}

function checkContext(context) {
  if (!context || typeof context.source !== 'string' || typeof context.file !== 'string' || !context.file ||
      typeof context.revision !== 'string' || !context.revision) {
    throw new TypeError('A full source, nonempty file and revision are required.');
  }
}

/** Filter host-owned source ranges before delivery for SQL-construction review. */
export function filterConstructionSource(snapshot, response) {
  checkContext(snapshot);
  checkContext(response);
  if (!Array.isArray(response.ranges) || response.ranges.some(r => !r || typeof r.text !== 'string')) {
    throw new TypeError('Source ranges with text are required.');
  }
  const plain = reason => ({ filtered: false, reason,
    ranges: response.ranges.map(({ start, end, text }) => ({ start, end, text })) });
  if (snapshot.file !== response.file || snapshot.revision !== response.revision || snapshot.source !== response.source) {
    return plain('snapshot-mismatch');
  }
  const { source, file, revision } = snapshot;
  if (!/\.(?:[cm]?[jt]s|[jt]sx)$/.test(file)) return plain('unsupported-file');
  if (response.ranges.some(r => !Number.isSafeInteger(r.start) || !Number.isSafeInteger(r.end) ||
      r.start < 0 || r.end < r.start || r.end > source.length || source.slice(r.start, r.end) !== r.text)) {
    return plain('range-mismatch');
  }
  let masks;
  try { masks = constructionFunctions(source, file); }
  catch { return plain('analysis-failed'); }
  if (masks === null) return plain('parse-failed');
  let filtered = false;
  const ranges = response.ranges.map(({ start, end }) => {
    const parts = [];
    if (start === end) return { start, end, parts };
    let cursor = start;
    for (const mask of masks) {
      if (mask.start >= end || mask.end <= cursor) continue;
      if (mask.start > cursor) parts.push({ kind: 'source', start: cursor, end: mask.start, text: source.slice(cursor, mask.start) });
      parts.push({ ...mask, revision });
      cursor = Math.min(end, mask.end);
      filtered = true;
    }
    if (cursor < end) parts.push({ kind: 'source', start: cursor, end, text: source.slice(cursor, end) });
    return { start, end, parts };
  });
  return filtered ? { filtered: true, ranges } : plain('no-ordinary-range');
}

/** Filter a complete, host-owned edit list; never parse or generate a Git patch. */
export function filterConstructionDiff(snapshot, response) {
  for (const pair of [snapshot, response]) {
    checkContext(pair?.base);
    checkContext(pair?.head);
  }
  if (!Array.isArray(response.changes) || response.changes.some(c =>
    !c || typeof c.base?.text !== 'string' || typeof c.head?.text !== 'string')) {
    throw new TypeError('Paired base/head change ranges with text are required.');
  }
  const identity = ({ file, revision }) => ({ file, revision });
  const range = ({ start, end, text }) => ({ start, end, text });
  const changes = response.changes.map((c, index) => ({ index, kind: 'source',
    base: range(c.base), head: range(c.head) }));
  const plain = reason => ({ filtered: false, reason,
    base: identity(response.base), head: identity(response.head), changes });
  for (const side of ['base', 'head']) {
    if (['file', 'revision', 'source'].some(key => snapshot[side][key] !== response[side][key])) {
      return plain('snapshot-mismatch');
    }
  }
  if (snapshot.base.file !== snapshot.head.file) return plain('file-identity-change');
  if (snapshot.base.revision === snapshot.head.revision && snapshot.base.source !== snapshot.head.source) {
    return plain('diff-mismatch');
  }
  if (!/\.(?:[cm]?[jt]s|[jt]sx)$/.test(snapshot.base.file)) return plain('unsupported-file');
  const valid = (r, source) => Number.isSafeInteger(r.start) && Number.isSafeInteger(r.end) &&
    r.start >= 0 && r.end >= r.start && r.end <= source.length && source.slice(r.start, r.end) === r.text;
  let baseEnd = 0, headEnd = 0;
  for (const c of changes) {
    if (!valid(c.base, snapshot.base.source) || !valid(c.head, snapshot.head.source)) return plain('range-mismatch');
    // Equal gaps establish that this is a complete edit list, not a selected hunk.
    if (c.base.start < baseEnd || c.head.start < headEnd ||
        snapshot.base.source.slice(baseEnd, c.base.start) !== snapshot.head.source.slice(headEnd, c.head.start)) {
      return plain('diff-mismatch');
    }
    baseEnd = c.base.end;
    headEnd = c.head.end;
  }
  if (snapshot.base.source.slice(baseEnd) !== snapshot.head.source.slice(headEnd)) return plain('diff-mismatch');
  let masks;
  try {
    masks = Object.fromEntries(['base', 'head'].map(side => [side,
      constructionFunctions(snapshot[side].source, snapshot[side].file)]));
  } catch { return plain('analysis-failed'); }
  if (!masks.base || !masks.head) return plain('parse-failed');
  const metadata = (side, mask) => ({ ...mask, revision: snapshot[side].revision });
  const names = side => masks[side].map(m => m.function);
  if (['base', 'head'].some(side => names(side).some(n => !n) || new Set(names(side)).size !== masks[side].length)) {
    return plain('ambiguous-functions');
  }
  const lost = masks.base.filter(m => !names('head').includes(m.function));
  const gained = masks.head.filter(m => !names('base').includes(m.function));
  if (lost.length || gained.length) {
    // An import edit can change provenance at execution sites absent from the diff.
    // Preserve the whole file's edits and explicitly direct follow-up to those sites.
    return { ...plain('ordinary-set-changed'), transitions: {
      base: lost.map(m => metadata('base', m)), head: gained.map(m => metadata('head', m)) } };
  }
  const contains = (m, r) => r.start === r.end
    ? m.start < r.start && r.end < m.end
    : m.start <= r.start && r.end <= m.end;
  const touches = (m, r) => r.start === r.end
    ? m.start <= r.start && r.end <= m.end
    : r.start < m.end && m.start < r.end;
  let filtered = false;
  for (const before of masks.base) {
    const after = masks.head.find(m => m.function === before.function);
    const involved = changes.filter(c => touches(before, c.base) || touches(after, c.head));
    if (!involved.length || involved.some(c => !contains(before, c.base) || !contains(after, c.head))) continue;
    // Require corresponding full function spans, not merely an equal name somewhere.
    let cursor = before.start, rebuilt = '';
    for (const c of involved) {
      rebuilt += snapshot.base.source.slice(cursor, c.base.start) + c.head.text;
      cursor = c.base.end;
    }
    rebuilt += snapshot.base.source.slice(cursor, before.end);
    if (rebuilt !== snapshot.head.source.slice(after.start, after.end)) continue;
    for (const c of involved) {
      if (c.base.text === c.head.text) continue;
      c.kind = 'ordinary';
      c.scope = 'sql-construction';
      c.change = !c.base.text ? 'addition' : !c.head.text ? 'deletion' : 'modification';
      c.base = { start: c.base.start, end: c.base.end, function: metadata('base', before) };
      c.head = { start: c.head.start, end: c.head.end, function: metadata('head', after) };
      filtered = true;
    }
  }
  return filtered ? { filtered: true, base: identity(response.base), head: identity(response.head), changes }
    : plain('no-ordinary-change');
}
