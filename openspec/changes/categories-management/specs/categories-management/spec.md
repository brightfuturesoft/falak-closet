## Purpose

Provides dynamic, database-backed categories and subcategories taxonomy management, enabling admin CRUD controls, DB seeding, and comprehensive product filtering on the storefront.

## ADDED Requirements

### Requirement: Admin Category CRUD Operations
The system MUST allow authenticated administrative users to perform full CRUD operations on categories and subcategories through API endpoints, persisting the changes to the database.

#### Scenario: Create Main Category
- **WHEN** client sends a POST request to `/api/categories` with a name, unique slug, description, and featured status
- **THEN** the system MUST create and save a new category document in MongoDB and return the created category details.

#### Scenario: Create Subcategory
- **WHEN** client sends a POST request to `/api/categories` with action `create_subcategory`, a parent category ID, name, unique slug, and description
- **THEN** the system MUST insert the new subcategory item into the parent category's subcategories array in the database.

#### Scenario: Update Category
- **WHEN** client sends a PUT request to `/api/categories` with a category ID, name, slug, description, and featured status
- **THEN** the system MUST update the fields of the matching category document in MongoDB and return the updated category.

#### Scenario: Update Subcategory
- **WHEN** client sends a PUT request to `/api/categories` with isSubcategory set to true, a subcategory ID, name, slug, and description
- **THEN** the system MUST update the properties of the matching subcategory item within its parent category document in the database.

#### Scenario: Delete Category
- **WHEN** client sends a DELETE request to `/api/categories` with a category ID
- **THEN** the system MUST remove the corresponding category document from the database.

#### Scenario: Delete Subcategory
- **WHEN** client sends a DELETE request to `/api/categories` with a subcategory ID and isSubcategory set to true
- **THEN** the system MUST pull and remove the matching subcategory item from its parent category's subcategories array in the database.

### Requirement: Database Seeding
The system MUST support database seeding to initialize the categories collection with the default boutique taxonomy when the seed API is triggered.

#### Scenario: Seed Categories and Subcategories
- **WHEN** client sends a POST request to `/api/seed`
- **THEN** the system MUST delete existing category documents and seed the collection with the initial category taxonomy array, while keeping product counts calculated dynamically.

### Requirement: Storefront Catalog Product Filtering
The storefront catalog MUST support querying and filtering products dynamically based on main category and subcategory slug criteria.

#### Scenario: Filter Products by Category and Subcategory
- **WHEN** client requests GET `/api/products` or page `/shop` with category and subCategory URL query parameters
- **THEN** the system MUST return only products matching the requested category name/slug and subcategory name/slug.
