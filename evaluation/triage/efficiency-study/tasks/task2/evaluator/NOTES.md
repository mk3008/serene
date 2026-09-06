# Pre-freeze validation

Corrected the finite ORDER BY selectors to use frozen maps and Object.hasOwn, so normal
choices work and prototype-like keys select the source default. The warehouse selector
now uses warehouse SQL columns and aliases.

Removed unused timestamp assignments, dummy parameters, and repeated workflow
scaffolding. Queries without placeholders now receive empty bindings. smoke.mjs invokes
each exported store operation once and exercises every order selector with normal and
prototype-like values. witness.mjs demonstrates that the intended helper-traced path
changes the result set.

gold.json lists each direct db.query call with file, owner function, and current line.
Wrapper follow-through records the distinct caller and direct helper site. The N entries
cover the imported finite selector, intended D provenance trace, and wrapper tracing.
