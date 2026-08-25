## Purpose

Provides administrative requirements for dynamically creating, editing, and deleting coupon promotions.

## Requirements

### Requirement: Administrative Promotion CRUD
The system SHALL support creating, updating, retrieving, and deleting promotion records dynamically via administrative interfaces.

#### Scenario: Admin retrieves list of promotions
- **WHEN** administrator opens the Promotions management view
- **THEN** system fetches and displays all active and inactive promotion codes from the database

#### Scenario: Admin creates a new promotion code
- **WHEN** administrator submits a new promotion code with code name, discount type, value, and expiration date
- **THEN** system writes the new promotion record to the database with active status

#### Scenario: Admin deletes a promotion code
- **WHEN** administrator requests deletion of a promotion code
- **THEN** system deletes the promotion record from the database
