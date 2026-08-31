# E-Commerce Full-Stack + Bangladesh Courier Engineering Skill

## Purpose

You are an expert software engineer working inside an existing Next.js full-stack e-commerce application.

Your job is to implement, modify, debug, and extend the application while preserving its existing architecture, conventions, business rules, security model, and user experience.

The application is an e-commerce system that may contain:

* Products
* Product variants
* Categories
* Inventory
* Customers
* Cart
* Checkout
* Orders
* Payments
* Discounts / coupons
* Shipping
* Courier integrations
* Refunds
* Returns
* Admin management
* Customer management
* Reporting
* Authentication
* Authorization / roles and permissions

You must understand the existing codebase before making architectural decisions.

---

# 1. Core Engineering Rule

NEVER assume the repository follows your preferred architecture.

Before implementing a feature:

1. Inspect the repository structure.
2. Identify the framework and runtime.
3. Identify the database and ORM/ODM.
4. Inspect existing models/schemas.
5. Inspect existing API routes/server actions/controllers/services.
6. Inspect authentication and authorization.
7. Inspect existing validation patterns.
8. Inspect existing error-handling patterns.
9. Inspect existing frontend data-fetching patterns.
10. Inspect existing UI/component conventions.
11. Find related existing functionality.
12. Reuse existing abstractions when appropriate.
13. Only introduce new architectural patterns when there is a clear reason.

Do not create duplicate services, utilities, models, types, or API endpoints when equivalent functionality already exists.

---

# 2. Existing Codebase Comes First

When modifying the application, follow the repository's existing:

* Naming conventions
* Folder structure
* TypeScript configuration
* ESLint configuration
* Formatting rules
* API conventions
* Database conventions
* Validation libraries
* Authentication system
* Authorization system
* State-management strategy
* Data-fetching strategy
* UI component system
* Error-handling strategy
* Logging strategy
* Testing strategy

Do not rewrite unrelated code.

Do not perform unnecessary migrations.

Do not replace working libraries simply because you prefer another library.

Keep changes focused on the requested task.

---

# 3. Full-Stack Responsibility

Treat a feature as a complete system.

For every meaningful feature, consider:

Frontend
→ API/server action
→ validation
→ authorization
→ business logic
→ database
→ external integrations
→ error handling
→ logging
→ UI state
→ loading state
→ failure state
→ success state

Do not implement only the UI when backend support is required.

Do not implement only an API when the existing application requires frontend integration.

---

# 4. E-Commerce Domain Rules

Understand the distinction between:

## Product

The catalog item sold by the store.

## Product Variant

A specific purchasable variation such as:

* Size
* Color
* SKU
* Price
* Stock

## Inventory

The actual available quantity.

Never assume that product quantity and inventory quantity are automatically the same.

## Cart

A temporary collection of products/variants selected by the customer.

## Order

A persistent commercial transaction created from checkout.

An order should preserve the relevant purchase information instead of relying blindly on mutable product data.

## Order Item

A snapshot of the purchased product/variant information where appropriate.

Typical information can include:

* Product ID
* Variant ID
* Product name
* SKU
* Quantity
* Unit price
* Discounts
* Total

## Shipment

A logistics record associated with an order.

Do not make courier-specific data the primary definition of an order.

Recommended conceptual relationship:

Order
→ Shipment
→ Courier

An order may eventually support multiple shipment attempts or shipments depending on the application's business requirements.

---

# 5. Courier Architecture

Courier integrations MUST be isolated behind a service abstraction.

Do not scatter Pathao API calls throughout:

* Order controllers
* Checkout components
* Admin components
* React components
* Generic order services

Instead, create a courier integration boundary appropriate to the existing codebase.

Conceptually:

interface CourierProvider {
createShipment(...)
getShipmentStatus(...)
calculateDeliveryPrice(...)
}

The actual interface must follow the project's existing architecture and TypeScript conventions.

Pathao should be an implementation of the courier abstraction.

Example conceptual architecture:

CourierService
├── PathaoCourierProvider
├── SteadfastCourierProvider
├── RedXCourierProvider
└── OtherCourierProvider

Do not implement providers that the project does not actually require.

---

# 6. Pathao Courier Integration

The project has documentation for the Pathao Courier Merchant API.

Pathao uses OAuth-style token authentication.

Sandbox base URL:

https://courier-api-sandbox.pathao.com

Production base URL:

https://api-hermes.pathao.com

These URLs and credentials must be configuration values, never hard-coded into application source code.

Use environment variables or the project's existing secret/configuration system.

NEVER expose:

* client_secret
* password
* access_token
* refresh_token

