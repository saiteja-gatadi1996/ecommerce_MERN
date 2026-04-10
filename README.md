# MERN E-Commerce Microservices Monorepo

A production-style starter for a scalable e-commerce platform with:
- API Gateway
- User Service
- Product Service
- Order Service
- Payment Service
- Notification Service
- React frontend
- RabbitMQ event flow
- MongoDB per service
- Docker Compose

## Core Flow Implemented
1. User registers / logs in
2. Frontend fetches products
3. User creates an order
4. Order service validates product data from Product service
5. Payment service processes payment asynchronously
6. Payment event updates Order status
7. Product service decrements stock on `order.paid`
8. Notification service logs order/payment notifications

## Run
```bash
docker compose up --build
```

## URLs
- Frontend: http://localhost:3000
- Gateway: http://localhost:8080

## Demo Credentials
Create via UI signup.

## Notes
- Payment is simulated for local development.
- Inventory is owned by Product Service to preserve service boundaries.
- Each service has its own MongoDB database.


## Folder Structure
mern-ecommerce/
  .gitignore
  FOLDER_STRUCTURE.txt
  README.md
  docker-compose.yml
  apps/
    frontend/
      Dockerfile
      index.html
      package.json
      vite.config.js
      src/
        App.jsx
        main.jsx
        components/
          Header.jsx
          ProductCard.jsx
          ProtectedRoute.jsx
        context/
          AuthContext.jsx
          CartContext.jsx
        lib/
          api.js
        pages/
          CheckoutPage.jsx
          HomePage.jsx
          LoginPage.jsx
          OrdersPage.jsx
          ProductPage.jsx
          SignupPage.jsx
        styles/
          global.css
  gateway/
    Dockerfile
    package.json
    src/
      server.js
  packages/
    event-bus/
      index.js
      package.json
  services/
    notification-service/
      Dockerfile
      package.json
      src/
        server.js
        config/
          db.js
          env.js
        events/
          notificationConsumer.js
        middleware/
          auth.js
        models/
          Notification.js
        routes/
          notificationRoutes.js
    order-service/
      Dockerfile
      package.json
      src/
        server.js
        config/
          db.js
          env.js
        controllers/
          orderController.js
        events/
          paymentConsumer.js
        middleware/
          auth.js
        models/
          Order.js
        routes/
          orderRoutes.js
    payment-service/
      Dockerfile
      package.json
      src/
        server.js
        config/
          db.js
          env.js
        controllers/
          paymentController.js
        middleware/
          auth.js
        models/
          Payment.js
        routes/
          paymentRoutes.js
    product-service/
      Dockerfile
      package.json
      src/
        server.js
        config/
          db.js
          env.js
        controllers/
          productController.js
        events/
          orderPaidConsumer.js
        middleware/
          auth.js
        models/
          Product.js
        routes/
          productRoutes.js
    user-service/
      Dockerfile
      package.json
      src/
        server.js
        config/
          db.js
          env.js
        controllers/
          authController.js
        middleware/
          auth.js
        models/
          User.js
        routes/
          authRoutes.js
