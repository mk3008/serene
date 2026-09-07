# Authorization review

A signed-in user can obtain another tenant’s case record through the caseById function. The function receives the signed-in actor, but never reads or validates actor.tenantId. Instead, the SQL query filters by request.tenantId and request.id, both supplied by the caller. For example, an actor from north can request { tenantId: "south", id: 2 } and receive the South record.

The relevant cause is the missing authorization check tying the query’s tenant filter to the authenticated actor; tenant scoping is controlled by request input rather than the actor identity.
