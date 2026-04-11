# MERN E-Commerce Microservices

> A production-style, scalable e-commerce platform built with a microservices architecture, event-driven communication, a gateway-based backend, and a Webpack Module Federation frontend.

---

## What This Project Is

This project is a **full-stack ecommerce foundation** designed to demonstrate how a modern commerce platform can be built using:

- **microservices** on the backend
- **database-per-service** ownership
- **event-driven communication** using RabbitMQ
- **JWT-based authentication**
- **gateway-based API routing**
- **microfrontend architecture** on the frontend using Webpack 5 + Module Federation
- **Dockerized local orchestration** for backend infrastructure and services

The goal of this project is **not** to claim that it is already a full Amazon/Flipkart clone.  
The goal is to build the **core architecture and core business flow** in a realistic, production-style way so that it can later scale into a much larger commerce platform.

If you are coming from a frontend background and learning backend/system design, this repository is useful because it shows how the different backend pieces connect:

- how services are split
- why they are split
- how they talk to each other
- what should stay synchronous
- what should become asynchronous
- how state changes move across multiple services

---

## Big Picture

At a high level, the system works like this:

1. a user registers or logs in
2. the frontend fetches products through the gateway
3. the user adds items to cart
4. the user places an order
5. the order starts in a `payment_pending` state
6. payment service simulates async payment processing
7. payment service emits `payment.paid`
8. order service consumes `payment.paid`
9. order status becomes `paid`
10. order service emits `order.paid`
11. product service consumes `order.paid`
12. product stock gets decremented
13. notification service stores the related business events

This is the core commerce workflow currently implemented.

---

## Tech Stack

| Layer                   | Technology                     |
| ----------------------- | ------------------------------ |
| Frontend Host           | React + Webpack 5              |
| Frontend Microfrontends | Webpack 5 + Module Federation  |
| Gateway                 | Node.js + Express              |
| Backend Services        | Node.js + Express              |
| Database                | MongoDB (database per service) |
| Messaging               | RabbitMQ                       |
| Containers              | Docker Compose                 |
| Auth                    | JWT + bcrypt                   |
| Styling                 | CSS stylesheets                |

---

## Frontend Architecture

The frontend is no longer a single Vite app.  
It is now split into a **host shell** and multiple **feature remotes**.

### Current Frontend Structure

| Frontend Module | Responsibility                                 |
| --------------- | ---------------------------------------------- |
| `apps/frontend` | Host shell, shared layout, route orchestration |
| `auth-mfe`      | Login and signup flows                         |
| `catalog-mfe`   | Product listing and product details            |
| `checkout-mfe`  | Cart, quantity controls, stock-aware checkout  |
| `orders-mfe`    | Order listing and polling-based status updates |

### Why this architecture was introduced

The original frontend was a simpler single app.  
Then the frontend was restructured into a **microfrontend architecture** to model how large teams might split ownership by business domain.

This now demonstrates:

- host shell + remotes architecture
- Module Federation setup
- feature isolation
- cross-MFE state sync through local storage and browser events
- frontend decomposition by domain

### Important note

The microfrontend approach increases architectural realism, but it also adds complexity.  
This project currently demonstrates the architecture and the working flow, but there is still room to improve the polish, design consistency, and shared UI system.

---

## Backend Services

| Service                | Responsibility                                    |
| ---------------------- | ------------------------------------------------- |
| `user-service`         | Registration, login, JWT auth                     |
| `product-service`      | Product catalog, product details, stock ownership |
| `order-service`        | Order creation, order status lifecycle            |
| `payment-service`      | Simulated async payment processing                |
| `notification-service` | Stores/logs important business events             |
| `gateway`              | Single API entry point and routing layer          |

---

## Why the Backend Is Split This Way

A beginner question is often:

> Why not just keep everything in one backend?

You absolutely can build a commerce app as a monolith first.  
But this project is intentionally structured as microservices so that it demonstrates **service boundaries** and **ownership**.

