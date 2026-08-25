## Context

See [proposal.md](file:///Users/shahinalam/Developer/brightfuturesofts/falak-closet/openspec/changes/dynamic-promotions/proposal.md) for motivations. The application's database data is now mapped via Prisma Next, and Server Actions are available under `src/actions/orderActions.ts` for promotions CRUD operations.

## Goals / Non-Goals

**Goals:**
- Eliminate references to the static `PROMOTIONS` array on the frontend and checkout page.
- Load live active coupons directly from MongoDB via Prisma Next.
- Integrate the Admin Panel Promotions Tab with Server Actions, eliminating REST HTTP fetches.

**Non-Goals:**
- Changing database collection schemas or rules.
- Implementing coupon usage history validation on a per-user basis.

## Decisions

### 1. Refactor Live Promotions Client View
- **Current Pattern**: Statically imports and maps over `PROMOTIONS` from `src/data/promotions.ts`.
- **Selected Approach**: Fetch coupons dynamically on mount using the `getPromotions` Server Action in `LivePromotionsClient.tsx`.
- **Rationale**: Ensures customers always view current offers and Eid/Seasonal coupons exactly as configured in the DB.

### 2. Refactor Admin Promotions Dashboard
- **Current Pattern**: Performs fetches on REST endpoints `/api/promotions`.
- **Selected Approach**: Replace fetches in `src/app/admin/page.tsx` with direct async calls to Server Actions:
  - `getPromotions()`
  - `createPromotion()`
  - `updatePromotion()`
  - `deletePromotion()`
- **Rationale**: Bypasses network request overhead and achieves clean separation of concerns using Server Actions.

### 3. Deprecate Static Promotions Config
- **Action**: Deprecate `src/data/promotions.ts` and remove its imports.
- **Rationale**: Prevents accidental import of stale data and keeps the codebase clean.

## Risks / Trade-offs

- **[Risk]**: Database downtime could cause live promotions page or coupon validation to fail.
  - **[Mitigation]**: Implement a fallback mechanism inside the Server Actions that returns default seed promotions (e.g. FALAK10, EID2026) if the DB query throws.
