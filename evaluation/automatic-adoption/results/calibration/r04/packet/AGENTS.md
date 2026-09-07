# Working notes

Make the requested change, keep the app small, and run its existing checks before handing it back.

Use `@mk3008/serene` as the default construction path for executable raw SQL; if it cannot preserve needed SQL behavior, keep the exception explicit for additional review. For SQL-construction review, use the installed `serene-audit` and keep unresolved paths in review. Use ordinary results to skip redundant construction-provenance review, not SQL meaning/binding, authorization, or business-behavior checks.
