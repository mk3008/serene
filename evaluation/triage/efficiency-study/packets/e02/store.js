import { sql, bind } from '@mk3008/serene';

export async function product(db, sku) {
  const __sereneQuery1 = bind(sql`SELECT sku,title,category,reorder_point FROM products WHERE sku=:sku`, { sku });
  const result = await db.query(__sereneQuery1.text, __sereneQuery1.params);
  return result;
}

export async function productPage(db, after, limit) {
  const __sereneQuery2 = bind(sql`SELECT sku,title,category FROM products WHERE sku>:after ORDER BY sku LIMIT :limit`, { after, limit });
  const result = await db.query(__sereneQuery2.text, __sereneQuery2.params);
  return result;
}

export async function addProduct(db, sku, title, category, reorderPoint, updatedAt) {
  const __sereneQuery3 = bind(sql`INSERT INTO products(sku,title,category,reorder_point,updated_at) VALUES(:sku,:title,:category,:reorderPoint,:updatedAt)`, { sku, title, category, reorderPoint, updatedAt });
  const result = await db.query(__sereneQuery3.text, __sereneQuery3.params);
  return result;
}

export async function updateProduct(db, sku, title, category) {
  const __sereneQuery4 = bind(sql`UPDATE products SET title=:title,category=:category WHERE sku=:sku`, { sku, title, category });
  const result = await db.query(__sereneQuery4.text, __sereneQuery4.params);
  return result;
}

export async function binLevels(db, sku) {
  const __sereneQuery5 = bind(sql`SELECT warehouse,bin_code,on_hand,reserved FROM bins WHERE sku=:sku`, { sku });
  const result = await db.query(__sereneQuery5.text, __sereneQuery5.params);
  return result;
}

export async function reserveUnits(db, sku, warehouse, quantity) {
  const __sereneQuery6 = bind(sql`UPDATE bins SET reserved=reserved+:quantity WHERE sku=:sku AND warehouse=:warehouse`, { sku, warehouse, quantity });
  const result = await db.query(__sereneQuery6.text, __sereneQuery6.params);
  return result;
}

export async function reservationRow(db, id, sku, warehouse, quantity, requestedAt) {
  const __sereneQuery7 = bind(sql`INSERT INTO reservations(id,sku,warehouse,quantity,requested_at) VALUES(:id,:sku,:warehouse,:quantity,:requestedAt)`, { id, sku, warehouse, quantity, requestedAt });
  const result = await db.query(__sereneQuery7.text, __sereneQuery7.params);
  return result;
}

export async function reservation(db, id) {
  const __sereneQuery8 = bind(sql`SELECT sku,warehouse,quantity FROM reservations WHERE id=:id`, { id });
  const result = await db.query(__sereneQuery8.text, __sereneQuery8.params);
  return result;
}

export async function releaseUnits(db, sku, warehouse, quantity) {
  const __sereneQuery9 = bind(sql`UPDATE bins SET reserved=reserved-:quantity WHERE sku=:sku AND warehouse=:warehouse`, { sku, warehouse, quantity });
  const result = await db.query(__sereneQuery9.text, __sereneQuery9.params);
  return result;
}

export async function deleteReservation(db, id) {
  const __sereneQuery10 = bind(sql`DELETE FROM reservations WHERE id=:id`, { id });
  const result = await db.query(__sereneQuery10.text, __sereneQuery10.params);
  return result;
}

export async function insertReceipt(db, id, supplierId, receivedAt, reference) {
  const __sereneQuery11 = bind(sql`INSERT INTO receipts(id,supplier_id,received_at,reference) VALUES(:id,:supplierId,:receivedAt,:reference)`, { id, supplierId, receivedAt, reference });
  const result = await db.query(__sereneQuery11.text, __sereneQuery11.params);
  return result;
}

export async function receiptLine(db, receiptId, sku, quantity, unitCostCents) {
  const __sereneQuery12 = bind(sql`INSERT INTO receipt_lines(receipt_id,sku,quantity,unit_cost_cents) VALUES(:receiptId,:sku,:quantity,:unitCostCents)`, { receiptId, sku, quantity, unitCostCents });
  const result = await db.query(__sereneQuery12.text, __sereneQuery12.params);
  return result;
}

export async function addOnHand(db, sku, warehouse, quantity) {
  const __sereneQuery13 = bind(sql`UPDATE bins SET on_hand=on_hand+:quantity WHERE sku=:sku AND warehouse=:warehouse`, { sku, warehouse, quantity });
  const result = await db.query(__sereneQuery13.text, __sereneQuery13.params);
  return result;
}

export async function postReceipt(db, id, postedAt) {
  const __sereneQuery14 = bind(sql`UPDATE receipts SET posted_at=:postedAt WHERE id=:id`, { id, postedAt });
  const result = await db.query(__sereneQuery14.text, __sereneQuery14.params);
  return result;
}

export async function supplierSpend(db) {
  const __sereneQuery15 = bind(sql`SELECT supplier_id,SUM(quantity*unit_cost_cents) cents FROM receipts r JOIN receipt_lines l ON l.receipt_id=r.id GROUP BY supplier_id`, {});
  const result = await db.query(__sereneQuery15.text, __sereneQuery15.params);
  return result;
}

export async function openReceipts(db) {
  const __sereneQuery16 = bind(sql`SELECT id,supplier_id,received_at FROM receipts WHERE posted_at IS NULL`, {});
  const result = await db.query(__sereneQuery16.text, __sereneQuery16.params);
  return result;
}

export async function receiptItems(db, receiptId) {
  const __sereneQuery17 = bind(sql`SELECT sku,quantity FROM receipt_lines WHERE receipt_id=:receiptId`, { receiptId });
  const result = await db.query(__sereneQuery17.text, __sereneQuery17.params);
  return result;
}

export async function removeReceipt(db, receiptId) {
  const __sereneQuery18 = bind(sql`DELETE FROM receipts WHERE id=:receiptId AND posted_at IS NULL`, { receiptId });
  const result = await db.query(__sereneQuery18.text, __sereneQuery18.params);
  return result;
}

export async function reservationsBySku(db) {
  const __sereneQuery19 = bind(sql`SELECT sku,SUM(quantity) units FROM reservations GROUP BY sku`, {});
  const result = await db.query(__sereneQuery19.text, __sereneQuery19.params);
  return result;
}

export async function inactiveProducts(db, before) {
  const __sereneQuery20 = bind(sql`SELECT sku,title FROM products WHERE updated_at<:before`, { before });
  const result = await db.query(__sereneQuery20.text, __sereneQuery20.params);
  return result;
}
import { categoryName, categoryScope, stockOrder, send } from './helpers.js';

export async function inventoryList(db, input) {
  const order = stockOrder(input.sort);
  return db.query('SELECT p.sku,p.title,COALESCE(SUM(b.on_hand-b.reserved),0) available FROM products p LEFT JOIN bins b ON b.sku=p.sku GROUP BY p.sku ORDER BY ' + order, {});
}
export async function categorySnapshot(db, request) {
  const category = categoryName(request.category);
  const scope = categoryScope(category);
  const rows = await db.query('SELECT p.category,COUNT(*) count,COALESCE(SUM(b.on_hand),0) units FROM products p LEFT JOIN bins b ON b.sku=p.sku WHERE ' + scope + ' GROUP BY p.category', {});
  return rows.map(row => ({...row, empty:row.units===0}));
}
export async function purgeReservation(db, id) {
  const result = await send(db, 'DELETE FROM reservations WHERE id=:id', {id});
  return {deleted:result.changes};
}
