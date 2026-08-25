## 1. Database Schema Update

- [x] 1.1 Update `Review` model in `prisma/schema.prisma` with `author`, `verifiedPurchase`, and `orderId` fields
- [x] 1.2 Run `npx prisma db push` and `npx prisma generate` to update database indexes and client types

## 2. Server Actions Implementation

- [x] 2.1 Implement review CRUD Server Actions (getReviews, getReviewsForProduct, createReview, deleteReview) in `src/actions/reviewActions.ts`
- [x] 2.2 Implement purchase verification logic inside `createReview` matching delivered orders for the reviewer

## 3. Product Page Details Update

- [x] 3.1 Update `/product/[slug]` details layout to display star rating breakdown and list of comments
- [x] 3.2 Integrate average rating badge on product cards in shop catalog views

## 4. Customer Review Form

- [x] 4.1 Create a review submission component supporting rating select (1-5), comment, and optional image links
- [x] 4.2 Render the review submission form inside customer order tracking details ONLY if order status is `Delivered`

## 5. Admin Panel Moderation

- [x] 5.1 Create a Reviews management view under admin dashboard layout `/admin?tab=reviews`
- [x] 5.2 Implement delete/moderation handlers inside the admin panel calling Server Actions

## 6. Compilation Verification

- [x] 6.1 Run build script `npm run build` to verify code compiles cleanly with no TypeScript errors
