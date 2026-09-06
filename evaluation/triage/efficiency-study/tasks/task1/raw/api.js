import * as store from './store.js';

export async function getInvoice(db, params) {
  const [invoice] = await store.findInvoice(db, params.invoiceId);
  return invoice ? {status:200,body:invoice} : {status:404,body:{error:'missing'}};
}
export async function postInvoice(db, body) {
  await store.insertInvoice(db, body);
  for (const line of body.lines || []) await store.insertInvoiceLine(db, body.id, line.sku, line.description, line.quantity, line.unitCents);
  await store.repriceInvoice(db, body.id);
  return {status:201,body:{id:body.id}};
}
export async function revenueReport(db, query) {
  return {status:200,body:await store.revenueSummary(db, query)};
}
export async function customerPage(db, query) {
  const p = query.page || 0;
  return {status:200,body:await store.searchCustomer(db, '%'+(query.q||'')+'%', 25, p*25)};
}
