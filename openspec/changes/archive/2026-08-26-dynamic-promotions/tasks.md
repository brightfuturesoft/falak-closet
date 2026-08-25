## 1. Backend Service Integrations

- [x] 1.1 Verify orderActions Server Actions for promotions CRUD (getPromotions, createPromotion, updatePromotion, deletePromotion, validatePromotion) support dynamic reads from MongoDB.

## 2. Frontend Component Integration

- [x] 2.1 Refactor `LivePromotionsClient.tsx` to retrieve active promotions dynamically using `getPromotions` action.
- [x] 2.2 Refactor the Admin Dashboard tab in `src/app/admin/page.tsx` to handle promotions CRUD via `getPromotions`, `createPromotion`, `updatePromotion`, `deletePromotion` Server Actions directly instead of REST API fetch calls.
- [x] 2.3 Refactor `CartContext.tsx` to execute dynamic validations through Server Actions and drop static data references.

## 3. Deprecation & Cleanup

- [x] 3.1 Safely delete `src/data/promotions.ts` (deprecate static config) and remove its static import references.

## 4. Verification

- [x] 4.1 Verify compilation with a clean `npm run build`.
- [x] 4.2 Run manual checks on the admin Promotions management panel (create, update, delete) and verify checkout validate flows.
