import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';

const appRoot = resolve(process.argv[2] ?? process.env.APP_ROOT ?? 'evaluation/automatic-adoption/fixtures/calibration-construction-review');
const app = await import(pathToFileURL(resolve(appRoot, 'app.mjs')).href);
const results = [];
function check(name, operation) {
  try { results.push({ name, passed: Boolean(operation()) }); }
  catch (error) { results.push({ name, passed: false, error: String(error?.message ?? error) }); }
}
const db = app.openQueue();
check('fixed bound path behavior', () => app.byId(db, 1).region === 'east');
check('joined-text path baseline behavior', () => app.byRegion(db, 'west').length === 1);
check('fixed raw path baseline behavior', () => app.queued(db).length === 1);
process.stdout.write(JSON.stringify({ appRoot, results }) + '\n');
if (!results.every((result) => result.passed)) process.exitCode = 1;
