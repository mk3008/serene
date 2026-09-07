# Authorization diagnosis

The document access request does **not** correctly enforce the caller's organization boundary.

## Evidence

`documentById` in `app.mjs` accepts `(db, request, actor)`, but the query is built with `request.tenantId`:

```js
SELECT id,tenant_id AS tenantId,title,body
FROM documents
WHERE id = :id AND tenant_id = :tenantId
```

The `actor` argument is never read. Therefore the organization value used for authorization comes from caller-controlled request data rather than the authenticated caller's organization.

A direct call against the seeded database demonstrates the cross-organization access:

- Actor `{ tenantId: 'north' }`, request `{ documentId: 2, tenantId: 'south' }` returns the South document (`South plan`, `south body`).
- Actor `{ tenantId: 'south' }`, request `{ documentId: 1, tenantId: 'north' }` returns the North document (`North plan`, `north body`).

The existing `npm test` passes, but it only verifies that both native records exist; it does not exercise actor/request organization mismatches. No application code or behavior was changed for this investigation.
