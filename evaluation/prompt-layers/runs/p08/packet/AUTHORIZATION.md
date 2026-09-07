# Authorization diagnosis

The document access request does **not** correctly enforce the caller's organization boundary. The query applies a tenant filter, but the tenant value comes from the caller-controlled request rather than from the authenticated actor.

## Evidence

- `app.mjs:2` accepts an `actor` argument but never reads it. It binds `tenantId: request.tenantId` into `WHERE ... tenant_id = :tenantId`.
- `database.mjs:2` seeds document `id = 1` in `north` and document `id = 2` in `south`.
- Reproduction with an actor whose organization is `north`:

  ```js
  const db = openDatabase();
  documentById(db, { documentId: 2, tenantId: 'south' }, { tenantId: 'north' });
  // { id: 2, tenantId: 'south', title: 'South plan', body: 'south body' }
  ```

  The function returns the South document to a North actor because the request's `tenantId` controls the lookup. Passing a different actor with the same request produces the same result, confirming that `actor` has no authorization effect.

The existing test (`test.mjs:1`) only checks that both seeded records exist. It does not exercise cross-organization access, so it would pass despite this authorization issue.

## Impact

Any caller able to choose `request.tenantId` can read a document from another organization by supplying that organization's tenant identifier. The tenant predicate is a data lookup constraint, not an effective caller-boundary check in this implementation.
