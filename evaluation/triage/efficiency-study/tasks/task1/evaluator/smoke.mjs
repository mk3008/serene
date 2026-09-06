import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import * as s from '../raw/store.js';
const native=new DatabaseSync(':memory:');
native.exec(readFileSync(new URL('./schema.sql',import.meta.url),'utf8'));
const db={query(text,values={}) { const q=native.prepare(text); return /^\s*select/i.test(text)?q.all(values):q.run(values); }};
const calls=[
 ['findInvoice',['i1']],['listOpen',['open',10,0]],['insertInvoice',['i3','c1','void',300,'2026-03-01','2026-02-01','west']],
 ['deleteInvoiceLines',['i3']],['insertInvoiceLine',['i3','s1','sample',2,50]],['repriceInvoice',['i3']],['markInvoiceSent',['i3','2026-02-02']],
 ['addPayment',['p1','i1',100,'2026-02-02','ref']],['completeInvoice',['i1']],['overdueAccounts',['2026-03-01']],
 ['customerStatement',['c1','2026-01-01','2026-03-01']],['findCustomer',['c1']],['searchCustomer',['%',10,0]],
 ['createCustomer',['c3','Casey','c@example.test','west',5000]],['changeCredit',['c3',6000]],['activeRegions',[]],
 ['dailyCash',['2026-01-01','2026-03-01']],['productTotals',[]],['invoiceCount',[]],['recentNotes',['c1']],
 ['paymentFeed',[{order:'recent'}]],['revenueSummary',[{from:'2026-01-01',to:'2026-03-01',region:'west'}]],['removeVoid',['i3']]
];
for (const [name,args] of calls) await s[name](db,...args);
for (const value of ['recent','amount','name','__proto__','constructor','toString']) await s.paymentFeed(db,{order:value});
console.log(JSON.stringify({calls:calls.length,orderGuarded:true}));
