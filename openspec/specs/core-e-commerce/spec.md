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

---

### Requirement: Fetch single product by ID
The API SHALL expose a GET endpoint to retrieve a single product document by its string `id` field.

#### Scenario: Fetch existing product
- **WHEN** client requests GET `/api/products/[id]` with a valid product `id`
- **THEN** response returns `{ success: true, product: <document> }` with HTTP 200

#### Scenario: Product not found
- **WHEN** client requests GET `/api/products/[id]` with an `id` that does not exist in MongoDB
- **THEN** response returns `{ success: false, error: "Product not found" }` with HTTP 404

---

### Requirement: Create product via API
The system MUST validate required fields server-side before creating a product document in MongoDB. Required fields are: `name`, `category`, `price` (> 0), `originalPrice` (> 0), `workType`, `occasion`, `material`, `description`, `colors` (non-empty array), `images` (non-empty array).

#### Scenario: Create product with all required fields
- **WHEN** client sends POST `/api/products` with all required fields populated and valid
- **THEN** the API creates the document and returns `{ success: true, product: <document> }` with HTTP 200

#### Scenario: Create product with missing required field
- **WHEN** client sends POST `/api/products` with a missing or invalid required field (e.g., `price` is 0 or `name` is empty)
- **THEN** the API returns `{ success: false, error: "<field> is required" }` with HTTP 400 and does NOT write to MongoDB

#### Scenario: Create product - slug auto-generated
- **WHEN** client sends POST `/api/products` without a `slug` field
- **THEN** the API generates a URL-safe slug from `name` and a unique `id` with prefix `flk-`
