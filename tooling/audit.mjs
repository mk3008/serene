import ts from 'typescript';
import * as serene from '../dist/index.js';

const tags = new Set(['sql', 'sort']);
const api = new Set([...tags, 'bind', 'orderBy', 'review']);
const result = (level, code, detail) => ({ level, code, detail });
const ordinary = () => result('ordinary', 'SCREENED_SOURCE', 'Literal SQL through Serene; review SQL meaning and binding use separately.');
const unknown = () => result('review-required', 'UNRESOLVED', 'SQL provenance cannot be established in this file.');
const violation = (code, detail) => result('violation', code, detail);

// Deliberately approximate content triage, not a SQL parser. Destructive words
// are searched even in comments/literals: false positives are review suggestions.
function contentSignals(text) {
  const signals = [];
  const add = (code, detail) => signals.push({ code, detail: `Review suggested: ${detail}` });
  for (const word of ['DROP', 'TRUNCATE', 'RENAME']) {
    if (new RegExp(`\\b${word}\\b`, 'i').test(text)) add(`SQL_${word}`, `${word} keyword may indicate an exceptional operation.`);
  }
  // Mask common comments/quotes only to avoid accepting their WHERE as evidence
  // of a restriction. Unsupported dialect forms and nesting are not interpreted.
  const apparent = text.replace(/--[^\r\n]*|\/\*[\s\S]*?(?:\*\/|$)|'(?:''|[^'])*(?:'|$)|"(?:""|[^"])*(?:"|$)/g, ' ');
  if (/\bCREATE\s+(?:(?:GLOBAL|LOCAL)\s+)?TEMP(?:ORARY)?\b/i.test(apparent)) {
    add('SQL_CREATE_TEMP', 'Temporary creation may introduce operational state.');
  }
  for (const statement of apparent.split(';')) {
    // Look near an AS-opened body after WITH, including later CTE definitions.
    // Outer DML after a SELECT body is not evidence of a modifying CTE.
    if (/\bWITH\b[\s\S]*?\bAS\s*(?:(?:NOT\s+)?MATERIALIZED\s*)?\(\s*(?:\(\s*)*(?:INSERT|UPDATE|DELETE)\b/i.test(statement)) {
      if (!signals.some(s => s.code === 'SQL_DATA_MODIFYING_CTE')) {
        add('SQL_DATA_MODIFYING_CTE', 'A CTE-shaped AS body begins with data modification; inspect its effects.');
      }
    }
    // A later query's WHERE must not clear an earlier operation. This intentionally
    // over-refers nested queries and does not establish WHERE scope or selectivity.
    const operations = [...statement.matchAll(/\b(SELECT|UPDATE|DELETE|INSERT)\b/gi)];
    for (let i = 0; i < operations.length; i++) {
      const operation = operations[i], name = operation[1].toUpperCase();
      if (name === 'INSERT') continue;
      const region = statement.slice(operation.index + operation[0].length, operations[i + 1]?.index);
      const code = `SQL_${name}_WITHOUT_WHERE`;
      if (!/\bWHERE\b/i.test(region) && !signals.some(s => s.code === code)) {
        add(code, `${name} has no apparent WHERE before the next operation or statement boundary.`);
      }
    }
  }
  return signals;
}

/** Conservative, file-local source inventory. No type assertion establishes trust. */
export function auditSource(source, filename = 'input.ts', options = {}) {
  // TypeScript canonicalizes Windows paths to forward slashes while creating a
  // Program. Keep that spelling inside the virtual host, but retain `filename`
  // below so findings report exactly the path supplied by the caller.
  const compilerFilename = filename.replaceAll('\\', '/');
  const sourceFile = ts.createSourceFile(compilerFilename, source, ts.ScriptTarget.Latest, true,
    /\.[cm]?jsx?$/.test(filename) ? ts.ScriptKind.JS : filename.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  const host = {
    getSourceFile: name => name === compilerFilename ? sourceFile : undefined,
    getDefaultLibFileName: () => '', writeFile() {}, getCurrentDirectory: () => '',
    getDirectories: () => [], fileExists: name => name === compilerFilename,
    readFile: name => name === compilerFilename ? source : undefined,
    getCanonicalFileName: name => name, useCaseSensitiveFileNames: () => true, getNewLine: () => '\n',
  };
  const program = ts.createProgram([compilerFilename], { noLib: true, noResolve: true, allowJs: true }, host);
  const checker = program.getTypeChecker();
  const rows = [];
  const sinkNames = new Set(options.sinkNames ?? ['query', 'execute', 'unsafe']);
  function unparen(node) {
    while (node && ts.isParenthesizedExpression(node)) node = node.expression;
    return node;
  }
  function declaration(node) {
    return ts.isIdentifier(node) ? checker.getSymbolAtLocation(node)?.declarations?.[0] : undefined;
  }
  function initializer(node) {
    const decl = declaration(node);
    return decl && ts.isVariableDeclaration(decl) && ts.isIdentifier(decl.name) &&
      (decl.parent.flags & ts.NodeFlags.Const) ? decl.initializer : undefined;
  }
  function apiName(node, seen = new Set()) {
    node = unparen(node);
    if (!node || seen.has(node)) return undefined;
    seen.add(node);
    const decl = declaration(node);
    if (decl && ts.isImportSpecifier(decl) && !decl.isTypeOnly && !decl.parent.parent.isTypeOnly) {
      const imported = (decl.propertyName ?? decl.name).text;
      if (decl.parent.parent.parent.moduleSpecifier.text === '@mk3008/serene' && api.has(imported)) return imported;
    }
    const init = initializer(node);
    return init ? apiName(init, seen) : undefined;
  }
  function resolve(node, seen = new Set()) {
    node = unparen(node);
    if (!node || seen.has(node)) return node;
    seen.add(node);
    const init = initializer(node);
    return init ? resolve(init, seen) : node;
  }
  function sinkInfo(node, seen = new Set(), alias = false) {
    node = unparen(node);
    if (!node || seen.has(node)) return undefined;
    seen.add(node);
    const name = ts.isPropertyAccessExpression(node) ? node.name.text :
      ts.isElementAccessExpression(node) && ts.isStringLiteral(node.argumentExpression) ? node.argumentExpression.text :
      ts.isIdentifier(node) ? node.text : undefined;
    if (sinkNames.has(name) && !ts.isIdentifier(node)) return { name, alias };
    // Follow only local const aliases. These establish candidacy, never ordinary provenance.
    const init = initializer(node);
    if (init) return sinkInfo(init, seen, true) ?? (sinkNames.has(name) ? { name, alias: true } : undefined);
    const decl = declaration(node);
    if (decl && ts.isBindingElement(decl) && !decl.dotDotDotToken && !decl.initializer &&
        ts.isObjectBindingPattern(decl.parent) && ts.isVariableDeclaration(decl.parent.parent) &&
        (decl.parent.parent.parent.flags & ts.NodeFlags.Const)) {
      const property = decl.propertyName ?? decl.name;
      const key = ts.isIdentifier(property) || ts.isStringLiteral(property) ? property.text : undefined;
      if (sinkNames.has(key)) return { name: key, alias: true };
    }
    if (alias && ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression) &&
        node.expression.name.text === 'bind') {
      return sinkInfo(node.expression.expression, seen, true);
    }
    if (sinkNames.has(name)) return { name, alias: alias || !!decl &&
      (ts.isVariableDeclaration(decl) || ts.isBindingElement(decl)) };
    return undefined;
  }
  function classify(node, kind = 'sql', seen = new Set()) {
    node = resolve(node);
    if (!node || seen.has(node)) return unknown();
    seen = new Set(seen).add(node);
    if (ts.isTaggedTemplateExpression(node)) {
      const name = apiName(node.tag);
      if (!tags.has(name)) return unknown();
      if (!ts.isNoSubstitutionTemplateLiteral(node.template)) {
        return violation('INTERPOLATION', 'SQL interpolation is forbidden; use named parameters.');
      }
      if ((kind === 'sort') !== (name === 'sort') || !['sql', 'sort'].includes(kind)) return unknown();
      const raw = source.slice(node.template.getStart(sourceFile) + 1, node.template.end - 1);
      try {
        const strings = Object.assign([node.template.text], { raw: Object.freeze([raw]) });
        serene[name](Object.freeze(strings));
      } catch (error) { return violation(error.code ?? 'SQL_BOUNDARY', error.message); }
      const reviewSignals = name === 'sql' ? contentSignals(raw) : [];
      return reviewSignals.length ? { ...ordinary(), reviewSignals } : ordinary();
    }
    if (ts.isCallExpression(node)) {
      const name = apiName(node.expression);
      if (tags.has(name)) return violation('DIRECT_TAG_CALL', 'Serene tags must be literal template syntax; fabricated templates are not trusted.');
      if (name === 'bind' && kind === 'bound') return classify(node.arguments[0], 'sql', seen);
      if (name === 'orderBy' && kind === 'sql') {
        const base = classify(node.arguments[0], 'sql', seen);
        if (base.level !== 'ordinary') return base;
        // Require the finite set at the call site: no mutable map aliases, getters or spreads.
        const choices = node.arguments[1];
        if (!choices || !ts.isObjectLiteralExpression(choices) || !choices.properties.length) return unknown();
        for (const property of choices.properties) {
          if (!ts.isPropertyAssignment(property) || ts.isComputedPropertyName(property.name)) return unknown();
          const choice = classify(property.initializer, 'sort', seen);
          if (choice.level !== 'ordinary') return choice;
        }
        return base;
      }
      if (ts.isPropertyAccessExpression(node.expression) && ['concat', 'join', 'replace', 'replaceAll'].includes(node.expression.name.text)) {
        return violation('STRING_CONSTRUCTION', 'String construction at a SQL boundary requires redesign or explicit review outside Serene.');
      }
    }
    if (kind === 'text' && ts.isPropertyAccessExpression(node) && node.name.text === 'text') {
      return classify(node.expression, 'bound', seen);
    }
    if (ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.PlusToken || ts.isTemplateExpression(node)) {
      return violation('STRING_CONSTRUCTION', 'Concatenation/interpolation at a SQL boundary.');
    }
    return unknown();
  }
  function queryConfig(node) {
    node = unparen(node);
    if (!node) return undefined;
    // Only recognized identity-backed BoundSql, never a shape assertion.
    const bound = classify(node, 'bound');
    if (bound.level === 'ordinary') return bound;
    // Do not resolve object aliases: const does not prevent property writes.
    if (!ts.isObjectLiteralExpression(node)) return undefined;
    if (node.properties.length !== 2) return unknown();
    const fields = new Map();
    for (const p of node.properties) {
      if (!ts.isPropertyAssignment(p) || !ts.isIdentifier(p.name) ||
          !['text', 'values'].includes(p.name.text) || fields.has(p.name.text)) return unknown();
      fields.set(p.name.text, unparen(p.initializer));
    }
    const text = fields.get('text'), values = fields.get('values');
    if (!text || !values || !ts.isPropertyAccessExpression(text) || text.name.text !== 'text' ||
        !ts.isPropertyAccessExpression(values) || values.name.text !== 'values') return unknown();
    // Both properties must come from a recognized BoundSql. This does not claim
    // value integrity, serializer safety or semantic parameter correctness.
    const textSource = classify(text.expression, 'bound');
    if (textSource.level !== 'ordinary' ||
        classify(values.expression, 'bound').level !== 'ordinary') return unknown();
    return textSource;
  }
  // A function label is supplementary location metadata. It never participates in
  // provenance classification, and an anonymous lexical callback deliberately
  // blocks a fallback to any named outer function.
  function lexicalFunctionName(node) {
    for (let current = node.parent; current; current = current.parent) {
      if (!ts.isFunctionLike(current)) continue;
      if (ts.isFunctionDeclaration(current) || ts.isFunctionExpression(current)) {
        return current.name?.text ?? null;
      }
      if (ts.isArrowFunction(current)) {
        const parent = current.parent;
        return ts.isVariableDeclaration(parent) && parent.initializer === current &&
          ts.isIdentifier(parent.name) ? parent.name.text : null;
      }
      if (ts.isMethodDeclaration(current) || ts.isGetAccessorDeclaration(current) || ts.isSetAccessorDeclaration(current)) {
        return ts.isIdentifier(current.name) ? current.name.text : null;
      }
      // Constructors, call signatures, and other function-like nodes do not
      // expose a source name that this file-local audit can label confidently.
      return null;
    }
    return null;
  }
  function emit(node, finding, boundary) {
    const { line, character } = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile));
    rows.push({ file: filename, line: line + 1, column: character + 1, boundary,
      function: lexicalFunctionName(node), ...finding });
  }
  for (const diagnostic of sourceFile.parseDiagnostics) {
    const location = sourceFile.getLineAndCharacterOfPosition(diagnostic.start ?? 0);
    rows.push({ file: filename, line: location.line + 1, column: location.character + 1,
      boundary: 'source', function: null, ...violation('PARSE_ERROR', ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n')) });
  }
  function visit(node) {
    if (ts.isTaggedTemplateExpression(node) && tags.has(apiName(node.tag))) {
      emit(node, classify(node, apiName(node.tag) === 'sort' ? 'sort' : 'sql'), 'serene');
    }
    if (ts.isCallExpression(node)) {
      const name = apiName(node.expression);
      if (name && name !== 'review') emit(node, classify(node, name === 'bind' ? 'bound' : 'sql'), 'serene');
      else {
        const expr = node.expression;
        const sink = sinkInfo(expr);
        if (sink) {
          const finding = (!sink.alias && sink.name === 'query' && node.arguments.length === 1
            ? queryConfig(node.arguments[0]) : undefined) ?? classify(node.arguments[0], 'text');
          emit(node, sink.alias && finding.level !== 'violation' ?
            result('review-required', 'SINK_ALIAS', 'Local execution alias; inspect its receiver and any prebound arguments.') :
            finding, 'driver-candidate');
        }
        else if (ts.isElementAccessExpression(expr)) emit(node, unknown(), 'computed-call');
      }
    }
    ts.forEachChild(node, visit);
  }
  visit(sourceFile);
  return rows;
}
