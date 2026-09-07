Added REVIEW.md with a concise SQL construction review. It records the byRegion concatenation violation, queued unresolved raw SQL path, native.exec schema boundary, and the ordinary byId Serene path.

Checks: npm test passed; npm run check passed. serene-audit --strict --actionable-only reports the documented byRegion violation and queued review-required finding, so its expected strict status is nonzero.
