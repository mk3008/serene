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
  const ordinary = (node, boundary) => at(node).find(f => f.boundary === boundary && f.level === 'ordinary');
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
