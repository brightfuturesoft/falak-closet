# 🛍️ Falak Closet

**Falak Closet** is a modern, full-stack E-Commerce platform built for fashion and lifestyle retail. Designed with Next.js App Router, Prisma, MongoDB, Cloudinary, and real-time Socket.IO synchronization, it features built-in integration for Bangladesh courier services (Pathao Courier API & Webhooks) and a mobile-optimized shopping experience.

---

## 🚀 Tech Stack

- **Framework:** [Next.js 16](https://nextjs.org/) (App Router) & [React 19](https://react.dev/)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **Styling:** [Tailwind CSS v4](https://tailwindcss.com/) & [Lucide React](https://lucide.dev/) Icons
- **Database & ORM:** MongoDB & [Prisma ORM](https://www.prisma.io/)
- **Real-Time Sync:** [Socket.IO](https://socket.io/) (Dedicated WebSocket server)
- **Media Storage:** [Cloudinary](https://cloudinary.com/) (Image uploads & automated optimization)
- **Logistics & Couriers:** Pathao Merchant API & Webhooks (plus Steadfast Courier integration ready)
- **Analytics & Performance:** Vercel Analytics & Speed Insights

---

## ✨ Features

- **🛍️ Storefront & Shopping Experience**
  - Dynamic category browsing & multi-variant product support (sizes, colors, stock)
  - Seamless mobile-first navigation with quick-action bottom bars
  - Fast client-side search & filtering

- **🛒 Checkout & Order Flow**
  - Streamlined guest and user checkout
  - District/City based shipping calculation for Bangladesh
  - Instant order confirmation & real-time order tracking

- **📦 Logistics & Courier Integration**
  - Direct integration with **Pathao Courier API** for automated order shipping & consignment creation
  - Webhook listener for live delivery status updates (`pathao/route.ts`)
  - QR Code generation for invoice & package verification (`qrcode.react`)

- **🛡️ Admin Management Portal**
  - Admin authentication & secure session management
  - Live order management dashboard powered by WebSockets
  - Product & inventory management with Cloudinary image upload widget

- **⚡ Real-Time Socket Server**
  - Standalone Socket.IO server (`socket-server.js`) for instant notifications & dashboard sync

---

## 📁 Project Structure

```text
falak-closet/
├── src/
│   ├── app/                 # Next.js App Router routes & API endpoints
│   │   ├── admin/           # Admin portal pages (Login, Dashboard, Orders, Products)
│   │   ├── api/             # REST API routes (Auth, Upload, Webhooks, Shipping)
│   │   ├── checkout/        # Checkout flow components & pages
│   │   ├── product/         # Product detail pages & client components
│   │   └── page.tsx         # Storefront homepage
│   ├── components/          # Reusable UI components (Header, Navigation, Product Cards)
│   ├── lib/                 # Core libraries (Prisma client, Shipping APIs, Socket client)
│   └── prisma/              # Prisma schema & database configuration
├── socket-server.js         # Standalone Socket.IO server for real-time updates
├── .env.example             # Template for required environment variables
└── README.md
```

---

## 🛠️ Getting Started

### Prerequisites

Ensure you have the following installed on your environment:
- **Node.js**: `v18.x` or higher
- **npm**: `v9.x` or higher (or `pnpm` / `yarn`)
- **MongoDB Database**: Local instance or MongoDB Atlas connection URI

---

### Step 1: Clone & Install Dependencies

```bash
git clone https://github.com/your-repo/falak-closet.git
cd falak-closet
npm install
```

---

### Step 2: Environment Setup

Copy `.env.example` to create your local `.env` configuration file:

```bash
cp .env.example .env
```

Open `.env` and fill in your environment variables:

```env
# Database
DATABASE_URL="mongodb+srv://username:password@cluster.mongodb.net/falak_closet"

# Auth & Admin Credentials
AUTH_SECRET="your-32-character-secret"
ADMIN_USERNAME="admin@falakcloset.com"
ADMIN_PASSWORD="your-secure-password"

# Cloudinary Setup
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME="your_cloud_name"
CLOUDINARY_URL="cloudinary://API_KEY:API_SECRET@CLOUD_NAME"

# Pathao Courier Credentials
PATHAO_BASE_URL="https://api-hermes.pathao.com"
PATHAO_CLIENT_ID="your_client_id"
PATHAO_CLIENT_SECRET="your_client_secret"
PATHAO_USERNAME="your_account_email"
PATHAO_PASSWORD="your_password"
PATHAO_WEBHOOK_SECRET="your_webhook_secret"
```

> 💡 Refer to [`.env.example`](file:///.env.example) for the complete list of supported environment variables.

---

### Step 3: Prisma Database Setup

Generate the Prisma client and sync the schema with your MongoDB instance:

```bash
npx prisma generate
npx prisma db push
```

---

### Step 4: Run Development Servers

Start the Next.js development server:

```bash
npm run dev
```

In a separate terminal, start the Socket.IO real-time server (if testing live order updates):

```bash
npm run socket
```

Visit [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📜 Available Scripts

| Command | Description |
| :--- | :--- |
| `npm run dev` | Runs the Next.js app in development mode on `http://localhost:3000` |
| `npm run socket` | Starts the Socket.IO server on `http://localhost:3001` |
| `npm run build` | Compiles and builds the application for production |
| `npm run start` | Runs the compiled production build |
| `npm run lint` | Executes ESLint to check for code quality and errors |

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

---

## 📄 License

This project is private and proprietary to **Bright Future Soft / Falak Closet**.
