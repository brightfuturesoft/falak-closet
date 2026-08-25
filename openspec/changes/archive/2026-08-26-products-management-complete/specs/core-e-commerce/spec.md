## ADDED Requirements

### Requirement: Fetch single product by ID
The API SHALL expose a GET endpoint to retrieve a single product document by its string `id` field.

#### Scenario: Fetch existing product
- **WHEN** client requests GET `/api/products/[id]` with a valid product `id`
- **THEN** response returns `{ success: true, product: <document> }` with HTTP 200

#### Scenario: Product not found
- **WHEN** client requests GET `/api/products/[id]` with an `id` that does not exist in MongoDB
- **THEN** response returns `{ success: false, error: "Product not found" }` with HTTP 404

## MODIFIED Requirements

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