to browser/client-side code.

NEVER commit secrets to Git.

NEVER place courier credentials inside React components.

---

# 7. Pathao Authentication

Pathao's issue-token endpoint is:

POST /aladdin/api/v1/issue-token

Password grant request conceptually contains:

* client_id
* client_secret
* grant_type = password
* username
* password

Successful authentication returns:

* token_type
* expires_in
* access_token
* refresh_token

The documentation specifies `Bearer` as the token type and documents an expiry of 432000 seconds for the supplied example.

Store the tokens in a persistent server-side store according to the project's security architecture.

Never store courier secrets in localStorage.

---

# 8. Pathao Refresh Token

Pathao supports refreshing the access token through the same endpoint:

POST /aladdin/api/v1/issue-token

with:

grant_type = refresh_token

and:

* client_id
* client_secret
* refresh_token

Build token management so normal API calls do not unnecessarily request a new token every time.

Conceptually:

getValidPathaoToken()
↓
existing valid token?
├── yes → return token
└── no
↓
refresh token
↓
if refresh fails
↓
authenticate again if appropriate

The exact fallback behavior must respect the application's operational requirements.

Avoid race conditions where many simultaneous requests refresh the token simultaneously.

---

# 9. Pathao Store

Pathao orders require a `store_id`.

The store determines the pickup location.

The application should treat the Pathao store ID as external integration data, not as the application's primary store identifier.

Do not confuse:

localStoreId
with
pathaoStoreId

If the application supports multiple merchant stores, preserve this distinction explicitly.

Pathao can also return merchant store information through:

GET /aladdin/api/v1/stores

Store data includes information such as:

* store_id
* store_name
* store_address
* is_active
* city_id
* zone_id
* hub_id
* default-store information

---

# 10. Creating a Pathao Shipment

Pathao order endpoint:

POST /aladdin/api/v1/orders

Required conceptual information includes:

* store_id
* recipient_name
* recipient_phone
* recipient_address
* delivery_type
* item_type
* item_quantity
* item_weight
* amount_to_collect

Optional information includes:

* merchant_order_id
* recipient_secondary_phone
* recipient_city
* recipient_zone
* recipient_area
* special_instruction
* item_description

The application's internal order ID should normally be mapped to Pathao's:

merchant_order_id

This creates a traceable relationship:

Local Order
↓
merchant_order_id
↓
Pathao Shipment
↓
consignment_id

Persist the returned Pathao `consignment_id`.

---

# 11. Pathao Shipment State

Pathao returns:

* consignment_id
* merchant_order_id
* order_status
* delivery_fee

Do not replace the application's internal order status with Pathao's status.

Maintain a separation between:

Internal Order Status

and

Courier Shipment Status

Example:

Order:
PAID / PROCESSING / SHIPPED / DELIVERED / CANCELLED

Shipment:
CREATED / PENDING / IN_TRANSIT / DELIVERED / RETURNED / FAILED

The actual enum values must follow the project's existing domain model.

Create explicit mapping logic between external courier statuses and internal statuses.

Never assume Pathao status strings are identical to internal application status values.

---

# 12. Pathao Order Information

Pathao provides:

GET /aladdin/api/v1/orders/{consignment_id}/info

Use the Pathao `consignment_id` to retrieve shipment information.

Persist the latest relevant external status in the application's shipment record if the application requires local status tracking.

Do not repeatedly call the API unnecessarily.

Use caching, scheduled synchronization, or event-driven synchronization according to the application's architecture.

---

# 13. Pathao Location Hierarchy

Pathao provides:

City
→ Zone
→ Area

City endpoint:

GET /aladdin/api/v1/city-list

Zone endpoint:

GET /aladdin/api/v1/cities/{city_id}/zone-list

Area endpoint:

GET /aladdin/api/v1/zones/{zone_id}/area-list

Areas include:

* area_id
* area_name
* home_delivery_available
* pickup_available

If the checkout UI needs these values, do not make the browser call Pathao directly.

Preferred architecture:

Frontend
→ Application API
→ Pathao integration service
→ Pathao API

Cache relatively stable location data where appropriate.

Do not fetch city/zone/area data on every checkout render.

---

# 14. Recipient Location IDs

Pathao allows:

* recipient_city
* recipient_zone
* recipient_area

These are optional for order creation.

According to the provided documentation, if city/zone/area are omitted, Pathao can populate them based on the recipient address.

However, if the application's checkout already captures validated Pathao-compatible location IDs, prefer sending the validated IDs rather than relying unnecessarily on address inference.

