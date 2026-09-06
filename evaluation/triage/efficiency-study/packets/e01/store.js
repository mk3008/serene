export async function product(db, sku) {
  const result = await db.query('SELECT sku,title,category,reorder_point FROM products WHERE sku=:sku', { sku });
  return result;
}

export async function productPage(db, after, limit) {
  const result = await db.query('SELECT sku,title,category FROM products WHERE sku>:after ORDER BY sku LIMIT :limit', { after, limit });
  return result;
}

export async function addProduct(db, sku, title, category, reorderPoint, updatedAt) {
  const result = await db.query('INSERT INTO products(sku,title,category,reorder_point,updated_at) VALUES(:sku,:title,:category,:reorderPoint,:updatedAt)', { sku, title, category, reorderPoint, updatedAt });
  return result;
}

export async function updateProduct(db, sku, title, category) {
  const result = await db.query('UPDATE products SET title=:title,category=:category WHERE sku=:sku', { sku, title, category });
  return result;
}

export async function binLevels(db, sku) {
  const result = await db.query('SELECT warehouse,bin_code,on_hand,reserved FROM bins WHERE sku=:sku', { sku });
  return result;
}

export async function reserveUnits(db, sku, warehouse, quantity) {
  const result = await db.query('UPDATE bins SET reserved=reserved+:quantity WHERE sku=:sku AND warehouse=:warehouse', { sku, warehouse, quantity });
  return result;
}

export async function reservationRow(db, id, sku, warehouse, quantity, requestedAt) {
  const result = await db.query('INSERT INTO reservations(id,sku,warehouse,quantity,requested_at) VALUES(:id,:sku,:warehouse,:quantity,:requestedAt)', { id, sku, warehouse, quantity, requestedAt });
  return result;
}

export async function reservation(db, id) {
  const result = await db.query('SELECT sku,warehouse,quantity FROM reservations WHERE id=:id', { id });
  return result;
}

export async function releaseUnits(db, sku, warehouse, quantity) {
  const result = await db.query('UPDATE bins SET reserved=reserved-:quantity WHERE sku=:sku AND warehouse=:warehouse', { sku, warehouse, quantity });
  return result;
}

export async function deleteReservation(db, id) {
  const result = await db.query('DELETE FROM reservations WHERE id=:id', { id });
  return result;
}

export async function insertReceipt(db, id, supplierId, receivedAt, reference) {
  const result = await db.query('INSERT INTO receipts(id,supplier_id,received_at,reference) VALUES(:id,:supplierId,:receivedAt,:reference)', { id, supplierId, receivedAt, reference });
  return result;
}

export async function receiptLine(db, receiptId, sku, quantity, unitCostCents) {
  const result = await db.query('INSERT INTO receipt_lines(receipt_id,sku,quantity,unit_cost_cents) VALUES(:receiptId,:sku,:quantity,:unitCostCents)', { receiptId, sku, quantity, unitCostCents });
  return result;
}

export async function addOnHand(db, sku, warehouse, quantity) {
  const result = await db.query('UPDATE bins SET on_hand=on_hand+:quantity WHERE sku=:sku AND warehouse=:warehouse', { sku, warehouse, quantity });
  return result;
}

export async function postReceipt(db, id, postedAt) {
  const result = await db.query('UPDATE receipts SET posted_at=:postedAt WHERE id=:id', { id, postedAt });
  return result;
}

export async function supplierSpend(db) {
  const result = await db.query('SELECT supplier_id,SUM(quantity*unit_cost_cents) cents FROM receipts r JOIN receipt_lines l ON l.receipt_id=r.id GROUP BY supplier_id', {});
  return result;
}

export async function openReceipts(db) {
  const result = await db.query('SELECT id,supplier_id,received_at FROM receipts WHERE posted_at IS NULL', {});
  return result;
}

export async function receiptItems(db, receiptId) {
  const result = await db.query('SELECT sku,quantity FROM receipt_lines WHERE receipt_id=:receiptId', { receiptId });
  return result;
}

export async function removeReceipt(db, receiptId) {
  const result = await db.query('DELETE FROM receipts WHERE id=:receiptId AND posted_at IS NULL', { receiptId });
  return result;
}

export async function reservationsBySku(db) {
  const result = await db.query('SELECT sku,SUM(quantity) units FROM reservations GROUP BY sku', {});
  return result;
}

export async function inactiveProducts(db, before) {
  const result = await db.query('SELECT sku,title FROM products WHERE updated_at<:before', { before });
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
