# Medical Project PHP Backend

This backend is designed to support both frontend apps in this repository:
- `Medical_Product` (customer app)
- `Admin-Dashboard` (admin app)

## Stack
- PHP 8.1+
- SQLite (default) or MySQL
- Custom lightweight router + controller architecture

## Folder layout
- `public/index.php`: HTTP entrypoint
- `routes/api.php`: API route definitions
- `src/Core`: request/response/router/database/auth helpers
- `src/Controllers`: feature controllers
- `database/schema.sql`: DB schema
- `scripts/init-db.php`: initialize and seed database

## Quick start
1. Copy env file:
   - Windows PowerShell:
   ```powershell
   Copy-Item .env.example .env
   ```
2. Initialize DB:
   ```powershell
   php scripts/init-db.php
   ```
3. Run server:
   ```powershell
   php -c php-mysql-sqlite.ini -S localhost:8000 router.php
   ```

Base API URL: `http://localhost:8000`

## Demo users
- Admin: `admin@medical.local` / `admin123`
- Staff: `staff@medical.local` / `staff123`
- Customer: `customer@medical.local` / `customer123`

## API map for your frontend

### Customer app (`Medical_Product`)
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/products?category=EnglishMedicine&search=para`
- `GET /api/products/{id}`
- `POST /api/orders`
- `GET /api/orders/{id}`
- `POST /api/inquiries`

### Admin dashboard (`Admin-Dashboard`)
- `GET /api/inventory`
- `PATCH /api/inventory/{id}`
- `GET /api/customers?type=customers`
- `POST /api/customers`
- `GET /api/deliveries`
- `PATCH /api/deliveries/{id}`

Note: Admin endpoints require Bearer token from login with `staff` or `admin` role.

## Frontend integration notes
- Replace static lists in:
  - `Medical_Product/src/components/ProductList/ProductList.js`
  - `Admin-Dashboard/src/components/InventoryDashboard/InventoryDashboard.jsx`
  - `Admin-Dashboard/src/components/CustomerManagement/CustomerManagement.jsx`
  - `Admin-Dashboard/src/components/DeliveryTracking/DeliveryTracking.jsx`
- Update `CheckoutPage` to POST real cart + shipping data to `/api/orders`.
- Update `ContactUs` to POST to `/api/inquiries`.

## Example requests

### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "admin@medical.local",
  "password": "admin123"
}
```

### Create order
```http
POST /api/orders
Authorization: Bearer <token>
Content-Type: application/json

{
  "payment_method": "cod",
  "shipping": {
    "fullName": "Aung Kyaw",
    "email": "aung@example.com",
    "phone": "+9591111111",
    "city": "Mandalay",
    "address": "Chan Aye Thar Zan"
  },
  "items": [
    { "product_id": 1, "qty": 2 },
    { "product_id": 7, "qty": 1 }
  ]
}
```
