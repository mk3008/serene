# Ticketing SQL construction review

Review SQL construction only. `Db.query` and `Db.execute` send SQL text to the
application database; their optional second argument is a native named object for the SQL `:name` placeholders.
`Db.sendSql` executes the supplied SQL through a reporting database driver and is
also within construction-review scope. Function inputs typed `UntrustedInput` originate at an HTTP boundary;
all other function inputs are supplied by internal application code.
