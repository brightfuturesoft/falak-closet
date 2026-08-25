## Why

The homepage hero carousel is currently statically hardcoded, which prevents store administrators from updating promotional tags, titles, subtitles, imagery, and CTAs dynamically. This change introduces a database-backed Hero Slider capability, along with a full management interface in the Admin Dashboard, enabling dynamic real-time updates to the store's primary landing banner.

## What Changes

- **HeroSlide DB Schema**: A new Mongoose model for `HeroSlide` tracking visual content, call-to-actions, sort order, and toggleable active state.
- **Admin CRUD API**: REST API endpoints under `/api/admin/hero-slides` to support listing, creating, editing, and deleting slides, as well as updating active states.
- **Frontend Fetch API**: An endpoint `/api/hero-slides` for the storefront to fetch active and sorted slides.
- **Database Seeder**: Integration of baseline slides into the central `/api/seed` tool for development parity.
- **Admin Tab: Hero Banners**: A new control tab in the Admin Sidebar allowing managers to create/edit slides via a popup modal, sort slides by order, and toggle active status.
- **Dynamic Frontend Carousel**: Component `HeroCarousel` updated to fetch and render slides dynamically, falling back to static slides on database failure.

## Capabilities

### New Capabilities

- `admin/hero-banner-management`: Administrator capability to configure, sort, toggle, and manage homepage hero slides in the admin dashboard, and serve them to the customer-facing landing page.

### Modified Capabilities

None.

## Impact

- **Database Models**: New schema file `src/models/HeroSlide.ts`.
- **API Routing**: New endpoints under `src/app/api/hero-slides` and `src/app/api/admin/hero-slides/`.
- **Admin Panel Components**: Modifications to `src/components/admin/AdminSidebar.tsx`, `src/app/admin/page.tsx`, and addition of new components `src/components/admin/HeroTab.tsx` and `src/components/admin/HeroFormModal.tsx`.
- **Homepage Component**: Updates to `src/components/home/HeroCarousel.tsx` to handle client-side fetching, loading indicators, and static fallback.
- **Development Tooling**: Seeding logic extension in `src/app/api/seed/route.ts`.