### Service ownership in this project

- **user-service** owns user identity and auth
- **product-service** owns product and stock data
- **order-service** owns the order lifecycle
- **payment-service** owns payment state
- **notification-service** owns event persistence / observation
- **gateway** hides internal service topology from the frontend

This separation matters because it reduces coupling.

For example:

- product-service should be the source of truth for stock
- order-service should not directly own stock
- payment-service should not directly mutate product inventory

Instead, state changes happen through **events**.

---

## Core Flow

```text
User registers / logs in
        ↓
Frontend fetches products
        ↓
User adds products to cart
        ↓
User creates an order
        ↓
Order Service validates item availability
        ↓
Order is created with status: payment_pending
        ↓
Payment Service processes payment asynchronously
        ↓
payment.paid
        ↓
Order Service updates order status to paid
        ↓
order.paid
        ↓
Product Service decrements stock
        ↓
Notification Service stores business events
```

---

## Current Capabilities

## 1. Authentication

The system supports:

- user registration
- hashed password storage using bcrypt
- user login
- JWT token generation
- protected routes for order-related workflows

### Why this matters

This is the minimum secure auth foundation for a backend-led application:

- passwords are not stored in plain text
- clients receive a signed token
- protected services verify the token before allowing access

---

## 2. Product Catalog

The system supports:

- listing products
- viewing product details
- seeding demo products
- tracking product stock
- decrementing stock after successful paid orders

### Why this matters

Products are not just static data here.
They are part of a stateful commerce lifecycle.

Stock changes after a successful order, which means the product service is participating in the overall business flow rather than being just a read-only catalog service.

---

## 3. Cart and Checkout

The frontend currently supports:

- adding items to cart
- cart count badge in the header
- local cart persistence
- quantity controls in checkout
- remove item action
- stock-aware validation before order placement
- richer checkout display with image, name, description, stock state, quantity, and price

### Why this matters

Earlier versions of the checkout were much more minimal.
Now the checkout experience is closer to real ecommerce behavior because:

- cart items are identifiable
- stock state is visible
- quantity increases are blocked when stock is insufficient
- users receive clearer feedback before the order hits the backend

---

## 4. Order Lifecycle

The order service currently supports:

- creating orders
- storing initial status as `payment_pending`
- listing orders for the logged-in user
- updating order status when payment events are received
- publishing `order.paid` after a successful payment

### Current order states

- `payment_pending`
- `paid`
- `payment_failed`

### Why this matters

This is one of the most important backend learning areas in the project.

The order is not immediately marked as paid.
Instead, the order starts in an intermediate business state and transitions only when the downstream payment service emits the correct event.

That is a more realistic backend workflow than “create order and immediately mark success.”

---

## 5. Payment Flow

The payment service currently supports:

- creating payment records
- simulating delayed payment processing
- updating payment status from `pending` to `paid`
- publishing payment-related events

### Current payment states

- `pending`
- `paid`
- `failed`

### Important note

Payment is **mocked/simulated** for local development.

There is no real payment gateway yet.
That is intentional for now because the focus of this project is the backend architecture and state flow, not third-party payment integration.

---

## 6. Inventory Flow

After the payment is completed successfully:

1. payment service emits `payment.paid`
2. order service marks the order as `paid`
3. order service emits `order.paid`
4. product service consumes `order.paid`
5. product stock is decremented

### Why this matters

This is where backend learning becomes very practical.

Instead of directly changing stock from the frontend or inline in checkout logic, the stock change happens **after the order is truly paid**.

This models proper business sequencing.

---

## 7. Notification/Event Persistence

Notification service currently supports:

- consuming important business events
- storing notification/event records
- acting as an event history/audit-style service

### Why this matters

In a real system, notifications may later become:

- email notifications
- SMS notifications
- push notifications
- admin/audit activity logs

