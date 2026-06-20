import { getDb } from './db';
import { v4 as uuidv4 } from 'uuid';

/**
 * Atomically reserve stock for an order using an EXCLUSIVE transaction.
 * This is the core oversell prevention mechanism.
 * SQLite serializes all writes, so concurrent requests are queued and
 * each sees the updated reserved count from the previous.
 */
export function reserveStock(
  productId: string,
  quantity: number,
  customerName: string
): { success: boolean; orderId?: string; reason?: string } {
  const db = getDb();

  try {
    const reserve = db.transaction(() => {
      // Lock the product row and check availability
      const product = db.prepare(`
        SELECT id, name, price, quantity, reserved
        FROM products
        WHERE id = ?
      `).get(productId) as { id: string; name: string; price: number; quantity: number; reserved: number } | undefined;

      if (!product) {
        return { success: false, reason: 'Product not found' };
      }

      const available = product.quantity - product.reserved;

      if (available < quantity) {
        // Log oversell attempt
        db.prepare(`
          INSERT INTO audit_logs (id, action, entity_type, entity_id, details)
          VALUES (?, 'OVERSELL_ATTEMPT_BLOCKED', 'order', ?, ?)
        `).run(
          uuidv4(),
          productId,
          JSON.stringify({
            requested: quantity,
            available,
            customer: customerName,
          })
        );

        return {
          success: false,
          reason: `Insufficient stock. Requested: ${quantity}, Available: ${available}`,
        };
      }

      // Reserve the stock
      db.prepare(`
        UPDATE products
        SET reserved = reserved + ?, updated_at = datetime('now')
        WHERE id = ?
      `).run(quantity, productId);

      const orderId = uuidv4();
      const totalPrice = product.price * quantity;

      // Create the order
      db.prepare(`
        INSERT INTO orders (id, product_id, quantity, status, customer_name, total_price)
        VALUES (?, ?, ?, 'reserved', ?, ?)
      `).run(orderId, productId, quantity, customerName, totalPrice);

      // Audit log
      db.prepare(`
        INSERT INTO audit_logs (id, action, entity_type, entity_id, details)
        VALUES (?, 'STOCK_RESERVED', 'order', ?, ?)
      `).run(
        uuidv4(),
        orderId,
        JSON.stringify({
          productId,
          productName: product.name,
          quantity,
          customer: customerName,
          totalPrice,
        })
      );

      return { success: true, orderId };
    });

    return reserve() as { success: boolean; orderId?: string; reason?: string };
  } catch (error) {
    return { success: false, reason: `Transaction error: ${(error as Error).message}` };
  }
}

/**
 * Complete a reserved order — reduces actual quantity.
 */
export function completeOrder(orderId: string): { success: boolean; reason?: string } {
  const db = getDb();

  const complete = db.transaction(() => {
    const order = db.prepare(`
      SELECT o.*, p.name as product_name
      FROM orders o
      JOIN products p ON o.product_id = p.id
      WHERE o.id = ? AND o.status = 'reserved'
    `).get(orderId) as { id: string; product_id: string; quantity: number; product_name: string } | undefined;

    if (!order) {
      return { success: false, reason: 'Order not found or not in reserved state' };
    }

    // Reduce actual stock and reserved
    db.prepare(`
      UPDATE products
      SET quantity = quantity - ?, reserved = reserved - ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(order.quantity, order.quantity, order.product_id);

    db.prepare(`
      UPDATE orders SET status = 'completed', updated_at = datetime('now') WHERE id = ?
    `).run(orderId);

    db.prepare(`
      INSERT INTO audit_logs (id, action, entity_type, entity_id, details)
      VALUES (?, 'ORDER_COMPLETED', 'order', ?, ?)
    `).run(
      uuidv4(),
      orderId,
      JSON.stringify({ productId: order.product_id, productName: order.product_name, quantity: order.quantity })
    );

    return { success: true };
  });

  return complete() as { success: boolean; reason?: string };
}

/**
 * Cancel an order — releases the reservation.
 */
export function cancelOrder(orderId: string): { success: boolean; reason?: string } {
  const db = getDb();

  const cancel = db.transaction(() => {
    const order = db.prepare(`
      SELECT * FROM orders WHERE id = ? AND status = 'reserved'
    `).get(orderId) as { id: string; product_id: string; quantity: number } | undefined;

    if (!order) {
      return { success: false, reason: 'Order not found or cannot be cancelled' };
    }

    // Release the reservation
    db.prepare(`
      UPDATE products
      SET reserved = reserved - ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(order.quantity, order.product_id);

    db.prepare(`
      UPDATE orders SET status = 'cancelled', updated_at = datetime('now') WHERE id = ?
    `).run(orderId);

    db.prepare(`
      INSERT INTO audit_logs (id, action, entity_type, entity_id, details)
      VALUES (?, 'RESERVATION_RELEASED', 'order', ?, ?)
    `).run(
      uuidv4(),
      orderId,
      JSON.stringify({ productId: order.product_id, quantity: order.quantity })
    );

    return { success: true };
  });

  return cancel() as { success: boolean; reason?: string };
}

/**
 * Run a simulated batch of concurrent purchase attempts.
 * Because better-sqlite3 is synchronous, all requests are processed
 * sequentially under the same SQLite serialization guarantees.
 */
export function runSimulation(
  productId: string,
  concurrentRequests: number,
  quantityPerRequest: number
): {
  productName: string;
  initialStock: number;
  requestedTotal: number;
  successful: number;
  failed: number;
  remainingStock: number;
  orders: Array<{ requestId: number; customerId: string; quantity: number; status: string; reason?: string; orderId?: string }>;
  duration: number;
} {
  const db = getDb();
  const start = Date.now();

  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(productId) as {
    id: string; name: string; quantity: number; reserved: number;
  } | undefined;

  if (!product) throw new Error('Product not found');

  const initialStock = product.quantity - product.reserved;
  const results: Array<{ requestId: number; customerId: string; quantity: number; status: string; reason?: string; orderId?: string }> = [];

  let successCount = 0;
  let failCount = 0;

  for (let i = 1; i <= concurrentRequests; i++) {
    const customerId = `SIM-CUST-${String(i).padStart(3, '0')}`;
    const result = reserveStock(productId, quantityPerRequest, customerId);

    if (result.success) {
      successCount++;
      // Immediately complete the order for simulation purposes
      if (result.orderId) completeOrder(result.orderId);
      results.push({ requestId: i, customerId, quantity: quantityPerRequest, status: 'success', orderId: result.orderId });
    } else {
      failCount++;
      results.push({ requestId: i, customerId, quantity: quantityPerRequest, status: 'failed', reason: result.reason });
    }
  }

  const updatedProduct = db.prepare('SELECT quantity, reserved FROM products WHERE id = ?').get(productId) as {
    quantity: number; reserved: number;
  };

  db.prepare(`
    INSERT INTO audit_logs (id, action, entity_type, entity_id, details)
    VALUES (?, 'SIMULATION_RUN', 'simulation', ?, ?)
  `).run(
    require('uuid').v4(),
    productId,
    JSON.stringify({
      concurrentRequests,
      quantityPerRequest,
      successful: successCount,
      failed: failCount,
      initialStock,
    })
  );

  return {
    productName: product.name,
    initialStock,
    requestedTotal: concurrentRequests * quantityPerRequest,
    successful: successCount,
    failed: failCount,
    remainingStock: updatedProduct.quantity - updatedProduct.reserved,
    orders: results,
    duration: Date.now() - start,
  };
}
