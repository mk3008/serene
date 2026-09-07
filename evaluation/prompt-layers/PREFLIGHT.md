# Observer preflight

Run from the repository root:

```sh
python3 evaluation/prompt-layers/preflight.py
```

The check creates only a disposable temporary directory. It extracts the committed
`evaluation/automatic-adoption/artifacts/mk3008-serene-0.1.0.tgz` twice with the
already-installed local TypeScript runtime, inserts the exact hook into one installed CLI, and
compares raw exit status, stdout bytes, and stderr bytes for `serene-audit` and
direct `node .../tooling/cli.mjs` entry on help, ordinary, violation, and invalid
argument inputs. It also checks detached inotify readiness, `OPEN` observation, and
final health recording on an independent disposable root.

The hook records successful ESM entry only. It cannot record an attempted CLI whose
module resolution fails before module evaluation. Inotify records filesystem events,
not an actor PID, model comprehension, received prompt context, or policy use.

Work-mode spawning does not expose a working-directory setting. The frozen direct prompt names the
opaque packet root, but this preflight does not claim that the platform natively bootstraps a
repository-root `AGENTS.md`; the load cue is the only explicit instruction to read it.
