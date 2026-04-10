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

```text
User registers / logs in
        ↓
Frontend fetches products
        ↓
User creates an order
        ↓
Order Service validates product data
        ↓
Payment Service processes payment (async via RabbitMQ)
        ↓
payment.paid / payment.failed
        ↓
Order Service updates order status
        ↓
order.paid
        ↓
Product Service decrements stock
        ↓
Notification Service logs the event
```

---

## Getting Started

### Prerequisites

- [Docker](https://www.docker.com/) and Docker Compose installed


```bash
## RUN
docker compose up --build
```

----

### URLs

| Service             | URL                                              |
| ------------------- | ------------------------------------------------ |
| Frontend            | [http://localhost:3000](http://localhost:3000)   |
| API Gateway         | [http://localhost:8080](http://localhost:8080)   |
| RabbitMQ Management | [http://localhost:15672](http://localhost:15672) |

### Demo Credentials

Create an account via the **Sign Up** page in the UI.

---

## Architecture Notes

* Payment is **simulated** for local development — no real charges occur.
* Inventory is owned exclusively by **Product Service** to preserve service boundaries.
* Each service has its **own MongoDB database** (database-per-service pattern).
* Inter-service communication uses **RabbitMQ events** to keep services loosely coupled.

---

## Project Vision vs Current Implementation

This section explains the difference between the **original target** and the **current running implementation**.

### What the original final prompt asked for

The original ask was to build a production-grade, scalable, Amazon/Flipkart-style MERN e-commerce platform with:

* microservices architecture
* separate databases per service
* API gateway
* working auth flow
* working order → payment → inventory flow
* event-driven communication
* Dockerized local deployment
* realistic production-style folder structure
* complete implementation files, not just pseudo-code or scaffolding
* frontend modules for core pages
* backend APIs for core flows
* scalable code organization

### What is built and currently running as of now

The current implementation delivers a **working production-style foundation** of that ask, focused on the **core commerce lifecycle**.

Implemented and running:

* user registration
* user login with JWT
* protected order flow
* product catalog APIs
* product seeding
* cart + checkout frontend flow
* order creation
* async mock payment processing
* payment event publishing via RabbitMQ
* order status updates from payment events
* inventory stock reduction from order-paid events
* notification/event logging
* gateway-based routing
* Docker Compose setup for full stack
* local non-Docker setup also possible

This project is best understood as a **solid, scalable microservices starter for a large e-commerce platform**, not yet a full Amazon/Flipkart clone.

---

## What This Project Is About

This project demonstrates how to build a real-world **e-commerce platform foundation** using:

* **microservices**
* **service boundaries**
* **event-driven communication**
* **database-per-service**
* **gateway-based API routing**
* **containerized local development**

Instead of building everything in a single monolith, this project splits responsibilities into independent services. That makes it easier to scale, reason about ownership, and evolve services independently.

The goal is to model a production-style architecture where:

* users authenticate through a dedicated auth service
* products are owned by a dedicated product service
* orders are owned by a dedicated order service
* payments are processed asynchronously
* downstream services react to events instead of tight coupling

---

## Current Capabilities

### Frontend

The frontend currently supports:

* sign up
* login
* logout
* browse products
* view product details
* add items to cart
* checkout
* view orders
* auto-refresh order status page to observe async event flow

### Gateway

The gateway currently supports:

* single entry point for frontend
* proxy routing to downstream services
* CORS handling
* basic JWT decoding
* forwarding requests to internal services

### User Service

Current capabilities:

* register new user
* hash password using bcrypt
* login user
* sign JWT token
* return authenticated profile data

### Product Service

Current capabilities:

* list products
* fetch product details
* seed sample product catalog
* decrement stock when order is paid

### Order Service

Current capabilities:

* create order
* persist order items and totals
* store initial status as `payment_pending`
* consume payment events
* update order status to `paid` or `payment_failed`
* publish `order.paid` event after successful payment

### Payment Service

Current capabilities:

* create payment record
* simulate async payment delay
* update payment from `pending` to `paid`
* publish `payment.paid` or `payment.failed`

### Notification Service

Current capabilities:

* consume relevant events
* store/log notification-style event records
* provide a place to extend future email/SMS/push integrations

---

## What Is Not Yet Built

This project is intentionally focused on the **core flows**, not the full commercial feature set of a mature marketplace.

Not yet implemented:

* real payment gateway integration
* refresh tokens / access token rotation
* admin dashboard
* category management UI
* search/filter/sort at enterprise scale
* coupon / discount engine
* wishlist
* reviews and ratings
* returns and refunds workflow
* shipment tracking
* address book
* role-based admin operations beyond basic role field
* centralized logging / observability stack
* Redis caching
* Elasticsearch / OpenSearch
* Kubernetes deployment
* CI/CD pipelines
* automated API contract testing
* API documentation via Swagger/OpenAPI
* full production security hardening
* rate limiting per user/IP in downstream services
* circuit breakers / dead-letter queues / saga orchestration

So while this is **production-style**, it is still a **foundation**, not a feature-complete enterprise e-commerce suite.

---

## Async Event Flow Explanation

This is the most important architectural behavior in the system.

### Order creation flow

1. User logs in and gets JWT.
2. Frontend submits checkout request.
3. Order Service creates an order with initial status:

   * `payment_pending`
4. Order Service triggers payment initiation.
5. Payment Service creates a payment record with:

   * `pending`
6. Payment Service simulates async processing.
7. Payment Service updates payment to:

   * `paid`
8. Payment Service publishes:

   * `payment.paid`
9. Order Service consumes `payment.paid`
10. Order status becomes:

* `paid`

11. Order Service publishes:

* `order.paid`

12. Product Service consumes `order.paid`
13. Product Service decrements stock
14. Notification Service logs the event

### Why the Orders page auto-refreshes

The Orders page polls the backend so that the user can see the async flow happening in near real time.

That is why you may see repeated API calls while viewing orders. This is expected in the current implementation.

---

## Current Order Status Lifecycle

Possible order statuses in the current implementation include:

* `payment_pending`
* `paid`
* `payment_failed`

Possible payment statuses include:

* `pending`
* `paid`
* `failed`

Important:

* **Payment status** belongs to the payment record.
* **Order status** belongs to the order record.
* The UI usually shows **order status**, not raw payment status.

---

## Docker Usage

### Why Docker is useful here

Because this is a microservices project, Docker helps run:

* frontend
* gateway
* multiple Node services
* MongoDB instances
* RabbitMQ

with one command and a predictable environment.

Instead of manually starting everything, Docker Compose coordinates:

* service containers
* networking
* ports
* environment variables
* startup order

### Run with Docker

```bash
docker compose up --build
```

### Stop

```bash
docker compose down
```

### Rebuild after code changes

```bash
docker compose down
docker compose up --build
```

### Check running containers

```bash
docker compose ps
```

### Check service logs

```bash
docker compose logs --tail=200 user-service product-service order-service payment-service notification-service gateway frontend rabbitmq
```

---

## Local Non-Docker Usage

This project can also be run locally without Docker, but that requires manually starting:

* MongoDB
* RabbitMQ
* all backend services
* gateway
* frontend

This path is more manual and is mainly useful for debugging service-by-service behavior.

---

## Environment and Service Networking

### Local mode

In local development, services talk to each other using `127.0.0.1` and the exposed ports, for example:

* `http://127.0.0.1:4001`
* `http://127.0.0.1:4002`

### Docker mode

Inside Docker, services talk using service names, for example:

* `http://user-service:4001`
* `http://product-service:4002`
* `amqp://rabbitmq`
* `mongodb://mongo-user:27017/userdb`

This is why Docker configs and local configs are not always interchangeable.

---

## Important Implementation Notes

### 1. Payment is mocked

No real card or UPI transaction happens. Payment is simulated using async logic and delayed event publication.

### 2. Event-driven updates are intentional

The project is designed to show decoupled service communication. Order Service does not directly “become paid” by calling Product Service synchronously. Instead, events drive the lifecycle.

### 3. Polling is currently used in the UI

The Orders page auto-refreshes to display async status updates. This is for demonstration of event-driven backend flow.

### 4. Separate MongoDB per service

Each service owns its own persistence boundary. This is intentional and is a core microservices principle.

### 5. Shared package for event bus

The shared `packages/event-bus` package centralizes RabbitMQ publish/subscribe logic so services can reuse consistent event bus behavior.

---

## What Was Fixed During Setup / Debugging

During bring-up and runtime validation, the following issues were identified and corrected or documented:

* missing shared package dependency for RabbitMQ client
* missing local environment setup for services
* gateway proxy/body forwarding issues
* port conflicts during local development
* RabbitMQ readiness timing issues in Docker
* event consumer naming mismatch
* callback argument order issue in payment event consumer

These fixes are important because they reflect the difference between **scaffolding** and **actually making a distributed system run correctly**.

---

## Known Limitations / Current Tradeoffs

### 1. Payment success is simulated

There is no external payment provider integration.

### 2. Polling instead of WebSockets/SSE

The order page uses polling instead of push-based live updates.

### 3. Basic auth model

The auth layer is enough for demo/prototype use, but not yet enterprise-grade session management.

### 4. No centralized observability

There is no log aggregation, tracing, metrics dashboard, or structured monitoring stack yet.

### 5. No advanced resiliency patterns

There is no dead-letter queue, saga coordinator, exponential backoff orchestration, or recovery dashboard.

### 6. No production deployment manifests

Docker Compose is present for local orchestration, but production deployment assets like Kubernetes/Helm/Terraform are not part of this version.

---

## Suggested Next Improvements

If this project is extended further, the highest-value next steps would be:

1. add real payment gateway integration
2. add refresh token flow
3. add admin product/order management
4. add Redis caching
5. add search/filter/sort
6. add centralized logging and tracing
7. add Swagger/OpenAPI docs
8. add automated tests for cross-service flows
9. replace polling with WebSockets/SSE
10. add healthchecks and readiness checks for all services
11. add DLQ and stronger event retry patterns
12. add CI/CD pipeline

---

## Troubleshooting

### Orders stay stuck on `payment_pending`

Likely causes:

* payment event not published
* order-service consumer not running
* event consumer callback mismatch
* order-service crashed before handling payment event

What to check:

```bash
docker compose logs payment-service order-service notification-service --tail=200
```

### Backend services do not start in Docker

Check:

```bash
docker compose ps
docker compose logs --tail=200 user-service product-service order-service payment-service notification-service rabbitmq
```

### RabbitMQ connection refused in Docker

This usually means services started before RabbitMQ was ready. Retry logic in the shared event-bus package is important here.

### Frontend keeps hitting APIs repeatedly

That is usually because the Orders page polls for async order status updates.

### Gateway works but auth/product/order APIs behave incorrectly

Check gateway proxy configuration, path forwarding, and request body forwarding.

---

## API/Flow Summary

### Auth

* register user
* login user
* fetch authenticated profile

### Products

* seed products
* list products
* get product by id
* decrement stock after order is paid

### Orders

* create order
* list user orders
* update order status from payment events

### Payments

* process mock payment
* list payments

### Notifications

* log consumed events

---

## Folder Structure

```text
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

---

## Final Note

This repository is a **working microservices-based e-commerce foundation** that demonstrates:

* service separation
* event-driven architecture
* async order/payment flow
* database-per-service design
* Dockerized local orchestration
* a realistic starting point for scaling toward a much larger commerce platform

It is not yet a complete Amazon/Flipkart clone, but it successfully captures the **core architectural direction and core end-to-end business flow** requested in the original build prompt.

```

If you want, I can also turn this into a **cleaner “final polished README.md” version** with:
- badges
- a proper table of contents
- API endpoint tables
- architecture diagram section
- “current status: implemented vs planned” matrix.
```
