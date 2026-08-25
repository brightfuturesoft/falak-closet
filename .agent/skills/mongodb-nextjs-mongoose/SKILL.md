---
name: mongodb-nextjs-mongoose
description: Use this skill when creating or modifying Mongoose schemas, connecting Next.js API routes to MongoDB, handling connection caching in serverless environments, or seeding the database.
---

# MongoDB and Mongoose in Next.js

This skill guides schemas, querying, seeding, and database connection lifecycle management in Next.js Server Components and API Routes.

## MongoDB Connection Lifecycle (Serverless Cache)

Next.js App Router API routes and server actions run in transient serverless environments. To avoid creating a new database connection pool on every request (which exhausts MongoDB connection limits), always import and reuse the cached database connector:

```typescript
import { connectToDatabase } from '@/lib/db';

export async function GET(request: Request) {
  try {
    // 1. Establish/retrieve the cached connection
    await connectToDatabase();
    
    // 2. Perform query using Mongoose models
    const data = await ProductModel.find({});
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
```

Cached database connection implementation is located in [db.ts](file:///Users/shahinalam/Developer/brightfuturesofts/falak-closet/src/lib/db.ts).

---

## Schema Guidelines

Define schemas inside the `src/models/` directory.

- **Check if Model Exists**: Due to Next.js hot-reloading in development, schemas may compile multiple times. Always register model definitions using the logical fallback:
  ```typescript
  export const ProductModel = mongoose.models.Product || mongoose.model('Product', ProductSchema);
  ```
- **Indexing**: Always index fields that are frequently queried or filtered (e.g., `slug: { type: String, unique: true, index: true }`).
- **Timestamps**: Enable timestamps option `{ timestamps: true }` on schemas to track `createdAt` and `updatedAt` automatically.

---

## Seeding Database

The project has a custom seeding mechanism. When modifying data schemas or starting development on a clean cluster:

1. Locate or update seed routes/scripts (e.g., `/api/seed` or standalone seeds).
2. For local validation:
   - Run the development server: `npm run dev`
   - Access the seed endpoint `http://localhost:3000/api/seed` to populate mock data for categories and products.
3. Validate models against mock structures defined in `src/data/products.ts` and `src/data/categories.ts`.
