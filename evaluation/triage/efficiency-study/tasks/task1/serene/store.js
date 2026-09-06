import { sql, bind } from '@mk3008/serene';

export async function findInvoice(db, invoiceId) {
  const __sereneQuery1 = bind(sql`SELECT id, customer_id, status, total_cents FROM invoices WHERE id=:invoiceId`, { invoiceId });
  const result = await db.query(__sereneQuery1.text, __sereneQuery1.params);
  return result;
}

export async function listOpen(db, status, limit, offset) {
  const __sereneQuery2 = bind(sql`SELECT id, customer_id, due_on, total_cents FROM invoices WHERE status=:status ORDER BY due_on LIMIT :limit OFFSET :offset`, { status, limit, offset });
  const result = await db.query(__sereneQuery2.text, __sereneQuery2.params);
  return result;
}

export async function insertInvoice(db, id, customerId, status, totalCents, dueOn, createdAt, region) {
  const __sereneQuery3 = bind(sql`INSERT INTO invoices(id, customer_id, status, total_cents, due_on, created_at, region) VALUES(:id,:customerId,:status,:totalCents,:dueOn,:createdAt,:region)`, { id, customerId, status, totalCents, dueOn, createdAt, region });
  const result = await db.query(__sereneQuery3.text, __sereneQuery3.params);
  return result;
}

export async function deleteInvoiceLines(db, invoiceId) {
  const __sereneQuery4 = bind(sql`DELETE FROM invoice_lines WHERE invoice_id=:invoiceId`, { invoiceId });
  const result = await db.query(__sereneQuery4.text, __sereneQuery4.params);
  return result;
}

export async function insertInvoiceLine(db, invoiceId, sku, description, quantity, unitCents) {
  const __sereneQuery5 = bind(sql`INSERT INTO invoice_lines(invoice_id,sku,description,quantity,unit_cents) VALUES(:invoiceId,:sku,:description,:quantity,:unitCents)`, { invoiceId, sku, description, quantity, unitCents });
  const result = await db.query(__sereneQuery5.text, __sereneQuery5.params);
  return result;
}

export async function repriceInvoice(db, invoiceId) {
  const __sereneQuery6 = bind(sql`UPDATE invoices SET total_cents=(SELECT COALESCE(SUM(quantity*unit_cents),0) FROM invoice_lines WHERE invoice_id=:invoiceId) WHERE id=:invoiceId`, { invoiceId });
  const result = await db.query(__sereneQuery6.text, __sereneQuery6.params);
  return result;
}

export async function markInvoiceSent(db, invoiceId, sentAt) {
  const __sereneQuery7 = bind(sql`UPDATE invoices SET status='open', sent_at=:sentAt WHERE id=:invoiceId`, { invoiceId, sentAt });
  const result = await db.query(__sereneQuery7.text, __sereneQuery7.params);
  return result;
}

export async function addPayment(db, id, invoiceId, amountCents, receivedAt, reference) {
  const __sereneQuery8 = bind(sql`INSERT INTO payments(id,invoice_id,amount_cents,received_at,reference) VALUES(:id,:invoiceId,:amountCents,:receivedAt,:reference)`, { id, invoiceId, amountCents, receivedAt, reference });
  const result = await db.query(__sereneQuery8.text, __sereneQuery8.params);
  return result;
}

export async function completeInvoice(db, invoiceId) {
  const __sereneQuery9 = bind(sql`UPDATE invoices SET status='paid' WHERE id=:invoiceId`, { invoiceId });
  const result = await db.query(__sereneQuery9.text, __sereneQuery9.params);
  return result;
}

export async function overdueAccounts(db, asOf) {
  const __sereneQuery10 = bind(sql`SELECT customer_id,SUM(total_cents) balance FROM invoices WHERE status='open' AND due_on<:asOf GROUP BY customer_id`, { asOf });
  const result = await db.query(__sereneQuery10.text, __sereneQuery10.params);
  return result;
}

export async function customerStatement(db, customerId, from, to) {
  const __sereneQuery11 = bind(sql`SELECT id,created_at,total_cents FROM invoices WHERE customer_id=:customerId AND created_at>=:from AND created_at<:to`, { customerId, from, to });
  const result = await db.query(__sereneQuery11.text, __sereneQuery11.params);
  return result;
}

export async function findCustomer(db, customerId) {
  const __sereneQuery12 = bind(sql`SELECT id,name,email,region FROM customers WHERE id=:customerId`, { customerId });
  const result = await db.query(__sereneQuery12.text, __sereneQuery12.params);
  return result;
}

export async function searchCustomer(db, term, limit, offset) {
  const __sereneQuery13 = bind(sql`SELECT id,name,email FROM customers WHERE name LIKE :term ORDER BY name LIMIT :limit OFFSET :offset`, { term, limit, offset });
  const result = await db.query(__sereneQuery13.text, __sereneQuery13.params);
  return result;
}

export async function createCustomer(db, id, name, email, region, creditLimitCents) {
  const __sereneQuery14 = bind(sql`INSERT INTO customers(id,name,email,region,credit_limit_cents) VALUES(:id,:name,:email,:region,:creditLimitCents)`, { id, name, email, region, creditLimitCents });
  const result = await db.query(__sereneQuery14.text, __sereneQuery14.params);
  return result;
}

export async function changeCredit(db, customerId, creditLimitCents) {
  const __sereneQuery15 = bind(sql`UPDATE customers SET credit_limit_cents=:creditLimitCents WHERE id=:customerId`, { customerId, creditLimitCents });
  const result = await db.query(__sereneQuery15.text, __sereneQuery15.params);
  return result;
}

export async function activeRegions(db) {
  const __sereneQuery16 = bind(sql`SELECT region,COUNT(*) customer_count FROM customers GROUP BY region`, {});
  const result = await db.query(__sereneQuery16.text, __sereneQuery16.params);
  return result;
}

export async function dailyCash(db, from, to) {
  const __sereneQuery17 = bind(sql`SELECT date(received_at) day,SUM(amount_cents) cents FROM payments WHERE received_at>=:from AND received_at<:to GROUP BY date(received_at)`, { from, to });
  const result = await db.query(__sereneQuery17.text, __sereneQuery17.params);
  return result;
}

export async function productTotals(db) {
  const __sereneQuery18 = bind(sql`SELECT sku,SUM(quantity) units FROM invoice_lines GROUP BY sku ORDER BY units DESC`, {});
  const result = await db.query(__sereneQuery18.text, __sereneQuery18.params);
  return result;
}

export async function invoiceCount(db) {
  const __sereneQuery19 = bind(sql`SELECT status,COUNT(*) count FROM invoices GROUP BY status`, {});
  const result = await db.query(__sereneQuery19.text, __sereneQuery19.params);
  return result;
}

export async function recentNotes(db, customerId) {
  const __sereneQuery20 = bind(sql`SELECT body,created_at FROM customer_notes WHERE customer_id=:customerId ORDER BY created_at DESC`, { customerId });
  const result = await db.query(__sereneQuery20.text, __sereneQuery20.params);
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
