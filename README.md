# Storefront

## Project Overview

Storefront is a full-stack e-commerce application for a shoe store called SoleStreet. The Angular frontend provides the shopping experience, while the Node/Express backend exposes a PostgreSQL-backed REST API with JWT authentication.

Users can:

- Browse products
- View product details
- Add products to a shopping cart
- Update cart quantities
- Checkout using a validated form
- View an order confirmation page
- Register, log in, and use protected checkout/order features

## Tech Stack

- Angular 17.3
- TypeScript
- Node.js
- Express
- PostgreSQL
- JWT Authentication
- bcrypt
- pg
- RxJS
- Angular Router
- Angular Forms and Reactive Forms
- Swagger UI
- Jasmine / Karma / Supertest

## Architecture

### Frontend

The frontend is an Angular application located in the `frontend` directory.

- Frontend port: `4200`
- Frontend URL: `http://localhost:4200`
- Angular version: `17.3.x`
- API URL used by Angular: `http://localhost:3000`

Main frontend routes:

| Route | Description |
| --- | --- |
| `/products` | Product list |
| `/products/:id` | Product details |
| `/cart` | Shopping cart |
| `/checkout` | Checkout form |
| `/confirmation` | Order confirmation |
| `/auth/login` | Login |
| `/auth/register` | Register |

The root route `/` redirects to `/products`.

### Backend

The backend is a Node/Express API located in the `backend` directory.

- Backend port: `3000` by default, or the value of `PORT`
- API base URL: `http://localhost:3000`
- Swagger URL: `http://localhost:3000/api-docs`
- Database: PostgreSQL
- Development database name: `storefront`
- Test database name: `storefront_test`

## Prerequisites

- Node.js and npm
- PostgreSQL
- A running PostgreSQL server on port `5432`, or the port configured in `POSTGRES_PORT`

The project uses local npm dependencies, so the Angular CLI and TypeScript tooling are installed through `npm install`.

## Installation

### Backend Setup

From the project root:

```bash
cd backend
npm install
```

Create a `.env` file in `backend`. You can copy the provided example:

```bash
cp .env.example .env
```

Required backend environment variables:

| Variable | Example | Purpose |
| --- | --- | --- |
| `POSTGRES_HOST` | `127.0.0.1` | PostgreSQL host |
| `POSTGRES_DB` | `storefront` | Development database |
| `POSTGRES_TEST_DB` | `storefront_test` | Test database |
| `POSTGRES_USER` | `postgres` | PostgreSQL user |
| `POSTGRES_PASSWORD` | `0000` | PostgreSQL password |
| `POSTGRES_PORT` | `5432` | PostgreSQL port |
| `BCRYPT_PASSWORD` | `storefront_pepper` | Password hashing pepper |
| `SALT_ROUNDS` | `10` | bcrypt salt rounds |
| `TOKEN_SECRET` | `storefront_secret` | JWT signing secret |
| `PORT` | `3000` | Backend server port |
| `ENV` | `test` | Optional. Set to `test` to use `POSTGRES_TEST_DB` |

Create the databases and database user as needed:

```sql
CREATE USER storefront_user WITH PASSWORD '0000';
CREATE DATABASE storefront;
CREATE DATABASE storefront_test;
GRANT ALL PRIVILEGES ON DATABASE storefront TO storefront_user;
GRANT ALL PRIVILEGES ON DATABASE storefront_test TO storefront_user;
```

If your PostgreSQL version requires schema privileges, connect to each database and grant schema access:

```sql
\c storefront
GRANT ALL ON SCHEMA public TO storefront_user;

\c storefront_test
GRANT ALL ON SCHEMA public TO storefront_user;
```

If you use `storefront_user`, update `backend/.env`:

```env
POSTGRES_USER=storefront_user
POSTGRES_PASSWORD=0000
```

Create the development tables:

```bash
psql -U storefront_user -d storefront -f schema.sql
```

Create the test tables:

```bash
psql -U storefront_user -d storefront_test -f schema.sql
```

Migration configuration is also available through `backend/database.json`. If you prefer `db-migrate`, run:

```bash
npx db-migrate up
```

Product data is stored in the PostgreSQL `products` table. This project does not use a frontend `data.json` file for products.

### Frontend Setup

From the project root:

```bash
cd frontend
npm install
```

The frontend API URL is configured in:

```text
frontend/src/environments/environment.ts
```

