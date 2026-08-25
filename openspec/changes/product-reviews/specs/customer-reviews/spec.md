## Purpose

Provides requirements for verified buyers to submit product rating reviews after delivery.

## ADDED Requirements

### Requirement: Verified Buyer Reviews
The system SHALL allow logged-in customers who have purchased a product to write a review containing a rating, text, and optional media once the order has been delivered.

#### Scenario: Customer attempts to review undelivered product
- **WHEN** user requests the review submission form for a product they have not purchased or whose order status is not `Delivered`
- **THEN** system blocks the submission and displays an error message stating review is only allowed for delivered items

#### Scenario: Customer submits valid review
- **WHEN** user submits a review with rating (1-5), text comment, and verified order details for a delivered product
- **THEN** system saves the review in the database and updates the product's average rating and review count
