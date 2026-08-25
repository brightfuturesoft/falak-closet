## Why

The mobile filter drawer on the storefront (`/shop`) currently utilizes a static `CATEGORIES` array imported from static datasets. This list contains legacy category values such as `'Dress'` and `'HIJAB'`, which mismatch the database categories (`'Modest Dresses'` and `'Hijabs & Dupattas'`). As a result, selecting these filters on mobile view displays 0 items. Similarly, the admin products dashboard uses the same static categories list for filter pills, causing discrepancies with database products.

## What Changes

- **Dynamic Mobile Drawer Categories**: Refactor the mobile filter drawer categories mapping in `ShopClient.tsx` to use the dynamic `managedCategories` state (fetched from MongoDB) instead of the static `CATEGORIES` array.
- **Dynamic Admin Product Filters**: Update `ProductsTab.tsx` to dynamically load categories list from `/api/categories` at mount, rather than relying on the hardcoded static `CATEGORIES` array.
- **Standardize Category Reference APIs**: Align category display arrays across storefront page and admin panel list filters.

## Capabilities

### New Capabilities

*(None)*

### Modified Capabilities
- `categories-management`: Extend the capability to cover storefront mobile drawer and admin products tab list categories synchronization from the API database.
- `core-e-commerce`: Align catalog browsing layout to dynamically render category items in mobile view filter drawers matching current database entries.

## Impact

- **Frontend Pages**: Refactor mobile layout maps in `ShopClient.tsx` and list indicators in `ProductsTab.tsx`.
- **APIs**: No backend API changes are needed, as `/api/categories` already returns the correct taxonomy.
