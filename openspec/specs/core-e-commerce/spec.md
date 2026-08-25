## Purpose
Core e-commerce system that manages product catalog, shopping cart, customer checkout, orders, real-time updates via Socket.io, and administrative security (IP blocking) for the Falak Closet clothing brand.

## Requirements

### Requirement: Product Catalog Browsing
The system must expose product data grouped by categories and support filtering, detailed views, and stock availability checks.

#### Scenario: Fetch Categories
- **WHEN** client requests GET `/api/categories`
- **THEN** response returns list of all product categories containing category details, image, and active product count.

#### Scenario: Fetch Products
- **WHEN** client requests GET `/api/products`
- **THEN** response returns list of all products, optionally filtered by category, size, color, occasion, or flash sale tags.

---

### Requirement: Shopping Cart & Checkout
Users must be able to manage items in their cart and place orders.

#### Scenario: Add item to cart
- **WHEN** client adds a product with selected color, size, and quantity to their cart
- **THEN** the cart updates the product reference and quantity, validating stock availability.

#### Scenario: Checkout Order Placement
- **WHEN** client submits checkout form with name, phone, shipping district, address, and cart items
- **THEN** an Order record is created in the database with status `Pending`, stock is decremented, and real-time socket notification is dispatched to the admin dashboard.

---

### Requirement: Administrative Security & IP Blocking
Admin can manage IP address restrictions to block malicious users or spam requests.

#### Scenario: Access from Blocked IP
- **WHEN** incoming request client IP is found in the BlockedIp database
- **THEN** API endpoints or page render requests are rejected with a blocked status or redirect.
