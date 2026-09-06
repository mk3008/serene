export function page(value, size = 50) {
  const current = Math.max(0, Number(value) || 0);
  return { limit: Math.min(size, 100), offset: current * size };
}
export function stockOrder(value) {
  const choices = Object.freeze({
    sku: 'p.sku ASC',
    available: 'available DESC',
    updated: 'p.updated_at DESC'
  });
  return Object.hasOwn(choices, value) ? choices[value] : choices.sku;
}
export function categoryName(value) {
  return String(value || '').trim();
}
export function categoryScope(value) {
  return value ? "p.category = '" + value + "'" : '1 = 1';
}
export async function send(db, text, values = {}) {
  return db.query(text, values);
}
