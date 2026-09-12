# Storefront Backend

Node, Express, TypeScript, PostgreSQL API for a storefront application.

## Ports

- Backend/server: `3000` by default, or the value of `PORT`
- PostgreSQL: `5432` by default, or the value of `POSTGRES_PORT`

## Environment Variables

Create a `.env` file in the project root before running the app. You can copy the provided `.env.example`.

```bash
cp .env.example .env
```

Required variables:

| Variable | Example | Purpose |
| --- | --- | --- |
| `POSTGRES_HOST` | `127.0.0.1` | PostgreSQL host |
| `POSTGRES_DB` | `storefront` | Development database name |
| `POSTGRES_TEST_DB` | `storefront_test` | Test database name |
| `POSTGRES_USER` | `postgres` | PostgreSQL user |
| `POSTGRES_PASSWORD` | `<strong database password>` | PostgreSQL password |
| `POSTGRES_PORT` | `5432` | PostgreSQL port |
| `BCRYPT_PASSWORD` | `<strong unique password pepper>` | Required password pepper; no default is provided |
| `SALT_ROUNDS` | `10` | bcrypt salt rounds |
| `TOKEN_SECRET` | `<strong unique JWT secret>` | Required JWT signing secret; no default is provided |
| `PORT` | `3000` | Express server port |
| `ENV` | `test` | Optional. Set to `test` to use `POSTGRES_TEST_DB`; otherwise the app uses `POSTGRES_DB`. |
| `DEFAULT_ADMIN_EMAIL` | `admin@example.com` | Optional initial-admin bootstrap email; use only together with `DEFAULT_ADMIN_PASSWORD` |
| `DEFAULT_ADMIN_PASSWORD` | `<strong unique password>` | Optional initial-admin bootstrap password; use only together with `DEFAULT_ADMIN_EMAIL` |

The JWT secret (`TOKEN_SECRET`) and password pepper (`BCRYPT_PASSWORD`) must be explicitly configured. Production secrets must be strong, unique, and supplied through a secret manager or another environment-specific mechanism outside source control. Real credentials must never be committed.

Default admin bootstrap is optional and environment-driven. It runs only when both `DEFAULT_ADMIN_EMAIL` and `DEFAULT_ADMIN_PASSWORD` are configured and no user with that email exists. Startup never resets or replaces an existing administrator's password.

## Install

```bash
npm install
```

Run this command from the project root directory, not the parent `StoreFront` folder.

## Database Setup

The project includes `schema.sql` for table creation. Migration configuration is available via `database.json` for use with `db-migrate` tooling.

### Using db-migrate (Optional)

If you have `db-migrate` installed globally or locally:

```bash
npx db-migrate up
```

### Using schema.sql directly

```bash
psql -U postgres
```

Create the database user and databases:

```sql
CREATE USER storefront_user WITH PASSWORD '<strong unique database password>';
CREATE DATABASE storefront;
CREATE DATABASE storefront_test;
GRANT ALL PRIVILEGES ON DATABASE storefront TO storefront_user;
GRANT ALL PRIVILEGES ON DATABASE storefront_test TO storefront_user;
```

If your PostgreSQL version requires schema privileges after connecting to each database, run:

```sql
\c storefront
GRANT ALL ON SCHEMA public TO storefront_user;

\c storefront_test
GRANT ALL ON SCHEMA public TO storefront_user;
```

Update `.env` if you use this user:

```env
POSTGRES_USER=storefront_user
POSTGRES_PASSWORD=<strong unique database password>
```

Create the development tables:

```bash
psql -U storefront_user -d storefront -f schema.sql
```

Create or reset the test tables:

```bash
psql -U storefront_user -d storefront_test -f schema.sql
```

The test helper also creates tables if they do not exist and truncates tables between tests with:

```sql
TRUNCATE order_products, orders, products, users RESTART IDENTITY CASCADE;
```

## Run the Server

Development server with TypeScript:

```bash
npm run watch
```

Production build:

```bash
npm run build
```

or alternatively:

```bash
npm run tsc
```

Run compiled production build:

```bash
npm start
```

The API root is:

```text
http://localhost:3000
```

Swagger UI is available at:

```text
http://localhost:3000/api-docs
```

## Heroku File Storage Limitation

