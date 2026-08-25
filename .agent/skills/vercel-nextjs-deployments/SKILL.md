---
name: vercel-nextjs-deployments
description: Use this skill when deploying the Next.js and React application to Vercel, configuring environment variables, setting up Vercel CLI, or debugging deployment/runtime issues on Vercel.
---

# Vercel, Next.js, and React Deployments Guide

This skill provides the runbook and best practices for building, optimizing, and deploying this Next.js App Router application to Vercel.

## Deployment Setup

### 1. Vercel Project Linkage
Ensure the project is correctly linked to Vercel via Git Integration or Vercel CLI.
- **Git Integration (Recommended)**: Push the `setup/openspec-agentic-workflow` branch or `main` to GitHub/GitLab, then import the repository in the Vercel Dashboard.
- **Vercel CLI**: Run `npx vercel link` to link the repository locally.

### 2. Configuration Settings on Vercel
- **Framework Preset**: Next.js
- **Root Directory**: `./` (Root)
- **Build Command**: `next build`
- **Output Directory**: `.next`

---

## Environment Variables Configuration

Make sure the following environment variables are set in the Vercel Dashboard under **Project Settings > Environment Variables**:

| Variable Name | Description | Example / Recommended Value | Scope |
| :--- | :--- | :--- | :--- |
| `MONGODB_URI` | Production MongoDB connection string | `mongodb+srv://<user>:<password>@cluster.mongodb.net/falak-closet` | All environments |
| `NEXT_PUBLIC_SOCKET_URL` | Socket.io server address | `https://your-socket-server.herokuapp.com` | Production / Preview |

> [!WARNING]
> Do not use `localhost` MongoDB or Socket.io URLs in the Production environment settings. Make sure credentials are set securely and are not committed to Git.

---

## Serverless Considerations & Socket.io

Next.js API routes and Server Components run as **Serverless Functions** on Vercel. 
- **Socket.io Limitation**: Serverless functions have a max execution time limit and cannot maintain persistent WebSocket connections.
- **Solution**: The real-time Socket.io server is configured as a standalone service (`socket-server.js`). For Vercel deployments:
  1. Deploy the Next.js frontend to Vercel.
  2. Deploy the `socket-server.js` backend to a persistent container service (e.g., Render, Railway, or Heroku).
  3. Set `NEXT_PUBLIC_SOCKET_URL` in Vercel settings pointing to the persistent container service.

---

## Runbook for Deployment Verification

Before pushing to production, verify the project builds and runs cleanly locally:

1. **Production Build Check**:
   ```bash
   npm run build
   ```
   Ensure there are no TypeScript compile errors, linting errors, or page generation failures.

2. **Vercel Preview Deployment**:
   Run the Vercel CLI preview build command (optional if using git hooks):
   ```bash
   npx vercel
   ```

3. **Check Logs**:
   In Vercel Dashboard, go to **Deployments**, select the latest build, and check **Build Logs** or **Runtime Logs** for any startup exceptions.
