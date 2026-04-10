const express = require('express');
const cors = require('cors');
const { connectDB } = require('./config/db');
const { port, mongoUri, rabbitUrl, frontendOrigin } = require('./config/env');
const { connectRabbit } = require('@repo/event-bus');
const orderRoutes = require('./routes/orderRoutes');
const { registerPaymentConsumer } = require('./events/paymentConsumer');

async function start() {
  await connectDB(mongoUri);

  const rabbit = await connectRabbit(rabbitUrl);

  const app = express();
  app.locals.channel = rabbit.channel;

  app.use(cors({ origin: frontendOrigin, credentials: true }));
  app.use(express.json());

  app.get('/health', (req, res) => res.json({ service: 'order-service', ok: true }));
  app.use('/api/orders', orderRoutes);

  await registerPaymentConsumer(rabbit.channel);

  app.listen(port, () => {
    console.log(`Order service running on ${port}`);
  });
}

start().catch((error) => {
  console.error('Order service failed to start', error);
  process.exit(1);
});
