CREATE TABLE products(sku TEXT,title TEXT,category TEXT,reorder_point INTEGER,updated_at TEXT);
CREATE TABLE bins(sku TEXT,warehouse TEXT,bin_code TEXT,on_hand INTEGER,reserved INTEGER);
CREATE TABLE reservations(id TEXT,sku TEXT,warehouse TEXT,quantity INTEGER,requested_at TEXT);
CREATE TABLE receipts(id TEXT,supplier_id TEXT,received_at TEXT,reference TEXT,posted_at TEXT);
CREATE TABLE receipt_lines(receipt_id TEXT,sku TEXT,quantity INTEGER,unit_cost_cents INTEGER);
INSERT INTO products VALUES('a1','Anchor','tools',4,'2026-01-01');
INSERT INTO products VALUES('b2','Bolt','parts',3,'2026-01-01');
INSERT INTO bins VALUES('a1','north','N1',8,1);
INSERT INTO bins VALUES('b2','north','N2',5,0);
