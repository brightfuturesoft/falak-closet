## MODIFIED Requirements

### Requirement: Product Catalog Browsing
The system must expose product data grouped by categories and support filtering, detailed views, and stock availability checks.

#### Scenario: Fetch Categories
- **WHEN** client requests GET `/api/categories`
- **THEN** response returns list of all product categories containing category details, image, and active product count.

#### Scenario: Fetch Products
- **WHEN** client requests GET `/api/products`
- **THEN** response returns list of all products, optionally filtered by category, subCategory, size, color, occasion, or flash sale tags.
