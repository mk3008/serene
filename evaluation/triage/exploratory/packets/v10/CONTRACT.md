# Cedar task contract

`setSubscriptionState` is called by a tenant administrator to activate or suspend one subscription in the authenticated tenant. The authenticated `tenantId` and request `subscriptionId` are untrusted only at the input boundary; the database must receive them as named values. The requested state is exactly `active` or `suspended`; invalid states are rejected. A successful update must set `updated_at` and return the changed row.

`subscriptionHistory` lists history for the authenticated tenant, optionally limited to a positive integer. The limit is a caller value and must remain a bound parameter. `db.query(text, namedParams)` passes SQL and values unchanged to native SQLite, returns row arrays, and throws on SQL errors. SQLite interprets `:name` markers.

The handler must preserve tenant scoping in every operation. No transaction or concurrency behavior is required.
