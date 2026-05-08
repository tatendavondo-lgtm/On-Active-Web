# Project Brief: On Active Webstore & Admin Hub

## Overview
**On Active** is a premium, high-performance fitness apparel brand based in Zimbabwe. The platform consists of two main components: a cinematic, conversion-focused storefront and a robust, AI-powered Administrative Hub for business management.

---

## Technical Stack
- **Framework:** Next.js 16.2.2 (Turbopack)
- **Language:** TypeScript
- **Styling:** Tailwind CSS (Custom Hex-based Design System: `#0A0A0A`, `#C5A021`)
- **Backend/DB:** Supabase (PostgreSQL, Real-time, Auth, Storage)
- **AI Engine:** Google Gemini 1.5 Flash (integrated via `@google/generative-ai`)
- **Animations:** Framer Motion (Micro-interactions, cinematic transitions)

---

## Core Features: Storefront (`(store)`)
1. **Cinematic Landing Page:**
   - Interactive Bento-grid layouts for featured collections.
   - High-end performance sections with background cinematic assets.
   - 2.2-second branded preloader experience.
2. **Dynamic Product Discovery:**
   - Real-time product fetching from Supabase.
   - Size/Color selection with stock-aware logic.
3. **Cart & Checkout:**
   - **Persistent Cart:** Client-side state with custom hydration handling to prevent SSR flashes.
   - **Secure Guest Checkout:** Orders are processed via a server-side API route (`/api/checkout`) to ensure database integrity and bypass client-side RLS safely.

---

## Core Features: Admin Hub (`(admin)`)
1. **Security & RBAC:**
   - Secure login gated by Supabase Auth.
   - Role-based permissions: `Owner` (full access) vs. `Manager` (limited access).
   - Custom `proxy.ts` architecture for route protection.
2. **AI Business Intelligence ("Samkee"):**
   - Personal business assistant powered by Gemini 1.5 Flash.
   - Capable of analyzing real-time store data (orders, inventory) to provide actionable insights.
   - Integrated chat interface and "AI Insight" banners on the dashboard.
3. **Inventory Management:**
   - Complete CRUD for products via secure server actions.
   - Inventory tracking with "Low Stock" alerts and popularity metrics.
4. **Order Management:**
   - Real-time order tracking.
   - Status transitions: `pending` -> `confirmed` / `cancelled`.
   - Automatic currency conversion (USD to ZiG) for local market awareness.

---

## Backend & Security Architecture
- **API-First Mutations:** Sensitive operations (like adding products or creating orders) are moved to server-side routes (`/api/admin/products`, `/api/checkout`) using the Supabase Service Role Key to maintain strict control while bypassing client-side RLS blockers.
- **Database Schema:** 
  - `profiles`: Extends Supabase Auth with roles and metadata.
  - `products`: Dynamic inventory with categories and features.
  - `pending_orders`: Secure order storage with itemized tracking.

---

## Current Status & Next Steps
- **Local Dev:** Stable on Port 3001.
- **Infrastructure:** Supabase project initialized and migrations applied.
- **Pending:** Production deployment on Vercel requires manual injection of Environment Variables (Supabase Keys, Gemini API Key) via the Vercel Dashboard.
- **Future Goals:** Real-time push notifications for orders and automated replenishment logic.