Right now this service is a lightweight foundation for that future capability.

---

## Async Event Flow Explanation

This is the most important technical concept in the repository.

### Order creation flow in detail

1. User logs in and receives JWT.
2. Frontend submits checkout request to gateway.
3. Gateway forwards request to order-service.
4. Order service validates the order request.
5. Order is created with initial status:

   - `payment_pending`

6. Payment processing is triggered.
7. Payment service creates a payment record with:

   - `pending`

8. Payment service waits for a simulated delay.
9. Payment service marks payment as:

   - `paid`

10. Payment service publishes:

- `payment.paid`

11. Order service consumes `payment.paid`
12. Order status becomes:

- `paid`

13. Order service publishes:

- `order.paid`

14. Product service consumes `order.paid`
15. Product stock is decremented
16. Notification service stores the relevant events

---

## Why the Orders Page Polls

The orders page uses polling to repeatedly fetch current order state.

### Why this exists

Because payment processing and downstream inventory updates happen asynchronously, the UI cannot assume immediate completion.

Polling is a simple way to surface this changing backend state in near real time.

### Tradeoff

Polling is easy to implement, but it is not the final ideal solution.

A more advanced version could use:

- WebSockets
- Server-Sent Events (SSE)
- long polling with optimized refresh
- event streaming to the frontend

For now, polling is enough to demonstrate the backend lifecycle.

---

## Architecture Notes

- Payment is **simulated** for local development — no real charges occur.
- Inventory is owned exclusively by **product-service**.
- Each service has its **own MongoDB database**.
- Inter-service communication uses **RabbitMQ events**.
- The gateway is the single entry point for frontend API calls.
- The frontend uses a host + remotes architecture through Module Federation.
- Cart state is synchronized through local storage and browser events.
- Stock validation is performed both in frontend UX and backend business logic.

---

## Project Vision vs Current Implementation

This section explains the difference between what the original final prompt wanted and what is actually built right now.

### What the original final prompt asked for

The original ask was to build a production-grade, scalable, Amazon/Flipkart-style MERN commerce platform with:

- microservices architecture
- separate databases per service
- API gateway
- working auth flow
- working order → payment → inventory flow
- event-driven communication
- Dockerized local deployment
- realistic production-style folder structure
- actual working implementation files
- frontend modules for core pages
- backend APIs for core flows
- scalable project organization
- a frontend that feels like an ecommerce application

### What is built and running now

The project currently delivers a **working commerce foundation** with the core flow implemented.

Implemented and working:

- user registration
- user login with JWT
- protected order flow
- product catalog APIs
- product details route
- product seeding
- cart + checkout frontend flow
- order creation
- async mock payment processing
- payment event publishing through RabbitMQ
- order status updates from payment events
- inventory stock reduction from `order.paid`
- notification/event persistence
- gateway-based routing
- Docker Compose support
- local non-Docker setup
- Webpack Module Federation frontend split
- stock-aware cart/checkout behavior
- CSS-based ecommerce-oriented UI refinement

### What this project currently is

This project is now best understood as:

> A working, production-style ecommerce architecture foundation that demonstrates real backend service boundaries, async business flows, and a microfrontend frontend split.

It is not yet a full marketplace product, but it is much more than a toy CRUD demo.

---

## What Was Fixed During Real Integration

A major strength of this project is that it was not left at “generated scaffolding.”
A lot of real integration work was required to make it truly run.

### Backend / infra fixes that were made

- missing shared RabbitMQ dependency issue fixed
- local environment setup clarified
- gateway proxy target issues fixed
- gateway body forwarding issues fixed
- RabbitMQ startup timing issue fixed with retry logic
- consumer naming mismatch fixed
- callback argument order bugs fixed across consumers
- order listing route mismatch fixed
- notification event persistence fixed
- product inventory consumption flow fixed

### Frontend / MFE fixes that were made

