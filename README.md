# MERN E-Commerce Microservices

> A production-style, scalable e-commerce platform built with a microservices architecture, event-driven communication, and Dockerized deployment.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React + Vite |
| Gateway | Node.js (Express) |
| Services | Node.js (Express) |
| Database | MongoDB (per service) |
| Messaging | RabbitMQ |
| Containers | Docker Compose |

---

## Services

| Service | Responsibility |
|---|---|
| `user-service` | Registration, login, JWT auth |
| `product-service` | Product catalog, stock management |
| `order-service` | Order creation and status tracking |
| `payment-service` | Simulated payment processing |
| `notification-service` | Logs order and payment events |
| `gateway` | Single entry point, routes to services |

---

## Core Flow

```
User registers / logs in
        ↓
Frontend fetches products
        ↓
User creates an order
        ↓
Order Service validates product data (calls Product Service)
        ↓
Payment Service processes payment (async via RabbitMQ)
        ↓
payment.completed → Order status updated
        ↓
order.paid → Product Service decrements stock
        ↓
Notification Service logs the event
```

---

## Getting Started

### Prerequisites

- [Docker](https://www.docker.com/) and Docker Compose installed

### Run

```bash
docker compose up --build
```

### URLs

| Service | URL |
|---|---|
| Frontend | http://localhost:3000 |
| API Gateway | http://localhost:8080 |

### Demo Credentials

Create an account via the **Sign Up** page in the UI.

---

## Architecture Notes

- Payment is **simulated** for local development — no real charges occur.
- Inventory is owned exclusively by **Product Service** to preserve service boundaries.
- Each service has its **own MongoDB database** (database-per-service pattern).
- Inter-service communication uses **RabbitMQ events** (not direct HTTP calls) for decoupling.

---

## Folder Structure

```
mern-ecommerce/
├── .gitignore
├── FOLDER_STRUCTURE.txt
├── README.md
├── docker-compose.yml
│
├── apps/
│   ├── frontend/
│   │   ├── Dockerfile
│   │   ├── index.html
│   │   ├── package.json
│   │   ├── vite.config.js
│   │   └── src/
│   │       ├── App.jsx
│   │       ├── main.jsx
│   │       ├── components/
│   │       │   ├── Header.jsx
│   │       │   ├── ProductCard.jsx
│   │       │   └── ProtectedRoute.jsx
│   │       ├── context/
│   │       │   ├── AuthContext.jsx
│   │       │   └── CartContext.jsx
│   │       ├── lib/
│   │       │   └── api.js
│   │       ├── pages/
│   │       │   ├── CheckoutPage.jsx
│   │       │   ├── HomePage.jsx
│   │       │   ├── LoginPage.jsx
│   │       │   ├── OrdersPage.jsx
│   │       │   ├── ProductPage.jsx
│   │       │   └── SignupPage.jsx
│   │       └── styles/
│   │           └── global.css
│   │
│   └── gateway/
│       ├── Dockerfile
│       ├── package.json
│       └── src/
│           └── server.js
│
├── packages/
│   └── event-bus/
│       ├── index.js
│       └── package.json
│
└── services/
    ├── notification-service/
    │   ├── Dockerfile
    │   ├── package.json
    │   └── src/
    │       ├── server.js
    │       ├── config/
    │       │   ├── db.js
    │       │   └── env.js
    │       ├── events/
    │       │   └── notificationConsumer.js
    │       ├── middleware/
    │       │   └── auth.js
    │       ├── models/
    │       │   └── Notification.js
    │       └── routes/
    │           └── notificationRoutes.js
    │
    ├── order-service/
    │   ├── Dockerfile
    │   ├── package.json
    │   └── src/
    │       ├── server.js
    │       ├── config/
    │       │   ├── db.js
    │       │   └── env.js
    │       ├── controllers/
    │       │   └── orderController.js
    │       ├── events/
    │       │   └── paymentConsumer.js
    │       ├── middleware/
    │       │   └── auth.js
    │       ├── models/
    │       │   └── Order.js
    │       └── routes/
    │           └── orderRoutes.js
    │
    ├── payment-service/
    │   ├── Dockerfile
    │   ├── package.json
    │   └── src/
    │       ├── server.js
    │       ├── config/
    │       │   ├── db.js
    │       │   └── env.js
    │       ├── controllers/
    │       │   └── paymentController.js
    │       ├── middleware/
    │       │   └── auth.js
    │       ├── models/
    │       │   └── Payment.js
    │       └── routes/
    │           └── paymentRoutes.js
    │
    ├── product-service/
    │   ├── Dockerfile
    │   ├── package.json
    │   └── src/
    │       ├── server.js
    │       ├── config/
    │       │   ├── db.js
    │       │   └── env.js
    │       ├── controllers/
    │       │   └── productController.js
    │       ├── events/
    │       │   └── orderPaidConsumer.js
    │       ├── middleware/
    │       │   └── auth.js
    │       ├── models/
    │       │   └── Product.js
    │       └── routes/
    │           └── productRoutes.js
    │
    └── user-service/
        ├── Dockerfile
        ├── package.json
        └── src/
            ├── server.js
            ├── config/
            │   ├── db.js
            │   └── env.js
            ├── controllers/
            │   └── authController.js
            ├── middleware/
            │   └── auth.js
            ├── models/
            │   └── User.js
            └── routes/
                └── authRoutes.js
```
