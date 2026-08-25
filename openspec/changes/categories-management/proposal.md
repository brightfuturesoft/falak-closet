## Why

The current categories management implementation relies on an in-memory/localStorage-backed taxonomy that is volatile, inconsistent across client/server sessions, and lacks persistence on server restarts. Building a persistent, database-backed categories system is essential for maintaining accurate, real-time product filters on the storefront (/shop) and enabling comprehensive category CRUD operations for administrators.

## What Changes

- **Database-Backed Category Schema**: Create a `Category` mongoose model in MongoDB supporting custom slugs, descriptions, icons, featured status, and subcategories.
- **Extended Product Schema**: Add `subCategory` field to the Mongoose Product model to support fine-grained subcategory associations.
- **RESTful Category APIs**: Update `/api/categories` to support full database-backed CRUD actions: listing, creating, updating, and deleting categories and subcategories.
- **Database Seeding Integration**: Update the database seed API (`/api/seed`) to reset and pre-populate the categories collection with the default boutique taxonomy.
- **Enhanced Storefront Catalog Filtering**: Update the `/shop` page logic to fetch dynamic categories from the API, supporting filtering by both main categories and subcategories.
- **Admin Category Controls**: Polish and verify frontend category management operations within the admin panel categories tab, syncing edits via the categories API.

## Capabilities

### New Capabilities
- `categories-management`: Admin CRUD management of categories and subcategories, API routes integration, database persistence, and dynamic filtering on the shop catalog page.

### Modified Capabilities
- `core-e-commerce`: Update catalog browsing requirements to fetch category taxonomies and product count stats dynamically from the database instead of static/in-memory datasets.

## Impact

- **Database**: Introduce a new `categories` collection in MongoDB; extend the `products` schema with `subCategory`.
- **Backend APIs**: Modify `/api/categories` GET/POST/PUT/DELETE endpoints to operate on MongoDB. Modify `/api/seed` to seed category data.
- **Frontend Components**: Update `CategoriesTab.tsx` and `ShopClient.tsx` to handle dynamic API categories, subcategory structures, and updated filtering query parameters.
