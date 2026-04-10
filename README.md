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
