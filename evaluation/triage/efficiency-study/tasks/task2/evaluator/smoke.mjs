import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import * as s from '../raw/store.js';
const native=new DatabaseSync(':memory:');
native.exec(readFileSync(new URL('./schema.sql',import.meta.url),'utf8'));
const db={query(text,values={}) { const q=native.prepare(text); return /^\s*select/i.test(text)?q.all(values):q.run(values); }};
const calls=[
 ['product',['a1']],['productPage',['',10]],['addProduct',['z9','Zinc','parts',2,'2026-02-01']],['updateProduct',['z9','Zinc cap','parts']],
 ['binLevels',['a1']],['reserveUnits',['a1','north',1]],['reservationRow',['r1','a1','north',1,'2026-02-01']],
 ['reservation',['r1']],['releaseUnits',['a1','north',1]],['deleteReservation',['r1']],['insertReceipt',['rc1','sup1','2026-02-01','ref']],
 ['receiptLine',['rc1','a1',2,25]],['addOnHand',['a1','north',2]],['postReceipt',['rc1','2026-02-01']],
 ['supplierSpend',[]],['openReceipts',[]],['receiptItems',['rc1']],['removeReceipt',['rc1']],['reservationsBySku',[]],['inactiveProducts',['2027-01-01']],
 ['inventoryList',[{sort:'sku'}]],['categorySnapshot',[{category:'tools'}]],['purgeReservation',['missing']]
];
for (const [name,args] of calls) await s[name](db,...args);
for (const value of ['sku','available','updated','__proto__','constructor','toString']) await s.inventoryList(db,{sort:value});
console.log(JSON.stringify({calls:calls.length,orderGuarded:true}));
