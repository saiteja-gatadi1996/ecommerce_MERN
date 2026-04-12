# Code Knowledge Transfer (KT) — ecommerce MERN Monorepo

> **Who is this for?**
> A new developer joining the project. No hand-holding session needed — read this top-to-bottom and you will understand every folder, every architectural decision, and how everything ties together.

---

## Table of Contents

1. [Big-Picture Architecture](#1-big-picture-architecture)
2. [Root — Monorepo Orchestration](#2-root--monorepo-orchestration)
3. [apps/frontend — Shell / Host MFE](#3-appsfrontend--shell--host-mfe)
4. [auth-mfe — Authentication Microfrontend](#4-auth-mfe--authentication-microfrontend)
5. [catalog-mfe — Product Catalog Microfrontend](#5-catalog-mfe--product-catalog-microfrontend)
6. [checkout-mfe — Cart & Checkout Microfrontend](#6-checkout-mfe--cart--checkout-microfrontend)
7. [orders-mfe — Orders Microfrontend](#7-orders-mfe--orders-microfrontend)
8. [gateway — API Gateway](#8-gateway--api-gateway)
9. [services/user-service — Auth Backend](#9-servicesuser-service--auth-backend)
10. [services/product-service — Product Backend](#10-servicesproduct-service--product-backend)
11. [services/order-service — Order Backend](#11-servicesorder-service--order-backend)
12. [services/payment-service — Payment Backend](#12-servicespayment-service--payment-backend)
13. [services/notification-service — Notification Backend](#13-servicesnotification-service--notification-backend)
14. [packages/event-bus — Shared RabbitMQ Library](#14-packagesevent-bus--shared-rabbitmq-library)
15. [Cross-Cutting Concerns](#15-cross-cutting-concerns)
16. [How to Run Locally](#16-how-to-run-locally)
17. [Port Reference Map](#17-port-reference-map)

---

## 1. Big-Picture Architecture

This project is a **full-stack ecommerce application** built with two distinct architectural styles working together:

### Frontend — Microfrontend (MFE) Architecture using Webpack Module Federation

```
Browser
  └── apps/frontend  (Shell — port 3000)
        ├── loads auth_mfe/App      (port 3001)  → /login, /signup
        ├── loads catalog_mfe/App   (port 3002)  → /, /products/:id
        ├── loads checkout_mfe/App  (port 3003)  → /checkout
        └── loads orders_mfe/App   (port 3004)  → /orders
```

Each MFE is a **completely independent React app** that can run in isolation or be consumed by the shell. The shell is the only thing the browser's address bar points to (`localhost:3000`). All routing and lazy-loading of MFEs happens inside the shell.

### Backend — Microservices Architecture with Event-Driven Communication

```
Browser → gateway (port 8080)
              ├── /api/auth      → user-service   (port 4001)
              ├── /api/products  → product-service (port 4002)
              ├── /api/orders    → order-service   (port 4003)
              └── /api/payments  → payment-service (port 4004)

RabbitMQ (port 5672) — async event bus between services
              ├── user.registered       (user-service → notification-service)
              ├── order.created         (order-service → [broadcast])
              ├── payment.paid          (payment-service → order-service, notification-service)
              ├── payment.failed        (payment-service → order-service, notification-service)
              ├── order.paid            (order-service → product-service, notification-service)
              └── order.payment_failed  (order-service → notification-service)
```

Each backend service has its **own dedicated MongoDB instance** (database-per-service pattern). They never share a database.

### Why this architecture?

The goal of this project is to be a learning/showcase project that demonstrates **real-world engineering patterns** in a single codebase:

- **MFE with Module Federation**: Each UI domain (auth, catalog, checkout, orders) can be owned, deployed, and scaled by a separate team without touching the shell.
- **Microservices**: Each domain service owns its data and can be scaled independently. A spike in orders doesn't affect product browsing.
- **Event-Driven (RabbitMQ)**: Services don't call each other synchronously for side effects. Order placement triggers payment asynchronously; payment completion triggers stock deduction and notifications — all without tight coupling.
- **API Gateway**: A single entry point for the browser. The browser never knows the internal ports of services.

---

## 2. Root — Monorepo Orchestration

**Folder:** `/`

**Files:**
- [package.json](package.json) — root scripts, `concurrently` as the only dependency
- [docker-compose.yml](docker-compose.yml) — full containerised environment

### What it does

The root has no application code. Its only job is **starting everything at once** using `concurrently`.

### Key scripts

| Command | What runs |
|---|---|
| `npm run dev` | All 11 processes (5 backend services + gateway + 5 MFEs) in parallel |
| `npm run dev:backend` | Only the 6 backend processes |
| `npm run dev:mfes` | Only the 5 frontend processes |
| Individual `dev:*` scripts | One specific service or MFE |

### Why `concurrently` and not a task runner like Nx/Turborepo?

`concurrently` is intentionally minimal — it keeps the setup simple and framework-agnostic. The project avoids build-tool lock-in. Each service/MFE manages its own `npm run start` / `npm run dev` internally.

### docker-compose.yml

Runs the **full production-like environment** in containers:

- One `rabbitmq:3-management` container (ports 5672 for AMQP, 15672 for management UI)
- Five separate `mongo:7` containers — one per service (ports 27017–27021)
- One container per backend service + gateway
- One container for the frontend shell

**Key design decision — separate MongoDB containers per service**: This enforces the microservices boundary at the infrastructure level. Services literally cannot access each other's databases even if someone accidentally writes code to try.

---

## 3. apps/frontend — Shell / Host MFE

**Folder:** [apps/frontend/](apps/frontend/)

**Port:** `3000`

**Files:**
- [webpack.config.js](apps/frontend/webpack.config.js) — Module Federation host config
- [src/index.js](apps/frontend/src/index.js) — async dynamic import trigger
- [src/bootstrap.js](apps/frontend/src/bootstrap.js) — actual React root mount
- [src/bootstrap/App.jsx](apps/frontend/src/bootstrap/App.jsx) — full shell app: router, header, route-to-MFE mapping
- [src/lib/api.js](apps/frontend/src/lib/api.js) — shared API + auth utilities
- [src/styles/global.css](apps/frontend/src/styles/global.css) — global design tokens and shared CSS classes

### What it's responsible for

The shell is the **container app**. It:

1. Provides the `BrowserRouter` that wraps every MFE (so all MFEs share the same router instance)
2. Renders the persistent `<Header>` navigation bar across all routes
3. Loads each MFE lazily via `React.lazy` + `Suspense`
4. Guards protected routes (`/checkout`, `/orders`) with a `<RequireAuth>` component
5. Injects `apiBaseUrl` as a prop into every loaded MFE so they all point to the same gateway

### Why the two-file entry pattern (`index.js` → `bootstrap.js`)?

```
index.js       → import('./bootstrap')      // dynamic import
bootstrap.js   → createRoot(...).render(...)  // actual app boot
```

This is a **Module Federation requirement**. MFEs use shared dependencies (React, React-DOM). When the entry point is synchronous, webpack tries to resolve shared modules before the MFE remote manifests are loaded, which causes runtime errors. Making the entry a dynamic import gives webpack time to negotiate shared module versions first. Every MFE in this project follows the same pattern.

### How remote MFEs are loaded

In `webpack.config.js`:

```js
remotes: {
  auth_mfe:     'auth_mfe@http://localhost:3001/remoteEntry.js',
  catalog_mfe:  'catalog_mfe@http://localhost:3002/remoteEntry.js',
  checkout_mfe: 'checkout_mfe@http://localhost:3003/remoteEntry.js',
  orders_mfe:   'orders_mfe@http://localhost:3004/remoteEntry.js'
}
```

In `App.jsx`:

```js
const AuthApp    = React.lazy(() => import('auth_mfe/App'));
const CatalogApp = React.lazy(() => import('catalog_mfe/App'));
```

`auth_mfe/App` is not a relative path — it's a **federated module name** resolved at runtime from the remote URL. If a remote is unavailable, `Suspense` shows "Loading..." and React error boundaries (if added) would show a fallback.

### Header and auth state synchronisation

The `<Header>` component listens to two custom `window` events:

- `mf-auth-changed` — fired any time login/logout happens (from any MFE)
- `mf-cart-changed` — fired any time the cart is modified (from catalog or checkout MFE)

This is how the cart count badge and the Login/Logout button stay in sync without a shared state library like Redux. Since all MFEs run in the same browser tab and share the same `window` object, dispatching a `CustomEvent` is a clean, zero-dependency way to broadcast state changes.

### `<RequireAuth>` guard

```js
function RequireAuth({ children }) {
  const auth = getStoredAuth();
  if (!auth?.token) return <Navigate to='/login' replace />;
  return children;
}
```

Reads `mf_auth` from `localStorage`. If no token is present, redirect to `/login`. This is a client-side only guard — the real security is enforced at the gateway level with JWT verification.

### `window.__API_BASE_URL__`

```js
window.__API_BASE_URL__ = window.__API_BASE_URL__ || 'http://localhost:8080';
```

The shell sets this global. Then it passes `apiBaseUrl: window.__API_BASE_URL__` as a prop to every remote MFE. In production (Docker), this can be overridden without rebuilding the app — you set the `VITE_API_BASE_URL` env var and inject it into `window.__API_BASE_URL__` at container startup.

---

## 4. auth-mfe — Authentication Microfrontend

**Folder:** [auth-mfe/](auth-mfe/)

**Port:** `3001`

**Files:**
- [webpack.config.js](auth-mfe/webpack.config.js) — Module Federation remote config
- [src/index.js](auth-mfe/src/index.js) — async entry (same pattern as shell)
- [src/bootstrap/App.jsx](auth-mfe/src/bootstrap/App.jsx) — Login + Register form
- [src/lib/api.js](auth-mfe/src/lib/api.js) — shared API utilities (same as other MFEs)
- [src/styles/auth.css](auth-mfe/src/styles/auth.css) — auth-specific styles
- [src/styles/remote.css](auth-mfe/src/styles/remote.css) — styles for standalone dev mode

### What it's responsible for

Handles user **registration and login** UI. A single `App` component serves both modes via a `mode` prop (`'login'` or `'signup'`):

```js
<AuthApp mode='login' apiBaseUrl={...} />   // → /login route
<AuthApp mode='signup' apiBaseUrl={...} />  // → /signup route
```

The component uses `useMemo` to derive all the copy (title, subtitle, API endpoint) from the `mode` prop so no duplicated logic exists.

### How it stores auth after login

```js
function setStoredAuth(data) {
  localStorage.setItem('mf_auth', JSON.stringify(data));
  window.dispatchEvent(new Event('mf-auth-changed'));
}
```

The server responds with `{ token, user: { id, name, email, role } }`. This whole object is stored under the key `mf_auth`. Dispatching `mf-auth-changed` causes the shell's Header to re-read localStorage and update the Login/Logout button instantly.

### Why Module Federation remote config?

```js
new ModuleFederationPlugin({
  name: 'auth_mfe',
  filename: 'remoteEntry.js',
  exposes: { './App': './src/bootstrap/App.jsx' },
  ...
})
```

`filename: 'remoteEntry.js'` generates the manifest file that the shell fetches. `exposes` declares which components this MFE makes available to other applications. Only `App.jsx` is exposed — internal components, styles, and utilities are private.

### Can it run standalone?

Yes. Navigate to `http://localhost:3001` and you get a fully working login page. This is intentional — it lets the auth team develop and test independently without the shell.

---

## 5. catalog-mfe — Product Catalog Microfrontend

**Folder:** [catalog-mfe/](catalog-mfe/)

**Port:** `3002`

**Files:**
- [webpack.config.js](catalog-mfe/webpack.config.js) — remote config, port 3002
- [src/bootstrap/App.jsx](catalog-mfe/src/bootstrap/App.jsx) — product list + product details
- [src/lib/api.js](catalog-mfe/src/lib/api.js) — shared API utilities

### What it's responsible for

Renders two views depending on the current URL:

| URL | View |
|---|---|
| `/` | `<ProductList>` — grid of product cards |
| `/products/:id` | `<ProductDetails>` — single product with Add to Cart + Buy Now |

The component reads `location.pathname` to decide which view to render:

```js
const isDetailsPage = location.pathname.startsWith('/products/');
if (isDetailsPage) return <ProductDetails ... />;
return <ProductList ... />;
```

### Cart management (client-side)

The catalog MFE **owns the write side of the cart**. Cart state lives in `localStorage` under the key `mf_cart`:

```json
[{ "productId": "...", "name": "...", "price": 3999, "quantity": 2, "image": "...", "description": "..." }]
```

`mf_cart_count` is a separate key storing the total item count (used by the shell's cart badge).

Every cart mutation dispatches `mf-cart-changed` so the shell header updates the badge in real-time.

### Stock-aware "Add to Cart"

Before adding an item, the code checks `product.stock`:

```js
if (!product?.stock || product.stock <= 0)  → out of stock, block add
if (existingQty + 1 > product.stock)         → exceed stock, block add
```

This prevents the cart from holding more items than are actually in stock. The source of truth for stock is whatever `GET /api/products` returned at page load.

### "Seed Demo Products" button

Calls `POST /api/products/seed` which upserts 20 demo products in the product-service database. This is for demo/development convenience so you don't need to manually create products.

### Stock badges

The catalog shows three states:

- **In stock** (green) — `stock > 3`
- **Only N left** (amber) — `0 < stock <= 3`
- **Out of stock** (red) — `stock <= 0`

---

## 6. checkout-mfe — Cart & Checkout Microfrontend

**Folder:** [checkout-mfe/](checkout-mfe/)

**Port:** `3003`

**Files:**
- [webpack.config.js](checkout-mfe/webpack.config.js) — remote config, port 3003
- [src/bootstrap/App.jsx](checkout-mfe/src/bootstrap/App.jsx) — checkout page with cart review + order placement
- [src/lib/api.js](checkout-mfe/src/lib/api.js) — shared API utilities

### What it's responsible for

Reads the cart from `localStorage`, verifies stock against live product data, lets the user adjust quantities, and places the order.

### Two-step stock verification

1. **At page load**: Fetches `GET /api/products` and builds a `productsMap` (`{ [productId]: product }`). Cart items are "enriched" with live stock data using `useMemo`.
2. **Before order placement**: `validateCart()` iterates `enrichedCart` and blocks placement if any item's stock is `0` or quantity exceeds available stock.

This two-step approach catches cases where stock changed between when the user added the item to cart and when they reached checkout (e.g., another user bought the last unit).

### Order placement flow

```
1. Read token from localStorage (mf_auth)
2. Validate cart against live stock
3. POST /api/orders  → gateway → order-service
   Body: { items: [{ productId, price, quantity }] }
4. On success → clear localStorage cart → redirect to /orders
```

The `price` is sent from the client but the order-service re-fetches product prices from the product-service and re-calculates the total server-side — so the client-side price is only used as a hint, not trusted for billing.

### Quantity controls

The `+` button is disabled when `item.quantity >= item.stock`, preventing the user from incrementing beyond available stock. The `updateQuantity` function also clamps: `Math.max(1, Math.min(nextQty, availableStock))`.

---

## 7. orders-mfe — Orders Microfrontend

**Folder:** [orders-mfe/](orders-mfe/)

**Port:** `3004`

**Files:**
- [webpack.config.js](orders-mfe/webpack.config.js) — remote config, port 3004
- [src/bootstrap/App.jsx](orders-mfe/src/bootstrap/App.jsx) — orders list with auto-refresh
- [src/lib/api.js](orders-mfe/src/lib/api.js) — shared API utilities

### What it's responsible for

Displays the authenticated user's order history. The key feature is **automatic polling every 3 seconds**:

```js
loadOrders();
const intervalId = setInterval(loadOrders, 3000);
return () => { active = false; clearInterval(intervalId); };
```

### Why polling?

The payment flow is **asynchronous** — order status starts as `payment_pending` and transitions to `paid` or `payment_failed` after ~1.2 seconds (the simulated payment processing delay in the payment service). The orders page polls so the user can watch the status update in real time without a manual page refresh. This demonstrates the async nature of the payment pipeline.

### Order status values

From the Order model:

| Status | Meaning |
|---|---|
| `payment_pending` | Order created, payment in progress |
| `paid` | Payment succeeded |
| `payment_failed` | Payment failed |

The UI renders `Status: {order.status}` directly. The status a user sees on screen comes directly from the order-service database, which is updated by the payment consumer.

---

## 8. gateway — API Gateway

**Folder:** [gateway/](gateway/)

**Port:** `8080`

**Files:**
- [src/server.js](gateway/src/server.js) — the entire gateway in one file

### What it's responsible for

The gateway is the **single entry point** for all browser-to-backend traffic. The browser only ever talks to `localhost:8080`. The gateway:

1. Adds **CORS** headers (allows requests from the frontend origin)
2. Applies a **rate limiter** (200 requests / minute per IP)
3. Decodes the **JWT** from `Authorization: Bearer <token>` into `req.user`
4. **Proxies** requests to the correct downstream service

### Route-to-service mapping

```
GET/POST /api/auth/*      → user-service:4001
GET/POST /api/products/*  → product-service:4002
*        /api/orders/*    → order-service:4003    (requires valid JWT)
*        /api/payments/*  → payment-service:4004
```

### Authentication: gateway vs service

There are two layers of auth:

- **Gateway level** (`attachUser`): decodes the JWT and attaches `req.user` to the request. Does NOT reject — if the token is missing or invalid, `req.user` is just `null`.
- **Gateway level** (`requireAuth` middleware on `/api/orders`): rejects with 401 if `req.user` is null. This is the first guard.
- **Service level** (`requireAuth` in each service): each service independently verifies the JWT again. This is the second guard. Services should never trust that the gateway already validated the token.

This dual-verification is intentional — services can be called directly (e.g. via curl during debugging) without going through the gateway.

### Why `http-proxy-middleware` instead of a BFF (Backend-for-Frontend)?

The gateway is intentionally thin — it does no business logic, no data transformation, no aggregation. It just routes. This is the **API Gateway pattern** (not BFF). Each service is fully self-contained. If a service needs to call another service, it does so directly (e.g. order-service calls product-service for the product batch endpoint).

### `proxyWithPrefix`

```js
function proxyWithPrefix(target, prefix) {
  return createProxyMiddleware({
    target,
    changeOrigin: true,
    pathRewrite: (path) => `${prefix}${path}`,
    on: { proxyReq: fixRequestBody },
  });
}
```

`pathRewrite` prepends the service prefix back. Example:

- Browser sends: `POST /api/orders`
- Gateway receives at: `app.use('/api/orders', proxyWithPrefix(services.order, '/api/orders'))`
- The `path` parameter passed to `pathRewrite` is already stripped of the matched prefix, so `pathRewrite` adds it back
- Result sent to order-service: `POST /api/orders`

`fixRequestBody` is required when proxying POST/PUT bodies with `http-proxy-middleware` v3+ — without it, request bodies get lost.

---

## 9. services/user-service — Auth Backend

**Folder:** [services/user-service/](services/user-service/)

**Port:** `4001`

**Internal structure:**

```
src/
  config/
    db.js          — MongoDB connection helper
    env.js         — validated environment variables
  controllers/
    authController.js  — register, login, profile handlers
  middleware/
    auth.js        — requireAuth, requireAdmin JWT middlewares
  models/
    User.js        — Mongoose schema
  routes/
    authRoutes.js  — route definitions
  server.js        — bootstrap
```

### What it's responsible for

Manages user accounts and issues JWT tokens. Three endpoints:

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | None | Create account, returns JWT |
| POST | `/api/auth/login` | None | Verify credentials, returns JWT |
| GET | `/api/auth/me` | Required | Returns the logged-in user's profile |

### JWT design

```js
jwt.sign(
  { id, email, role, name },
  jwtSecret,
  { expiresIn: '2h' }
)
```

The token payload embeds `id`, `email`, `role`, and `name`. This means downstream services (order-service, etc.) can extract the user's identity directly from the token without a database round-trip.

### Password storage

`bcryptjs` with salt rounds of `10`. The field is named `passwordHash` (not `password`) in the schema to make it obvious it's hashed and to avoid accidental plain-text leaks.

### Role system

Two roles: `customer` (default) and `admin`. The register endpoint accepts a `role` field but only grants `admin` if `role === 'admin'` is explicitly sent — it can't be set to anything arbitrary.

### Event published

After successful registration, the service publishes `user.registered` to RabbitMQ. The notification-service listens to this and stores a notification record.

---

## 10. services/product-service — Product Backend

**Folder:** [services/product-service/](services/product-service/)

**Port:** `4002`

**Internal structure:**

```
src/
  config/
  controllers/
    productController.js  — CRUD + seed + batch endpoints
  events/
    orderPaidConsumer.js  — listens for order.paid, decrements stock
  middleware/
    auth.js
  models/
    Product.js
  routes/
    productRoutes.js
  server.js
```

### What it's responsible for

Manages the product catalogue. Public read endpoints, admin-only write endpoints, and an event consumer that keeps stock accurate.

### API endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/products` | None | List all products |
| GET | `/api/products/:id` | None | Single product by ID |
| GET | `/api/products/batch?ids=id1,id2` | None | Batch fetch by comma-separated IDs |
| POST | `/api/products` | Admin | Create a product |
| POST | `/api/products/seed` | None | Upsert 20 demo products |

### Product schema

```
name, description, price, image, category, stock, sku (unique)
```

`sku` is unique and used as the idempotency key in the seed endpoint's `bulkWrite` upsert.

### Stock decrement via event

When a payment succeeds:

```
payment.paid event
  → order-service marks order as 'paid'
  → order-service publishes order.paid (with items list)
  → product-service orderPaidConsumer handles order.paid
  → decrements stock for each item: $inc: { stock: -quantity }
```

This means stock is only deducted **after payment is confirmed** — not when the order is created. If payment fails, stock is never touched.

### The `/batch` endpoint

The order-service needs to look up multiple products at once when creating an order. Rather than N serial HTTP calls, it calls `/api/products/batch?ids=id1,id2,id3` which does a single `Product.find({ _id: { $in: ids } })`.

---

## 11. services/order-service — Order Backend

**Folder:** [services/order-service/](services/order-service/)

**Port:** `4003`

**Internal structure:**

```
src/
  config/
  controllers/
    orderController.js  — createOrder, listMyOrders
  events/
    paymentConsumer.js  — listens for payment.paid / payment.failed
  middleware/
    auth.js
  models/
    Order.js
  routes/
    orderRoutes.js       — all routes require auth
  server.js
```

### What it's responsible for

Creates orders and tracks their payment status. All routes require authentication.

### Order creation flow (inside `createOrder`)

```
1. Validate that items array is non-empty
2. Batch-fetch products from product-service (HTTP GET /api/products/batch)
3. For each item: verify product exists + has enough stock
4. Calculate totalAmount using server-side prices (not client prices)
5. Persist Order with status='payment_pending'
6. Publish order.created event to RabbitMQ
7. Synchronously call payment-service POST /api/payments/process
8. Return 201 with the order
```

**Why is step 7 synchronous (HTTP call) while step 6 is async (event)?**

The HTTP call to payment-service just *initiates* the payment — it returns `202 Accepted` immediately. The actual payment result (`payment.paid` or `payment.failed`) comes back asynchronously via RabbitMQ. The frontend needs the order record returned so it can redirect to `/orders`, so the HTTP call must complete before returning the response to the browser.

### Payment consumer (inside `paymentConsumer.js`)

Listens to `payment.paid` and `payment.failed`:

- `payment.paid` → sets order `status='paid'`, `paymentStatus='paid'` → publishes `order.paid`
- `payment.failed` → sets order `status='payment_failed'` → publishes `order.payment_failed`

The `order.paid` event is what triggers stock deduction in the product-service.

### Order statuses

```
created → payment_pending → paid
                          → payment_failed
```

---

## 12. services/payment-service — Payment Backend

**Folder:** [services/payment-service/](services/payment-service/)

**Port:** `4004`

**Files:**
- [src/controllers/paymentController.js](services/payment-service/src/controllers/paymentController.js)
- [src/models/Payment.js](services/payment-service/src/models/Payment.js)

### What it's responsible for

Simulates a payment processor. In a real system this would integrate with Stripe, Razorpay, etc.

### `processPayment` — the simulated async payment

```js
async function processPayment(req, res) {
  // 1. Create payment record with status='pending'
  const payment = await Payment.create({ orderId, userId, amount, status: 'pending' });

  // 2. Schedule the "processing" with a 1.2 second delay
  setTimeout(async () => {
    payment.status = 'paid';
    payment.transactionId = `txn_${Date.now()}`;
    await payment.save();

    await publishEvent(channel, 'payment.paid', { ... });
  }, 1200);

  // 3. Immediately return 202 Accepted
  return res.status(202).json({ message: 'Payment initiated', ... });
}
```

The `setTimeout` simulates the ~1.2 second delay of a real payment gateway. The 202 response returns immediately to the order-service, which then returns the order to the browser. 1.2 seconds later, the payment event fires through RabbitMQ and the order status updates.

**This is exactly why the orders page polls every 3 seconds** — the status goes from `payment_pending` to `paid` about 1–2 seconds after the user lands on the orders page.

### Payment schema

```
orderId, userId, amount, paymentMethod, status (pending/paid/failed), transactionId
```

---

## 13. services/notification-service — Notification Backend

**Folder:** [services/notification-service/](services/notification-service/)

**Port:** `4005`

**Files:**
- [src/events/notificationConsumer.js](services/notification-service/src/events/notificationConsumer.js)
- [src/models/Notification.js](services/notification-service/src/models/Notification.js)

### What it's responsible for

A **pure event listener**. It subscribes to every significant business event on RabbitMQ and persists a notification record for each one. It has no influence on any other service and no other service depends on it.

### Events it consumes

```
user.registered       → "New user registered: {name} ({email})"
payment.paid          → "Payment completed for order {orderId}"
payment.failed        → "Payment failed for order {orderId}"
order.paid            → "Order {orderId} has been marked as paid"
order.payment_failed  → "Order {orderId} payment failed"
```

### Why have a notification service?

This demonstrates the **observer pattern** in a microservices context. Adding or removing the notification service has zero impact on any other service. It is a completely decoupled audit log / notification store. In a real system it would also send emails, push notifications, or SMS.

### Notification schema

```
eventType, recipient, title, message, payload (raw event data)
```

---

## 14. packages/event-bus — Shared RabbitMQ Library

**Folder:** [packages/event-bus/](packages/event-bus/)

**Package name:** `@repo/event-bus`

**File:** [index.js](packages/event-bus/index.js)

### What it's responsible for

A small shared library with three exported functions used by **every backend service**. It abstracts away the `amqplib` boilerplate.

### `connectRabbit(url, options)`

Retries the RabbitMQ connection up to 20 times with a 3-second delay between attempts. This is critical because when Docker starts all containers simultaneously, RabbitMQ takes ~10–15 seconds to be ready. Without retries, all services would crash on startup.

It creates one exchange named `app.events` of type `topic`, which is where all events are published.

### `publishEvent(channel, routingKey, payload)`

```js
channel.publish('app.events', routingKey, message, {
  persistent: true,
  contentType: 'application/json'
});
```

`persistent: true` means messages survive a RabbitMQ restart. The routing key follows dot-notation (e.g. `order.paid`, `payment.failed`).

### `subscribeEvent(channel, queue, patterns, handler)`

Creates a **durable queue** (survives restarts), binds it to the exchange with the given routing-key patterns, and calls `handler(payload, routingKey)` for each message. Acknowledges (`ack`) on success, dead-letters (`nack` with requeue=false) on handler error.

### Why a shared package instead of duplicating this code?

If the connection logic or exchange name were copied into each service, one service could change it and silently break inter-service messaging. The shared package ensures all services speak the same protocol. Each service installs it as `"@repo/event-bus": "file:../../packages/event-bus"`.

### Exchange topology

All events flow through one **topic exchange** named `app.events`. Topic exchanges allow pattern matching — e.g. a queue can bind with pattern `order.*` to receive all order events. Currently each consumer binds to specific routing keys, but the topic exchange leaves room to add wildcard subscriptions without changing publishers.

---

## 15. Cross-Cutting Concerns

### localStorage contract

All MFEs share these keys — never rename them without updating every MFE:

| Key | Owner (write) | Consumers (read) | Content |
|---|---|---|---|
| `mf_auth` | auth-mfe, shell | all MFEs, shell | `{ token, user: { id, name, email, role } }` |
| `mf_cart` | catalog-mfe, checkout-mfe | checkout-mfe, shell | `[{ productId, name, description, image, price, quantity }]` |
| `mf_cart_count` | catalog-mfe, checkout-mfe | shell Header | `"3"` (string) |

### Window event contract

| Event name | Who dispatches | Who listens |
|---|---|---|
| `mf-auth-changed` | auth-mfe (login/register), shell (logout) | shell Header |
| `mf-cart-changed` | catalog-mfe (add to cart), checkout-mfe (qty change/remove/clear) | shell Header, checkout-mfe |

### Shared `lib/api.js`

Every MFE has an **identical copy** of [auth-mfe/src/lib/api.js](auth-mfe/src/lib/api.js). This is **intentional duplication** — in Module Federation, shared modules must be carefully managed. Rather than sharing a complex utility package across MFEs (which can cause version conflicts and tight coupling), each MFE owns its copy. If you need to change the auth storage key, change it in all four copies.

### RabbitMQ routing key reference

```
user.registered          published by: user-service
order.created            published by: order-service
payment.paid             published by: payment-service
payment.failed           published by: payment-service
order.paid               published by: order-service (after receiving payment.paid)
order.payment_failed     published by: order-service (after receiving payment.failed)
```

### JWT secret

All services (gateway + user-service + all downstream services) read the JWT secret from `process.env.JWT_SECRET`. In Docker, this is set to `supersecret` uniformly via `docker-compose.yml`. In local dev, each service has a `.env` file. **Never hardcode the secret and always use the same value across all services** — if they differ, token verification will fail.

---

## 16. How to Run Locally

### Prerequisites

- Node.js 18+
- Docker Desktop (for RabbitMQ + MongoDB)
- `npm install` in each folder that has a `package.json` (or run from root: `npm install` won't install sub-packages automatically — each service needs its own install)

### Quick start

**Step 1 — Start infrastructure**

```bash
docker-compose up rabbitmq mongo-user mongo-product mongo-order mongo-payment mongo-notification
```

This starts RabbitMQ and all 5 MongoDB instances. Leave this running.

**Step 2 — Install dependencies**

```bash
# Root
npm install

# Each service and MFE
cd services/user-service && npm install && cd ../..
cd services/product-service && npm install && cd ../..
cd services/order-service && npm install && cd ../..
cd services/payment-service && npm install && cd ../..
cd services/notification-service && npm install && cd ../..
cd gateway && npm install && cd ..
cd packages/event-bus && npm install && cd ../..
cd apps/frontend && npm install && cd ../..
cd auth-mfe && npm install && cd ..
cd catalog-mfe && npm install && cd ..
cd checkout-mfe && npm install && cd ..
cd orders-mfe && npm install && cd ..
```

**Step 3 — Start everything**

```bash
npm run dev
```

This runs all 11 processes (5 backend services + gateway + 5 MFEs) simultaneously with colour-coded terminal output.

**Step 4 — Seed products**

Open `http://localhost:3000` and click the **Seed Demo Products** button. This calls `POST /api/products/seed` and creates 20 products.

### Individual starts (for debugging)

```bash
npm run dev:backend      # only backend (6 processes)
npm run dev:mfes         # only frontend (5 processes)
npm run dev:auth-mfe     # only auth MFE
npm run dev:gateway      # only gateway
```

### Full Docker start (production-like)

```bash
docker-compose up --build
```

Builds and runs everything in containers including the frontend at `http://localhost:3000`.

---

## 17. Port Reference Map

| Process | Port | URL |
|---|---|---|
| Shell (host MFE) | 3000 | `http://localhost:3000` |
| auth-mfe | 3001 | `http://localhost:3001` (standalone) |
| catalog-mfe | 3002 | `http://localhost:3002` (standalone) |
| checkout-mfe | 3003 | `http://localhost:3003` (standalone) |
| orders-mfe | 3004 | `http://localhost:3004` (standalone) |
| API Gateway | 8080 | `http://localhost:8080` |
| user-service | 4001 | internal only |
| product-service | 4002 | internal only |
| order-service | 4003 | internal only |
| payment-service | 4004 | internal only |
| notification-service | 4005 | internal only |
| RabbitMQ AMQP | 5672 | internal |
| RabbitMQ Management UI | 15672 | `http://localhost:15672` (guest/guest) |
| MongoDB — user-service | 27017 | internal |
| MongoDB — product-service | 27018 | internal |
| MongoDB — order-service | 27019 | internal |
| MongoDB — payment-service | 27020 | internal |
| MongoDB — notification-service | 27021 | internal |

---

*This document covers every folder, file, and design decision in the project as of the time of writing. When you add a new service or MFE, update the relevant sections here.*
