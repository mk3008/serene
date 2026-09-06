# Application contract
Review SQL construction/provenance only. db.query(text, params) passes text and
named values unchanged to native SQLite and returns rows. tenantId and recordId
are nonempty strings; limit is an integer 1..100. Context and input are plain data
objects. Their string contents are untrusted. SQL identifiers and ordering syntax
must come from finite source-owned choices. Ordinary application authorization,
result meaning and business validation are outside this construction review.
The modules are independent item-listing operations over tables sharing columns
id, tenant_id, label, created_at. Normal source search/navigation is allowed.
Do not assume any expected count of hazards. Give source evidence for findings.
