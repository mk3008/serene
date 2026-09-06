# Application contract

The db object is a SQLite wrapper. db.query(text, values) passes a SQL string and a
plain object of SQLite named values to the driver. It returns arrays for SELECT and
write metadata for mutations. The driver binds the values; it never formats them into
the SQL string. Route and job inputs are untrusted except where a local finite mapping
visibly changes them. Review SQL construction and execution only.
