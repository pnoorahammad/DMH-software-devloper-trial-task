# Inventory Oversell Prevention System

<div align="center">

![Inventory OS Banner](https://img.shields.io/badge/Inventory%20OS-Oversell%20Prevention-6366f1?style=for-the-badge&logo=shield&logoColor=white)

**A production-quality inventory management system that prevents product overselling when multiple customers attempt to purchase simultaneously.**

[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-06b6d4?style=flat-square&logo=tailwindcss)](https://tailwindcss.com)
[![SQLite](https://img.shields.io/badge/SQLite-WAL%20Mode-003b57?style=flat-square&logo=sqlite)](https://www.sqlite.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)

**Built by Noor Ahammad · your-email@example.com**

[🦸 Built for Digital Heroes](https://digitalheroesco.com)

</div>

---

## 🚀 Project Overview

The **Inventory Oversell Prevention System** is a real-world SaaS-grade tool that solves a genuine e-commerce problem: **multiple customers trying to buy the same item at the exact same time**. 

Using SQLite's **WAL (Write-Ahead Logging)** mode with **exclusive transactions**, every purchase reservation is serialized atomically — guaranteeing that inventory **never goes negative** and **overselling is impossible**.

---

## ✨ Features

### 🛡️ Oversell Prevention Engine
- Atomic stock reservation via exclusive SQLite transactions
- Race condition prevention — all concurrent requests serialized
- Stock never goes negative, even under 100 simultaneous requests
- Automatic oversell attempt logging

### 📦 Product Management
- Add, edit, delete products with full validation
- Search & filter by name, SKU, category
- Paginated product table
- CSV export

### 🎯 Order Simulation
- Simulate 1–100 concurrent purchase requests
- Real-time success/failure results with request log
- Visual success rate progress bar
- Demonstrates the prevention engine under load

### 📊 Analytics Dashboard
- Orders by day (bar chart)
- Order status breakdown (pie chart)  
- Revenue trend (line chart)
- Stock usage heatmap
- Top products by revenue

### 📋 Audit Logs
- Every action logged: product created, stock reserved, order completed, oversell blocked
- Full event history with timestamps
- CSV export

### 🎨 Modern UI
- Dark mode SaaS dashboard
- Glassmorphism cards
- Smooth animations
- Mobile responsive
- Toast notifications
- Loading skeletons

---

## 🏗️ Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 4 |
| Database | SQLite via `better-sqlite3` (WAL mode) |
| Charts | Recharts |
| Icons | Lucide React |
| Notifications | react-hot-toast |
| Deployment | Vercel |

---

## 📁 Folder Structure

```
inventory-app/
├── src/
│   ├── app/
│   │   ├── page.tsx                  # Dashboard
│   │   ├── products/page.tsx         # Product management
│   │   ├── orders/page.tsx           # Order history
│   │   ├── simulation/page.tsx       # Concurrent simulation
│   │   ├── analytics/page.tsx        # Charts & analytics
│   │   ├── audit-logs/page.tsx       # Audit event log
│   │   └── api/
│   │       ├── dashboard/route.ts    # Dashboard stats
│   │       ├── products/route.ts     # Products CRUD
│   │       ├── products/[id]/route.ts
│   │       ├── orders/route.ts       # Order management
│   │       ├── orders/[id]/route.ts
│   │       ├── simulation/route.ts   # Simulation engine
│   │       ├── analytics/route.ts    # Analytics data
│   │       └── audit-logs/route.ts   # Audit logs
│   ├── components/
│   │   └── layout/
│   │       ├── Sidebar.tsx
│   │       └── Header.tsx
│   ├── lib/
│   │   ├── db.ts                     # SQLite connection & schema
│   │   └── inventory.ts              # Locking & transaction logic
│   └── types/
│       └── index.ts                  # Shared TypeScript types
├── data/                             # SQLite database (auto-created, gitignored)
├── next.config.ts
├── tailwind.config.ts
└── README.md
```

---

## ⚙️ How Oversell Prevention Works

```
Customer A ──┐
Customer B ──┤──► SQLite Exclusive Transaction ──► Check Stock ──► Reserve or Reject
Customer C ──┘         (serialized queue)
```

```typescript
// Atomic stock reservation — the core of the engine
db.transaction(() => {
  const available = product.quantity - product.reserved;
  if (available < requested) {
    logOversellAttempt(); // blocked!
    return { success: false };
  }
  db.run('UPDATE products SET reserved = reserved + ?', [quantity]);
  db.run('INSERT INTO orders ...', [orderId, ...]);
  return { success: true, orderId };
})();
```

SQLite + `better-sqlite3` processes all writes **synchronously** in a single process. Combined with WAL mode, this means:
- Zero race conditions
- Zero overselling
- Full audit trail of every blocked attempt

---

## 🛠️ Local Setup

### Prerequisites
- Node.js 18+
- npm 9+

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/pnoorahammad/DMH-software-devloper-trial-task.git
cd DMH-software-devloper-trial-task/inventory-app

# 2. Install dependencies
npm install

# 3. Start development server
npm run dev

# 4. Open http://localhost:3000
```

The SQLite database is created automatically on first run with 10 sample products pre-loaded.

---

## 🚀 Deployment on Vercel

### Option 1: Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

### Option 2: GitHub Integration

1. Push to GitHub
2. Go to [vercel.com](https://vercel.com) → **New Project**
3. Import your repository
4. Set **Root Directory** to `inventory-app`
5. Click **Deploy**

> **Note:** SQLite is local-only. For Vercel production, data resets on each deployment. For persistent production storage, swap `better-sqlite3` for **Turso** (SQLite-compatible, free tier) or **PlanetScale**.

---

## 📊 Sample Output

After running a simulation with 50 concurrent requests on a product with 25 units:

```
✓ Initial Stock:    25 units
✓ Requests Sent:   50 concurrent
✓ Successful:      25 orders  (50%)
✗ Blocked:         25 requests (50%)
✓ Remaining Stock: 0 units
✓ Oversell:        NEVER
```

---

## 🔑 API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dashboard` | Dashboard statistics |
| GET | `/api/products` | List products (search, filter, paginate) |
| POST | `/api/products` | Create product |
| PUT | `/api/products/:id` | Update product |
| DELETE | `/api/products/:id` | Delete product |
| GET | `/api/orders` | List orders (filter by status) |
| POST | `/api/orders` | Create order (triggers reservation) |
| PUT | `/api/orders/:id` | Complete or cancel order |
| POST | `/api/simulation` | Run concurrent simulation |
| GET | `/api/analytics` | Analytics data |
| GET | `/api/audit-logs` | Audit log entries |

---

## 👤 Author

**Noor Ahammad**  
Email: your-email@example.com  
GitHub: [@pnoorahammad](https://github.com/pnoorahammad)

---

## 🦸 Digital Heroes

This project was built as part of the **Digital Heroes** developer trial assessment.

[![Built for Digital Heroes](https://img.shields.io/badge/Built%20for-Digital%20Heroes-6366f1?style=for-the-badge)](https://digitalheroesco.com)

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.
