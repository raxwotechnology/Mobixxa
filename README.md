# SR Mobile Official

Multi-store POS, inventory, and e-commerce platform for a mobile phone & accessories retailer — covers point-of-sale checkout, multi-branch inventory, reload/scratch-card float management, HP (installment) sales, repairs, HR/payroll, delivery, and a customer-facing storefront, all behind role-based portals (Admin, Store Owner, Manager, Cashier, Inventory, HR, Employee, Delivery).

## Tech stack

- **Frontend**: Next.js 15 (App Router) + React 19, Tailwind CSS, Zustand, Axios, Recharts
- **Backend**: Node.js + Express 5, MongoDB via Mongoose 9, JWT auth
- **Deployment**: Vercel (frontend + backend deployed as separate projects; see [Deployment](#deployment))

## Project structure

```
.
├── backend/          Express API server (routes, controllers, models, middleware)
├── frontend/          Next.js app (role-based views under src/views, shared services under src/services)
├── server.js          Root entry point that re-exports backend/server.js (for platforms expecting a root server file)
├── vercel.json         Root-level rewrites for the frontend's Vercel deployment
└── package.json        Root convenience scripts to run both apps together
```

## Prerequisites

- Node.js 18+
- A MongoDB database (local or a hosted cluster such as MongoDB Atlas)

## Getting started

### 1. Install dependencies

Install each app's dependencies separately:

```bash
cd backend && npm install
cd ../frontend && npm install
```

### 2. Configure environment variables

**`backend/.env`**

| Variable | Description |
| --- | --- |
| `MONGO_URI` | MongoDB connection string |
| `JWT_SECRET` | Secret used to sign auth tokens |
| `PORT` | Port for the API server (defaults to `5000`) |
| `NODE_ENV` | `development` or `production` |
| `EMAIL_FROM` | Sender address used for outgoing email (receipts, notifications) |
| `EMAIL_APP_PASSWORD` | App password for the email account above |

**`frontend/.env.local`** (optional for local dev)

| Variable | Description |
| --- | --- |
| `NEXT_PUBLIC_API_URL` | Base URL of the backend API. In development this can be left unset — `next.config.mjs` proxies `/api/*` and `/uploads/*` to `http://127.0.0.1:5000` automatically. Set it when the backend runs somewhere other than the local default. |

### 3. Run the apps

Run backend and frontend in two terminals:

```bash
# Terminal 1
cd backend && npm run dev

# Terminal 2
cd frontend && npm run dev
```

Frontend: [http://localhost:3000](http://localhost:3000) · Backend API: `http://localhost:5000/api`

Alternatively, from the repo root, `npm run dev` runs both concurrently — this requires `concurrently` to be available (install it at the root first: `npm install concurrently --save-dev`).

### 4. Bootstrap an admin account

The backend ships a couple of one-off scripts for local setup:

```bash
cd backend
node create-admin.js [email] [password] [name]   # creates/promotes a super admin user
node seed.js                                       # seeds demo stores, categories, products & vouchers (keeps existing users)
```

## Deployment

- The frontend is deployed on Vercel; `vercel.json` rewrites `/api/*` and `/uploads/*` to the deployed backend.
- The backend is deployed as its own Vercel project (see `backend/api/index.js`) or any Node host — `server.js` at the repo root simply re-exports `backend/server.js` for platforms that expect a root-level entry file.