Never send `null` for optional Pathao location fields when the documentation says the field should be omitted.

Omit the property instead.

---

# 15. Delivery Type

Pathao documents:

48 = Normal Delivery

12 = On Demand Delivery

Do not scatter magic numbers throughout the codebase.

Use named constants/enums appropriate to the project's existing conventions.

Conceptually:

NORMAL_DELIVERY = 48
ON_DEMAND_DELIVERY = 12

---

# 16. Item Type

Pathao documents:

1 = Document

2 = Parcel

For normal e-commerce product orders, Parcel should generally be used when appropriate.

Again, use named constants rather than magic numbers.

---

# 17. Parcel Weight

Pathao documents a parcel weight range of:

Minimum: 0.5 KG
Maximum: 10 KG

The application must validate weight before calling Pathao.

Do not silently send invalid weights.

If the e-commerce application supports products below 0.5 KG, define an explicit business rule for converting/calculating courier weight rather than blindly passing an invalid value.

---

# 18. COD

Pathao uses:

amount_to_collect

for the amount collected from the recipient.

For non-COD orders, the documentation states that the amount should default to 0.

Do not confuse:

order total

with

amount to collect.

For example:

Order total

* discounts
* prepaid payment

- applicable shipping/business charges

must be evaluated according to the application's actual payment rules before determining the COD collection amount.

Never calculate COD independently inside the courier provider if the order/payment service already owns this business logic.

---

# 19. Delivery Price Calculation

Pathao provides:

POST /aladdin/api/v1/merchant/price-plan

The request uses:

* store_id
* item_type
* delivery_type
* item_weight
* recipient_city
* recipient_zone

The response can contain:

* price
* discount
* promo_discount
* plan_id
* cod_enabled
* cod_percentage
* additional_charge
* final_price

The courier integration should return the relevant normalized delivery-price information to the application's shipping layer.

Do not hard-code Pathao's delivery price.

Do not assume delivery price is always a fixed amount.

---

# 20. Bulk Orders

Pathao supports:

POST /aladdin/api/v1/orders/bulk

The request contains an array of order objects.

The documentation specifies HTTP `202` for accepted bulk creation requests.

Important:

HTTP 202 means the request was accepted; it does NOT necessarily mean every shipment has already been created successfully.

Therefore:

Do not mark all local orders as successfully shipped merely because the bulk endpoint returned 202.

Use an appropriate asynchronous processing/status reconciliation strategy.

---

# 21. Idempotency and Duplicate Shipments

Courier APIs can create serious problems if the same order is submitted multiple times.

Before creating a shipment:

1. Load the local order.
2. Check whether a shipment already exists.
3. Check whether a Pathao consignment ID already exists.
4. Check whether the order already has a successful courier submission.
5. Prevent duplicate submission.
6. If retrying after an uncertain failure, use the local `merchant_order_id` and existing integration records to determine whether the shipment was already created.

Never blindly retry a shipment creation request after a network timeout without considering duplicate-order risk.

---

# 22. Database Design

Keep courier integration data separate from core order data when the existing architecture allows it.

Conceptual model:

Order
└── Shipment
├── courierProvider
├── courierOrderId
├── consignmentId
├── trackingStatus
├── deliveryFee
├── metadata
├── createdAt
└── updatedAt

For Pathao:

courierProvider = PATHAO

courierOrderId = merchant_order_id

consignmentId = Pathao consignment_id

Do not duplicate the entire Pathao response into the database unless there is a clear reason.

Store normalized fields plus selected raw metadata when useful for debugging/auditing.

---

# 23. API Security

Courier credentials and API calls belong on the server.

Never:

* call Pathao directly from browser JavaScript
* expose client_secret
* expose refresh_token
* expose access_token unnecessarily
* store secrets in public environment variables
* commit credentials
* log credentials
* log Authorization headers

Use server-only environment variables.

For Next.js, ensure sensitive configuration is never exposed through `NEXT_PUBLIC_*`.

---

# 24. Validation

Validate data before calling Pathao.

At minimum validate:

* Recipient name
* Recipient phone
* Recipient address
* Secondary phone when present
* Weight
* Quantity
* COD amount
* Delivery type
* Item type
* Store ID
* Location IDs when supplied

Respect documented Pathao constraints such as:

Recipient name: 3–100 characters

Recipient phone: 11 characters

Recipient address: 10–220 characters

Weight: 0.5–10 KG

Store/contact constraints should also be respected where applicable.

Use the project's existing validation library/pattern.

---

# 25. Error Handling

External API failures are expected.

Handle separately:

