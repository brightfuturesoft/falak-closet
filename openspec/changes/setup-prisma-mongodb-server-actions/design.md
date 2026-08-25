## Context

See [proposal.md](file:///Users/shahinalam/Developer/brightfuturesofts/falak-closet/openspec/changes/setup-prisma-mongodb-server-actions/proposal.md) for the high-level motivations. Currently, the application uses Mongoose ORM for database modeling and Next.js REST API routes under `src/app/api/` for fetching/updating data. This design shifts the stack to Prisma ORM and Next.js Server Actions to enforce SOLID design principles and optimize performance.

## Goals / Non-Goals

**Goals:**
- Install Prisma and setup `@prisma/client` for MongoDB.
- Migrate all Mongoose schemas (`Category`, `Product`, `User`, `Order`, `HeroSlide`, `Promotion`, `BlockedIp`) to a unified `prisma/schema.prisma`.
- Implement a cached Prisma client in `src/lib/prisma.ts` to prevent MongoDB connection exhaustion during hot reloading.
- Introduce Next.js Server Actions under `src/actions/` to handle e-commerce operations (e.g., category management, product retrieval, cart updates, order checkout, IP blocking).
- Refactor the Home Category Slider, Hero Section, and Shop filtering to fetch data directly in Server Components (eliminating REST API call overhead) or via Server Actions (speeding up page transitions and interactive elements).
- Adhere to SOLID principles: Single Responsibility Principle (separate DB layer from business logic actions and UI components), Open-Closed, and Dependency Inversion.

**Non-Goals:**
- Completely rewriting the visual frontend layout (keep styling/theme consistent).
- Rewriting the standalone Socket.io server structure (`socket-server.js`), though it can be configured to read from the MongoDB collection if/as required.

## Decisions

### 1. Prisma with MongoDB Composite Types
- **Rationale**: MongoDB uses subdocuments for collections. Mongoose models represent these using nested schemas (e.g. `subCategories` in `Category` or `items` in `Order`). Prisma handles this using `type` definitions (Composite Types) in the schema file, mapping them directly to nested objects without requiring foreign-key relation tables.
- **Alternatives Considered**: Using flat relational tables (relational mapping in MongoDB). This would require structural data migration and slow down reads/writes, defeating the purpose of MongoDB's document-model performance.

### 2. Global Prisma Client Singleton
- **Rationale**: Next.js development hot-reloads modules, which would instantiate new `PrismaClient` instances on every reload and exhaust MongoDB's connection pool. We will use a global variable pattern:
  ```typescript
  import { PrismaClient } from '@prisma/client';
  
  const prismaClientSingleton = () => {
    return new PrismaClient();
  };
  
  declare global {
    var prismaGlobal: undefined | ReturnType<typeof prismaClientSingleton>;
  }
  
  export const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();
  
  if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = prisma;
  ```

### 3. Server Actions & Direct Server Fetching for Speed
- **Rationale**: Currently, client components call `fetch('/api/products')` inside a `useEffect` hook. This triggers multiple waterfall network requests and renders fallback spinners.
  - **Data Fetching**: We will move data queries directly into Next.js Server Components. The server fetches data from Prisma and renders the HTML, resulting in near-instant initial page loads ("super fast").
  - **Data Mutations**: For interactive operations (e.g. cart updates, order creation, categories operations), we will define Server Actions with the `"use server"` directive in `src/actions/`. These actions can be called directly from Client Components as plain TypeScript functions, bypassing API route latency and ensuring type safety.

### 4. Codebase Organization (SOLID)
- **Data Access Layer**: `prisma/schema.prisma` and `src/lib/prisma.ts`.
- **Business/Service Layer**: Files in `src/actions/` (e.g., `categoryActions.ts`, `productActions.ts`, `orderActions.ts`) that handle validations, state changes, socket notification triggers, and database actions.
- **UI Components**: UI components focus solely on presentation. They receive data as props or invoke actions via React 19's form actions or `useTransition`.

## Risks / Trade-offs

- **[Risk] MongoDB Local Replica Set**: Prisma requires MongoDB to run as a replica set (with Oplog enabled) to support transaction features.
  - *Mitigation*: Instruct local setup to use a replica set (e.g. `mongodb://localhost:27017/falak-closet?replicaSet=rs0` or standard MongoDB Atlas cluster).
- **[Risk] Mongoose `Schema.Types.Mixed` in `Order.ts`**: The `items.product` field in Mongoose is unstructured (`Mixed`).
  - *Mitigation*: In `schema.prisma`, define `type OrderProduct` or map it as a strict composite type containing the essential product fields (id, name, slug, price, images, etc.) to maintain type safety.
