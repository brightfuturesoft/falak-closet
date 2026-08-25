## Purpose

Provides administrative requirements for viewing, moderating, and deleting customer reviews.

## ADDED Requirements

### Requirement: Admin Review Management
The system SHALL expose options for administrators to inspect and delete product reviews from the admin console.

#### Scenario: Admin views all reviews
- **WHEN** administrator navigates to the reviews moderation tab
- **THEN** system fetches and lists all reviews in the database sorted by submission date

#### Scenario: Admin deletes review
- **WHEN** administrator clicks delete on a malicious or spam review
- **THEN** system deletes the review from the database and updates the product's review list
