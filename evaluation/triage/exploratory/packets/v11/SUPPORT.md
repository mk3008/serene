Serene's sql tag holds fixed SQL; bind(statement, namedValues) returns .text and
.params for native named binding. Values do not become SQL syntax. orderBy adds
one selected source-defined sort fragment. The application wrapper in CONTRACT.md
passes .text and .params unchanged to SQLite.

An ordinary audit classification describes construction provenance only. It does
not establish tenant authorization, correct business values, SQL meaning or
exhaustive execution coverage. Review-required means more investigation is needed,
not that a defect is proven. Raw bypasses remain subject to ordinary source review.
