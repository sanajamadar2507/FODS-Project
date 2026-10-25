# ReliefLink

> **Emergency Relief Request Handling & Verified Courier Delivery Platform**  
> A clean, modern, light-mode web application designed for rapid disaster triage, inventory allocation, and humanitarian field dispatch.

---

## 🌟 Key Features

- **No Academic Jargon**: Built as a real-world disaster coordination product with high aesthetic fidelity, generous whitespace, Inter typography, Lucide icons, and soft shadows.
- **Light-Mode Only**: Calm teal accent palette (`#0d9488`), white and soft-gray cards, with zero dark-mode distraction.
- **Normalized 3NF PostgreSQL Architecture**: ACID-compliant transactions for atomic stock reservation and driver dispatch (`BEGIN` / `COMMIT` / `ROLLBACK`).
- **Dynamic Urgency Scoring Engine**: Calculates emergency score (0–100%) server-side based on incident severity (40%), people affected (25%), vulnerable groups (20%), and hourly elapsed waiting time (15%).
- **Handcrafted Data Structures (`/lib/ds/`)**:
  1. **Priority Queue**: Ranks pending incidents with descending urgency for the admin hero queue.
  2. **Singly Linked List**: Chains ordered delivery waypoints for the driver's trip itinerary.
  3. **Doubly Linked List**: Powers bidirectional (newer / older) navigation across the admin audit log.
  4. **Stack (LIFO)**: Drives the admin "Undo Last Action" button and driver's recent drop-off history.
  5. **Circular Queue**: Fair round-robin courier rotation prioritizing available drivers in matching sectors.
  6. **Normal FIFO Queue**: Manages driver notification dispatch streams.
  7. **QuickSort & InsertionSort**: Powers dynamic multi-attribute sorting on the requests register.
  8. **Binary Search & Linear Search**: Instant $O(\log N)$ lookup by Request ID and multi-field text search.
  9. **2D Demand Matrix**: Area $\times$ Item heat-map identifying regional supply shortages.

---

## 👥 Demo Login Credentials

All seed accounts use the default password: **`password123`**

| Role | Name | Email | Details |
| :--- | :--- | :--- | :--- |
| **Admin** | Elena Vance | `admin@relieflink.org` | Operations Director (Invite Code: `RELIEF2026`) |
| **Volunteer Driver** | Marcus Bennett | `marcus.driver@relieflink.org` | North Sector • Van |
| **Volunteer Driver** | Aisha Patel | `aisha.driver@relieflink.org` | River Valley • Pickup |
| **Volunteer Driver** | Carlos Mendez | `carlos.driver@relieflink.org` | Coastal Belt • Motorcycle |
| **Requester** | Sarah Jenkins | `sarah.jenkins@example.com` | River Valley Liaison |
| **Requester** | David Kim | `david.kim@example.com` | North Sector Shelter Lead |
| **Requester** | Priya Sharma | `priya.sharma@example.com` | Coastal Point Contact |

*Tip: You can also click the 1-click **Instant Demo Login** buttons on the landing page.*

---

## 🚀 3-Step Deployment Instructions

### Option A: Local Run (Zero-Setup Instant Start)

1. **Install Dependencies**:
   ```bash
   npm install
   ```
2. **Run Unit Tests**:
   ```bash
   npm test
   ```
3. **Launch Development Server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser. (All seed data and transactions work out-of-the-box with the persistent local store).

---

### Option B: Deploy to Vercel + Supabase (PostgreSQL)

1. **Create Supabase Database**:
   - Create a free project at [supabase.com](https://supabase.com).
   - In Supabase SQL Editor, paste and run the contents of [`schema.sql`](./schema.sql), followed by [`seed.sql`](./seed.sql).
   - Copy your PostgreSQL connection string from **Project Settings > Database > Connection pooling (URI)**.

2. **Configure Environment Variables**:
   Set the following variables in Vercel (or your local `.env.local`):
   ```env
   ADMIN_CODE=RELIEF2026
   JWT_SECRET=your-secure-jwt-secret-key-32-chars-long
   DATABASE_URL=postgresql://postgres.xxx:password@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true
   ```

3. **Deploy with Vercel**:
   ```bash
   vercel
   ```
   Or push your repository to GitHub and import it directly into the [Vercel Dashboard](https://vercel.com).

---

## 📁 Codebase Directory Structure

```text
├── app/
│   ├── api/
│   │   ├── activity/route.ts          # Audit log feed
│   │   ├── allocate/route.ts          # Atomic stock allocation transaction
│   │   ├── allocate/undo/route.ts     # Undo transaction (restores stock)
│   │   ├── assignments/status/route.ts# Courier step transitions
│   │   ├── auth/                      # Login, Signup, Logout, Me routes
│   │   ├── notifications/route.ts     # In-app alert queue
│   │   ├── requests/route.ts          # Request creation & priority retrieval
│   │   ├── stock/route.ts             # Stock inventory & inline updates
│   │   └── volunteers/route.ts        # Driver roster & availability toggle
│   ├── admin/page.tsx                 # Operations Admin Console
│   ├── requester/page.tsx             # Requester Dashboard & Step Tracker
│   ├── volunteer/page.tsx             # Volunteer Driver Itinerary & Maps Routing
│   ├── login/page.tsx                 # Authentication Portal & Demo Switcher
│   ├── signup/page.tsx                # Role-Based Registration
│   ├── globals.css                    # Inter & Light-Mode Palette
│   ├── layout.tsx                     # Global Root Shell & Toast Provider
│   └── page.tsx                       # Landing Page & Role Picker
├── components/
│   ├── Navbar.tsx                     # Global Navigation & Role Indicator
│   └── ui/
│       ├── Toast.tsx                  # Non-blocking Toast Alerts
│       └── Tooltip.tsx                # Plain-Language Informational Tooltips
├── lib/
│   ├── auth/                          # JWT signing, verification, cookies
│   ├── db/                            # 3NF Schema types, initial data, store
│   ├── ds/                            # Handcrafted Data Structures & Tests
│   │   ├── PriorityQueue.ts           # Descending Urgency Queue
│   │   ├── LinkedList.ts              # Singly & Doubly Linked Lists
│   │   ├── Stack.ts                   # LIFO Undo & Delivery History
│   │   ├── CircularQueue.ts           # Fair Courier Rotation Buffer
│   │   ├── NormalQueue.ts             # FIFO Notification Queue
│   │   ├── Sorting.ts                 # QuickSort, InsertionSort, BucketSort
│   │   ├── Searching.ts               # BinarySearch & LinearSearch
│   │   ├── Matrix2D.ts                # Area x Item Demand Heat-Map
│   │   └── __tests__/ds.test.mjs      # Comprehensive Native Unit Tests
│   └── priority.ts                    # Dynamic Urgency Scoring Engine
├── schema.sql                         # 3NF DDL Schema with Foreign Keys & Indexes
├── seed.sql                           # Production Seed Records
├── .env.example                       # Sample Environment Configuration
└── package.json                       # Dependencies & Scripts
```
