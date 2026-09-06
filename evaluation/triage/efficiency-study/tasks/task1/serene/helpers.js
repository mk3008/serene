import { sql, bind } from '@mk3008/serene';

export function page(value, size = 50) {
  const current = Math.max(0, Number(value) || 0);
  return { limit: Math.min(size, 100), offset: current * size };
}
export function chosenOrder(value) {
  const choices = Object.freeze({
    recent: 'created_at DESC',
    amount: 'total_cents DESC',
    name: 'customer_id ASC'
  });
  return Object.hasOwn(choices, value) ? choices[value] : choices.recent;
}
export function normaliseRegion(value) {
  return String(value || '').trim();
}
export function regionScope(value) {
  return value ? "region = '" + value + "'" : '1 = 1';
}
export async function send(db, text, values = {}) {
  return db.query(text, values);
}
