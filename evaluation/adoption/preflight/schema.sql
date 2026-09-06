CREATE TABLE accounts (
  tenant_id INTEGER NOT NULL,
  id INTEGER NOT NULL,
  name TEXT NOT NULL,
  balance INTEGER NOT NULL CHECK(balance >= 0),
  PRIMARY KEY (tenant_id, id)
) STRICT;
CREATE TABLE inventory (
  tenant_id INTEGER NOT NULL,
  sku TEXT NOT NULL,
  stock INTEGER NOT NULL CHECK(stock >= 0),
  PRIMARY KEY (tenant_id, sku)
) STRICT;
CREATE TABLE orders (
  tenant_id INTEGER NOT NULL,
  id INTEGER NOT NULL,
  sku TEXT NOT NULL,
  quantity INTEGER NOT NULL CHECK(quantity > 0),
  status TEXT NOT NULL CHECK(status IN ('pending', 'shipped')),
  PRIMARY KEY (tenant_id, id),
  FOREIGN KEY (tenant_id, sku) REFERENCES inventory(tenant_id, sku)
) STRICT;
CREATE TABLE shipments (
  id INTEGER PRIMARY KEY,
  tenant_id INTEGER NOT NULL,
  order_id INTEGER NOT NULL,
  sku TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  UNIQUE(tenant_id, order_id),
  FOREIGN KEY (tenant_id, order_id) REFERENCES orders(tenant_id, id)
) STRICT;
