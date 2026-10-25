# E-Commerce Backend API

A production-ready backend system for a full-featured e-commerce platform, built with Node.js, Express, and PostgreSQL. This project demonstrates real-world backend engineering: layered architecture, role-based access control, transaction-safe workflows, and secure authentication.

---

## Table of Contents

1. [System Architecture Overview](#1-system-architecture-overview)
2. [Request Flow (Step by Step)](#2-request-flow-step-by-step)
3. [Database Entity Relationship Diagram](#3-database-entity-relationship-diagram)
4. [Module-by-Module Deep Dive](#4-module-by-module-deep-dive)
   - [Authentication Module](#authentication-module)
   - [Authorization & RBAC](#authorization--rbac)
   - [Product Management Module](#product-management-module)
   - [Shopping Cart Module](#shopping-cart-module)
   - [Order & Checkout Module](#order--checkout-module)
   - [Payment Integration (Razorpay)](#payment-integration-razorpay)
5. [Layered Architecture Explanation](#5-layered-architecture-explanation)
6. [Security Deep Dive](#6-security-deep-dive)
7. [Validation Strategy](#7-validation-strategy)
8. [Error Handling](#8-error-handling)
9. [API Endpoints Summary](#9-api-endpoints-summary)
10. [Environment Variables](#10-environment-variables)
11. [Database Models (Prisma Schema)](#11-database-models-prisma-schema)
12. [Deployment](#12-deployment)
13. [Running Locally](#13-running-locally)
14. [Design Decisions & Trade-offs](#14-design-decisions--trade-offs)

---

## 1. System Architecture Overview

The system follows a **layered architecture** where responsibilities are cleanly separated across distinct layers. This makes the codebase maintainable, testable, and easy to extend.

```
┌─────────────────────────────────────────────────────────────┐
│                      CLIENT / POSTMAN                        │
│            (Frontend, Mobile App, or API Client)            │
└────────────────────────────┬────────────────────────────────┘
                             │  HTTPS / REST
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                    EXPRESS API SERVER                        │
│  ┌──────────┬──────────┬──────────┬──────────┬───────────┐ │
│  │   CORS   │  Helmet  │Rate Limit│  JSON    │  Trust    │ │
│  │          │(Security)│ (Abuse)  │ Parsing  │  Proxy    │ │
│  └──────────┴──────────┴──────────┴──────────┴───────────┘ │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐   │
│  │                    ROUTES LAYER                       │   │
│  │   /api/auth  /api/products  /api/cart  /api/orders  │   │
│  │   (Endpoint definitions + middleware chaining)        │   │
│  └────────────────────────┬─────────────────────────────┘   │
│                           │                                  │
│  ┌────────────────────────┴─────────────────────────────┐   │
│  │                 CONTROLLERS LAYER                     │   │
│  │   - Receives HTTP request                             │   │
│  │   - Calls service layer                               │   │
│  │   - Formats HTTP response                             │   │
│  │   - NO business logic here                            │   │
│  └────────────────────────┬─────────────────────────────┘   │
│                           │                                  │
│  ┌────────────────────────┴─────────────────────────────┐   │
│  │                  SERVICES LAYER                       │   │
│  │   - Business logic (validation, calculations)        │   │
│  │   - Prisma transactions (checkout)                   │   │
│  │   - Calls Prisma ORM                                 │   │
│  │   - NO HTTP/Express code                             │   │
│  └────────────────────────┬─────────────────────────────┘   │
│                           │                                  │
│  ┌────────────────────────┴─────────────────────────────┐   │
│  │                    PRISMA ORM                         │   │
│  │   - Data access abstraction                          │   │
│  │   - Query building                                   │   │
│  │   - Type-safe database operations                    │   │
│  └────────────────────────┬─────────────────────────────┘   │
│                           │                                  │
└───────────────────────────┼──────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    POSTGRESQL DATABASE                       │
│   Users  |  Products  |  Carts  |  CartItems  |             │
│   Orders |  OrderItems |  (Enums & Relations)              │
└─────────────────────────────────────────────────────────────┘
```

### Key Design Principles

| Principle | How It's Applied |
|---|---|
| **Separation of Concerns** | Routes define endpoints, controllers handle HTTP, services handle business logic, Prisma handles data |
| **Stateless Authentication** | JWT tokens — no session storage needed on the server |
| **Role-Based Access Control** | Middleware checks roles (USER/ADMIN) before allowing operations |
| **Transaction Safety** | Checkout uses `prisma.$transaction()` to ensure atomicity |
| **Soft Deletes** | Products are soft-deleted (`isActive: false`) instead of hard deletion |
| **Input Validation** | Zod schemas validate every incoming request at the route level |
| **Centralized Errors** | A single error-handling middleware transforms all errors into consistent JSON responses |

---

## 2. Request Flow (Step by Step)

Here's what happens when a client makes a request — using the **checkout** flow as the most complete example:

```
┌─────┐
│     │  POST /api/orders/checkout
│     │  Authorization: Bearer <JWT_TOKEN>
│     │  Content-Type: application/json
│CLIENT│
└─────┘
      │
      ▼
┌─────────────────────────────────────────────┐
│  1. EXPRESS MIDDLEWARE PIPELINE              │
│                                             │
│  • CORS check                              │
│  • Helmet security headers                 │
│  • Rate limiting (globalLimiter)           │
│  • JSON body parsing (10kb limit)          │
└─────────────────────────────────────────────┘
      │
      ▼
┌─────────────────────────────────────────────┐
│  2. ROUTES LAYER (/api/orders)              │
│                                             │
│  router.post("/checkout", checkOutOrder)    │
│  (authenticate middleware is already applied │
│   at the router level)                      │
└─────────────────────────────────────────────┘
      │
      ▼
┌─────────────────────────────────────────────┐
│  3. AUTH MIDDLEWARE                         │
│                                             │
│  • Extract "Bearer <token>" from header    │
│  • Verify JWT with JWT_SECRET              │
│  • Attach decoded user info to req.user    │
│  • If invalid → 401/403 response           │
└─────────────────────────────────────────────┘
      │
      ▼
┌─────────────────────────────────────────────┐
│  4. CONTROLLER (order.controller.js)        │
│                                             │
│  checkOutOrder(req, res, next)             │
│  ┌─ Calls checkoutOrderService(userId)     │
│  └─ Sends 201 response with order          │
└─────────────────────────────────────────────┘
      │
      ▼
┌─────────────────────────────────────────────┐
│  5. SERVICE (order.service.js)              │
│     checkoutOrderService(userId)            │
│                                             │
│  ┌─ Find active cart for user              │
│  ├─ Validate cart is not empty              │
│  ├─ Start Prisma $transaction:             │
│  │  ├─ Validate each product's stock       │
│  │  ├─ Calculate totalAmount               │
│  │  ├─ Create Order record                 │
│  │  ├─ Create OrderItem records            │
│  │  ├─ Decrement stock for each product    │
│  │  ├─ Mark cart as CHECKED_OUT            │
│  │  └─ Fetch and return full order         │
│  └─ Return order to controller             │
└─────────────────────────────────────────────┘
      │
      ▼
┌─────────────────────────────────────────────┐
│  6. PRISMA ORM                              │
│                                             │
│  • Translates service calls into SQL       │
│  • Executes queries against PostgreSQL     │
│  • Handles connection pooling             │
└─────────────────────────────────────────────┘
      │
      ▼
┌─────────────────────────────────────────────┐
│  7. POSTGRESQL DATABASE                     │
│                                             │
│  • Stores all data durably                 │
│  • Enforces constraints & relations        │
└─────────────────────────────────────────────┘
      │
      ▼
┌─────────────────────────────────────────────┐
│  8. RESPONSE TO CLIENT                      │
│                                             │
│  HTTP 201 Created                          │
│  {                                           │
│    "id": "...",                             │
│    "totalAmount": 2500,                     │
│    "status": "PLACED",                      │
│    "items": [...],                          │
│    ...                                       │
│  }                                           │
└─────────────────────────────────────────────┘
```

### Error Path Example

If anything fails during checkout (e.g., insufficient stock), the transaction is **automatically rolled back** by Prisma, and the error bubbles up through the service → controller → error middleware, returning:

```json
{
  "success": false,
  "message": "Insufficient stock for T-Shirt"
}
```

---

## 3. Database Entity Relationship Diagram

### Entity Relationship Diagram (ERD)

```
┌──────────────────────┐
│        USER          │
├──────────────────────┤
│ id        UUID       │◄────────────────────┐
│ email     String     │                     │
│ password  String     │                     │
│ role      Role       │                     │
│ createdAt DateTime   │                     │
└──────────────────────┘                     │
       │                                      │
       │ 1:N                                  │ 1:N
       ▼                                      ▼
┌──────────────────────┐          ┌──────────────────────┐
│         CART         │          │        ORDER         │
├──────────────────────┤          ├──────────────────────┤
│ id        UUID       │          │ id         UUID      │◄──┐
│ userId    String     │          │ userId     String    │   │
│ status    CartStatus │          │ totalAmount Int      │   │
│ createdAt DateTime   │          │ paymentStatus String │   │
└──────────────────────┘          │ status     OrderStatus│   │
       │                         │ createdAt  DateTime   │   │
       │ 1:N                     └──────────────────────┘   │
       ▼                                                      │
┌──────────────────────┐                                      │
│       CARTITEM       │                                      │
├──────────────────────┤                                      │
│ id        UUID       │                                      │
│ cartId    String     │                                      │
│ productId String     │                                      │
│ quantity  Int        │                                      │
│ price     Int        │                                      │ 1:N
└──────────────────────┘                                      ▼
       │                                            ┌──────────────────────┐
       │ 1:N                                         │      ORDERITEM       │
       ▼                                            ├──────────────────────┤
┌──────────────────────┐                            │ id        UUID       │
│       PRODUCT        │────────────────────────────│ orderId   String    │
├──────────────────────┤                            │ productId String     │
│ id        UUID       │                            │ quantity  Int       │
│ name      String     │                            │ price     Int       │
│ description String   │                            │ name      String?   │
│ price     Int        │                            └──────────────────────┘
│ stock     Int        │
│ isActive  Boolean    │
│ createdAt DateTime   │
└──────────────────────┘
```

### Relationship Summary

| Relation | Type | Explanation |
|---|---|---|
| **User → Cart** | 1:N | A user can have multiple carts, but only one `ACTIVE` cart at a time |
| **User → Order** | 1:N | A user can place many orders over time |
| **Cart → CartItem** | 1:N | A cart contains many cart items |
| **CartItem → Product** | N:1 | Each cart item references one product |
| **Order → OrderItem** | 1:N | An order contains many order items |
| **OrderItem → Product** | N:1 | Each order item references one product |
| **CartItem ↔ OrderItem** | Indirect | Cart items are "converted" to order items during checkout |

### Key Design Notes

- **CartItem has a unique constraint** on `[cartId, productId]` → a product can only appear once per cart (quantity is updated instead of creating duplicates)
- **Price snapshot** — CartItem and OrderItem store the `price` at the time of adding/checkout. This means if a product's price changes after being added to cart, the user still pays the original price.
- **Soft delete** — Product uses `isActive` flag; deleted products are hidden from listings but preserved in the database.

---

## 4. Module-by-Module Deep Dive

### Authentication Module

**Files:**
- `src/modules/auth/auth.routes.js` — endpoint definitions
- `src/modules/auth/auth.controller.js` — HTTP handling
- `src/modules/auth/auth.service.js` — business logic
- `src/validators/auth.schema.js` — Zod validation schemas

#### How Registration Works

```
POST /api/auth/register
Body: { "email": "user@example.com", "password": "secret123" }

1. auth.routes.js:
   - Rate limiter applied (authLimiter: 10 attempts per 15 min)
   - Zod validation (registerSchema: email format + password min 3 chars)
   - Calls register controller

2. auth.controller.js (register):
   - Extracts email & password from req.body
   - Calls registerUser(email, password)

3. auth.service.js (registerUser):
   - Check if user with this email already exists → 409 Conflict
   - Hash password with bcrypt (10 salt rounds)
   - Create user in database (role defaults to USER)
   - Return user object

4. Response:
   HTTP 201
   { "message": "User Registered Successfully", "userId": "<uuid>" }
```

#### How Login Works

```
POST /api/auth/login
Body: { "email": "user@example.com", "password": "secret123" }

1. auth.routes.js:
   - Rate limiter (authLimiter)
   - Zod validation (loginSchema)

2. auth.controller.js (login):
   - Calls loginUser(email, password)

3. auth.service.js (loginUser):
   - Find user by email → 401 if not found
   - Compare password with bcrypt.compare() → 401 if wrong
   - Generate JWT token: { userId, role } with 1-day expiry
   - Return token

4. Response:
   HTTP 200
   { "token": "eyJhbGciOiJIUzI1NiIs..." }
```

#### JWT Token Structure

```javascript
{
  userId: "uuid-of-the-user",
  role: "USER" | "ADMIN",
  // Signed with process.env.JWT_SECRET
  // Expires in 1 day
}
```

Every subsequent request includes this token in the `Authorization: Bearer <token>` header. The `authenticate` middleware decodes it and attaches the user info to `req.user`.

---

### Authorization & RBAC

**Files:** `src/middleware/role.middleware.js`

The system uses two roles:

| Role | Capabilities |
|---|---|
| **USER** (default) | Register, login, view products, manage own cart, place orders, view own orders |
| **ADMIN** | Everything a USER can do, **plus**: create/update/delete products, update any order's status |

#### How Role Middleware Works

```javascript
// In routes
router.post("/", authenticate, authorizeRole("ADMIN"), validate(schema), createProduct);

// authorizeRole("ADMIN") checks:
// 1. Is req.user present? → 401 if not
// 2. Is req.user.role in ["ADMIN"]? → 403 if not
// 3. If yes → call next() to proceed
```

This pattern is used in:
- **Product routes**: POST, PUT, DELETE require `ADMIN`
- **Order status routes**: PUT `/:id/status` requires `ADMIN`

---

### Product Management Module

**Files:**
- `src/modules/products/product.routes.js`
- `src/modules/products/product.controller.js`
- `src/modules/products/product.service.js`
- `src/validators/product.schema.js`

#### Product Schema (Database)

| Field | Type | Constraints |
|---|---|---|
| id | UUID | Primary key, auto-generated |
| name | String | Required |
| description | String | Optional |
| price | Int | Required (stored in smallest currency unit, e.g., cents) |
| stock | Int | Required |
| isActive | Boolean | Default `true` (soft delete flag) |
| createdAt | DateTime | Auto-set on creation |

#### CRUD Operations

| Operation | Endpoint | Access | Description |
|---|---|---|---|
| List all | `GET /api/products` | Public | Paginated, filterable, sortable list of **active** products |
| Get one | `GET /api/products/:id` | Public | Single product by ID (must be active) |
| Create | `POST /api/products` | ADMIN | Add a new product |
| Update | `PUT /api/products/:id` | ADMIN | Update product fields (partial updates supported) |
| Delete | `DELETE /api/products/:id` | ADMIN | **Soft delete** — sets `isActive: false` |

#### Filtering & Pagination (GET /api/products)

Query parameters supported:

```
GET /api/products?page=1&limit=10&minPrice=100&maxPrice=5000&inStock=true&sortBy=price&order=asc
```

| Parameter | Default | Description |
|---|---|---|
| `page` | 1 | Page number |
| `limit` | 10 | Items per page |
| `minPrice` | — | Minimum price filter |
| `maxPrice` | — | Maximum price filter |
| `inStock` | — | Set to `"true"` to show only products with stock > 0 |
| `sortBy` | `createdAt` | Field to sort by |
| `order` | `desc` | `asc` or `desc` |

Response includes pagination metadata:

```json
{
  "data": [/* products */],
  "pagination": {
    "total": 42,
    "page": 1,
    "limit": 10,
    "totalPages": 5
  }
}
```

---

### Shopping Cart Module

**Files:**
- `src/modules/carts/cart.routes.js`
- `src/modules/carts/cart.controller.js`
- `src/modules/carts/cart.service.js`
- `src/validators/cart.schema.js`

#### Cart Design Principles

1. **One active cart per user** — When a user adds their first item, a new cart is created. The system always uses the cart with `status: "ACTIVE"`.
2. **Price snapshot** — When an item is added to cart, the current product price is stored in the CartItem. This price is locked in and won't change even if the product price changes later.
3. **Stock validation** — Adding to cart checks that sufficient stock exists.
4. **Quantity aggregation** — If a product is already in the cart, adding it again increases the quantity rather than creating a duplicate entry.

#### CartStatus Enum

| Value | Meaning |
|---|---|
| `ACTIVE` | Cart is open, items can be added/modified |
| `CHECKED_OUT` | Cart has been converted to an order; no more modifications allowed |

#### Cart Operations

| Operation | Endpoint | Description |
|---|---|---|
| View cart | `GET /api/cart` | Returns the user's active cart with all items (auto-creates if none exists) |
| Add item | `POST /api/cart/add` | Adds product to cart or increases quantity if already present |
| Update item | `PUT /api/cart/item/:itemId` | Changes quantity of a cart item |
| Remove item | `DELETE /api/cart/item/:itemId` | Removes an item from the cart |

All cart routes require JWT authentication (enforced at the router level with `router.use(authenticate)`).

---

### Order & Checkout Module

**Files:**
- `src/modules/order/order.routes.js`
- `src/modules/order/order.controller.js`
- `src/modules/order/order.service.js`
- `src/validators/order.schema.js`

#### OrderStatus Lifecycle

```
PLACED ──→ CONFIRMED ──→ SHIPPED ──→ DELIVERED
   │
   └──→ CANCELLED (can be set at any point by ADMIN)
```

This is a linear progression, but ADMIN can set any status via the API.

#### Order Schema (Database)

| Field | Type | Description |
|---|---|---|
| id | UUID | Primary key |
| userId | String | Who placed the order |
| totalAmount | Int | Total price (sum of item prices × quantities) |
| paymentStatus | String | `"COD"` (cash on delivery) or `"PAID"` (via Razorpay) |
| paymentIntentId | String? | Razorpay order ID (if paid via Razorpay) |
| status | OrderStatus | Current lifecycle status |
| createdAt | DateTime | When the order was placed |

#### Checkout Process (The Core Logic)

The checkout is the most complex operation in the system. Here's exactly what happens:

```javascript
// order.service.js → checkoutOrderService(userId)

// STEP 1: Find the user's active cart
const cart = await prisma.cart.findFirst({
  where: { userId, status: "ACTIVE" },
  include: { items: { include: { product: true } } },
});

if (!cart || cart.items.length === 0) {
  throw new AppError("Cart is Empty");
}

// STEP 2: Start a database transaction
const order = await prisma.$transaction(async (tx) => {

  // 2a: Validate stock for every item & calculate total
  for (const item of cart.items) {
    if (!item.product.isActive) {
      throw new AppError(`${item.product.name} is unavailable`);
    }
    if (item.product.stock < item.quantity) {
      throw new AppError(`Insufficient stock for ${item.product.name}`);
    }
    totalAmount += item.price * item.quantity;
  }

  // 2b: Create the Order record
  const order = await tx.order.create({
    data: { userId, totalAmount, paymentStatus: "COD" },
  });

  // 2c: Create OrderItem records (snapshot of cart items)
  for (const item of cart.items) {
    await tx.orderItem.create({
      data: { orderId: order.id, productId: item.productId, quantity: item.quantity, price: item.price },
    });
  }

  // 2d: Reduce stock for each product
  for (const item of cart.items) {
    await tx.product.update({
      where: { id: item.productId },
      data: { stock: { decrement: item.quantity } },
    });
  }

  // 2e: Mark cart as CHECKED_OUT (no more modifications)
  await tx.cart.update({
    where: { id: cart.id },
    data: { status: "CHECKED_OUT" },
  });

  // 2f: Return the complete order with items
  return tx.order.findUnique({ where: { id: order.id }, include: { items: { include: { product: true } } } });
});
```

#### Why Use a Transaction?

The `$transaction` block ensures **atomicity** — either ALL of these operations succeed, or NONE of them do. Without a transaction:

- Stock could be reduced but the order might fail to create
- The order could be created but stock not reduced (overselling)
- The cart could be closed but items not moved to the order

With a transaction, if any step fails (e.g., insufficient stock on a second validation), the entire operation rolls back to its original state.

#### Order Operations

| Operation | Endpoint | Access | Description |
|---|---|---|---|
| Checkout | `POST /api/orders/checkout` | Authenticated user | Convert cart to order |
| List my orders | `GET /api/orders` | Authenticated user | Paginated list of user's orders (filter by status) |
| Get order | `GET /api/orders/:id` | Authenticated user (owner only) | Single order details |
| Update status | `PUT /api/orders/:id/status` | ADMIN | Update order lifecycle status |

---

### Payment Integration (Razorpay)

**Files:**
- `src/modules/checkout/razorpay.service.js` — (currently commented out; ready for integration)
- `src/webhooks/razorpay.webhook.js` — webhook handler for payment events
- `src/webhooks/server.js` — webhook route registration (not currently mounted in main app)

#### Current State: COD (Cash on Delivery)

By default, the system uses **COD** — when an order is placed via checkout, `paymentStatus` is set to `"COD"`. No actual payment processing happens. This is intentional to keep the project focused on backend logic without requiring payment gateway setup.

#### Razorpay Integration (Ready to Enable)

The Razorpay code is fully written but commented out. The flow would be:

```
1. Client calls POST /api/checkout (Razorpay endpoint)
2. Server calculates cart total, creates a Razorpay order
3. Server returns { orderId, amount, currency, key } to client
4. Client uses Razorpay SDK to show payment form
5. User completes payment on Razorpay
6. Razorpay sends a webhook to /webhooks/razorpay
7. Webhook verifies signature, marks order as PAID, reduces stock, closes cart
```

The webhook handler (`razorpayWebhook`) already implements:
- **Signature verification** using HMAC-SHA256
- **Payment captured** event handling — marks order as PAID, reduces stock, closes cart

To enable, you would:
1. Install and configure the Razorpay SDK
2. Uncomment the code in `razorpay.service.js`
3. Mount the webhook route in the main app
4. Add `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, and `RAZORPAY_WEBHOOK_SECRET` to `.env`

---

## 5. Layered Architecture Explanation

The codebase is organized into distinct layers, each with a clear responsibility:

```
┌─────────────────────────────────────────────────────────────┐
│                     API CALL (HTTP Request)                  │
└────────────────────────────┬────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────┐
│  LAYER 1: MIDDLEWARE                                        │
│  - CORS, Helmet, Rate Limiting, JSON Parsing, Auth, RBAC   │
│  - Cross-cutting concerns applied BEFORE reaching routes    │
└────────────────────────────┬────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────┐
│  LAYER 2: ROUTES                                            │
│  - Define URL patterns and HTTP methods                     │
│  - Chain middleware (authenticate, authorizeRole, validate) │
│  - Map to controller functions                             │
│  - Example: src/modules/products/product.routes.js         │
└────────────────────────────┬────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────┐
│  LAYER 3: CONTROLLERS                                       │
│  - Handle the HTTP request/response cycle                  │
│  - Extract data from req (body, params, query, user)       │
│  - Call service functions                                  │
│  - Format and send HTTP responses                          │
│  - NO business logic — only HTTP orchestration             │
│  - Example: src/modules/products/product.controller.js     │
└────────────────────────────┬────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────┐
│  LAYER 4: SERVICES                                          │
│  - Contains ALL business logic                             │
│  - Database operations via Prisma                          │
│  - Validation, calculations, transactions                  │
│  - Throws AppError for business rule violations            │
│  - NO knowledge of HTTP (no req, res, next)                │
│  - Example: src/modules/products/product.service.js        │
└────────────────────────────┬────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────┐
│  LAYER 5: PRISMA ORM                                        │
│  - Data access layer                                        │
│  - Type-safe queries                                        │
│  - Connection management                                   │
│  - Transaction management                                  │
└────────────────────────────┬────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────┐
│  LAYER 6: POSTGRESQL DATABASE                               │
│  - Persistent storage                                       │
│  - Constraints, relations, indexes                         │
└────────────────────────────┬────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────┐
│  ERROR HANDLING (cross-cutting, final layer)                │
│  - Catches all errors from any layer                       │
│  - Transforms into consistent JSON error responses         │
│  - Handles Prisma-specific errors (P2002, P2025)          │
└─────────────────────────────────────────────────────────────┘
```

### Why This Separation Matters

| Benefit | Explanation |
|---|---|
| **Testability** | Services can be unit-tested without needing HTTP mocks — they're just functions |
| **Maintainability** | Business logic changes stay in services; HTTP changes stay in controllers |
| **Reusability** | Services can be called from controllers, webhooks, or CLI scripts without modification |
| **Clarity** | Each file has one job: routes define URLs, controllers handle HTTP, services handle logic |

### What Each Layer Does NOT Do

| Layer | Does NOT |
|---|---|
| **Controller** | Contains business rules, validates input (delegates to middleware), queries the database directly |
| **Service** | Knows about Express, HTTP status codes, request/response objects |
| **Route** | Contains business logic, database queries, or complex conditionals |

---

## 6. Security Deep Dive

### Security Measures Implemented

```
┌─────────────────────────────────────────────────────────────┐
│                    SECURITY LAYERS                           │
└─────────────────────────────────────────────────────────────┘
                              │
    ┌─────────────────────────▼─────────────────────────────┐
    │  1. HELMET (src/app.js)                               │
    │     Sets secure HTTP headers on every response:       │
    │     - Content-Security-Policy                         │
    │     - X-Content-Type-Options: nosniff                │
    │     - X-Frame-Options: DENY                          │
    │     - Strict-Transport-Security                      │
    │     - And more...                                     │
    └───────────────────────────────────────────────────────┘
                              │
    ┌─────────────────────────▼─────────────────────────────┐
    │  2. RATE LIMITING (src/middleware/rateLimit.middleware.js) │
    │     • Global limiter: 100 requests per 15 minutes     │
    │     • Auth limiter: 10 attempts per 15 minutes        │
    │       (applied to /register and /login)               │
    │     • Prevents brute-force and abuse                  │
    └───────────────────────────────────────────────────────┘
                              │
    ┌─────────────────────────▼─────────────────────────────┐
    │  3. JWT AUTHENTICATION (src/middleware/auth.middleware.js) │
    │     • Stateless — no server-side session storage       │
    │     • Token contains userId + role                     │
    │     • 1-day expiry                                     │
    │     • Verified on every protected route                │
    │     • Bearer token extracted from Authorization header │
    └───────────────────────────────────────────────────────┘
                              │
    ┌─────────────────────────▼─────────────────────────────┐
    │  4. ROLE-BASED AUTHORIZATION (src/middleware/role.middleware.js) │
    │     • Restricts endpoints to specific roles            │
    │     • ADMIN-only: product CRUD, order status updates   │
    │     • Checked AFTER authentication                     │
    └───────────────────────────────────────────────────────┘
                              │
    ┌─────────────────────────▼─────────────────────────────┐
    │  5. PASSWORD SECURITY (src/modules/auth/auth.service.js)  │
    │     • bcrypt with 10 salt rounds                       │
    │     • Passwords NEVER stored in plain text             │
    │     • bcrypt.compare() for constant-time comparison    │
    └───────────────────────────────────────────────────────┘
                              │
    ┌─────────────────────────▼─────────────────────────────┐
    │  6. CORS (src/app.js)                                 │
    │     • Only allows configured origins                   │
    │     • Currently: http://localhost:3000                 │
    │     • Credentials (cookies) allowed                    │
    └───────────────────────────────────────────────────────┘
                              │
    ┌─────────────────────────▼─────────────────────────────┐
    │  7. REQUEST SIZE LIMIT (src/app.js)                   │
    │     • express.json({ limit: "10kb" })                 │
    │     • Prevents large payload attacks                  │
    └───────────────────────────────────────────────────────┘
                              │
    ┌─────────────────────────▼─────────────────────────────┐
    │  8. INPUT VALIDATION (src/middleware/validate.middleware.js) │
    │     • Zod schemas validate every request body/params   │
    │     • Rejects malformed input before it reaches logic  │
    │     • Returns field-level error details                │
    └───────────────────────────────────────────────────────┘
                              │
    ┌─────────────────────────▼─────────────────────────────┐
    │  9. ENVIRONMENT SECRETS (src/config/db.js, etc.)      │
    │     • JWT_SECRET from .env (never hardcoded)          │
    │     • DATABASE_URL from .env                           │
    │     • Never committed to version control               │
    └───────────────────────────────────────────────────────┘
                              │
    ┌─────────────────────────▼─────────────────────────────┐
    │  10. TRUST PROXY (src/app.js)                         │
    │     • app.set("trust proxy", 1)                       │
    │     • Important for deployments behind load balancers  │
    │     • Ensures correct IP detection and HTTPS           │
    └───────────────────────────────────────────────────────┘
```

---

## 7. Validation Strategy

### Zod Schemas

Every endpoint that accepts input uses a **Zod schema** to validate the data before it reaches the controller. Validation happens in the route definition via the `validate` middleware.

**Validation Middleware (`validate.middleware.js`):**

```javascript
export const validate = (schema, property = "body") =>
  (req, res, next) => {
    const result = schema.safeParse(req[property]);
    if (!result.success) {
      return res.status(400).json({
        message: "Validation failed",
        errors: result.error.flatten().fieldErrors,
      });
    }
    req[property] = result.data; // Attach validated/cleaned data to request
    next();
  };
```

### Schema Definitions

#### Auth Schemas (`auth.schema.js`)

```javascript
registerSchema = {
  email:    string, validated as email format
  password: string, minimum 3 characters
}

loginSchema = {
  email:    string, validated as email format
  password: string, minimum 3 characters
}
```

#### Product Schemas (`product.schema.js`)

```javascript
createProductSchema = {
  name:        string, minimum 1 character (required)
  description: string, optional
  price:       integer, must be positive (required)
  stock:       integer, must be non-negative (required)
}

updateProductSchema = createProductSchema.partial()
// All fields optional for partial updates
```

#### Cart Schemas (`cart.schema.js`)

```javascript
addToCartSchema = {
  productId: string, must be a valid UUID (required)
  quantity:  integer, must be positive (required)
}

updateCartItemSchema = {
  quantity: integer, must be positive (required)
}
```

#### Order Schemas (`order.schema.js`)

```javascript
updateOrderStatusSchema = {
  status: enum["PLACED" | "CONFIRMED" | "SHIPPED" | "DELIVERED" | "CANCELLED"] (required)
}
```

### Validation Flow

```
Client Request
  │
  ▼
Route Definition (e.g., router.post("/", validate(schema), controller))
  │
  ▼
validate() middleware
  │
  ├── Schema passes → req.body = cleaned data → call controller
  │
  └── Schema fails → HTTP 400 with field errors → STOP
```

The `safeParse` method from Zod ensures that validation errors don't throw exceptions — they return a structured result that the middleware converts into a proper HTTP response.

---

## 8. Error Handling

### Centralized Error Handler

**File:** `src/middleware/error.middleware.js`

```javascript
export function errorHandler(err, req, res, next) {
  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal Server Error";

  // Handle Prisma-specific errors
  if (err.code === "P2002") {    // Unique constraint violation
    statusCode = 400;
    message = "Duplicate value already exists";
  }
  if (err.code === "P2025") {    // Record not found
    statusCode = 404;
    message = "Resource not found";
  }

  res.status(statusCode).json({
    success: false,
    message,
  });
}
```

### Error Flow

```
Any layer throws an error or calls next(error)
  │
  ▼
Express error-handling middleware (must have 4 parameters)
  │
  ├── AppError (custom) → uses err.statusCode + err.message
  │
  ├── Prisma P2002 → duplicate key → 400
  │
  ├── Prisma P2025 → not found → 404
  │
  └── Unknown error → 500 + "Internal Server Error"
  │
  ▼
Consistent JSON response:
{ "success": false, "message": "..." }
```

### Custom AppError Class

**File:** `src/utils/AppError.js`

```javascript
export class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;  // Distinguishes operational vs. programming errors
  }
}
```

Services throw `AppError` for known business rule violations:

| Service | Example Errors |
|---|---|
| `auth.service.js` | `"User already exists"` (409), `"Invalid Credentials"` (401), `"Invalid Password"` (401) |
| `cart.service.js` | `"Product not available"` (404), `"Insufficient stock"` (400), `"Cart item not found"` (404) |
| `order.service.js` | `"Cart is Empty"`, `"Insufficient stock for X"`, `"X is unavailable"` |
| `product.service.js` | `"Missing required fields"` (400), `"Product not found"` (404) |

---

## 9. API Endpoints Summary

### Base URL: `/api`

```
─────────────────────────────────────────────────────────────────
AUTH
─────────────────────────────────────────────────────────────────
POST   /api/auth/register          Create a new user account
POST   /api/auth/login             Login and receive JWT token
─────────────────────────────────────────────────────────────────
PUBLIC PRODUCT ENDPOINTS
─────────────────────────────────────────────────────────────────
GET    /api/products               List all active products (paginated, filterable)
GET    /api/products/:id           Get a single product by ID
─────────────────────────────────────────────────────────────────
ADMIN PRODUCT ENDPOINTS
─────────────────────────────────────────────────────────────────
POST   /api/products               Create a new product (ADMIN only)
PUT    /api/products/:id           Update a product (ADMIN only)
DELETE /api/products/:id           Soft-delete a product (ADMIN only)
─────────────────────────────────────────────────────────────────
CART ENDPOINTS (all require JWT)
─────────────────────────────────────────────────────────────────
GET    /api/cart                   View or create active cart
POST   /api/cart/add               Add product to cart
PUT    /api/cart/item/:itemId      Update cart item quantity
DELETE /api/cart/item/:itemId      Remove item from cart
─────────────────────────────────────────────────────────────────
ORDER ENDPOINTS (all require JWT)
─────────────────────────────────────────────────────────────────
POST   /api/orders/checkout        Convert cart to order (COD)
GET    /api/orders                 List user's orders (paginated)
GET    /api/orders/:id             Get order details (owner only)
PUT    /api/orders/:id/status      Update order status (ADMIN only)
─────────────────────────────────────────────────────────────────
PROTECTED TEST
─────────────────────────────────────────────────────────────────
GET    /api/protected              Test endpoint — returns JWT user info
─────────────────────────────────────────────────────────────────
```

### Response Format Conventions

**Success responses** vary by endpoint but follow REST conventions:
- `200 OK` — successful GET, PUT
- `201 Created` — successful POST (returns created resource)
- `204 No Content` — successful DELETE (some endpoints return a message instead)

**Error responses** are always:
```json
{
  "success": false,
  "message": "Error description here"
}
```

---

## 10. Environment Variables

Required `.env` file:

```
# Server
PORT=5000

# Database
DATABASE_URL=postgresql://username:password@host:5432/ecommerce_db
DIRECT_URL=postgresql://username:password@host:5432/ecommerce_db

# JWT
JWT_SECRET=your-secure-random-secret-key-at-least-32-characters

# Node environment
NODE_ENV=development

# Razorpay (optional, for payment integration)
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
RAZORPAY_WEBHOOK_SECRET=your_razorpay_webhook_secret
```

| Variable | Required | Description |
|---|---|---|
| `PORT` | No | Server port (default: 5000) |
| `DATABASE_URL` | Yes | PostgreSQL connection string for Prisma |
| `DIRECT_URL` | Yes | Direct connection string (used for migrations) |
| `JWT_SECRET` | Yes | Secret key for signing/verifying JWT tokens |
| `NODE_ENV` | No | `development` or `production` |
| `RAZORPAY_*` | No | Razorpay credentials (only needed if enabling payments) |

---

## 11. Database Models (Prisma Schema)

Full `prisma/schema.prisma`:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}

// ─── User ───────────────────────────────────────────────────────
model User {
  id        String   @id @default(uuid())
  email     String   @unique
  password  String
  role      Role     @default(USER)
  carts     Cart[]
  orders    Order[]
  createdAt DateTime @default(now())
}

// ─── Product ────────────────────────────────────────────────────
model Product {
  id          String    @id @default(uuid())
  name        String
  description String
  price       Int
  stock       Int
  isActive    Boolean   @default(true)
  createdAt   DateTime  @default(now())
  cartItems   CartItem[]
  orderItems  OrderItem[]
}

// ─── Cart ───────────────────────────────────────────────────────
model Cart {
  id        String     @id @default(uuid())
  userId    String
  status    CartStatus @default(ACTIVE)
  user      User       @relation(fields: [userId], references: [id])
  items     CartItem[]
  createdAt DateTime   @default(now())
}

// ─── CartItem ───────────────────────────────────────────────────
model CartItem {
  id        String   @id @default(uuid())
  cartId    String
  productId String
  quantity  Int
  price     Int      // Price snapshot at time of adding to cart

  cart     Cart     @relation(fields: [cartId], references: [id])
  product  Product @relation(fields: [productId], references: [id])

  @@unique([cartId, productId])  // One entry per product per cart
}

// ─── Order ──────────────────────────────────────────────────────
model Order {
  id              String   @id @default(uuid())
  userId          String
  totalAmount     Int
  paymentStatus   String   // "COD" or "PAID"
  paymentIntentId String?  // Razorpay order ID (if paid)
  status          OrderStatus @default(PLACED)
  user            User     @relation(fields: [userId], references: [id])
  createdAt       DateTime @default(now())
  items           OrderItem[]
}

// ─── OrderItem ──────────────────────────────────────────────────
model OrderItem {
  id        String   @id @default(uuid())
  orderId   String
  productId String
  quantity  Int
  price     Int      // Price snapshot at time of checkout
  name      String?  // Product name at time of checkout
  order     Order    @relation(fields: [orderId], references: [id])
  product   Product @relation(fields: [productId], references: [id])
}

// ─── Enums ──────────────────────────────────────────────────────
enum Role {
  USER
  ADMIN
}

enum CartStatus {
  ACTIVE
  CHECKED_OUT
}

enum OrderStatus {
  PLACED
  CONFIRMED
  SHIPPED
  DELIVERED
  CANCELLED
}
```

### Design Decisions in the Schema

| Decision | Rationale |
|---|---|
| **UUID primary keys** | Prevents ID enumeration attacks; globally unique across tables |
| **Price as Int** | Stores currency in smallest unit (e.g., cents) to avoid floating-point precision issues |
| **`isActive` on Product** | Soft delete — preserves data integrity and allows recovery |
| **`price` on CartItem & OrderItem** | Price snapshot — protects against price changes between cart addition and checkout |
| **`@@unique([cartId, productId])`** — CartItem | Prevents duplicate entries; quantity is incremented instead |
| **Enums for status fields** | Type-safe, database-enforced valid values |
| **`paymentIntentId` as optional** | Allows both COD (null) and Razorpay (set) payment flows in the same schema |

---

## 12. Deployment

### Current Deployment (Render)

The project is deployed on **Render** at: `https://e-commerce-api-u1gs.onrender.com/api`

**Deployment setup:**
```
Runtime: Node.js
Build Command: npm install
Start Command: npm start
Environment: Node.js environment variables configured in Render dashboard
Database: Managed PostgreSQL on Render
```

### Deploy Steps

1. **Push code to GitHub**
2. **Create a Web Service on Render** pointing to the repository
3. **Configure environment variables** in Render dashboard:
   - `DATABASE_URL`
   - `DIRECT_URL`
   - `JWT_SECRET`
   - `NODE_ENV=production`
   - `PORT=5000`
4. **Run migrations on the production database:**
   ```bash
   npx prisma migrate deploy
   ```
5. **Render automatically builds and starts the server**

### Why Render?

- Free tier available for hosting
- Managed PostgreSQL integration
- Automatic deployments from Git
- SSL/HTTPS handled automatically

---

## 13. Running Locally

### Prerequisites

- Node.js (v18+)
- PostgreSQL (running locally or via Docker)
- npm

### Step-by-Step

```bash
# 1. Clone and install dependencies
npm install

# 2. Create .env file with your database credentials
#    See Section 10 for required variables

# 3. Generate Prisma client
npx prisma generate

# 4. Run database migrations (creates tables)
npx prisma migrate dev

#    OR if you just want to push the schema without migration files:
#    npx prisma db push

# 5. Seed the database (optional — create an admin user, etc.)

# 6. Start the development server with auto-restart
npm run dev

#    Server starts on http://localhost:5000
#    API docs page: http://localhost:5000/api
```

### Available Scripts

| Script | Command | Description |
|---|---|---|
| `npm run dev` | `nodemon src/server.js` | Development server with auto-restart |
| `npm start` | `node src/server.js` | Production server |
| `npm run build` | `prisma generate` | Generate Prisma client (runs automatically on postinstall) |

### Development Flow

1. Make changes to source files
2. Nodemon automatically restarts the server
3. Test with Postman, curl, or a frontend

### Testing the API

```bash
# Register a user
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Login and get token
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Use the token for protected routes
curl http://localhost:5000/api/protected \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>"
```

---

## 14. Design Decisions & Trade-offs

### Why No Payment Gateway by Default?

Payments are intentionally excluded from the default flow for several reasons:

| Reason | Explanation |
|---|---|
| **Focus on core logic** | The project demonstrates backend engineering skills (auth, RBAC, transactions, validation) without the complexity of payment SDK integration |
| **No verification required** | Payment gateways require business verification, KYC, and live credentials that aren't necessary for a portfolio project |
| **Simplicity** | COD is a valid business model; the code is cleaner and easier to understand |
| **Ready for future integration** | Razorpay code is already written and commented out — can be enabled when credentials are available |
| **Architecture is payment-agnostic** | The `paymentStatus` field and `paymentIntentId` column support any payment provider |

### Why CartItem Has a Unique Constraint on [cartId, productId]?

Instead of allowing duplicate rows for the same product in a cart, the system:
- Finds the existing cart item
- Increments the quantity

This is cleaner, prevents accidental duplicates, and makes cart total calculation straightforward.

### Why Store Price in CartItem and OrderItem?

Prices can change. If you add a product to your cart at $10, then the seller changes the price to $12 before you checkout, you should still pay $10. The stored `price` field on CartItem captures this snapshot. OrderItem captures the price at checkout time.

### Why Prisma Transactions for Checkout?

The checkout process touches 4 different tables (Order, OrderItem, Product, Cart). Without a transaction, a partial failure (e.g., stock reduction succeeds but order creation fails) would leave the database in an inconsistent state. `prisma.$transaction()` ensures all-or-nothing execution.

### Why Soft Delete Products Instead of Hard Delete?

Hard deleting a product would break existing orders that reference it. Soft deleting:
- Hides the product from listings (filtered by `isActive: true`)
- Preserves order history integrity
- Allows the product to be re-activated if needed

### Why JWT Instead of Sessions?

| JWT (chosen) | Sessions |
|---|---|
| Stateless — server doesn't store session data | Server must store session state (memory, Redis, DB) |
| Easy to scale horizontally | Requires session sharing across instances |
| Works well with APIs and mobile apps | Primarily web-focused |
| Built-in expiry | Requires cleanup of expired sessions |

Trade-off: JWT can't be easily revoked before expiry (without a blocklist). For this project's scale, the 1-day expiry is sufficient.

### Why Zod for Validation?

| Benefit | Explanation |
|---|---|
| **Type inference** | Zod schemas can infer TypeScript types (even in plain JS, the validation is clear) |
| **Composable** | Schemas can be combined, extended, and made optional (`.partial()`) |
| **Detailed errors** | `result.error.flatten().fieldErrors` gives field-level error messages |
| **Runtime validation** | Catches bad input before it reaches business logic |

### Directory Structure rationale

```
src/
├── app.js                 # Express app setup (middleware, routes mount)
├── server.js              # Entry point (starts the server)
├── routes.js              # All API route definitions + base route
├── config/
│   └── db.js              # Prisma client singleton
├── middleware/            # Cross-cutting middleware
│   ├── auth.middleware.js
│   ├── error.middleware.js
│   ├── rateLimit.middleware.js
│   ├── role.middleware.js
│   └── validate.middleware.js
├── modules/               # Feature modules (each self-contained)
│   ├── auth/
│   ├── carts/
│   ├── checkout/
│   ├── order/
│   └── products/
├── utils/
│   └── AppError.js        # Custom error class
├── validators/            # Zod schemas for each module
│   ├── auth.schema.js
│   ├── cart.schema.js
│   ├── order.schema.js
│   └── product.schema.js
├── webhooks/              # Third-party webhook handlers
│   ├── razorpay.webhook.js
│   └── server.js
└── public/                # Static files (API docs HTML page)
```

Each module under `src/modules/` follows the same internal pattern:
```
module/
├── module.routes.js       # Route definitions + middleware chain
├── module.controller.js   # HTTP request/response handling
├── module.service.js      # Business logic + database operations
```

This consistency makes it easy to add new modules — just follow the pattern.

---

## Project Structure Visual

```
ecommerce-api/
├── prisma/
│   └── schema.prisma          # Database models & relations
├── public/
│   ├── index.html             # API docs page (served at /api)
│   └── E-commerce backend API promo banner.png
├── src/
│   ├── app.js                 # Express app with all security middleware
│   ├── server.js              # Entry point
│   ├── routes.js              # Top-level route aggregator
│   ├── config/
│   │   └── db.js              # PrismaClient instance
│   ├── middleware/
│   │   ├── auth.middleware.js         # JWT verification
│   │   ├── error.middleware.js        # Central error handler
│   │   ├── rateLimit.middleware.js    # Global + auth rate limiters
│   │   ├── role.middleware.js         # RBAC authorization
│   │   └── validate.middleware.js     # Zod validation wrapper
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── auth.routes.js
│   │   │   ├── auth.controller.js
│   │   │   └── auth.service.js
│   │   ├── carts/
│   │   │   ├── cart.routes.js
│   │   │   ├── cart.controller.js
│   │   │   └── cart.service.js
│   │   ├── checkout/
│   │   │   ├── checkout.routes.js
│   │   │   ├── checkout.controller.js
│   │   │   └── razorpay.service.js   # (commented out)
│   │   ├── order/
│   │   │   ├── order.routes.js
│   │   │   ├── order.controller.js
│   │   │   └── order.service.js
│   │   └── products/
│   │       ├── product.routes.js
│   │       ├── product.controller.js
│   │       └── product.service.js
│   ├── utils/
│   │   └── AppError.js               # Custom error class
│   ├── validators/
│   │   ├── auth.schema.js
│   │   ├── cart.schema.js
│   │   ├── order.schema.js
│   │   └── product.schema.js
│   └── webhooks/
│       ├── razorpay.webhook.js       # Payment webhook handler
│       └── server.js                 # Webhook route (not mounted)
├── .env                              # Environment variables (not committed)
├── package.json
├── README.md                         # This file
└── .gitignore
```

---

## Summary

This e-commerce backend demonstrates a **production-grade API architecture** with:

- ✅ **Layered architecture** — routes, controllers, services, ORM
- ✅ **JWT authentication** — stateless, secure token-based auth
- ✅ **Role-based access control** — USER and ADMIN roles with middleware enforcement
- ✅ **Prisma ORM** — type-safe database access with transaction support
- ✅ **Zod validation** — schema-based input validation at API boundaries
- ✅ **Centralized error handling** — consistent error responses across the app
- ✅ **Transaction-safe checkout** — atomic cart-to-order conversion
- ✅ **Security hardening** — Helmet, rate limiting, CORS, request size limits
- ✅ **Soft deletes** — products preserved for data integrity
- ✅ **Price snapshots** — CartItem and OrderItem store price at time of action
- ✅ **Payment-ready** — Razorpay integration code included and commented out
- ✅ **Deployed** — live on Render with managed PostgreSQL

---

*---

## 📎 Diagrams

### 1. System Architecture

Open `architecture-diagram.drawio` in [draw.io](https://app.diagrams.net/) to view and edit the architecture diagram.

![Architecture Overview](public/E-commerce%20backend%20API%20promo%20banner.png)

### 2. Database ERD

Open the `architecture-diagram.drawio` file and switch to the **Database ERD** tab.

### 3. Checkout Transaction Flow

Open the `architecture-diagram.drawio` file and switch to the **Checkout Transaction Flow** tab.

---

*Built as a portfolio-grade backend project to demonstrate real-world backend engineering skills.**
