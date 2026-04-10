const Order = require('../models/Order');
const { publishEvent, subscribeEvent } = require('@repo/event-bus');

async function registerPaymentConsumer(channel) {
  await subscribeEvent(
    channel,
    'order-service.payment-events',
    ['payment.paid', 'payment.failed'],
    async (routingKey, payload) => {
      const order = await Order.findById(payload.orderId);
      if (!order) return;

      if (routingKey === 'payment.paid') {
        order.status = 'paid';
        order.paymentStatus = 'paid';
        await order.save();

        await publishEvent(channel, 'order.paid', {
          orderId: order._id.toString(),
          userId: order.userId,
          items: order.items,
          totalAmount: order.totalAmount
        });
      } else {
        order.status = 'payment_failed';
        order.paymentStatus = 'failed';
        await order.save();

        await publishEvent(channel, 'order.payment_failed', {
          orderId: order._id.toString(),
          userId: order.userId,
          totalAmount: order.totalAmount
        });
      }

      console.log(`[order-service] handled ${routingKey} for order ${payload.orderId}`);
    }
  );
}

module.exports = { registerPaymentConsumer };
