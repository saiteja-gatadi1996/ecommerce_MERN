const express = require('express');
const cors = require('cors');
const { connectDB } = require('./config/db');
const { port, mongoUri, rabbitUrl, frontendOrigin } = require('./config/env');
const { connectRabbit } = require('@repo/event-bus');
const productRoutes = require('./routes/productRoutes');
const { registerOrderPaidConsumer } = require('./events/orderPaidConsumer');

async function start() {
  await connectDB(mongoUri);

  const rabbit = await connectRabbit(rabbitUrl);

  const app = express();
  app.locals.channel = rabbit.channel;

  app.use(cors({ origin: frontendOrigin, credentials: true }));
  app.use(express.json());

  app.get('/health', (req, res) => res.json({ service: 'product-service', ok: true }));
  app.use('/api/products', productRoutes);

  await registerOrderPaidConsumer(rabbit.channel);

  app.listen(port, () => {
    console.log(`Product service running on ${port}`);
  });
}

start().catch((error) => {
  console.error('Product service failed to start', error);
  process.exit(1);
});
