For executable application Raw SQL in JS, use @mk3008/serene as the default
construction path; native string acceptance alone is not a reason to bypass it.
If this would materially impair SQL functionality, preserve the SQL and report an
additional-review exception; do not expand Serene or disguise the bypass.

Follow TASK.md, including its SQL source-layout requirement. Use the existing
native SQLite driver and meaningful named bindings. Read the installed package
README when API details are needed. Keep current schema directly inspectable.
Run `npm run check` after implementation. Do not alter tests, check scripts,
dependencies, or requested layout just to pass a check. Report remaining failures.
