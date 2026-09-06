import * as store from './store.js';

export async function browse(db, query) { return {status:200,body:await store.inventoryList(db,query)}; }
export async function card(db, params) {
  const [product]=await store.product(db,params.sku);
  return product ? {status:200,body:{product,bins:await store.binLevels(db,params.sku)}} : {status:404,body:{error:'missing'}};
}
export async function receive(db, body) {
  await store.insertReceipt(db,body);
  for (const item of body.items||[]) await store.receiptLine(db,body.id,item.sku,item.quantity,item.unitCostCents);
  return {status:201,body:{id:body.id}};
}
export async function inventoryReport(db, query) { return {status:200,body:await store.categorySnapshot(db,query)}; }
