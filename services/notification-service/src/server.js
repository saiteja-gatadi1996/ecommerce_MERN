const express = require('express');
const cors = require('cors');
const { connectDB } = require('./config/db');
const { port, mongoUri, rabbitUrl, frontendOrigin } = require('./config/env');
const { connectRabbit } = require('@repo/event-bus');
const { registerNotificationConsumer } = require('./events/notificationConsumer');
const notificationRoutes = require('./routes/notificationRoutes');

async function start() {
  await connectDB(mongoUri);

  const rabbit = await connectRabbit(rabbitUrl);

  const app = express();
  app.locals.channel = rabbit.channel;

  app.use(cors({ origin: frontendOrigin, credentials: true }));
  app.use(express.json());

  app.get('/health', (req, res) => res.json({ service: 'notification-service', ok: true }));
  app.use('/api/notifications', notificationRoutes);

  await registerNotificationConsumer(rabbit.channel);

  app.listen(port, () => {
    console.log(`Notification service running on ${port}`);
  });
}

start().catch((error) => {
  console.error('Notification service failed to start', error);
  process.exit(1);
});
