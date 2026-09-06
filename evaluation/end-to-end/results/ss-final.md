Review completed and recorded.

- Discovered 10 SQL execution sites at revision 10241d647759a95fc149da81fa6f664bd2d1fc51.
- Found one SQL injection in reporting.ts, searchStockroom: UntrustedInput phrase is concatenated into the ILIKE SQL text before db.query.
- Reviewed all candidates, marked Serene skips as skip-ordinary, resolved static SQL sites as safe, and completed the recorder with finish.
