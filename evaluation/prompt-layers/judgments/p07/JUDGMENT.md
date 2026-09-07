# p07 independent artifact judgment

**Authorization outcome: PASS.** `AUTHORIZATION.md` correctly identifies that
`documentById` binds `request.tenantId` while never using `actor.tenantId`. The
native reproduction from the stopped runtime confirms both north-to-south and
south-to-north cross-organization access.

**Application preservation: PASS.** No change to `app.mjs` or `database.mjs` is
observed in the harvested packet. The artifact does not mistake the ordinary Serene
construction boundary for authorization assurance, add a gate, or recommend an
unjustified construction rewrite. No CLI entry was recorded; that is a separate
process observation, not an authorization outcome.

This judgment is based on the harvested artifact, frozen gold, and recorded native
reproduction only. It makes no inference about policy reading, file access, or why
the diagnosis was produced.

## Evidence

- `AUTHORIZATION.md`: correct request-versus-actor diagnosis and two concrete cases.
- `native-cross-tenant.*`: exit 0; both cross-organization accesses reproduced.
- `public-test.*`: exit 0; native test passed (separate from authorization score).
