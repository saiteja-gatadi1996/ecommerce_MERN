const amqp = require('amqplib');

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function connectRabbit(url, options = {}) {
  const retries = options.retries ?? 20;
  const delay = options.delay ?? 3000;

  let lastError;

  for (let attempt = 1; attempt <= retries; attempt += 1) {
    try {
      const connection = await amqp.connect(url);
      const channel = await connection.createChannel();

      await channel.assertExchange('app.events', 'topic', { durable: true });

      console.log(`RabbitMQ connected on attempt ${attempt}`);

      connection.on('error', (error) => {
        console.error('RabbitMQ connection error:', error.message);
      });

      connection.on('close', () => {
        console.warn('RabbitMQ connection closed');
      });

      return { connection, channel };
    } catch (error) {
      lastError = error;
      console.warn(
        `RabbitMQ connection attempt ${attempt}/${retries} failed: ${error.message}`
      );

      if (attempt < retries) {
        await sleep(delay);
      }
    }
  }

  throw lastError;
}

async function publishEvent(channel, routingKey, payload) {
  const message = Buffer.from(JSON.stringify(payload));

  channel.publish('app.events', routingKey, message, {
    persistent: true,
    contentType: 'application/json',
  });
}

async function subscribeEvent(channel, queue, patterns, handler) {
  await channel.assertExchange('app.events', 'topic', { durable: true });
  const assertedQueue = await channel.assertQueue(queue, { durable: true });

  for (const pattern of patterns) {
    await channel.bindQueue(assertedQueue.queue, 'app.events', pattern);
  }

  channel.consume(assertedQueue.queue, async (msg) => {
    if (!msg) return;

    try {
      const content = JSON.parse(msg.content.toString());
      await handler(content, msg.fields.routingKey);
      channel.ack(msg);
    } catch (error) {
      console.error('Event handler failed:', error.message);
      channel.nack(msg, false, false);
    }
  });
}

module.exports = {
  connectRabbit,
  publishEvent,
  subscribeEvent,
};
