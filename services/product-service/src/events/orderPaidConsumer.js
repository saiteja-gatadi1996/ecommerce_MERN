const Product = require('../models/Product');
const { subscribeEvent } = require('@repo/event-bus');

async function registerOrderPaidConsumer(channel) {
  await subscribeEvent(
    channel,
    'product-service.order-events',
    ['order.paid'],
    async (payload, routingKey) => {
      if (routingKey !== 'order.paid') return;

      for (const item of payload.items || []) {
        await Product.findByIdAndUpdate(item.productId, {
          $inc: { stock: -item.quantity },
        });
      }

      console.log(
        `[product-service] handled ${routingKey} for order ${payload.orderId}`
      );
    }
  );
}

module.exports = { registerOrderPaidConsumer };
