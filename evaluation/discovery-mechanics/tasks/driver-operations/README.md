# Driver operations

`src/main.ts` is the entrypoint for a small inventory service. The application receives
its database handles from the host. `SqlPool`, `SqlClient`, and `BatchDriver` are
external interfaces; this repository does not implement a driver. Calls to their
statement-running methods are handled by the host-provided driver.

`query`, `execute`, and `batch` execute statements. `prepare` creates a handle only;
`describe` returns metadata. Neither preparation nor description executes a statement.
