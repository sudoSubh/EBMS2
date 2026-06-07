# 📚 E-Book Management System (EBMS)

A modern, full-stack E-Book Management System designed for educational libraries. It provides students with easy catalog search, book reservations, and transaction tracking, while equipping administrators with extensive tools for catalog curation, student details, transactions, automated fines, and procurement analysis.

---

## 🚀 Key Features

* **Dual Dashboards**: Dedicated experiences for students (search, request, reservation) and administrators (curation, checkout, analytics).
* **Supabase Integration**: Robust user authentication and security middleware.
* **Database Management**: Express backend connected to MongoDB Atlas for performant catalog querying and transaction logs.
* **Automated Book Covers & Invoices**: Direct file uploads with Cloudinary storage optimization.
* **Fine Tracking & Emails**: Automated calculation of return parameters and SMTP notifications.

---

## 🛠️ Technology Stack

* **Frontend**: React (Vite, TailwindCSS, HeadlessUI, Framer Motion, Recharts)
* **Backend**: Node.js, Express, MongoDB (Mongoose), Supabase, Nodemailer, Cloudinary
* **Deployment**: Fully optimized for Vercel

---

## 📁 Repository Structure

```text
├── frontend/             # React SPA (Vite + React Router)
│   ├── src/              # Source code (pages, components, lib, store)
│   ├── vercel.json       # Vercel SPA routing configuration
│   └── package.json      # Frontend dependencies
│
├── backend/              # Node/Express API
│   ├── src/              # Config, controllers, models, routes, jobs, utils
│   ├── server.js         # Entry point (conditional listener for serverless compatibility)
│   ├── vercel.json       # Vercel Serverless Function configuration
│   └── package.json      # Backend dependencies
│
├── deployment.md         # Detailed Vercel deployment guide
└── README.md             # This document
```

---

## 💻 Local Development Setup

### Prerequisites
* Node.js (v18+)
* MongoDB Atlas cluster or local instance
* Supabase project
* Cloudinary account

### 1. Setup Backend
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file based on `.env.example` and fill in your credentials.
4. (Optional) Seed the database with catalog data:
   ```bash
   npm run seed:books
   ```
5. Start the development server:
   ```bash
   npm run dev
   ```
   *The server runs on `http://localhost:5000`.*

### 2. Setup Frontend
1. Navigate to the frontend directory:
   ```bash
   cd ../frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file based on `.env.example` and specify the API endpoint:
   ```env
   VITE_API_URL=http://localhost:5000/api
   VITE_SUPABASE_URL=https://<your-project>.supabase.co
   VITE_SUPABASE_ANON_KEY=<your-anon-key>
   ```
4. Start the frontend developer server:
   ```bash
   npm run dev
   ```
   *The app runs on `http://localhost:5173`.*

---

## ☁️ Production Deployment

This project is fully structured for Vercel. 

* Detailed deployment steps, folder configurations, and environment variables are documented in **[deployment.md](file:///c:/Users/subha/OneDrive/Desktop/EBMS2/deployment.md)**.
* Make sure you set your Vercel environment variables properly and trigger a **Redeploy** to bake them into the client build.
