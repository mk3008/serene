# invoiceById authorization

A signed-in user can obtain another tenant’s invoice. For example, an actor with tenantId cedar receives the Maple invoice when the request supplies tenantId maple and id 42.

The cause is that invoiceById never uses actor for authorization. Its SQL query scopes rows to request.tenantId and request.id, so the caller controls the tenant value used in the lookup. There is no check that request.tenantId matches the actor’s tenant.
