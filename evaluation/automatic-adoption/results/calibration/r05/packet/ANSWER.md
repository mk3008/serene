Completed the authorization review in AUTHORIZATION.md. It finds that an actor from one tenant can retrieve another tenant’s record because caseById ignores actor.tenantId and trusts request.tenantId for the SQL filter. No application behavior was changed.

Checks passed: npm test and npm run check.
