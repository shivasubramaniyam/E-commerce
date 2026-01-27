E-COMMERCE BACKEND API
=====================

This project is a complete, production-ready backend system for an
e-commerce application, built step-by-step using real-world backend
architecture and best practices.

The focus of this project is on clean business logic, scalability,
security, and maintainability. Payments are intentionally excluded
to keep the system lightweight and portfolio-focused.

--------------------------------------------------
TECH STACK
--------------------------------------------------
- Node.js
- Express.js
- PostgreSQL
- Prisma ORM
- JWT Authentication
- Zod (Input Validation)
- bcrypt (Password Hashing)
- Helmet (Security Headers)
- express-rate-limit (Rate Limiting)
- CORS (Access Control)

--------------------------------------------------
ARCHITECTURE OVERVIEW
--------------------------------------------------
- Layered architecture (Routes → Controllers → Services → ORM)
- Centralized error handling
- Transaction-safe checkout logic
- Role-based access control
- Modular feature-based structure

--------------------------------------------------
PROJECT FEATURES
--------------------------------------------------

PHASE 1 – AUTHENTICATION
------------------------
- User registration
- User login
- Password hashing using bcrypt
- JWT generation and verification
- Protected routes using authentication middleware
- Rate-limited login & registration endpoints

Endpoints:
POST   /api/auth/register
POST   /api/auth/login
GET    /api/protected

--------------------------------------------------

PHASE 2 – AUTHORIZATION
-----------------------
- Role-based access control
- Roles: USER, ADMIN
- Middleware-based role authorization

Only ADMIN users can:
- Create products
- Update products
- Delete products
- Update order status

--------------------------------------------------

PHASE 3 – PRODUCT MANAGEMENT
----------------------------
- Create product (ADMIN)
- Update product (ADMIN)
- Soft delete product (ADMIN)
- List all active products (PUBLIC)
- Get product by ID (PUBLIC)
- Pagination, filtering, and sorting

Supported query params:
- page, limit
- minPrice, maxPrice
- inStock
- sortBy, order

Endpoints:
GET    /api/products
GET    /api/products/:id
POST   /api/products        (ADMIN)
PUT    /api/products/:id    (ADMIN)
DELETE /api/products/:id    (ADMIN)

--------------------------------------------------

PHASE 4 – SHOPPING CART
-----------------------
- One active cart per user
- Add product to cart
- Update cart item quantity
- Remove cart item
- View cart
- Stock validation
- Price snapshot stored in cart item

Endpoints:
GET    /api/cart
POST   /api/cart/add
PUT    /api/cart/item/:itemId
DELETE /api/cart/item/:itemId

(All cart routes require JWT authentication)

--------------------------------------------------

PHASE 5 – ORDERS (NO PAYMENT)
------------------------------
Payments are intentionally excluded.

This phase focuses on core commerce logic:
- Cart → Order conversion
- Order items snapshot (price, quantity, product name)
- Atomic checkout using Prisma transactions
- Stock reduction
- Cart marked as CHECKED_OUT
- Order lifecycle management

Order Status Flow:
PLACED → CONFIRMED → SHIPPED → DELIVERED → CANCELLED

Endpoints:
POST /api/orders/checkout
GET  /api/orders
GET  /api/orders/:id
PUT  /api/orders/:id/status   (ADMIN)

--------------------------------------------------
DATABASE MODELS
--------------------------------------------------
- User
- Product
- Cart
- CartItem
- Order
- OrderItem

All relationships and constraints are managed via Prisma ORM.

--------------------------------------------------
VALIDATION & ERROR HANDLING
--------------------------------------------------
- Zod-based input validation at API boundaries
- Centralized error handling using custom AppError class
- Consistent error responses across the application
- No HTTP logic inside services

--------------------------------------------------
SECURITY PRACTICES
--------------------------------------------------
- Passwords stored only as bcrypt hashes
- JWT-based stateless authentication
- Role-based authorization middleware
- Rate limiting on sensitive endpoints
- Helmet security headers
- CORS configuration
- Request size limits
- Soft delete strategy for products

--------------------------------------------------
ENVIRONMENT VARIABLES
--------------------------------------------------

PORT=5000
DATABASE_URL=postgresql://user:password@localhost:5432/ecommerce_db
JWT_SECRET=your_jwt_secret
NODE_ENV=production

--------------------------------------------------
DEPLOYMENT
--------------------------------------------------
- Deployed on Render - https://e-commerce-api-u1gs.onrender.com/api
- Managed PostgreSQL database
- Prisma migrations via `prisma migrate deploy`
- Environment-based configuration
- Production-ready security setup

--------------------------------------------------
HOW TO RUN LOCALLY
--------------------------------------------------

1. Install dependencies:
   npm install

2. Setup .env file

3. Generate Prisma client:
   npx prisma generate

4. Run database migrations:
   npx prisma migrate dev

5. Start the server:
   npm run dev

--------------------------------------------------
WHY NO PAYMENT GATEWAY?
--------------------------------------------------
Payment gateways were intentionally excluded to:
- Avoid unnecessary personal/business verification
- Keep the project focused on core backend logic
- Maintain simplicity and clarity
- Allow easy future integration if required

The architecture is payment-gateway agnostic.

--------------------------------------------------
ARCHITECTURE DIAGRAM
--------------------------------------------------
1.High Level Architecture
                ┌──────────────────────┐
                │   Client / Postman   │
                │ (Frontend optional)  │
                └─────────┬────────────┘
                          │ HTTPS (REST)
                          ▼
                ┌──────────────────────┐
                │   Express API Server │
                │   (Render Cloud)     │
                └─────────┬────────────┘
                          │
        ┌─────────────────┼──────────────────┐
        │                 │                  │
        ▼                 ▼                  ▼
 ┌────────────┐   ┌────────────┐    ┌─────────────┐
 │ Auth Module│   │ Cart Module│    │ Order Module │
 │ JWT + Role │   │ Business   │    │ Checkout     │
 └────────────┘   └────────────┘    └─────────────┘
        │                 │                  │
        └─────────────────┴──────────┬───────┘
                                     ▼
                            ┌──────────────────┐
                            │ Prisma ORM       │
                            │ (Data Access)    │
                            └─────────┬────────┘
                                      ▼
                            ┌──────────────────┐
                            │ PostgreSQL DB    │
                            │ (Render Managed) │
                            └──────────────────┘

2.Request Flow

Client
  │
  │ POST /api/orders/checkout
  │ Authorization: Bearer JWT
  ▼
Authenticate Middleware
  │  ✔ JWT verified
  ▼
Order Controller
  │
  ▼
Order Service
  │
  │ ┌─ Validate Cart
  │ ├─ Validate Stock
  │ ├─ Calculate Total
  │ ├─ Start DB Transaction
  │ ├─ Create Order
  │ ├─ Create Order Items
  │ ├─ Reduce Stock
  │ ├─ Close Cart
  │ └─ Commit Transaction
  ▼
Prisma ORM
  │
  ▼
PostgreSQL
  │
  ▼
Response → Client

--------------------------------------------------
AUTHOR
--------------------------------------------------
SHIVA SUBRAMANIYAM S

Built as a portfolio-grade backend project to demonstrate
real-world backend engineering skills.

--------------------------------------------------
