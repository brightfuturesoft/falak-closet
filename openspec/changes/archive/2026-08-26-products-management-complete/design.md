## Context

See `proposal.md – Why` for motivation. The relevant current state:

- `ProductFormModal` is a ~1,054-line multi-step wizard. It already has color-variation arrays, size selection, and an image-URL input per color. Missing pieces: client-side validation, featured-flag toggles, and working default image URLs.
- `ProductsTab` (420 lines) fetches categories from the API and renders a table. It has no bulk-select mode and no inline flag-toggle controls.
- `GET /api/products/[id]` does not exist — only PUT and DELETE are handled in the `[id]` route file.
- `POST /api/products` and `PUT /api/products/[id]` write to MongoDB without any pre-write field validation.
- Several Unsplash default image URLs (e.g. `photo-1583391733956-6c78276477e2`) return 404 in the running app.

## Goals / Non-Goals

**Goals:**
- Add GET `/api/products/[id]` endpoint
- Add server-side validation guard to POST and PUT product endpoints
- Wire `discountPercentage` auto-calculation into the form
- Add featured-flag (`isNewArrival`, `isBestSeller`, `isFlashSale`) toggles to step 2 (Pricing) of `ProductFormModal`
- Add inline flag toggle icons to `ProductsTab` table rows, dispatching a PATCH-like PUT call
- Add checkbox bulk-select + "Delete Selected" action to `ProductsTab`
- Replace broken default image URLs with working alternatives

**Non-Goals:**
- Image file upload (S3 / Cloudinary) — URL-based entry only in this change
- Real-time push notification when an admin edits a product
- Public-facing product page redesign
- New Socket.io events

## Decisions

### Decision: Inline flag toggles call `PUT /api/products/[id]` with a partial body
**Rationale**: The existing PUT handler passes the entire `body` to `findOneAndUpdate`, so a partial body `{ isNewArrival: true }` works safely with MongoDB's `$set`-style update. No new endpoint is needed, keeping surface area minimal.

**Alternative considered**: A dedicated PATCH endpoint per flag. Rejected — over-engineering for three boolean fields.

---

### Decision: Client-side validation in `ProductFormModal` before server submission
**Rationale**: Prevents an API round-trip for obviously invalid data and gives immediate per-field feedback inside the wizard. The server-side guard is a second safety net for direct API callers.

**Approach**: A `validateStep(step)` function checks the active step's fields; a `validateAll()` function checks all steps before final submit. Errors are stored in a `formErrors` `Record<string, string>` state object and displayed inline.

---

### Decision: Bulk-delete as parallel DELETE requests from the frontend
**Rationale**: No batch-delete API endpoint exists. Issuing parallel `fetch` calls for selected IDs re-uses the existing DELETE route without any backend changes. For typical admin usage (< 50 products selected), this is acceptable.

**Alternative considered**: A `DELETE /api/products` endpoint accepting an array of IDs. Deferred — the existing infrastructure is sufficient for the current scale.

---

### Decision: `discountPercentage` computed on form change, not on server
**Rationale**: The Mongoose schema stores `discountPercentage` as a number. Auto-computing it in the form (`Math.round((1 - price / originalPrice) * 100)`) and including it in the save payload means the stored value stays consistent with the displayed percentage without server logic changes.

---

### Decision: Replace broken default image URLs with known-good Unsplash IDs
**Rationale**: The dev server logs show `⨯ upstream image response failed for photo-1583391733956-6c78276477e2` repeatedly. Replace the three bad IDs used as defaults in `ProductFormModal` with verified working Unsplash photo IDs that show modest fashion content. No seed-script changes are required because the seed data already uses different URLs.

## Risks / Trade-offs

- **Parallel bulk-delete at scale** → Mitigation: for now scope is small (dozens of products); if catalog grows, add a batch endpoint.
- **Partial-body PUT overwrites** → The current `findOneAndUpdate` passes `body` directly without `$set`. If a caller omits a field, Mongoose will not overwrite it (omitted keys are ignored by the driver in a plain object update), so this is safe for the inline flag toggle use-case.
- **No optimistic lock on concurrent edits** → Two admins editing the same product simultaneously could overwrite each other. Out of scope for single-admin stores but noted.

## Migration Plan

1. Deploy API changes (GET handler, validation guards) — backward compatible; existing products are unaffected.
2. Deploy frontend changes — modal and tab updates are additive; no data migration needed.
3. Clear `.next` cache if Turbopack caches old route handlers: `rm -rf .next && npm run dev`.