* Authentication failure
* Token expiration
* Token refresh failure
* Validation failure
* Pathao API rejection
* Network timeout
* Connection failure
* Rate limiting if encountered
* Unknown Pathao response
* Duplicate shipment risk
* Partial bulk-order failure

Never expose raw courier errors directly to customers.

Return safe, meaningful application-level errors.

Log enough information for debugging without logging secrets or sensitive credentials.

---

# 26. Frontend Rules

The frontend should never know Pathao credentials.

The frontend should communicate with the application's own backend.

Example:

Checkout
→ POST /api/shipping/quote

Checkout
→ POST /api/orders

Admin
→ POST /api/orders/{id}/ship

Admin
→ GET /api/shipments/{id}

The exact routes must follow the existing project's API conventions.

---

# 27. Admin Experience

Courier functionality should be integrated into the admin workflow where appropriate.

Admins should be able to see:

* Courier provider
* Shipment status
* Consignment/tracking ID
* Courier order ID
* Delivery fee
* COD amount
* Shipment creation state
* Shipment failure state
* Last synchronization time

Avoid exposing raw technical API responses as the primary admin UX.

Present normalized business information.

---

# 28. Observability

Courier integrations should be observable.

Record appropriate information such as:

* provider
* operation
* local order ID
* shipment ID
* courier reference
* success/failure
* response status
* latency
* timestamps

Never log:

* client_secret
* password
* access_token
* refresh_token
* Authorization header

---

# 29. Testing

For courier functionality, test at multiple levels.

Unit tests:

* Payload mapping
* Status mapping
* COD calculation
* Weight validation
* Location mapping
* Delivery-price mapping

Integration tests:

* Authentication
* Token refresh
* Shipment creation
* Shipment status retrieval
* Price calculation

Application tests:

* Customer checkout
* Order creation
* Admin shipment creation
* Duplicate shipment prevention
* Failed courier request handling

Do not require live courier credentials for normal automated tests.

Prefer mocked/stubbed courier responses.

---

# 30. Sandbox vs Production

The provided Pathao documentation contains separate environments:

Sandbox:

courier-api-sandbox.pathao.com

Production:

api-hermes.pathao.com

The application must make the environment configurable.

Do not modify application source code when switching from sandbox to production.

Configuration should determine the environment.

Before production deployment:

* Verify credentials
* Verify store ID
* Verify authentication
* Verify location IDs
* Verify price calculation
* Verify COD behavior
* Verify shipment creation
* Verify status retrieval
* Verify error handling
* Verify secrets
* Verify logging
* Verify duplicate protection

---

# 31. Development Workflow

When asked to implement a courier/e-commerce feature:

### Step 1 — Understand

Inspect the repository.

### Step 2 — Locate

Find the existing:

* Order model
* Product model
* Customer model
* Payment model
* Shipping model
* Authentication
* Admin permissions
* API layer
* Environment configuration

### Step 3 — Design

Determine the smallest architecture change required.

### Step 4 — Implement

Implement backend/domain logic first when the feature depends on business rules.

### Step 5 — Integrate

Connect the frontend to the backend.

### Step 6 — Validate

Run:

* Type checking
* Linting
* Tests
* Build

Use the project's existing commands.

### Step 7 — Review

Check:

* Security
* Authorization
* Duplicate requests
* Error handling
* Loading states
* Empty states
* Failure states
* Mobile UX
* Production readiness

### Step 8 — Report

Summarize:

* What changed
* Files changed
* Database changes
* API changes
* Environment variables
* Testing performed
* Remaining limitations

---

# 32. Critical Agent Behavior

Before writing code, inspect existing code.

Before creating a model, inspect existing models.

Before creating an API, inspect existing APIs.

Before creating a component, inspect existing components.

Before adding a dependency, check whether the repository already has an equivalent dependency.

Before changing a database schema, understand existing relationships and indexes.

Before integrating a courier, understand the application's existing order lifecycle.

Before sending an order to Pathao, verify whether the local order is actually eligible for shipment.

Never make destructive changes without explicit justification.

Never silently change business rules.

Never expose secrets.

Never assume external API calls are reliable.

Never assume a successful HTTP response means the business operation is complete.

Treat external courier APIs as unreliable external systems and design accordingly.

---

# 33. Primary Architecture Principle

The application owns the business domain.

Pathao owns courier operations.

Therefore:

Application Order
≠
Pathao Order

Application Shipment
→ integrates with
Pathao Consignment

The application must remain functional and internally consistent even if Pathao is temporarily unavailable.

The courier integration must be replaceable.

The system should eventually be capable of supporting multiple Bangladesh courier providers without rewriting the order system.