Profile avatars are currently written to the local `uploads/` directory. A Heroku
dyno's filesystem is ephemeral and is not shared between dynos, so uploaded files
can disappear after a restart, redeploy, or dyno replacement. This storage is
suitable only for temporary files on Heroku. Persistent production avatars require
external object storage; that integration is intentionally outside the current
deployment setup.

## Run Tests

Make sure the test database exists and is reachable. The Jasmine helper sets `ENV=test`, so tests use `POSTGRES_TEST_DB`.

Run this command from the project root directory, not the parent `StoreFront` folder.

```bash
npm test
```

## Authentication

User creation and login return a JWT. Protected endpoints require an `Authorization` header:

```text
Authorization: Bearer <token>
```

Login endpoint:

```http
POST /auth/login
```

Body:

```json
{
  "firstname": "Ada",
  "password": "password123"
}
```

## API Endpoints

### Auth

| Method | Path | Purpose | Body params | JWT required |
| --- | --- | --- | --- | --- |
| `POST` | `/auth/login` | Authenticate a user and return a token | `firstname`, `password` | No |

### Users

| Method | Path | Purpose | Body params | JWT required |
| --- | --- | --- | --- | --- |
| `GET` | `/users` | List users | None | Yes |
| `GET` | `/users/:id` | Get one user | None | Yes |
| `POST` | `/users` | Create user and return a token | `firstname`, `lastname`, `password` | No |
| `PUT` | `/users/:id` | Update user | `firstname`, `lastname`, optional `password` | Yes |
| `DELETE` | `/users/:id` | Delete user | None | Yes |

### Products

| Method | Path | Purpose | Body params | JWT required |
| --- | --- | --- | --- | --- |
| `GET` | `/products` | List products | None | No |
| `GET` | `/products/popular` | List top 5 products by ordered quantity | None | No |
| `GET` | `/products/:id` | Get one product | None | No |
| `POST` | `/products` | Create product | `name`, `price`, optional `category` | Yes |
| `PUT` | `/products/:id` | Update product | `name`, `price`, optional `category` | Yes |
| `DELETE` | `/products/:id` | Delete product | None | Yes |

### Orders

| Method | Path | Purpose | Body params | JWT required |
| --- | --- | --- | --- | --- |
| `GET` | `/orders` | List orders | None | Yes |
| `GET` | `/orders/:id` | Get one order | None | Yes |
| `POST` | `/orders` | Create order | `user_id`, `status` | Yes |
| `PUT` | `/orders/:id` | Update order | `user_id`, `status` | Yes |
| `DELETE` | `/orders/:id` | Delete order | None | Yes |
| `POST` | `/orders/:id/products` | Add a product to an order | `product_id`, `quantity` | Yes |
| `GET` | `/orders/users/:userId/current` | Get active orders for a user | None | Yes |
| `GET` | `/orders/users/:userId/completed` | Get completed orders for a user | None | Yes |

## Database Schema

### `users`

| Column | Type | Key | Required |
| --- | --- | --- | --- |
| `id` | `SERIAL` | Primary key | Yes |
| `firstname` | `VARCHAR(100)` |  | Yes |
| `lastname` | `VARCHAR(100)` |  | Yes |
| `password_digest` | `TEXT` |  | Yes |

### `products`

| Column | Type | Key | Required |
| --- | --- | --- | --- |
| `id` | `SERIAL` | Primary key | Yes |
| `name` | `VARCHAR(100)` |  | Yes |
| `price` | `INTEGER` |  | Yes |
| `category` | `VARCHAR(100)` |  | No |

### `orders`

| Column | Type | Key | Required |
| --- | --- | --- | --- |
| `id` | `SERIAL` | Primary key | Yes |
| `user_id` | `BIGINT` | Foreign key to `users(id)` with `ON DELETE CASCADE` | No explicit `NOT NULL` |
| `status` | `VARCHAR(20)` |  | Yes |

### `order_products`

| Column | Type | Key | Required |
| --- | --- | --- | --- |
| `id` | `SERIAL` | Primary key | Yes |
| `order_id` | `BIGINT` | Foreign key to `orders(id)` with `ON DELETE CASCADE` | No explicit `NOT NULL` |
| `product_id` | `BIGINT` | Foreign key to `products(id)` with `ON DELETE CASCADE` | No explicit `NOT NULL` |
| `quantity` | `INTEGER` |  | Yes |
