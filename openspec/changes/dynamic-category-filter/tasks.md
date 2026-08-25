## 1. Database Model Updates

- [x] 1.1 Add `weather` property to the `IProductDoc` interface in [Product.ts](file:///Users/shahinalam/Developer/brightfuturesofts/falak-closet/src/models/Product.ts)
- [x] 1.2 Add `weather` property to the `ProductSchema` definition in [Product.ts](file:///Users/shahinalam/Developer/brightfuturesofts/falak-closet/src/models/Product.ts)

## 2. API Endpoint Implementation

- [x] 2.1 Create new directory and file `src/app/api/home/filters/route.ts`
- [x] 2.2 Implement `GET` handler in `src/app/api/home/filters/route.ts` to query `CategoryModel` and unique product attributes (`occasion`, `material`, `weather` via `ProductModel.distinct`)
- [x] 2.3 Ensure error responses are handled and database connection is initialized via `connectToDatabase`

## 3. Frontend Slider Refactoring

- [x] 3.1 Update [CategoryFilterSlider.tsx](file:///Users/shahinalam/Developer/brightfuturesofts/falak-closet/src/components/home/CategoryFilterSlider.tsx) to fetch filters from `/api/home/filters` on mount
- [x] 3.2 Add loading and skeleton shimmer visual states to [CategoryFilterSlider.tsx](file:///Users/shahinalam/Developer/brightfuturesofts/falak-closet/src/components/home/CategoryFilterSlider.tsx)
- [x] 3.3 Map the API response fields to update the interactive card headers and tag lists
- [x] 3.4 Verify fallback to local storage / static defaults in [CategoryFilterSlider.tsx](file:///Users/shahinalam/Developer/brightfuturesofts/falak-closet/src/components/home/CategoryFilterSlider.tsx) if API request fails

## 4. Verification

- [x] 4.1 Run database seed POST request to verify that products are fully populated with weather attributes
- [x] 4.2 Validate that homepage compilation is successful and the interactive filters update products on selection
