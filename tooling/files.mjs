import { lstatSync, readdirSync, realpathSync } from 'node:fs';
import { extname, join, resolve } from 'node:path';

const extensions = new Set(['.ts', '.tsx', '.mts', '.cts', '.js', '.jsx', '.mjs', '.cjs']);
const excluded = new Set(['node_modules', 'dist', 'build', 'coverage', '.git']);

// Discovery only: every selected source is still analyzed independently.
export function collectFiles(inputs) {
  const files = new Map();
  const skipped = [];
  function visit(path, explicit = false) {
    const stat = lstatSync(path);
    if (stat.isSymbolicLink()) {
      if (explicit) throw new Error(`Symbolic link input is not supported: ${path}`);
      skipped.push({ path, reason: 'symbolic-link' });
    } else if (stat.isDirectory()) {
      for (const entry of readdirSync(path).sort()) {
        const child = join(path, entry);
        if (excluded.has(entry) && lstatSync(child).isDirectory()) {
          skipped.push({ path: child, reason: 'excluded-directory' });
        } else visit(child);
      }
    } else if (stat.isFile()) {
      if (explicit || extensions.has(extname(path))) {
        const key = realpathSync(path);
        if (!files.has(key)) files.set(key, path);
      }
    } else {
      throw new Error(`Not a regular source file or directory: ${path}`);
    }
  }
  for (const input of inputs) visit(input, true);
  if (!files.size) throw new Error('No source files selected. Supply source files or a directory containing JS/TS files.');
  return {
    files: [...files.values()].sort((a, b) => resolve(a) < resolve(b) ? -1 : resolve(a) > resolve(b) ? 1 : 0),
    skipped,
  };
}
