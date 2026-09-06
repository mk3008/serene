export function alpha(db, id) { return db.query('SELECT :id', {id}); }
export function beta(db, id) { return db.query('SELECT :id + 1', {id}); }
export function gamma(db, input) { return db.query("SELECT '" + input + "'", {}); }
