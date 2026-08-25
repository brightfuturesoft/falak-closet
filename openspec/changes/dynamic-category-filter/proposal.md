## Why

Currently, the `CategoryFilterSlider` on the home page uses hardcoded, static categories and tags (for occasions, weather, materials, and categories). As products are added, updated, or removed, and as categories are managed through the admin panel, the home page filter slider remains static and out of sync with actual inventory. Making the `CategoryFilterSlider` dynamic ensures it dynamically reflects live categories and available product attributes (occasions, materials, and weather) directly from the database.

## What Changes

- **Database Model Update**: Add the `weather` field to the Mongoose `ProductSchema` so that seasonal weather attributes are persisted and queried correctly from MongoDB.
- **New API Endpoint (`GET /api/home/filters`)**: Introduce a new API endpoint that dynamically queries the database for:
  - Active categories (including their names and dynamic product counts).
  - Unique product attributes present in the database (specifically `occasion`, `material`, and `weather`).
- **Dynamic CategoryFilterSlider Component**: Modify `CategoryFilterSlider.tsx` to fetch filter data from the new endpoint and dynamically populate the four interactive filter cards (Occasion, Weather, Material, Category) and their corresponding tags.
- **Home Page Integration**: Ensure that clicking a tag in the dynamic filter slider updates the active filter state on the home page and filters the products listed on the home page correctly.

## Capabilities

### New Capabilities
- `home/category-filter-slider`: Covers the retrieval of dynamic filter attributes (categories, occasions, materials, weather) from the database and rendering them in the interactive home page filter slider.

### Modified Capabilities
<!-- None -->

## Impact

- **Models**: `src/models/Product.ts` will be updated to include `weather` in the schema.
- **API**: New route `src/app/api/home/filters/route.ts` will be added.
- **Components**: `src/components/home/CategoryFilterSlider.tsx` will be refactored to fetch dynamic options from `/api/home/filters`.
