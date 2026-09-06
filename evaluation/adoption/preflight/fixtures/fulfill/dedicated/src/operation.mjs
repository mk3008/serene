import { bind } from '@mk3008/serene';
import { transaction } from '../../../../support.mjs';
import { findOrder } from './findOrder.mjs';
import { reserve } from './reserve.mjs';
import { logShipment } from './logShipment.mjs';
import { closeOrder } from './closeOrder.mjs';

export function fulfill(db, { tenantId, orderIds }) {
  return transaction(db, () => {
    const shipments = [];
    for (const orderId of orderIds) {
      const query = bind(findOrder, { tenantId, orderId });
      const order = db.prepare(query.text).get(query.params);
      if (!order) throw new Error('Order unavailable');
      const stock = bind(reserve, { tenantId, sku: order.sku, quantity: order.quantity });
      if (!db.prepare(stock.text).get(stock.params)) throw new Error('Stock unavailable');
      const log = bind(logShipment, { tenantId, orderId, sku: order.sku, quantity: order.quantity });
      const shipment = db.prepare(log.text).get(log.params);
      const close = bind(closeOrder, { tenantId, orderId });
      if (db.prepare(close.text).run(close.params).changes !== 1) throw new Error('Order changed');
      shipments.push({ orderId, shipmentId: shipment.id, quantity: order.quantity });
    }
    return shipments;
  });
}
