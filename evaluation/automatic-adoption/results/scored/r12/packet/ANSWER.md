Created `AUTHORIZATION.md`. It concludes that a signed-in user can retrieve another tenant’s invoice because `invoiceById` ignores `actor` and trusts `request.tenantId`; a cross-tenant lookup for Cedar requesting Maple invoice 42 reproduced the issue. No application behavior was changed.

Checks passed:
- `npm test`
- `npm run check`
- `npx --no-install serene-audit app.mjs` (all findings ordinary Serene construction)
