# Authorization behavior

A signed-in user can obtain another tenant’s record if they know or can guess its ID and provide that tenant ID in the request. For example, an actor with `{ tenantId: "north" }` can call `caseById(db, actor, { tenantId: "south", id: 2 })` and receive the South record.

The cause is that `caseById` builds its SQL filter from `request.tenantId`; it never uses `actor.tenantId` to constrain the query. The `actor` argument is therefore ignored, so the request can select a different tenant. No application behavior was changed.
