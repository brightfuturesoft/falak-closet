## Why

Currently, coupon promotions in Falak Closet are loaded from a static list (`PROMOTIONS` in `src/data/promotions.ts`) or validated statically on the client/context side. This prevents the administrator from dynamically creating, editing, activating, deactivating, or deleting coupons in real-time through the Admin Panel, and causes outdated promotions to show up on the Live Promotions page. 

Making promotions fully dynamic and backed by the database via Server Actions will ensure real-time coupon updates and full dynamic validation on the checkout page.

## What Changes

- Refactor the **Live Promotions** page to fetch active promotion coupons dynamically from the database via the `getPromotions` Server Action.
- Refactor the **Cart Context** validation logic to query database promotions via the `validatePromotion` Server Action instead of relying on the static `PROMOTIONS` array.
- Refactor the **Admin Dashboard (Promotions Tab)** to perform CRUD actions on coupons dynamically using our new Server Actions (`getPromotions`, `createPromotion`, `updatePromotion`, `deletePromotion`) instead of calling the old REST API or using static fallbacks.
- Clean up and remove references to static promotions in `src/data/promotions.ts` to deprecate the static file.

## Capabilities

### New Capabilities
- `admin/promotions-management`: Outlines requirements for administrators to dynamically create, retrieve, update, and delete active coupon promotions.

### Modified Capabilities
- `core-e-commerce`: Modifies requirement of coupon code validation during checkout to use real-time database validation rather than static data lists.

## Impact

- `src/actions/orderActions.ts`: Serves as the primary data interface for promotion query, validation, and mutation.
- `src/context/CartContext.tsx`: Invokes the `validatePromotion` Server Action dynamically.
- `src/app/live-promotions/LivePromotionsClient.tsx`: Invokes the `getPromotions` Server Action on mount.
- `src/app/admin/page.tsx` & `src/components/admin/PromotionsTab.tsx`: Integrates CRUD actions directly with Server Actions.
- `src/data/promotions.ts`: Deprecated and removed.
