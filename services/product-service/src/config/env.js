require('dotenv').config();

module.exports = {
  port: process.env.PORT || 4000,
  mongoUri: process.env.MONGO_URI,
  jwtSecret: process.env.JWT_SECRET || 'supersecret',
  rabbitUrl: process.env.RABBITMQ_URL || 'amqp://localhost',
  frontendOrigin: process.env.FRONTEND_ORIGIN || 'http://localhost:3000',
  productServiceUrl: process.env.PRODUCT_SERVICE_URL,
  paymentServiceUrl: process.env.PAYMENT_SERVICE_URL
};
