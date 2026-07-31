# 📱 SR Mobile Official (Raxwo Mobile)
> **Enterprise Mobile Shop Point of Sale (POS), Multi-Store ERP, E-Commerce & Management System**

[![Node.js](https://img.shields.io/badge/Node.js-v18%2B-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-v19.0-blue.svg)](https://react.dev/)
[![Express](https://img.shields.io/badge/Express-v5.0-lightgrey.svg)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-brightgreen.svg)](https://www.mongodb.com/)
[![Vite](https://img.shields.io/badge/Vite-v8.0-purple.svg)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-v4.0-38bdf8.svg)](https://tailwindcss.com/)

---

## 🌟 Overview

**SR Mobile Official (Raxwo Mobile)** is an all-in-one management suite tailored specifically for mobile phone, electronics retail, repair, and wholesale businesses. It seamlessly connects front-end retail POS cashiers, multi-branch inventory tracking, HR & payroll operations, repair management, hire purchase installment tracking, and an online customer store.

---

## 🚀 Key Modules & Features

### 🛒 1. Point of Sale (POS) & Cashier Module
- **Fast Checkout & Barcode Scanner Integration:** Scan IMEIs and product barcodes using hardware scanners or camera scanning.
- **Thermal & PDF Receipt Generation:** Instant PDF/Thermal receipt rendering with printable invoices via `jsPDF` and `JSBarcode`.
- **Session Management:** Track register opening/closing balances, cash drawers, and cashier sessions.
- **Flexible Payment Methods:** Cash, Card, Credit, Hire Purchase, Loyalty Points, and Vouchers.

### 📦 2. Multi-Store Inventory & Stock ERP
- **Multi-Branch Tracking:** Manage multiple stores/outlets, stock transfers between stores, and stock audits.
- **IMEI / Serial Number Support:** Detailed tracking for individual device serial numbers, warranty details, and price histories.
- **Stock Receipts & Adjustments:** Record supplier inventory receipts, damage returns, and manual stock adjustments.
- **Promotions & Discount Rules:** Flexible promotional campaigns and voucher management.

### 🛍️ 3. E-Commerce Customer Storefront
- **Modern Shopping Experience:** Browse mobile devices, accessories, categories, and special deals with responsive animations.
- **Cart & Wishlist:** Real-time state management powered by Zustand.
- **Order Tracking & Portal:** Customers can view order history, delivery updates, and download invoices.

### 👥 4. HR, Attendance & Payroll System
- **Attendance Tracking:** Clock-in/clock-out logging, break tracking, and overtime calculation (`OvertimePay`).
- **Leave Management:** Custom leave policies, employee leave applications, and manager approval flows.
- **Automated Payroll Engine:** Calculate base salaries, allowances, overtime, tax deductions, and generate payslips.

### 🛠️ 5. Repair Job & Service Desk
- **Work Orders:** Create repair jobs with device diagnostics, issue notes, and estimated costs.
- **Status Updates:** Track repair stages (Received, In Progress, Waiting for Parts, Completed, Delivered).
- **Technician Assignment:** Assign service tasks to repair engineers and manage spare parts usage.

### 💳 6. Hire Purchase & Credit Management
- **Installment Plans:** Create hire purchase agreements for high-value mobile phones.
- **Payment Schedules:** Automated interest calculations, payment installments, and due-date tracking.
- **Credit Sales & Reminders:** Manage customer credit limits, outstanding balances, and payment collection.

### 📊 7. Finance, Accounting & Reporting
- **Petty Cash & Expense Logging:** Track store operational expenses, additional income, and petty cash logs.
- **Supplier Accounts:** Track supplier invoices, payments, and supplier return credits.
- **Analytics & Reports:** Detailed visual charts built with `Recharts` for sales velocity, profit metrics, and inventory valuations.
- **Excel & PDF Exports:** Comprehensive report downloads via `ExcelJS` and `pdfkit`.

### 🔒 8. Role-Based Access Control (RBAC)
- Fine-grained permission architecture supporting roles:
  - `Admin`
  - `Store Owner`
  - `Cashier`
  - `Inventory Manager`
  - `HR Manager`
  - `Employee`
  - `Delivery Executive`
  - `Customer`

---

## 🛠️ Technology Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend Framework** | React 19, Vite 8 |
| **Styling & UI** | Tailwind CSS v4, Framer Motion, Lucide Icons |
| **State Management** | Zustand |
| **Routing & Forms** | React Router v7, React Hook Form |
| **Barcodes & QR** | `JSBarcode`, `html5-qrcode` |
| **Documents & PDF** | `jsPDF`, `jspdf-autotable`, `xlsx` |
| **Backend Runtime** | Node.js (>= 18), Express 5 |
| **Database** | MongoDB, Mongoose 9 |
| **Authentication** | JSON Web Tokens (JWT), BcryptJS |
| **File Storage & Mail**| Multer, Nodemailer |
| **Backend Documents** | PDFKit, ExcelJS |

---

## 📂 Project Structure

```
SR Mobile Official/
├── backend/                  # Express.js REST API & Database Models
│   ├── config/               # Database & App configurations
│   ├── controllers/          # Business logic controllers
│   ├── middleware/           # Auth, RBAC, File Upload middleware
│   ├── models/               # Mongoose schemas (40+ models)
│   ├── routes/               # Express API endpoints
│   ├── scripts/              # Database seeding & setup scripts
│   ├── services/             # Background services & helpers
│   ├── uploads/              # File uploads directory
│   ├── server.js             # Backend entry point
│   └── package.json
│
├── frontend/                 # React + Vite Frontend Application
│   ├── public/               # Static assets & public resources
│   ├── src/
│   │   ├── components/       # Reusable UI components
│   │   ├── pages/            # Page views (Admin, POS, HR, Store, etc.)
│   │   ├── services/         # Axios API clients
│   │   ├── store/            # Zustand global stores
│   │   ├── utils/            # Helper functions & formatters
│   │   ├── App.jsx           # App routes configuration
│   │   └── main.jsx          # React entry point
│   ├── vite.config.js
│   └── package.json
└── README.md
```

---

## ⚡ Getting Started

### Prerequisites
Make sure you have the following installed on your local machine:
- **Node.js** (v18.0.0 or higher)
- **MongoDB** (Local instance or MongoDB Atlas connection string)
- **npm** or **yarn**

---

### 1. Installation

Clone the repository and navigate to the project directory:

```bash
cd "SR Mobile Official"
```

#### Install Backend Dependencies
```bash
cd backend
npm install
```

#### Install Frontend Dependencies
```bash
cd ../frontend
npm install
```

---

### 2. Environment Configuration

#### Backend `.env`
Create a `.env` file inside the `backend/` directory:

```env
PORT=5000
MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/mobile_shop?retryWrites=true&w=majority
JWT_SECRET=your_jwt_secret_key_here
NODE_ENV=development
```

#### Frontend `.env`
Create a `.env` file inside the `frontend/` directory:

```env
VITE_API_URL=http://localhost:5000
```

---

### 3. Database Seeding & Admin Setup

To initialize default roles, settings, or seed demo data into your MongoDB database:

```bash
cd backend
npm run seed        # Run seed script if available
node create-admin.js # Bootstrap an initial admin account
```

---

### 4. Running the Application

#### Start Backend Server
```bash
cd backend
npm run dev
```
> The API server will start on `http://localhost:5000`

#### Start Frontend Client
```bash
cd frontend
npm run dev
```
> The Vite dev server will start on `http://localhost:5173`

---

## 📜 Available Scripts

### Backend (`/backend`)
- `npm run dev` - Start development server with `nodemon`
- `npm start` - Start production server

### Frontend (`/frontend`)
- `npm run build` - Build production-ready bundle
- `npm run dev` - Start Vite dev server
- `npm run preview` - Preview production build locally
- `npm run lint` - Run ESLint code checks

---

## 🌐 Deployment

- **Frontend Deployment:** Suitable for deployment on [Vercel](https://vercel.com) or [Netlify](https://netlify.com) using the included `vercel.json` / `netlify.toml`.
- **Backend Deployment:** Suitable for deployment on Node.js hosts (e.g. Render, Railway, Vercel Serverless API, or AWS/DigitalOcean).

---

## 📄 License

This project is proprietary software created for **SR Mobile / Raxwo**. All rights reserved.
