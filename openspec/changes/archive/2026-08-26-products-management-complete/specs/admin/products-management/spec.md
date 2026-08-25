## Purpose

Provides the admin panel with a complete product CRUD lifecycle — create, read, update, and delete — backed by validated API endpoints, a multi-step form wizard, inline flag controls, and bulk-delete, enabling store admins to fully manage the product catalog without touching the database directly.

## ADDED Requirements

### Requirement: Admin can create a new product via form wizard
The system SHALL present a multi-step form modal covering basic info, pricing, color variations with image URLs, and care/feature text. On submission, the system SHALL validate all required fields client-side before sending the request.

#### Scenario: Successful product creation
- **WHEN** admin fills in all required fields (name, category, price > 0, originalPrice > 0, at least one color variation with at least one image URL) and submits the form
- **THEN** the system sends POST `/api/products` with the full payload, the API creates a MongoDB document, and the `ProductsTab` list immediately reflects the new product

#### Scenario: Validation prevents incomplete submissions
- **WHEN** admin tries to submit the form with a required field empty (e.g., name blank or price = 0)
- **THEN** the form displays inline error messages per field and does NOT call the API

#### Scenario: discountPercentage auto-calculated
- **WHEN** admin sets `price` and `originalPrice` in the pricing step
- **THEN** `discountPercentage` is computed as `Math.round((1 - price / originalPrice) * 100)` and stored on save; admin does not need to enter it manually

### Requirement: Admin can set featured flags on a product
The system SHALL allow admins to toggle `isNewArrival`, `isBestSeller`, and `isFlashSale` flags both inside the form wizard and inline in the ProductsTab table row.

#### Scenario: Flags set via form wizard
- **WHEN** admin opens the form (create or edit) and toggles any featured flag
- **THEN** the saved product document reflects the new flag value

#### Scenario: Inline flag toggle in ProductsTab
- **WHEN** admin clicks a flag toggle icon in the ProductsTab table row
- **THEN** the system sends PUT `/api/products/[id]` with only the changed flag field, and the table row icon updates immediately without a page reload

### Requirement: Admin can edit an existing product
The system SHALL load the current product data into the form wizard when an "Edit" action is triggered, pre-populating all fields.

#### Scenario: Edit opens with existing data
- **WHEN** admin clicks "Edit" on a product row
- **THEN** the form modal opens pre-filled with that product's current field values, including all color variations, images, sizes, flags, and text fields

#### Scenario: Successful product update
- **WHEN** admin modifies one or more fields and saves
- **THEN** the system sends PUT `/api/products/[id]` with the full updated payload, the API updates the MongoDB document, and the ProductsTab list reflects the change

### Requirement: Admin can delete a product
The system SHALL support single-product delete and bulk-delete of selected products.

#### Scenario: Single delete with confirmation
- **WHEN** admin clicks the delete icon on a product row and confirms the dialog
- **THEN** the system sends DELETE `/api/products/[id]`, the document is removed from MongoDB, and the product disappears from the table

#### Scenario: Bulk delete
- **WHEN** admin selects multiple products via checkbox and clicks "Delete Selected"
- **THEN** the system sends DELETE requests for each selected product ID, all selected products are removed from MongoDB, and the table updates to reflect removals

### Requirement: Admin can fetch a single product by ID
The system SHALL expose GET `/api/products/[id]` to retrieve a single product record.

#### Scenario: Successful single product fetch
- **WHEN** client sends GET `/api/products/[id]`
- **THEN** the API returns the matching product document; if not found, it returns 404 with `{ success: false, error: "Product not found" }`
