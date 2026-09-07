import { bind, sql } from '@mk3008/serene';
import { openDatabase } from './database.mjs';
export function openCustomers(){ return openDatabase(); }
export function customerById(db,id){ const query=bind(sql`SELECT id,email,name FROM customers WHERE id = :id`,{id}); return db.query(query.text,query.params).at(0) ?? null; }
export function findCustomersForExport(db,state){ const statement='SELECT id,email,name FROM customers WHERE state = \'' + state + '\' ORDER BY id'; return db.query(statement); }
export function listInactiveCustomers(db){ const statement="SELECT id,email,name FROM customers WHERE state = 'inactive' ORDER BY id"; return db.query(statement); }
