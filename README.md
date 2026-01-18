E-COMMERCE BACKEND API
=====================

This project is a complete backend system for an e-commerce application,
built step-by-step with real-world architecture and best practices.

It covers authentication, authorization, product management, shopping cart,
and payment integration (India-ready using Razorpay).

--------------------------------------------------
TECH STACK
--------------------------------------------------
- Node.js
- Express.js
- PostgreSQL
- Prisma ORM
- JWT Authentication
- Razorpay Payment Gateway
- bcrypt (password hashing)

--------------------------------------------------
PROJECT FEATURES
--------------------------------------------------

PHASE 1 – AUTHENTICATION
------------------------
- User registration
- User login
- Password hashing using bcrypt
- JWT generation and verification
- Protected routes using middleware

Endpoints:
POST   /api/auth/register
POST   /api/auth/login
GET    /api/protected

--------------------------------------------------

PHASE 2 – AUTHORIZATION
-----------------------
- Role-based access control
- Roles: USER, ADMIN
- Middleware-based authorization

Only ADMIN users can:
- Create products
- Update products
- Delete products

--------------------------------------------------

PHASE 3 – PRODUCT MANAGEMENT
----------------------------
- Create product (ADMIN)
- Update product (ADMIN)
- Delete product (soft delete)
- List all active products (PUBLIC)
- Get product by ID (PUBLIC)

Endpoints:
GET    /api/products
GET    /api/products/:id
POST   /api/products        (ADMIN)
PUT    /api/products/:id    (ADMIN)
DELETE /api/products/:id    (ADMIN)

--------------------------------------------------

PHASE 4 – SHOPPING CART
-----------------------
- Each user has one active cart
- Add product to cart
- Update cart item quantity
- Remove cart item
- View cart
- Stock validation before adding items

Endpoints:
GET    /api/cart
POST   /api/cart/add
PUT    /api/cart/item/:itemId
DELETE /api/cart/item/:itemId

(All cart routes require JWT authentication)

--------------------------------------------------

PHASE 5 – PAYMENTS (INDIA-READY)
--------------------------------
Stripe is invite-only in India, so Razorpay is used.

Features:
- Secure backend-controlled checkout
- Razorpay order creation
- Webhook-based payment verification
- Order creation and tracking
- Stock reduction after payment
- Cart marked as CHECKED_OUT after success

Endpoints:
POST /api/checkout
POST /webhooks/razorpay

--------------------------------------------------
DATABASE MODELS
--------------------------------------------------
- User
- Product
- Cart
- CartItem
- Order

Relationships handled using Prisma ORM.

--------------------------------------------------
ENVIRONMENT VARIABLES
--------------------------------------------------

PORT=5000
DATABASE_URL=postgresql://user:password@localhost:5432/ecommerce_db
JWT_SECRET=your_jwt_secret

RAZORPAY_KEY_ID=rzp_test_xxxxx
RAZORPAY_KEY_SECRET=xxxxx
RAZORPAY_WEBHOOK_SECRET=whsec_xxxxx

--------------------------------------------------
SECURITY PRACTICES
--------------------------------------------------
- Passwords stored only as bcrypt hashes
- JWT-based stateless authentication
- Role-based authorization middleware
- Backend-calculated prices (no frontend trust)
- Webhook signature verification for payments
- Soft delete for products

--------------------------------------------------
HOW TO RUN LOCALLY
--------------------------------------------------

1. Install dependencies:
   npm install

2. Setup .env file

3. Run Prisma:
   npx prisma generate
   npx prisma migrate dev

4. Start server:
   npm run dev

--------------------------------------------------
AUTHOR : SHIVA SUBRAMANIYAM S
--------------------------------------------------
Built as a learning + portfolio project to demonstrate
real-world backend engineering skills.

--------------------------------------------------
