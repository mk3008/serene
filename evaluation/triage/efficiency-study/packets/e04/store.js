export async function findInvoice(db, invoiceId) {
  const result = await db.query('SELECT id, customer_id, status, total_cents FROM invoices WHERE id=:invoiceId', { invoiceId });
  return result;
}

export async function listOpen(db, status, limit, offset) {
  const result = await db.query('SELECT id, customer_id, due_on, total_cents FROM invoices WHERE status=:status ORDER BY due_on LIMIT :limit OFFSET :offset', { status, limit, offset });
  return result;
}

export async function insertInvoice(db, id, customerId, status, totalCents, dueOn, createdAt, region) {
  const result = await db.query('INSERT INTO invoices(id, customer_id, status, total_cents, due_on, created_at, region) VALUES(:id,:customerId,:status,:totalCents,:dueOn,:createdAt,:region)', { id, customerId, status, totalCents, dueOn, createdAt, region });
  return result;
}

export async function deleteInvoiceLines(db, invoiceId) {
  const result = await db.query('DELETE FROM invoice_lines WHERE invoice_id=:invoiceId', { invoiceId });
  return result;
}

export async function insertInvoiceLine(db, invoiceId, sku, description, quantity, unitCents) {
  const result = await db.query('INSERT INTO invoice_lines(invoice_id,sku,description,quantity,unit_cents) VALUES(:invoiceId,:sku,:description,:quantity,:unitCents)', { invoiceId, sku, description, quantity, unitCents });
  return result;
}

export async function repriceInvoice(db, invoiceId) {
  const result = await db.query('UPDATE invoices SET total_cents=(SELECT COALESCE(SUM(quantity*unit_cents),0) FROM invoice_lines WHERE invoice_id=:invoiceId) WHERE id=:invoiceId', { invoiceId });
  return result;
}

export async function markInvoiceSent(db, invoiceId, sentAt) {
  const result = await db.query("UPDATE invoices SET status='open', sent_at=:sentAt WHERE id=:invoiceId", { invoiceId, sentAt });
  return result;
}

export async function addPayment(db, id, invoiceId, amountCents, receivedAt, reference) {
  const result = await db.query('INSERT INTO payments(id,invoice_id,amount_cents,received_at,reference) VALUES(:id,:invoiceId,:amountCents,:receivedAt,:reference)', { id, invoiceId, amountCents, receivedAt, reference });
  return result;
}

export async function completeInvoice(db, invoiceId) {
  const result = await db.query("UPDATE invoices SET status='paid' WHERE id=:invoiceId", { invoiceId });
  return result;
}

export async function overdueAccounts(db, asOf) {
  const result = await db.query("SELECT customer_id,SUM(total_cents) balance FROM invoices WHERE status='open' AND due_on<:asOf GROUP BY customer_id", { asOf });
  return result;
}

export async function customerStatement(db, customerId, from, to) {
  const result = await db.query('SELECT id,created_at,total_cents FROM invoices WHERE customer_id=:customerId AND created_at>=:from AND created_at<:to', { customerId, from, to });
  return result;
}

export async function findCustomer(db, customerId) {
  const result = await db.query('SELECT id,name,email,region FROM customers WHERE id=:customerId', { customerId });
  return result;
}

export async function searchCustomer(db, term, limit, offset) {
  const result = await db.query('SELECT id,name,email FROM customers WHERE name LIKE :term ORDER BY name LIMIT :limit OFFSET :offset', { term, limit, offset });
  return result;
}

export async function createCustomer(db, id, name, email, region, creditLimitCents) {
  const result = await db.query('INSERT INTO customers(id,name,email,region,credit_limit_cents) VALUES(:id,:name,:email,:region,:creditLimitCents)', { id, name, email, region, creditLimitCents });
  return result;
}

export async function changeCredit(db, customerId, creditLimitCents) {
  const result = await db.query('UPDATE customers SET credit_limit_cents=:creditLimitCents WHERE id=:customerId', { customerId, creditLimitCents });
  return result;
}

export async function activeRegions(db) {
  const result = await db.query('SELECT region,COUNT(*) customer_count FROM customers GROUP BY region', {});
  return result;
}

export async function dailyCash(db, from, to) {
  const result = await db.query('SELECT date(received_at) day,SUM(amount_cents) cents FROM payments WHERE received_at>=:from AND received_at<:to GROUP BY date(received_at)', { from, to });
  return result;
}

export async function productTotals(db) {
  const result = await db.query('SELECT sku,SUM(quantity) units FROM invoice_lines GROUP BY sku ORDER BY units DESC', {});
  return result;
}

export async function invoiceCount(db) {
  const result = await db.query('SELECT status,COUNT(*) count FROM invoices GROUP BY status', {});
  return result;
}

export async function recentNotes(db, customerId) {
  const result = await db.query('SELECT body,created_at FROM customer_notes WHERE customer_id=:customerId ORDER BY created_at DESC', { customerId });
  return result;
}
import { normaliseRegion, regionScope, chosenOrder, send } from './helpers.js';

export async function paymentFeed(db, input) {
  const order = chosenOrder(input.order);
  const rows = await db.query('SELECT id,total_cents,created_at FROM invoices ORDER BY ' + order + ' LIMIT :limit', {limit:25});
  return rows.map(row => ({...row, dollars:row.total_cents / 100}));
}
export async function revenueSummary(db, request) {
  const region = normaliseRegion(request.region);
  const scope = regionScope(region);
  const rows = await db.query('SELECT region,COUNT(*) count,SUM(total_cents) cents FROM invoices WHERE created_at>=:from AND created_at<:to AND ' + scope + ' GROUP BY region', {from:request.from,to:request.to});
  return rows.map(row => ({...row, dollars:row.cents / 100}));
}
export async function removeVoid(db, invoiceId) {
  const result = await send(db, "DELETE FROM invoices WHERE id=:invoiceId AND status='void'", {invoiceId});
  return { removed: result.changes };
}
