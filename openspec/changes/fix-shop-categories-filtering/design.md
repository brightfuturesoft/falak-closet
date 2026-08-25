## Context

See `proposal.md` for motivation. Currently, the static `CATEGORIES` array in `src/data/products.ts` contains legacy category names that do not match current database entries. We will transition the category list in the mobile filter drawer and admin product filter dashboard to fetch data dynamically from `/api/categories`.

## Goals / Non-Goals

**Goals:**
- Transition categories list in storefront mobile filter drawer (`ShopClient.tsx`) to map over `managedCategories` dynamically.
- Transition category filter pills in admin dashboard (`ProductsTab.tsx`) to fetch from `/api/categories` dynamically at mount.

**Non-Goals:**
- Removing the static `CATEGORIES` list entirely if it is used for type assertions elsewhere.
- Modifying other filters (material, colors) to be dynamic.

## Decisions

### 1. Fetch Categories in Admin Products Tab
We will implement an API fetch to `/api/categories` inside `ProductsTab.tsx` to populate a dynamic categories state.
- **Rationale**: The admin dashboard requires filtering products by actual database categories. Relying on the static legacy array leads to outdated filter tabs.
- **Alternative considered**: Passing categories down from `AdminDashboardPage`. While feasible, the page is already complex, and keeping `ProductsTab` self-contained for categories lookup keeps props clean.

### 2. Map dynamically on Mobile Drawer
We will map categories list using `managedCategories.map(c => c.name)` in `ShopClient.tsx`.
- **Rationale**: Keeps the mobile filter options perfectly identical to the desktop filters.

## Risks / Trade-offs

- **[Risk]**: Initial filter load latency.
- **[Mitigation]**: Maintain a loading fallback or use local static categories as a fallback if the API fetch fails or is slow.
