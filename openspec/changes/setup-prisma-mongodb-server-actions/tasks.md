## 1. Environment & Package Setup

- [x] 1.1 Install `prisma` devDependency and `@prisma/client` dependency
- [x] 1.2 Run Prisma initialization `npx prisma init`
- [x] 1.3 Configure datasource provider to `mongodb` in `prisma/schema.prisma`
- [x] 1.4 Add `DATABASE_URL` environment variable matching the current MongoDB connection URI

## 2. Prisma Schema Design

- [x] 2.1 Define composite types: `SubCategory`, `ProductColor`, `OrderItem`, `CartItem`, `ShippingAddress`
- [x] 2.2 Define main MongoDB models in `schema.prisma`: `User`, `Product`, `Category`, `Order`, `HeroSlide`, `Promotion`, `BlockedIp` matching Mongoose attributes and indices
- [x] 2.3 Run `npx prisma generate` to generate the client and type definitions

## 3. Prisma Client Setup

- [x] 3.1 Create global cached Prisma client utility in `src/lib/prisma.ts`

## 4. Seeding & Connection Validation

- [x] 4.1 Create a test script in `src/lib/test-prisma.ts` or database seeder to verify write/read operations with Prisma
- [x] 4.2 Run test script/seeder to confirm MongoDB connection and verify database schema alignment

## 5. Server Actions Implementation (SOLID)

- [x] 5.1 Implement Category actions in `src/actions/categoryActions.ts` (retrieval, creation, update, delete)
- [x] 5.2 Implement Product actions in `src/actions/productActions.ts` (retrieval, filtering, details)
- [x] 5.3 Implement Hero Slide actions in `src/actions/heroActions.ts` (retrieval, re-ordering)
- [x] 5.4 Implement User / Cart actions in `src/actions/userActions.ts` (login logic, sync cart, block/unblock)
- [x] 5.5 Implement Order / Promotion actions in `src/actions/orderActions.ts` (create order, validate promo, update status)

## 6. Frontend & Route Integration

- [x] 6.1 Refactor Home Category Slider to fetch categories server-side directly using the category actions/client
- [x] 6.2 Refactor Hero Section slider to load slides server-side
- [x] 6.3 Refactor dynamic category / filter selection in the shop page to load data via server actions/queries
- [x] 6.4 Refactor User authentications / checkout flows to call Server Actions directly instead of `/api` HTTP endpoints
- [x] 6.5 Deprecate unused or obsolete Mongoose models and REST API routes under `src/app/api/`

## 7. Verification & Build

- [x] 7.1 Verify application compiles clean using `npm run build`
- [x] 7.2 Run the development server and verify standard user paths (browsing, filtering, cart additions, checkout)
