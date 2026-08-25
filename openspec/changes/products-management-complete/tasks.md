## 1. API Layer — Backend Changes

- [ ] 1.1 Add `GET` handler to `src/app/api/products/[id]/route.ts` — query MongoDB by `{ id: resolvedParams.id }`, return `{ success: true, product }` or 404 `{ success: false, error: "Product not found" }`
- [ ] 1.2 Add server-side validation to `POST /api/products` in `src/app/api/products/route.ts` — check required fields (`name`, `category`, `price > 0`, `originalPrice > 0`, `workType`, `occasion`, `material`, `description`, `colors` non-empty, `images` non-empty); return 400 `{ success: false, error: "<field> is required" }` on failure
- [ ] 1.3 Add server-side validation to `PUT /api/products/[id]` in `src/app/api/products/[id]/route.ts` — same required-field guard as POST (skip `images`/`colors` for partial updates; only validate if the field is present in the body and invalid)

## 2. ProductFormModal — Validation & Featured Flags

- [ ] 2.1 Add `formErrors` state (`Record<string, string>`) and `validateStep(step)` / `validateAll()` helper functions inside `ProductFormModal`
- [ ] 2.2 Hook `validateStep` into the "Next" button so the wizard cannot advance to the next step with invalid fields; display per-field error messages below inputs
- [ ] 2.3 Hook `validateAll()` into the final "Publish Product" / "Save Changes" submit button to block submission if any step has errors
- [ ] 2.4 Add `discountPercentage` auto-calculation in the pricing `useEffect` / `onChange` handler: `Math.round((1 - price / originalPrice) * 100)`; display the computed value as a read-only badge next to the price inputs
- [ ] 2.5 Add "Featured Flags" toggle row to Step 2 (Pricing) — three toggle switches for `isNewArrival`, `isBestSeller`, `isFlashSale`; wire to `formData` state
- [ ] 2.6 Include `isNewArrival`, `isBestSeller`, `isFlashSale`, and `discountPercentage` in the payload passed to `onSaveProduct`
- [ ] 2.7 Pre-populate featured flag toggles when `editingProduct` is loaded into the form (`editingProduct.isNewArrival`, etc.)
- [ ] 2.8 Replace broken default image URL (`photo-1583391733956-6c78276477e2`) with a verified working Unsplash URL in `ProductFormModal` default state and the `editingProduct` fallback

## 3. ProductsTab — Inline Flag Toggles & Bulk Delete

- [ ] 3.1 Add three icon-button columns to the `ProductsTab` table header: `New`, `Best`, `Sale` (representing the three flags)
- [ ] 3.2 In each product table row, render togglable icon buttons for `isNewArrival`, `isBestSeller`, `isFlashSale` that visually indicate active/inactive state
- [ ] 3.3 Add `onToggleProductFlag` prop to `ProductsTabProps` interface: `(id: string, flag: 'isNewArrival' | 'isBestSeller' | 'isFlashSale', value: boolean) => void`
- [ ] 3.4 Add checkbox column to the `ProductsTab` table — first column; header checkbox selects/deselects all visible rows
- [ ] 3.5 Add `selectedIds` state (`Set<string>`) to track checked product rows
- [ ] 3.6 Add a "Delete Selected (N)" action bar that appears above the table when at least one row is checked; clicking it calls `onDeleteProduct` for each selected ID sequentially

## 4. Admin Page — Wire New Handlers

- [ ] 4.1 Add `handleToggleProductFlag` in `src/app/admin/page.tsx` — calls `PUT /api/products/[id]` with `{ [flag]: value }`, then updates `productsList` state optimistically
- [ ] 4.2 Pass `onToggleProductFlag={handleToggleProductFlag}` to `<ProductsTab>` in the admin page render

## 5. Validation & Build Check

- [ ] 5.1 Run `npm run build` (or `npm run dev` and check for TypeScript/lint errors) — resolve any compilation errors introduced by new props or type changes
- [ ] 5.2 Manual smoke test: create a new product via the admin form, verify it appears in the products list and is retrievable via GET `/api/products/[id]`
- [ ] 5.3 Manual smoke test: toggle an inline flag in `ProductsTab` and verify the change persists after a page refresh (data comes from MongoDB)
- [ ] 5.4 Manual smoke test: select two products in bulk, click "Delete Selected", verify both are removed from the table and MongoDB
- [ ] 5.5 Verify no `⨯ upstream image response failed` errors appear in the dev server console for the replaced default image URLs
