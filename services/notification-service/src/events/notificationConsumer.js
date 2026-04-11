const Notification = require('../models/Notification');
const { subscribeEvent } = require('@repo/event-bus');

function getNotificationContent(routingKey, payload) {
  switch (routingKey) {
    case 'user.registered':
      return {
        title: 'User Registered',
        message: `New user registered: ${payload.name} (${payload.email})`,
      };

    case 'payment.paid':
      return {
        title: 'Payment Successful',
        message: `Payment completed for order ${payload.orderId}`,
      };

    case 'payment.failed':
      return {
        title: 'Payment Failed',
        message: `Payment failed for order ${payload.orderId}`,
      };

    case 'order.paid':
      return {
        title: 'Order Paid',
        message: `Order ${payload.orderId} has been marked as paid`,
      };

    case 'order.payment_failed':
      return {
        title: 'Order Payment Failed',
        message: `Order ${payload.orderId} payment failed`,
      };

    default:
      return {
        title: 'System Event',
        message: `Received event ${routingKey}`,
      };
  }
}

async function registerNotificationConsumer(channel) {
  await subscribeEvent(
    channel,
    'notification-service.events',
    [
      'payment.paid',
      'payment.failed',
      'order.paid',
      'order.payment_failed',
      'user.registered',
    ],
    async (payload, routingKey) => {
      const { title, message } = getNotificationContent(routingKey, payload);

      await Notification.create({
        title,
        message,
        eventType: routingKey,
        payload,
      });

      console.log(`[notification-service] stored ${routingKey}`);
    }
  );
}

module.exports = { registerNotificationConsumer };
