## Context

See proposal.md - Why.

We have a standard Prisma 6 model for `Review` inside [`schema.prisma`](file:///Users/shahinalam/Developer/brightfuturesofts/falak-closet/prisma/schema.prisma) mapping to MongoDB. However, it lacks fields to support verified author information, purchase verification status, and order linking. We must expand the database model and create dynamic verification routes.

## Goals / Non-Goals

**Goals:**
- Add `author`, `verifiedPurchase`, and `orderId` fields to the `Review` model.
- Expose direct Server Actions to submit a review and verify if a customer has a delivered order for the specific product.
- Build an interactive review form in the order tracking or account view for delivered products.
- Provide a reviews list with average star rating calculations on the product details page.
- Implement an admin reviews moderation tab.

**Non-Goals:**
- Uploading videos to cloud services (in-scope reviews will accept simple mock URLs or locally handled images).
- Review editing capability for users (once submitted, reviews are final; administrators can delete them).

## Decisions

### 1. Database Schema Extension
To support review authenticity and verification matching, we will update the `Review` model in [`schema.prisma`](file:///Users/shahinalam/Developer/brightfuturesofts/falak-closet/prisma/schema.prisma) with the following fields:
* `author`: String (Customer name)
* `verifiedPurchase`: Boolean (Default: true)
* `orderId`: String (Optional link to the order document)

### 2. Verified Buyer Verification Rationale
* **Decision**: When a user submits a review, the Server Action `createReview` checks if there is any `Order` record matching the customer's phone or email where:
  - `status === 'Delivered'`
  - The order contains a line item matching the `productId`.
* **Alternative**: Allowing anyone to review. Discarded to maintain clean social proof and avoid spam entries.

### 3. Star Rating Calculations
* **Decision**: On product details load, the system runs an aggregation count on the product's reviews to calculate the arithmetic mean.
* **Alternative**: Pre-calculating and storing the average rating on the `Product` model itself. Discarded due to simplicity and to avoid write-locks or inconsistencies in MongoDB updates.

## Risks / Trade-offs

- **[Risk]**: Customers might have purchased items offline or with mismatched phone numbers.
  - **Mitigation**: Allow admins to manually flag a review as verified or submit reviews on behalf of clients.
- **[Risk]**: Large volume of reviews causing slow aggregation on details view.
  - **Mitigation**: Build index on `productId` in the `Review` model.
