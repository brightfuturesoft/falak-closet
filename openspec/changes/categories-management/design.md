## Context

The system has an existing MongoDB backend via Mongoose but keeps the category taxonomy in-memory on the server and client-side (via localStorage fallback). See `proposal.md` for motivation. We must implement database persistence for categories, update product references, and align storefront and admin query operations.

## Goals / Non-Goals

**Goals:**
- Implement a Mongoose Category model to store category and subcategory definitions.
- Transition `/api/categories` to database queries.
- Support seeding categories via `/api/seed`.
- Update the `/shop` catalog to query dynamic categories and calculate active product counts from MongoDB.

**Non-Goals:**
- Overhauling the general ecommerce checkout flow.
- Modifying other static tables (such as materials or work types).

## Decisions

### 1. Embedded Subcategories Schema
We will embed subcategories directly inside the main Category document as a subdocument array.
- **Rationale**: A boutique clothing website has a shallow, stable taxonomy (approx. 6 categories, 5 subcategories each). Embedding avoids join queries, allows quick loading of the entire taxonomy tree in a single query, and matches the existing `Category` typescript interface.
- **Alternative considered**: A separate `SubCategory` collection with `parentCategoryId` references. This was rejected due to unnecessary document complexity and joins.

### 2. String References in Products
We will keep `category` and `subCategory` as strings in the `Product` model.
- **Rationale**: The existing codebase uses string names/slugs for filtering and UI rendering. Using string references avoids breaking existing views or requiring complex Mongoose populate/lookup operations.
- **Alternative considered**: Using `Schema.Types.ObjectId` references. This would require substantial migrations across the entire product catalog data structure and frontend UI.

### 3. Dynamic Product Counts in Category Listing
When returning categories from `GET /api/categories`, the system will dynamically compute product counts from MongoDB.
- **Rationale**: Admin updates (e.g. adding a new product or changing a category) must reflect immediately in category counts.
- **Alternative considered**: Storing a cache counter in the Category document. This is error-prone and requires atomic increment/decrement hooks on product CRUD.

## Risks / Trade-offs

- **[Risk]**: LocalStorage-saved categories out of sync with Database.
- **[Mitigation]**: Client components will actively fetch `/api/categories` and overwrite any local cache, relying on localStorage only as a brief fallback.
