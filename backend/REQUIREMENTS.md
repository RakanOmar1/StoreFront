# API Requirements

The Storefront Backend API supports browsing products, managing users, creating orders, and adding products to orders. The implemented API uses Express, PostgreSQL, bcrypt password hashing, and JWT authentication.

## Technical Requirements

- Backend/server port: `3000` by default, configurable with `PORT`
- PostgreSQL port: `5432` by default, configurable with `POSTGRES_PORT`
- PostgreSQL development database: `POSTGRES_DB`, example `storefront`
- PostgreSQL test database: `POSTGRES_TEST_DB`, example `storefront_test`
- Required `.env` file: create one in the project root from `.env.example`
- Swagger API docs: `http://localhost:3000/api-docs`

Required environment variables:

| Variable | Example |
| --- | --- |
| `POSTGRES_HOST` | `127.0.0.1` |
| `POSTGRES_DB` | `storefront` |
| `POSTGRES_TEST_DB` | `storefront_test` |
| `POSTGRES_USER` | `postgres` |
| `POSTGRES_PASSWORD` | `0000` |
| `POSTGRES_PORT` | `5432` |
| `BCRYPT_PASSWORD` | `storefront_pepper` |
| `SALT_ROUNDS` | `10` |
| `TOKEN_SECRET` | `storefront_secret` |
| `PORT` | `3000` |
| `ENV` | `test` when running tests |

## Setup Commands

Install packages:

```bash
npm install
```

Build TypeScript:

```bash
npm run build
```

or alternatively:

```bash
npm run tsc
```

Run in development:

```bash
npm run watch
```

Run compiled app:

```bash
npm start
```

Run tests:

```bash
npm test
```

Create PostgreSQL user and databases:

```sql
CREATE USER storefront_user WITH PASSWORD '0000';
CREATE DATABASE storefront;
CREATE DATABASE storefront_test;
GRANT ALL PRIVILEGES ON DATABASE storefront TO storefront_user;
GRANT ALL PRIVILEGES ON DATABASE storefront_test TO storefront_user;
```

Create tables from the schema file:

```bash
psql -U storefront_user -d storefront -f schema.sql
psql -U storefront_user -d storefront_test -f schema.sql
```

Alternatively, use `db-migrate` with the provided `database.json` configuration:

```bash
npx db-migrate up
npx db-migrate down
```

The project includes a `migrations/` folder for db-migrate. The actual table definition source is still `schema.sql`, and the test helper mirrors the same schema.

## Authentication

JWTs are generated when a user is created or logs in. Protected endpoints require:

```text
Authorization: Bearer <token>
```

The auth middleware also accepts a raw token value, but the documented and expected format is `Bearer <token>`.

## Database Schema

### `users`

| Column | Type | Key | Nullable |
| --- | --- | --- | --- |
| `id` | `SERIAL` | Primary key | No |
| `firstname` | `VARCHAR(100)` |  | No |
| `lastname` | `VARCHAR(100)` |  | No |
| `password_digest` | `TEXT` |  | No |

### `products`

| Column | Type | Key | Nullable |
| --- | --- | --- | --- |
| `id` | `SERIAL` | Primary key | No |
| `name` | `VARCHAR(100)` |  | No |
| `price` | `INTEGER` |  | No |
| `category` | `VARCHAR(100)` |  | Yes |

### `orders`

| Column | Type | Key | Nullable |
| --- | --- | --- | --- |
| `id` | `SERIAL` | Primary key | No |
| `user_id` | `BIGINT` | Foreign key to `users(id)` with `ON DELETE CASCADE` | Yes, no `NOT NULL` constraint |
| `status` | `VARCHAR(20)` |  | No |

### `order_products`

| Column | Type | Key | Nullable |
| --- | --- | --- | --- |
| `id` | `SERIAL` | Primary key | No |
| `order_id` | `BIGINT` | Foreign key to `orders(id)` with `ON DELETE CASCADE` | Yes, no `NOT NULL` constraint |
| `product_id` | `BIGINT` | Foreign key to `products(id)` with `ON DELETE CASCADE` | Yes, no `NOT NULL` constraint |
| `quantity` | `INTEGER` |  | No |

## Data Shapes

### Product

```ts
{
  id?: number
  name: string
  price: number
  category?: string
}
```

### User

```ts
{
  id?: number
  firstname: string
  lastname: string
  password?: string
}
```

API responses return public users without `password` or `password_digest`.

### Order

```ts
{
  id?: number
  user_id: number
  status: 'active' | 'complete'
}
```

### Order Product

```ts
{
  id?: number
  order_id: number
  product_id: number
  quantity: number
}
```

## API Endpoints

### Auth

| Method | Path | Purpose | Required body params | JWT required |
| --- | --- | --- | --- | --- |
| `POST` | `/auth/login` | Authenticate user and return `{ user, token }` | `firstname`, `password` | No |

### Products

| Method | Path | Purpose | Required body params | JWT required |
| --- | --- | --- | --- | --- |
| `GET` | `/products` | Product index | None | No |
| `GET` | `/products/:id` | Product show | None | No |
| `GET` | `/products/popular` | Top 5 products by ordered quantity | None | No |
| `POST` | `/products` | Create product | `name`, `price`; `category` optional | Yes |
| `PUT` | `/products/:id` | Update product | `name`, `price`; `category` optional | Yes |
| `DELETE` | `/products/:id` | Delete product | None | Yes |

### Users

| Method | Path | Purpose | Required body params | JWT required |
| --- | --- | --- | --- | --- |
| `GET` | `/users` | User index | None | Yes |
| `GET` | `/users/:id` | User show | None | Yes |
| `POST` | `/users` | Create user and return `{ user, token }` | `firstname`, `lastname`, `password` | No |
| `PUT` | `/users/:id` | Update user | `firstname`, `lastname`; `password` optional | Yes |
| `DELETE` | `/users/:id` | Delete user | None | Yes |

### Orders

| Method | Path | Purpose | Required body params | JWT required |
| --- | --- | --- | --- | --- |
| `GET` | `/orders` | Order index | None | Yes |
| `GET` | `/orders/:id` | Order show | None | Yes |
| `POST` | `/orders` | Create order | `user_id`, `status` | Yes |
| `PUT` | `/orders/:id` | Update order | `user_id`, `status` | Yes |
| `DELETE` | `/orders/:id` | Delete order | None | Yes |
| `POST` | `/orders/:id/products` | Add product to an order | `product_id`, `quantity` | Yes |
| `GET` | `/orders/users/:userId/current` | Current active orders by user | None | Yes |
| `GET` | `/orders/users/:userId/completed` | Completed orders by user | None | Yes |

## Required Features Implemented

- Product index and show endpoints are public.
- Product create, update, and delete endpoints require JWT authentication.
- User index, show, update, and delete endpoints require JWT authentication.
- User creation is public and returns a JWT.
- Login is available through `POST /auth/login`.
- Order endpoints require JWT authentication.
- Passwords are stored as bcrypt hashes in `users.password_digest`.
- Popular products endpoint returns up to 5 products ordered by total quantity in `order_products`.