Current API URL:

```text
http://localhost:3000
```

## Running the Application

Start the backend first.

### Start Backend

From the `backend` directory:

```bash
npm run watch
```

The backend starts on:

```text
http://localhost:3000
```

### Start Frontend

From the `frontend` directory:

```bash
npm start
```

This runs:

```bash
ng serve
```

The frontend starts on:

```text
http://localhost:4200
```

### Access URLs

| App | URL |
| --- | --- |
| Frontend | `http://localhost:4200` |
| Backend API | `http://localhost:3000` |
| Swagger UI | `http://localhost:3000/api-docs` |

## Authentication

The backend supports registration and login using JWT authentication.

- Register: `POST /users`
- Login: `POST /auth/login`
- Protected routes require an `Authorization` header:

```text
Authorization: Bearer <token>
```

The frontend stores the JWT in `localStorage` and attaches it to API requests through an Angular HTTP interceptor. The checkout route is protected by an Angular auth guard.

## Features

- Product catalog
- Product details page
- Product images with frontend fallback images
- Product descriptions with frontend fallback descriptions
- Shopping cart
- Cart quantity updates
- Cart item removal
- Cart total calculation
- Cart persistence in `localStorage`
- Cart item count badge
- Checkout form with validation
- Order confirmation page
- Login and registration
- JWT-protected checkout
- Backend order creation
- Search filter
- Category filter
- Price range filter
- Swagger API documentation

## API Endpoints

Base URL:

```text
http://localhost:3000
```

### Auth

| Method | Endpoint | Description | Auth Required |
| --- | --- | --- | --- |
| `POST` | `/auth/login` | Log in and receive a JWT | No |

### Users

| Method | Endpoint | Description | Auth Required |
| --- | --- | --- | --- |
| `GET` | `/users` | List users | Yes |
| `GET` | `/users/:id` | Get one user | Yes |
| `POST` | `/users` | Register a user and receive a JWT | No |
| `PUT` | `/users/:id` | Update a user | Yes |
| `DELETE` | `/users/:id` | Delete a user | Yes |

### Products

| Method | Endpoint | Description | Auth Required |
| --- | --- | --- | --- |
| `GET` | `/products` | List products | No |
| `GET` | `/products/popular` | List top products by ordered quantity | No |
| `GET` | `/products/:id` | Get one product | No |
| `POST` | `/products` | Create a product | Yes |
| `PUT` | `/products/:id` | Update a product | Yes |
| `DELETE` | `/products/:id` | Delete a product | Yes |

### Orders

| Method | Endpoint | Description | Auth Required |
| --- | --- | --- | --- |
| `GET` | `/orders` | List orders | Yes |
| `GET` | `/orders/:id` | Get one order | Yes |
| `POST` | `/orders` | Create an order | Yes |
| `PUT` | `/orders/:id` | Update an order | Yes |
| `DELETE` | `/orders/:id` | Delete an order | Yes |
| `POST` | `/orders/:id/products` | Add a product to an order | Yes |
| `GET` | `/orders/users/:userId/current` | Get active orders for a user | Yes |
| `GET` | `/orders/users/:userId/completed` | Get completed orders for a user | Yes |

## Build

### Backend Build

From the `backend` directory:

```bash
npm run build
```

Run the compiled backend:

```bash
npm start
```

### Frontend Build

From the `frontend` directory:

```bash
npm run build
```

The Angular production build is written to:

```text
frontend/dist/frontend
```

## Testing

### Backend Tests

From the `backend` directory:

```bash
npm test
```

The backend tests use Jasmine and the `storefront_test` database.

### Frontend Tests

From the `frontend` directory:

```bash
npm test
```

The frontend test script uses Angular's Karma/Jasmine test runner.

## Submission Notes

- Start PostgreSQL before running the backend.
- Start the backend before running the frontend.
- The frontend requires the backend API at `http://localhost:3000`.
- The backend requires a PostgreSQL database with the schema from `backend/schema.sql`.
- Products are loaded from the backend API, not from a frontend `data.json` file.
- Product records must exist in the PostgreSQL `products` table for the frontend catalog to display products.
- Swagger documentation is available at `http://localhost:3000/api-docs`.

Recommended reviewer startup order:

```bash
cd backend
npm install
npm run watch
```

In a second terminal:

```bash
cd frontend
npm install
npm start
```

Then open:

```text
http://localhost:4200
```
