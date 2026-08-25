## Why

The admin product management feature is partially built: the `ProductFormModal` wizard UI exists but has gaps — image upload is URL-only, the `GET /api/products/[id]` endpoint is missing, form validation is absent, and the `ProductsTab` list view lacks bulk-action tools and inline editing for flags like `isNewArrival` / `isBestSeller`. Store admins need a reliable, end-to-end product CRUD flow — form → API → database — without data-loss risks from missing validations or broken image references.

## What Changes

- **Complete the `ProductFormModal`**: add client-side validation (required fields, price > 0, at least one color + image), fix the broken Unsplash image reference (`photo-1583391733956-6c78276477e2` 404s), and add a "Featured flags" section for `isNewArrival`, `isBestSeller`, and `isFlashSale` toggles that currently cannot be set from the form UI.
- **Add `GET /api/products/[id]`**: the `[id]` route only exposes PUT and DELETE; a GET handler is required so the edit modal can refresh stale product data before opening.
- **Add server-side validation to `POST /api/products` and `PUT /api/products/[id]`**: currently both accept any partial body without checking required fields, allowing corrupt records to enter MongoDB.
- **Extend `ProductsTab`**: add column controls for `isNewArrival`, `isBestSeller`, `isFlashSale` toggles in the table row so flags can be flipped without opening the full form; add a bulk-delete selection mode.
- **Fix image URL seeding**: replace broken Unsplash photo IDs with validated working URLs in both `ProductFormModal` defaults and the seed script.
- **Add `discountPercentage` auto-calculation**: when `price` and `originalPrice` are set in the form, auto-compute the discount percentage instead of requiring manual entry.

## Capabilities

### New Capabilities
- `admin/products-management`: Full admin CRUD lifecycle for products — create, read, update, delete — with form validation, featured-flag toggles, bulk operations, and a complete REST API (`GET/POST /api/products`, `GET/PUT/DELETE /api/products/[id]`).

### Modified Capabilities
- `core-e-commerce`: The product catalog fetch requirement gains a GET-by-ID scenario, and the existing POST/PUT product endpoints now enforce server-side schema validation before writing to MongoDB.

## Impact

- **API routes**: `src/app/api/products/route.ts` (POST validation), `src/app/api/products/[id]/route.ts` (new GET + PUT validation)
- **Components**: `src/components/admin/ProductFormModal.tsx` (validation, featured flags, image fix), `src/components/admin/ProductsTab.tsx` (flag toggles, bulk-delete)
- **Admin page**: `src/app/admin/page.tsx` (new `handleToggleProductFlag` handler wired to `ProductsTab`)
- **No new dependencies or Socket.io events required**
