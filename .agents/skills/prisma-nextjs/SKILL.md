---
name: prisma-nextjs
description: >-
  Use this skill when developing or modifying database operations in the Next.js App Router using standard schema-driven Prisma Client.
  Trigger on database queries, prisma schema changes, or database migrations using standard Prisma.
---

# Prisma & Next.js Database Skill

This skill outlines the conventions and procedures for running database queries, schema definition updates, and seeding in the Next.js App Router using standard Prisma Client.

## Conventions

1. **Schema Definition**: 
   - Define database models inside [`prisma/schema.prisma`](file:///Users/shahinalam/Developer/brightfuturesofts/falak-closet/prisma/schema.prisma).
   - For MongoDB, maps standard `id` String field to `_id` with `@db.ObjectId`:
     `id String @id @default(auto()) @map("_id") @db.ObjectId`
   - Nested structures are represented as `type <TypeName> { ... }`.

2. **Client Initialization**:
   - The database client is exported from [`src/prisma/db.ts`](file:///Users/shahinalam/Developer/brightfuturesofts/falak-closet/src/prisma/db.ts):
     ```typescript
     import { PrismaClient } from '@prisma/client';
     export const db = new PrismaClient();
     ```
   - Always import it as:
     `import { db } from '@/prisma/db';`

3. **Query Patterns**:
   - Query all documents: `await db.<modelName>.findMany()`
   - Query by unique identifier: `await db.<modelName>.findUnique({ where: { <fieldName>: value } })`
   - Create document: `await db.<modelName>.create({ data: { ... } })`
   - Update document: `await db.<modelName>.update({ where: { id: value }, data: { ... } })`
   - Delete document: `await db.<modelName>.delete({ where: { id: value } })`

4. **Schema Migrations & Updates**:
   - To update database indexes and sync types, run:
     `npx prisma db push` followed by `npx prisma generate` (or `npm run prisma:generate`).
