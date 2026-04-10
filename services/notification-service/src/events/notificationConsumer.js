const Notification = require('../models/Notification');
const { subscribeEvents } = require('@repo/event-bus');

async function registerNotificationConsumer(channel) {
  await subscribeEvents(
    channel,
    'notification-service.all-events',
    ['user.registered', 'order.paid', 'order.payment_failed'],
    async (routingKey, payload) => {
      let title = 'Platform update';
      let message = 'An event was received';
      let recipient = payload.email || payload.userId || '';

      if (routingKey === 'user.registered') {
        title = 'Welcome to the platform';
        message = `User ${payload.name} registered successfully.`;
      }

      if (routingKey === 'order.paid') {
        title = 'Order confirmed';
        message = `Order ${payload.orderId} has been paid successfully.`;
      }

      if (routingKey === 'order.payment_failed') {
        title = 'Payment failed';
        message = `Payment failed for order ${payload.orderId}.`;
      }

      await Notification.create({
        eventType: routingKey,
        recipient,
        title,
        message,
        payload
      });

      console.log(`[notification-service] stored notification for ${routingKey}`);
    }
  );
}

module.exports = { registerNotificationConsumer };
