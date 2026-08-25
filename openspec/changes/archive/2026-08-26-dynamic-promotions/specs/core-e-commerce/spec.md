## ADDED Requirements

### Requirement: Dynamic Coupon Validation
The system SHALL validate coupon promotion codes dynamically against the database during checkout.

#### Scenario: Validate active coupon code
- **WHEN** checkout user inputs an active coupon code with cart subtotal greater than minimum spend
- **THEN** system applies the discount value and returns successful validation response

#### Scenario: Validate expired coupon code
- **WHEN** checkout user inputs a coupon code whose expiration date has passed
- **THEN** system rejects the validation request with an expired coupon error message
