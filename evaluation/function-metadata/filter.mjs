// Evaluation-only response transformation. The caller owns search scope and candidates.
import ts from 'typescript';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { auditSource } from '../../tooling/audit.mjs';

export function filterRows(source, file, revision, rows, snapshotValid = true) {
  const plain = () => ({ rows, correspondence: rows.map((_, i) => ({ input: i, outputs: [i] })),
    masks: [], inputRecords: rows.length, representedRecords: rows.length });
  if (!snapshotValid || !/\.(?:[cm]?[jt]s|[jt]sx)$/.test(file)) return plain();
  const sf = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true,
    file.endsWith('.tsx') ? ts.ScriptKind.TSX : /\.[cm]?jsx?$/.test(file) ? ts.ScriptKind.JS : ts.ScriptKind.TS);
  if (sf.parseDiagnostics.length) return plain();
  const findings = auditSource(source, file);
  const position = n => {
    const p = sf.getLineAndCharacterOfPosition(n.getStart(sf));
    return { line: p.line + 1, column: p.character + 1 };
  };
  const at = n => { const p = position(n); return findings.filter(f => f.line === p.line && f.column === p.column); };
  const unwrap = n => ts.isAwaitExpression(n) ? n.expression : n;
  const isAssignment = kind => kind >= ts.SyntaxKind.FirstAssignment && kind <= ts.SyntaxKind.LastAssignment;
  // The audit establishes the first argument's Serene text provenance. Keep the
  // rest of the execution shape deliberately narrow so arbitrary expressions
  // (including a second SQL construction) cannot disappear with the function.
  const isSimpleDriverArguments = call => {
    const [first, ...rest] = call.arguments;
    if (!first || !ts.isPropertyAccessExpression(first) || !ts.isIdentifier(first.expression) || first.name.text !== 'text') return false;
    const bound = first.expression.text;
    return rest.every(argument => {
      if (ts.isIdentifier(argument) || ts.isStringLiteral(argument) || ts.isNumericLiteral(argument) ||
          argument.kind === ts.SyntaxKind.NullKeyword || argument.kind === ts.SyntaxKind.TrueKeyword ||
          argument.kind === ts.SyntaxKind.FalseKeyword) return true;
      return ts.isPropertyAccessExpression(argument) && ts.isIdentifier(argument.expression) &&
        argument.expression.text === bound && ['values', 'params'].includes(argument.name.text);
    });
  };
  const masks = [];
  for (const fn of sf.statements) {
    if (!ts.isFunctionDeclaration(fn) || !fn.body || !fn.name || !fn.body.statements.length) continue;
    let valid = true;
    const sites = [];
    // Defaults and destructuring execute/bind code outside body.statements, but
    // the emitted mask includes the complete declaration.
    for (const parameter of fn.parameters) {
      if (parameter.initializer || !ts.isIdentifier(parameter.name)) valid = false;
    }
    for (const statement of fn.body.statements) {
      if (ts.isVariableStatement(statement) && statement.declarationList.flags & ts.NodeFlags.Const) {
        for (const decl of statement.declarationList.declarations) {
          if (!ts.isIdentifier(decl.name) || !decl.initializer || !(ts.isCallExpression(decl.initializer) || ts.isTaggedTemplateExpression(decl.initializer)) ||
              !at(decl.initializer).some(f => f.boundary === 'serene' && f.level === 'ordinary')) valid = false;
        }
      } else {
        const expr = ts.isExpressionStatement(statement) ? statement.expression :
          ts.isReturnStatement(statement) ? statement.expression : undefined;
        const call = expr && unwrap(expr);
        if (!call || !ts.isCallExpression(call) || !isSimpleDriverArguments(call) ||
            !at(call).some(f => f.boundary === 'driver-candidate' && f.level === 'ordinary')) valid = false;
      }
    }
    const visit = n => {
      if (n !== fn && ((ts.isFunctionLike(n) && n.body) || ts.isClassLike(n))) valid = false;
      if (ts.isCallExpression(n)) {
        const fs = at(n);
        if (!fs.some(f => ['serene', 'driver-candidate'].includes(f.boundary) && f.level === 'ordinary')) valid = false;
        const execution = fs.find(f => f.boundary === 'driver-candidate' && f.level === 'ordinary');
        if (execution) sites.push({ ...position(n), function: typeof execution.function === 'string' ? execution.function : null });
      }
      if (ts.isTaggedTemplateExpression(n) && !at(n).some(f => f.boundary === 'serene' && f.level === 'ordinary')) valid = false;
      // Effectful expressions inside parameters are not covered by SQL provenance.
      if (ts.isNewExpression(n) || ts.isYieldExpression(n) || ts.isDeleteExpression(n) ||
          ts.isSpreadAssignment(n) || ts.isSpreadElement(n) || ts.isGetAccessor(n) ||
          ts.isSetAccessor(n) || ts.isComputedPropertyName(n) ||
          (ts.isBinaryExpression(n) && isAssignment(n.operatorToken.kind)) ||
          (ts.isPrefixUnaryExpression(n) && [ts.SyntaxKind.PlusPlusToken, ts.SyntaxKind.MinusMinusToken].includes(n.operator)) ||
          (ts.isPostfixUnaryExpression(n) && [ts.SyntaxKind.PlusPlusToken, ts.SyntaxKind.MinusMinusToken].includes(n.operator))) valid = false;
      ts.forEachChild(n, visit);
    };
    visit(fn);
    if (!valid || !sites.length) continue;
    const start = fn.getStart(sf), end = fn.end;
    const startLine = sf.getLineAndCharacterOfPosition(start).line + 1;
    const endLine = sf.getLineAndCharacterOfPosition(end - 1).line + 1;
    masks.push({ id: createHash('sha256').update(revision + '\0' + file + '\0' + start + ':' + end).digest('hex').slice(0, 12),
      file, startLine, endLine, start, end, sites });
  }
  // Any ID collision conservatively disables compression.
  if (new Set(masks.map(m => m.id)).size !== masks.length) return plain();
  const output = [], correspondence = [], emitted = new Map();
  const lineStarts = sf.getLineStarts(), sourceLines = source.split(/\r?\n/);
  rows.forEach((row, input) => {
    if (row.file !== file || row.text !== sourceLines[row.line - 1]) {
      correspondence.push({ input, outputs: [output.length] }); output.push(row); return;
    }
    const lineStart = lineStarts[row.line - 1], lineEnd = lineStart + row.text.length;
    const overlaps = masks.filter(m => m.start < lineEnd && m.end > lineStart);
    if (!overlaps.length) {
      correspondence.push({ input, outputs: [output.length] }); output.push(row); return;
    }
    const outputs = [], parts = []; let cursor = lineStart;
    for (const mask of overlaps) {
      if (mask.start > cursor) parts.push({ column: cursor - lineStart + 1, text: source.slice(cursor, mask.start) });
      cursor = Math.min(lineEnd, mask.end);
      if (!emitted.has(mask.id)) {
        emitted.set(mask.id, output.length);
        const requested = new Set(rows.filter(r => r.file === file).map(r => r.line));
        output.push({ ordinary: mask.id, file, sites: mask.sites.filter(s => requested.has(s.line)) });
      }
      outputs.push(emitted.get(mask.id));
    }
    if (cursor < lineEnd) parts.push({ column: cursor - lineStart + 1, text: source.slice(cursor, lineEnd) });
    if (parts.some(p => p.text.trim())) {
      outputs.push(output.length); output.push({ file, line: row.line, parts });
    }
    correspondence.push({ input, outputs });
  });
  return { rows: output, correspondence, masks, inputRecords: rows.length,
    representedRecords: correspondence.length };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const q = JSON.parse(readFileSync(0, 'utf8'));
  process.stdout.write(JSON.stringify(filterRows(q.source, q.file, q.revision, q.rows, q.snapshotValid)) + '\n');
}
