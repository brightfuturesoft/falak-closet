## 1. Database Schema

- [x] 1.1 Create the Mongoose category schema and model in `src/models/Category.ts` defining subcategory schema structure.
- [x] 1.2 Update the product schema `src/models/Product.ts` to add the `subCategory` field.

## 2. API Routes

- [x] 2.1 Update `/api/categories` GET handler to fetch categories and subcategories from MongoDB and dynamically calculate product counts.
- [x] 2.2 Update `/api/categories` POST/PUT/DELETE handlers to write changes directly to the MongoDB collections.
- [x] 2.3 Update `/api/seed` POST handler to clear existing categories and seed from `INITIAL_CATEGORIES` taxonomy.
- [x] 2.4 Verify product route controllers handle the product `subCategory` field in POST/PUT operations.

## 3. Frontend Integration

- [x] 3.1 Update admin `CategoriesTab.tsx` to handle dynamic API operations instead of falling back to client-side localStorage.
- [x] 3.2 Update `ShopClient.tsx` to support product catalog filtering via subcategory URL params and dynamically load active category taxonomy structure.
- [x] 3.3 Verify admin `ProductFormModal.tsx` dropdowns dynamically list subcategories based on the chosen parent category.

## 4. Verification

- [x] 4.1 Trigger database seeding API (`/api/seed`) and confirm successful DB load for categories and products.
- [x] 4.2 Verify frontend Admin portal and /shop pages function smoothly and compile correctly.
