## Why

To increase customer confidence and social proof, the system requires a complete product review capability. Customers who have bought a product and received it must be allowed to leave detailed rating reviews, and administrators must be able to manage these reviews (moderation, deletion) from the admin panel.

## What Changes

- Add a dynamic customer product review submission form visible to users on delivered orders.
- Expose a dynamic review creation endpoint that checks order delivery status before accepting reviews.
- Extend the product details view to show average ratings and customer reviews list.
- Expose an administrative reviews tab in the admin panel to view and delete product reviews.

## Capabilities

### New Capabilities
- `admin/reviews-management`: Administrative panel features to view, moderate, and delete user reviews.
- `customer-reviews`: Features allowing verified buyers to post ratings and comments for delivered items.

### Modified Capabilities
- `core-e-commerce`: Display average ratings, review count, and reviews list on product detail pages.

## Impact

- Database schemas: Standard Prisma `Review` model will be fully utilized.
- Server Actions: Add reviewActions Server Actions for CRUD operations and verification checks.
- UI views: Product detail pages, customer account orders view, and administrative dashboard panel.
