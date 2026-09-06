CREATE TABLE invoices(id TEXT,customer_id TEXT,status TEXT,total_cents INTEGER,due_on TEXT,created_at TEXT,region TEXT,sent_at TEXT);
CREATE TABLE customers(id TEXT,name TEXT,email TEXT,region TEXT,credit_limit_cents INTEGER);
CREATE TABLE invoice_lines(invoice_id TEXT,sku TEXT,description TEXT,quantity INTEGER,unit_cents INTEGER);
CREATE TABLE payments(id TEXT,invoice_id TEXT,amount_cents INTEGER,received_at TEXT,reference TEXT);
CREATE TABLE customer_notes(customer_id TEXT,body TEXT,created_at TEXT);
INSERT INTO invoices VALUES('i1','c1','open',1000,'2026-01-01','2026-01-01','west',NULL);
INSERT INTO invoices VALUES('i2','c2','open',2000,'2026-01-01','2026-01-02','east',NULL);
