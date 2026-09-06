import {sql, bind} from '@mk3008/serene';
export function alpha(db, id) { const q=bind(sql`SELECT :id`, {id}); return db.query(q.text,q.params); }
export function beta(db, id) { const q=bind(sql`SELECT :id + 1`, {id}); return db.query(q.text,q.params); }
export function gamma(db, input) { return db.query("SELECT '" + input + "'", {}); }
