# Serene

**Raw SQL is a little too raw.**

Serene is a lightweight review tool for people who want to keep writing raw SQL and keep using their native database driver.

Raw SQL is not inherently unsafe. Some SQL construction paths are simple, fixed, and safely parameterized. Others are dynamic, unresolved, or deserve closer inspection.

Serene adds a small, recognizable boundary that lets humans and AI reviewers tell those paths apart.

Use Serene to identify ordinary, safely constructed SQL and spend your review effort on the paths that actually need additional scrutiny.

For SQL construction and parameter separation, Serene aims to provide the same class of safety people often rely on an ORM for — without replacing SQL or your native driver.

Serene is not an ORM, query builder, mapper, driver wrapper, or SQL parser.

It does not prove that SQL is semantically correct, authorized, performant, or free from every vulnerability. Its job is narrower: make raw SQL construction easy to recognize and triage during review.

## Install

Current release: **0.1.1** (`v0.1.1`). Serene is not published to the npm registry; install the tagged GitHub release directly:

```sh
npm install github:mk3008/serene#v0.1.1
```

Use `github:mk3008/serene` only when you intentionally want the latest `main` instead of a pinned release.

Node.js 22+. The runtime has zero dependencies. Full documentation stays in the tagged GitHub repository rather than being copied into `node_modules`.

## Quick start

Write normal SQL, bind values separately, and keep using your driver.

```ts
import { sql, bind } from '@mk3008/serene';

const findUser = sql`
  SELECT id, name
  FROM users
  WHERE id = :id
`;

const query = bind(findUser, { id }, 'indexed');
await pool.query(query.text, query.values);
```

`sql` accepts fixed template literals only. Runtime values stay outside the SQL text.

If your driver already supports named parameters, keep its native SQL unchanged:

```ts
const findUser = sql`
  SELECT [id], [name]
  FROM [users]
  WHERE id = @id
`;

const query = bind(findUser, { id });

query.names.forEach((name, i) => request.input(name, query.values[i]));
await request.query(query.text);
```

No Serene-specific parameter dialect is required when the driver already has one.

For drivers that use `?` placeholders, use the same named authoring style and bind with `anonymous`:

```ts
const findUser = sql`SELECT id, name FROM users WHERE id = :id`;
const query = bind(findUser, { id }, 'anonymous');
```

## What Serene adds

- **A visible SQL boundary** — fixed SQL is created from a literal `sql` template.
- **Value separation** — bound values are never rendered into SQL text.
- **Native driver usage** — Serene does not own connections, execution, transactions, or mapping.
- **Review triage** — recognized construction can be treated as ordinary; unresolved or dynamic construction stays visible for additional review.
- **Controlled sorting** — runtime input can select from finite, source-defined `ORDER BY` choices without accepting arbitrary SQL fragments.

Serene does not prove that a query is correct, authorized, fast, or free of every SQL vulnerability. Its job is narrower: make SQL construction easier to classify during review.

## Audit SQL paths

Run the audit on your source directory:

```sh
npx --no-install serene-audit src
```

Repository-wide:

```sh
npx --no-install serene-audit .
```

Show only paths that need additional review:

```sh
npx --no-install serene-audit --actionable-only src
```

If the project does not already use a compatible TypeScript version:

```sh
npm install --save-dev typescript@^5.9.3
```

| Level | Meaning |
| --- | --- |
| `ordinary` | Recognized Serene construction |
| `review-required` | Raw or unresolved SQL path; inspect it |
| `violation` | A detected Serene boundary violation |

The audit is conservative and file-local. See [audit coverage](docs/review-coverage.md) for details.

### Use the audit with AI agents

Copy this into the repository's root `AGENTS.md` (or equivalent instruction file):

```text
Use `@mk3008/serene` as the default construction path for executable raw SQL; if
it cannot preserve needed SQL behavior, keep the exception explicit for additional
review. For SQL-construction review, use the installed `serene-audit` and keep
unresolved paths in review. Use ordinary results to skip redundant
construction-provenance review, not SQL meaning/binding, authorization, or
business-behavior checks.
```

Then keep individual prompts focused on the actual task; they do not need to mention Serene each time. See the [AI adoption guide](docs/ai-adoption.md) for details and evidence.

### Filter source before AI delivery

Serene does not install itself into an AI agent. Call the filter in the host/tool layer **before** returning source-bearing results to the model:

```ts
import { filterConstructionSource, filterConstructionDiff } from '@mk3008/serene/filter';

const modelRead = filterConstructionSource(pinnedSource, {
  ...currentSource,
  ranges: readRanges,
});

const modelDiff = filterConstructionDiff(pinnedPair, {
  ...currentPair,
  changes: pairedEdits,
});
```

For PR or commit review, the host can start from a normal Git diff:

```sh
git diff --unified=0 BASE...HEAD
```

Convert those diff hunks into `pairedEdits`, then pass them to `filterConstructionDiff`. Serene deliberately does not parse or run `git diff` itself.

Send `modelRead` / `modelDiff` to the AI instead of the unfiltered source response. See the [source filter](docs/pre-exposure-filter.md) and [diff filter](docs/diff-filter.md) for the host contract and limits.

## Dynamic ORDER BY without dynamic SQL

```ts
import { sql, sort, orderBy, bind } from '@mk3008/serene';

const base = sql`SELECT id, name, created_at FROM users`;

const query = orderBy(base, {
  name: sort`name ASC`,
  newest: sort`created_at DESC`,
}, input.sort);

const bound = bind(query);
```

Runtime input chooses a reviewed key, not a SQL fragment.

## Optional search conditions without dynamic SQL

Optional filters do not necessarily require building SQL strings. When the set of filters is known, normal fixed SQL can express any combination:

```ts
const searchUsers = sql`
  SELECT id, name, status, created_at
  FROM users
  WHERE (:status IS NULL OR status = :status)
    AND (:createdFrom IS NULL OR created_at >= :createdFrom)
    AND (:createdTo IS NULL OR created_at < :createdTo)
`;

const query = bind(searchUsers, {
  status,
  createdFrom,
  createdTo,
}, 'indexed');
```

Bind `null` for filters that are not used. The SQL text stays fixed and the values stay bound; no Serene-specific optional-filter feature is required.

If users can change the query structure itself—for example, adding arbitrary joins or grouping—that is a different problem and may still require dynamic SQL and additional review.

## Documentation

- [Design](docs/design.md) — goals, boundaries, and why Serene stays small.
- [Security contract](docs/security.md) — guarantees, non-guarantees, and review responsibilities.
- [Review coverage](docs/review-coverage.md) — what source inspection detects, refers, or may miss.
- [Binding verification](docs/parameter-scanning-verification.md) — detailed parameter behavior and regression evidence.
- [Pre-exposure filter](docs/pre-exposure-filter.md) — host API for filtering construction-only source before AI delivery.
- [Diff filter](docs/diff-filter.md) — paired base/head filtering for PR and commit changes.
- [Evaluation map](evaluation/README.md) — current research questions, AI-review evidence, and limits.
- [AI adoption guide](docs/ai-adoption.md) — optional repository policy for installed Serene and AI review.

## Development

```sh
npm ci
npm run check
npm pack
```

License: MIT.
