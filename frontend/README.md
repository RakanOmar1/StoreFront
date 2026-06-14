# SoleStreet MyStore Frontend

Angular storefront frontend for a shoe e-commerce app. Users can browse products, filter by category/search/price, view product details, add products to a persistent cart, log in, check out, and view an order confirmation page.

## Requirements

- Node.js and npm
- Angular CLI through the local project dependency
- Running StoreFront backend API at:

```text
http://localhost:3000
```

The frontend loads products from the backend endpoint:

```text
GET http://localhost:3000/products
```

Checkout also requires the backend auth and order endpoints.

## Installation

From the `frontend` directory:

```bash
npm install
```

## Launch

Start the backend first from the `backend` directory:

```bash
npm run watch
```

Then start the Angular frontend from the `frontend` directory:

```bash
npm start
```

or:

```bash
npx ng serve
```

Open the app at:

```text
http://localhost:4200
```

## Build

From the `frontend` directory:

```bash
npm run build
```

## Main Routes

- `/products` - product list
- `/products/:id` - product details
- `/cart` - shopping cart
- `/checkout` - checkout form
- `/confirmation` - order confirmation
- `/auth/login` - login
- `/auth/register` - registration
