# Serene

**Raw SQL is a little too raw.**

Keep your SQL. Keep your native driver. Add a small boundary that reviewers can recognize.

Serene is for TypeScript/JavaScript teams that prefer raw SQL but want humans and AI reviewers to distinguish fixed, parameterized SQL from code that deserves additional review.

The goal is to focus deep SQL-construction review on the paths that need it, using recognized construction to avoid repeated investigation without replacing SQL review.

It is not an ORM, query builder, mapper, driver wrapper, or SQL parser.

## Install

Serene is currently pre-release and not yet published to npm. Install it directly from GitHub for now:

```sh
npm install github:mk3008/serene
```

Node.js 22+. The runtime has zero dependencies.

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

## Review your SQL paths

The optional source audit identifies recognized Serene construction and SQL execution candidates.

If your project does not already use a compatible TypeScript version:

```sh
npm install --save-dev typescript@^5.9.3
```

Then run:

```sh
npx --no-install serene-audit src
```

Use `serene-audit .` for repository-wide inventory, or pass individual files. For concise review triage, use `serene-audit --actionable-only src`: it reports counts only for candidate driver execution sites and lists only review-required or violation findings. The default JSON inventory remains complete.

Findings include source locations and function names for navigation; see [audit coverage](docs/review-coverage.md).

Findings are intentionally simple:

| Level | Meaning |
| --- | --- |
| `ordinary` | Recognized Serene construction |
| `review-required` | Raw or unresolved SQL path; inspect it |
| `violation` | A detected Serene boundary violation |

The audit is deliberately conservative and file-local. See [review coverage](docs/review-coverage.md) for what it can and cannot discover.

The CLI provides the review signal; it does not force an AI agent to invoke or consume it. Evaluation shows that integration timing matters: filtering source-bearing responses before model delivery can avoid ordinary-body exposure, while adding Serene only after the agent has already read those bodies can add cost instead. The pre-exposure host/filter used in that study is not a shipped CLI feature. See the [evaluation map](evaluation/README.md).

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

## Documentation

- [Design](docs/design.md) — goals, boundaries, and why Serene stays small.
- [Security contract](docs/security.md) — guarantees, non-guarantees, and review responsibilities.
- [Review coverage](docs/review-coverage.md) — what source inspection detects, refers, or may miss.
- [Binding verification](docs/parameter-scanning-verification.md) — detailed parameter behavior and regression evidence.
- [Evaluation map](evaluation/README.md) — current research questions, AI-review evidence, and limits.
- [AI adoption guide](docs/ai-adoption.md) — optional repository policy for installed Serene and AI review.

## Development

```sh
npm ci
npm run check
npm pack
```

License: MIT.
