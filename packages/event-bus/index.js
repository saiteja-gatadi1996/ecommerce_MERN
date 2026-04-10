const amqp = require('amqplib');

const EXCHANGE_NAME = 'ecommerce.events';

async function connectRabbit(rabbitUrl) {
  const connection = await amqp.connect(rabbitUrl);
  const channel = await connection.createChannel();
  await channel.assertExchange(EXCHANGE_NAME, 'topic', { durable: true });
  return { connection, channel };
}

async function publishEvent(channel, routingKey, payload) {
  channel.publish(
    EXCHANGE_NAME,
    routingKey,
    Buffer.from(JSON.stringify(payload)),
    { persistent: true, contentType: 'application/json' }
  );
}

async function subscribeEvents(channel, queueName, patterns, handler) {
  await channel.assertQueue(queueName, { durable: true });
  for (const pattern of patterns) {
    await channel.bindQueue(queueName, EXCHANGE_NAME, pattern);
  }

  channel.consume(queueName, async (msg) => {
    if (!msg) return;
    try {
      const payload = JSON.parse(msg.content.toString());
      await handler(msg.fields.routingKey, payload);
      channel.ack(msg);
    } catch (error) {
      console.error(`Event handler failed for ${msg.fields.routingKey}`, error);
      channel.nack(msg, false, false);
    }
  });
}

module.exports = {
  EXCHANGE_NAME,
  connectRabbit,
  publishEvent,
  subscribeEvents
};
