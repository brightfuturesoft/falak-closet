## Context

Currently, the `CategoryFilterSlider` component is static and lists hardcoded tags. The application uses MongoDB via Mongoose. Product documents are modeled by `src/models/Product.ts` and categories by `src/models/Category.ts`. However, the Mongoose `ProductSchema` lacks the `weather` field, which prevents Mongoose from returning the `weather` property from queried MongoDB documents even though it exists in the seed dataset.

## Goals / Non-Goals

**Goals:**
- Update `ProductSchema` to include the `weather` field.
- Implement a public `GET /api/home/filters` API endpoint to return dynamic categories, occasions, materials, and weather values.
- Refactor the React `CategoryFilterSlider` component to fetch and render the filters dynamically on the home page.
- Maintain the premium, responsive layout with smooth touch scrolling and auto-rotation.
- Implement robust skeleton loading states.

**Non-Goals:**
- Adding filter slider cards for other attributes (like color, size, price, etc.).
- Modifying the general shop page sidebar filtering behavior.

## Decisions

### 1. Schema Expansion
Add `weather: { type: String, default: '' }` to Mongoose `ProductSchema` and update the `IProductDoc` interface.
- *Rationale*: Allows Mongoose to read and serialize the `weather` property from product documents in MongoDB.
- *Alternative*: Read the raw, un-schematized documents using `.lean()` without updating the schema. Rejected as it bypasses Mongoose validation/types and is prone to typescript errors.

### 2. Dedicated Filter API Endpoint (`GET /api/home/filters`)
Create a new API route under `src/app/api/home/filters/route.ts` that retrieves the list of categories and performs Mongoose `.distinct()` queries on products.
- *Rationale*: Retrieving unique attributes on the server is highly performant and keeps payload size small.
- *Alternative*: Calculate unique occasions, materials, and weather values client-side from the loaded products array. Rejected because it couples the filter slider logic to the entire product list payload and doesn't scale if home page product queries are paginated or limited in the future.

### 3. Client Component Fetch & Load States
Fetch the dynamic filters inside `CategoryFilterSlider` on mount. Show a shimmer/skeleton card UI during load.
- *Rationale*: Matches the React/Next.js client-side data fetching pattern of other pages and components, preventing render-blocking on the home page.

## Risks / Trade-offs

- **[Risk]** API call fails or database is empty.
  - **Mitigation**: Implement a fallback to the initial mock categories and attributes data if the API fails or returns empty lists, ensuring the UI never breaks.
