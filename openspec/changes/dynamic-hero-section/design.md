## Context

The system has a hardcoded client-side array representing the hero carousel banners (see [proposal.md](file:///Users/shahinalam/Developer/brightfuturesofts/falak-closet/openspec/changes/dynamic-hero-section/proposal.md) for detailed motivation). To make this dynamic, we need to introduce a database model, APIs, and an admin management interface.

## Goals / Non-Goals

**Goals:**
- Store hero banner slide configuration in MongoDB.
- Build Next.js App Router API routes to query active slides (public storefront) and manage slides (admin-only CRUD).
- Implement a responsive management tab in the Admin panel to support addition, deletion, visibility toggle, and sorting of slides.
- Support fallback to original hardcoded slides in case of DB offline or empty states.

**Non-Goals:**
- Editing images or supporting image binary uploads directly to the local server (administrators will provide external image URLs).
- Changing the layout or core visual styling of the main storefront `HeroCarousel` container.

## Decisions

### 1. Database Model (`HeroSlide`)

We will define `src/models/HeroSlide.ts` as follows:
```typescript
import mongoose, { Schema, Document } from 'mongoose';

export interface IHeroSlide extends Document {
  id?: string;
  tag: string;
  title: string;
  subtitle: string;
  ctaText: string;
  ctaLink: string;
  image: string;
  order: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const HeroSlideSchema = new Schema<IHeroSlide>(
  {
    tag: { type: String, required: true, trim: true },
    title: { type: String, required: true, trim: true },
    subtitle: { type: String, required: true, trim: true },
    ctaText: { type: String, required: true, trim: true },
    ctaLink: { type: String, required: true, trim: true },
    image: { type: String, required: true, trim: true },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

export const HeroSlideModel =
  mongoose.models.HeroSlide || mongoose.model<IHeroSlide>('HeroSlide', HeroSlideSchema);
```

*Rationale*: A dedicated model isolates carousel banner configurations from other promotional assets like discounts, ensuring clean schemas and index paths.

### 2. API Endpoints

We will create two route handlers:
- Public endpoint: `GET /api/hero-slides`
  - Fetches slides where `isActive: true` and sorts them by `order` ascending.
  - If database connection fails or list is empty, returns an empty array or static default list.
- Admin endpoint: `src/app/api/admin/hero-slides/route.ts` (GET, POST)
  - GET: Fetches all slides sorted by `order` ascending.
  - POST: Validates admin authentication cookie (`falak_admin_session`) and creates a new slide.
- Admin dynamic endpoint: `src/app/api/admin/hero-slides/[id]/route.ts` (PUT, DELETE)
  - PUT: Validates admin authentication cookie, and updates the fields of the target slide.
  - DELETE: Validates admin authentication cookie, and deletes the target slide.

*Rationale*: Separation of public and admin endpoints ensures storefront users don't fetch inactive drafts, while enforcing admin verification for mutation commands.

### 3. UI Component Layout (Admin & Storefront)

- **Admin Sidebar Tab (`hero`)**:
  - Add `id: 'hero' as AdminTabType` with label `"Hero Banners"` and icon `Image` or `Tv` inside `src/components/admin/AdminSidebar.tsx`.
- **Admin Dashboard Tab Routing**:
  - Update `src/app/admin/page.tsx` tab-matching logic to include `'hero'`.
  - Render a new `HeroTab` component, fetching all slides on mount.
- **Admin Management Modal**:
  - Create `HeroFormModal.tsx` allowing addition and editing of slides (fields: Tag, Title, Subtitle, CTA Text, CTA Link, Image URL, Sort Order, Active Status).
- **Storefront Carousel integration**:
  - Modify `src/components/home/HeroCarousel.tsx` to fetch `GET /api/hero-slides` in `useEffect`. On load, if slides are returned, replace static array. If request fails or returns empty, fallback immediately to baseline hardcoded slides to ensure zero-downtime.

## Risks / Trade-offs

- **[Risk] Broken image URLs provided by administrator**
  - *Mitigation*: Storefront `Image` component should have safety checks or standard fallback behavior, and admin validation will check for URL format.
- **[Risk] Database offline during storefront load**
  - *Mitigation*: The component will catch connection exceptions and default to rendering the built-in hardcoded fallback slides.
