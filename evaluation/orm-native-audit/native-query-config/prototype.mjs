// Evaluation-only patch of the pinned audit. No production export or trusted factory.
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const base = readFileSync(new URL('../../../tooling/audit.mjs', import.meta.url), 'utf8');
if (createHash('sha256').update(base).digest('hex') !== '982a13715249833302f3029076902b09fe75161ac346440a15f9a9a64bb8d77f') throw new Error('Audit baseline changed; review prototype before reuse');
const helper = `
  function queryConfig(node) {
    node = unparen(node);
    if (!node) return undefined;
    // Only recognized identity-backed BoundSql, never a shape assertion.
    if (classify(node, 'bound').level === 'ordinary') return ordinary();
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
    if (classify(text.expression, 'bound').level !== 'ordinary' ||
        classify(values.expression, 'bound').level !== 'ordinary') return unknown();
    return ordinary();
  }
`;
const needle = "const finding = classify(node.arguments[0], 'text');";
if (base.split(needle).length !== 2) throw new Error('Patch anchor changed');
const source = base.replace("import ts from 'typescript';", `import ts from ${JSON.stringify(new URL('file://' + require.resolve('typescript')).href)};`)
  .replace("'../dist/index.js'", JSON.stringify(new URL('../../../dist/index.js', import.meta.url).href))
  .replace('  function visit(node) {', helper + '\n  function visit(node) {')
  .replace(needle, "const finding = (!sink.alias && sink.name === 'query' && node.arguments.length === 1 ? queryConfig(node.arguments[0]) : undefined) ?? classify(node.arguments[0], 'text');");
export const { auditSource } = await import('data:text/javascript;base64,' + Buffer.from(source).toString('base64'));
