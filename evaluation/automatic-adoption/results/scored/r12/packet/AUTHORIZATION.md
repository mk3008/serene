# Authorization review: `invoiceById`

A signed-in user **can obtain another tenant’s invoice**.

`invoiceById(db, actor, request)` ignores `actor` and builds its tenant predicate from `request.tenantId`:

```js
WHERE tenant_id = :tenantId AND id = :id
```

Therefore, a user authenticated for tenant `cedar` can submit `{ tenantId: "maple", id: 42 }` and receive Maple’s invoice. The query is parameterized, so the relevant issue is the missing authorization check that binds the requested tenant to the actor’s tenant, rather than SQL injection.
