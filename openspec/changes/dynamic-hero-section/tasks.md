## 1. Backend Database Setup

- [x] 1.1 Create the `HeroSlide` Mongoose model in `src/models/HeroSlide.ts` with tag, title, subtitle, image URL, CTA text, CTA link, order, and active flag
- [x] 1.2 Update the seed API in `src/app/api/seed/route.ts` to clear and populate initial hero slides

## 2. API Endpoints Implementation

- [x] 2.1 Implement the storefront endpoint `GET /api/hero-slides` to return active slides sorted by order ascending
- [x] 2.2 Implement the admin endpoint `src/app/api/admin/hero-slides/route.ts` supporting GET (all slides) and POST (create slide)
- [x] 2.3 Implement the admin dynamic endpoint `src/app/api/admin/hero-slides/[id]/route.ts` supporting PUT (edit slide) and DELETE (remove slide)

## 3. Admin Panel UI

- [x] 3.1 Update the sidebar navigation items in `src/components/admin/AdminSidebar.tsx` to add the "Hero Banners" tab
- [x] 3.2 Add routing case and tab mounting for the new tab in `src/app/admin/page.tsx`
- [x] 3.3 Create the slide creation/editing form modal in `src/components/admin/HeroFormModal.tsx`
- [x] 3.4 Build the dashboard slide manager component in `src/components/admin/HeroTab.tsx` allowing administrators to manage, delete, toggle active status, and edit sort order of slides

## 4. Frontend Storefront Integration

- [x] 4.1 Update `src/components/home/HeroCarousel.tsx` to perform client-side fetching of slides from `/api/hero-slides` with automatic fallback to local static data in case of error or empty response

## 5. Verification & Testing

- [x] 5.1 Trigger database seeding to verify database connection and verify newly added seeding records
- [x] 5.2 Validate CRUD operations in the admin panel by creating a new test slide, editing its order, toggling active, and deleting it
- [x] 5.3 Verify that storefront carousel loads active database slides, is responsive, and falls back to static arrays when database connection drops
- [x] 5.4 Execute TypeScript compiler verification and project build checks to ensure compile-time safety