- package startup script mismatches fixed
- missing local webpack installations fixed
- Babel JSX configuration fixed
- Module Federation bootstrap/eager shared dependency issue fixed
- host rendering flow fixed
- details route rendering fixed
- MFE CSS-based UI improved
- cart sync improved
- checkout item identity improved
- stock-aware UX improved

This matters because it shows that the project was not just “written,” it was actually **debugged, corrected, and stabilized**.

---

## Getting Started

### Prerequisites

You need:

- Node.js
- npm
- MongoDB
- RabbitMQ

Optional but recommended:

- Docker
- Docker Compose

---

## Run with Docker

docker compose down
docker compose up --build

---

## Run Locally Without Docker

This project can also be run locally without Docker.

That requires manually starting:

- MongoDB
- RabbitMQ
- backend services
- gateway
- host shell
- all frontend remotes

### Start the full local setup

From the project root:

```bash id="tqne4m"
npm run dev
```

This starts:

- user-service
- product-service
- order-service
- payment-service
- notification-service
- gateway
- frontend host shell
- auth-mfe
- catalog-mfe
- checkout-mfe
- orders-mfe

---

## URLs

| App / Service       | URL                                              |
| ------------------- | ------------------------------------------------ |
| Host Shell          | [http://localhost:3000](http://localhost:3000)   |
| Auth MFE            | [http://localhost:3001](http://localhost:3001)   |
| Catalog MFE         | [http://localhost:3002](http://localhost:3002)   |
| Checkout MFE        | [http://localhost:3003](http://localhost:3003)   |
| Orders MFE          | [http://localhost:3004](http://localhost:3004)   |
| API Gateway         | [http://localhost:8080](http://localhost:8080)   |
| RabbitMQ Management | [http://localhost:15672](http://localhost:15672) |

### Demo credentials

Create an account using the signup flow in the UI.

---

## Environment and Networking

### Local mode

In local development, services talk to each other using `127.0.0.1` and known ports.

Examples:

- `http://127.0.0.1:4001`
- `http://127.0.0.1:4002`
- `http://127.0.0.1:4003`
- `http://127.0.0.1:4004`

### Docker mode

Inside Docker, services use service names instead.

Examples:

- `http://user-service:4001`
- `http://product-service:4002`
- `http://order-service:4003`
- `http://payment-service:4004`
- `amqp://rabbitmq`
- `mongodb://mongo-user:27017/userdb`

This is why local `.env` values and Docker `.env` values are not always interchangeable.

---

## API / Flow Summary

## Auth

- register user
- login user
- fetch authenticated profile

## Products

- seed products
- list products
- get product by id
- decrement stock after order is paid

## Orders

- create order
- list current user orders
- update order status from payment events

## Payments

- process mock payment
- list payments

## Notifications

- consume and persist important business events

---

## Current Folder Structure

```text
ecommerce_MERN/
├── apps/
│   └── frontend/                # host shell
│       ├── package.json
│       ├── webpack.config.js
│       └── src/
│
├── auth-mfe/                    # auth remote
│   ├── package.json
│   ├── webpack.config.js
│   └── src/
│
├── catalog-mfe/                 # catalog + product details remote
│   ├── package.json
│   ├── webpack.config.js
│   └── src/
│
├── checkout-mfe/                # checkout/cart remote
│   ├── package.json
│   ├── webpack.config.js
│   └── src/
│
├── orders-mfe/                  # orders remote
│   ├── package.json
│   ├── webpack.config.js
│   └── src/
│
├── gateway/
│   ├── package.json
│   └── src/
│
├── packages/
│   └── event-bus/
│
├── services/
│   ├── user-service/
│   ├── product-service/
│   ├── order-service/
│   ├── payment-service/
│   └── notification-service/
│
├── docker-compose.yml
├── package.json
└── README.md
```

---

## What Is Still Not Implemented Yet

This section is important because it clearly shows what still remains from the original final prompt or from a true production-grade ecommerce system.

### Backend / platform gaps

Not yet implemented:

- real payment gateway integration
- refresh token / session rotation flow
- admin dashboard and admin APIs
- advanced role-based authorization
- coupon / promo / discount engine
- wishlist
- reviews and ratings
- returns / refunds
- shipment / delivery tracking
- address book / saved addresses
- Redis caching
- Elasticsearch / OpenSearch
- centralized logging and observability
- distributed tracing
- Swagger / OpenAPI docs
- CI/CD pipelines
- API contract testing
- DLQ / stronger failure handling / advanced saga-style orchestration
- production deployment manifests like Kubernetes / Helm / Terraform

### Frontend / product gaps

Not yet implemented:

- refined search UX
- sorting / filters sidebar
- category landing pages
- recommendation carousels
- reviews and rating UI
- polished order detail page
- wishlist UI
- admin management UI
- advanced responsive polish
- shared UI design system across remotes
- toasts/snackbars for all actions
- skeleton loaders / shimmer states
- more realistic marketplace-style product enrichment

### Architecture maturity gaps

Not yet implemented:

- auth refresh flow
- request tracing across services
- retry / backoff strategy beyond startup connection handling
- centralized metrics
- feature flagging
- proper environment secret management for production hosting
- complete deployment playbooks

So while this is **already strong as an architecture and integration project**, there is still meaningful work left before it becomes a production-hardened ecommerce platform.

---

## Suggested Next Improvements

If this project is extended further, these are the highest-value next steps:

1. integrate a real payment provider
2. add refresh token based session management
3. add admin product and inventory management
4. add Redis caching
5. add search, filters, and sorting
6. add centralized logs and tracing
7. add Swagger/OpenAPI documentation
8. add automated integration tests for cross-service flows
9. replace polling with SSE/WebSockets
10. add better dead-letter and failure-handling patterns
11. add deployment support for Railway / Vercel / cloud hosting
12. improve the microfrontend design consistency with a shared design system

---

## Troubleshooting

### Orders stay stuck on `payment_pending`

Likely causes:

- payment event not published
- order-service consumer not running
- event consumer callback signature mismatch
- order-service crashed before handling payment event

Check:

```bash id="ho2nx9"
docker compose logs payment-service order-service notification-service --tail=200
```

### Backend services do not start in Docker

Check:

```bash id="nkr7vl"
docker compose ps
docker compose logs --tail=200 user-service product-service order-service payment-service notification-service rabbitmq
```

### RabbitMQ connection refused in Docker

This usually means services tried to connect before RabbitMQ was ready.
Retry logic in the shared event-bus package is important here.

### Frontend stays blank

Likely causes:

- MFE startup script issues
- Webpack/Babel config issues
- Module Federation bootstrap issue
- host/remote misconfiguration

### Cart or checkout behaves incorrectly

Check:

- cart payload in local storage
- stock values in `/api/products`
- quantity validation in checkout UI
- backend stock validation in product/order flow

### Gateway works but frontend APIs do not

Check:

- gateway proxy config
- forwarded route paths
- auth headers
- request body forwarding
- backend route compatibility

---

## Final Summary

This repository now demonstrates a real **backend-led ecommerce architecture** with a working frontend integration.

What it successfully proves today:

- backend service separation
- gateway-based API routing
- JWT auth
- MongoDB-per-service ownership
- RabbitMQ event-driven communication
- async payment → order → inventory flow
- notification/event persistence
- Dockerized local orchestration
- local non-Docker development
- Webpack Module Federation frontend split
- product listing + product details
- cart persistence
- checkout with quantity/stock awareness
- polling-based order state visibility

This makes the project much more than a simple CRUD application.

It is a strong **full-stack architecture foundation** that helps explain how frontend, backend, messaging, state transitions, and service boundaries all connect in a real-world commerce workflow.

```

```
