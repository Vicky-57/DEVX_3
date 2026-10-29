# DEVX_3
# DevX Commerce Suite — CartX | RetailOS | SearchX

> Complete full-stack reproduction of the DevX Labs commerce platform built from architectural analysis of [devxlabs.ai](https://www.devxlabs.ai/).
> Engineered from the ground up with custom TypeScript engines, SQLite WAL persistence, sub-10KB client widgets, touchscreen POS, and hybrid semantic search.

---

## 1. Monorepo Architecture Overview

Structured as an npm workspace monorepo:

```
devx-commerce/
├── packages/
│   ├── shared/         # Pure cart pricing engine, SearchX hybrid search engine, deterministic A/B hashing, types
│   └── widget/         # Standalone CartX drawer embed (Shadow DOM, 9.3 kB gzipped, zero runtime dependencies)
├── apps/
│   ├── api/            # Fastify + TypeScript + SQLite (better-sqlite3 WAL) backend & unified analytics pipeline
│   ├── console/        # React + Vite Merchant Admin Console (CartX A/B lab & SearchX Discovery Studio) [Port 5173]
│   ├── demo-store/     # "AURA Lifestyle" D2C storefront with live CartX embed & SearchX ⌘K overlay [Port 5174]
│   └── retailos/       # Touchscreen POS, BOPIS station, BORIS returns, Cash Drawer, & AI Clienteling [Port 5175]
├── data/
│   └── cartx.db        # SQLite database (Stores, Products, Inventory Matrix, Shifts, BOPIS, Search Logs)
├── TEST_REPORT.md      # Comprehensive 33-test verification audit
└── README.md
```

### Port Allocations
| Application | Port | Technology | Purpose |
|---|---|---|---|
| **API & Widget Host** | `4000` | Fastify + SQLite WAL | Headless REST endpoints, dynamic pricing, static `cartx.js` |
| **Merchant Admin Console** | `5173` | React + Vite + Lucide | CartX configuration, A/B Testing Lab, SearchX Studio |
| **Demo D2C Storefront** | `5174` | React + Vite + CartX Embed | Live shopper experience, collection carts, SearchX `⌘K` overlay |
| **RetailOS POS & Operations** | `5175` | React + Vite | Touchscreen register, BOPIS pickup, BORIS returns, AI assistant |

---

## 2. Product Suite Breakdown

### 1. CartX — AI-Powered Conversion & Cart Engine
- **High-Speed Embed (`cartx.js`)**: Injects in an isolated Shadow DOM (`37 kB uncompressed`, `<10 kB gzipped`). Zero external framework dependencies.
- **Urgency & Tiered Progress**: Multi-milestone progress bar (₹999 Free Shipping, ₹1,999 Free Tote Bag, ₹2,999 15% OFF) and countdown reserve timer.
- **Dynamic Freebies & Bundles**: Pure client-server dual execution engine dynamically adds free products (`isFreebie: true`, ₹0) and applies combo bundle discounts.
- **AI Upsells & Curated Overrides**: Product affinity algorithm with high-margin merchant pinning.
- **Deterministic A/B Testing**: FNV-1a hash distributing visitors 50/50 without tracking cookies or server round-trips.

### 2. SearchX — Hybrid Semantic Search & Discovery
- **Levenshtein Typo Tolerance**: Resolves misspelled queries (e.g., `sneekers` -> `sneakers`).
- **Natural Language Intent Parsing**: Automatically extracts budget bounds (`pants under 2000` -> `maxPricePaise: 200000`) and category tags (`hoodie`, `shoes`).
- **Synonyms Dictionary**: Domain expansion rules (`kicks` expands to `sneakers`, `shoes`, `footwear`, `runners`).
- **Merchandising Rules & Pinning**: Pin hero products to #1 or boost seasonal tags (`#heavyweight`, `#fleece`).
- **Interactive Storefront Overlay**: `⌘K` keyboard-accessible modal with real-time debounced results and 1-click `+ Bag` into CartX.
- **Search Analytics**: Queries log tracking search volume, click-through rates (CTR %), and zero-result queries.

### 3. RetailOS — Omnichannel In-Store POS & Operations
- **Touchscreen POS Register**: Rapid category tabs, barcode/SKU search, local floor inventory validation, split tender modal (Cash, UPI QR code, Card), and instant printable receipts.
- **BOPIS Station (Click & Collect)**: In-store pickup fulfillment workflow: `Picking & Packing` -> `Ready for Pickup` -> 4-digit OTP handover validation.
- **BORIS Omnichannel Returns**: Bring any online CartX purchase into store for immediate physical restocking and instant refund.
- **Multi-Location Inventory Matrix**: Real-time stock matrix across Central Dark Warehouse, Indiranagar Flagship, and Koramangala Store with inter-location transfers.
- **Cash Drawer & Shift Balancing**: Register opening cash float, mid-day safe cash drops, and shift closing recount with discrepancy reporting.
- **Store Manager AI Assistant**: Unified 360 customer profile (`Arjun Kapoor`, `Sneha Reddy`), LTV, return rate, and AI smart upsell pitches for floor associates.

---

## 3. Quickstart & Setup Instructions

### Prerequisites
- Node.js **v20+** or **v22+**
- npm **v10+**

### 1. Install Monorepo Dependencies
```bash
cd d:/REA/devx-commerce
npm install
```

### 2. Seed the Database
Populates products, multi-location inventory, store shifts, past orders, SearchX synonyms, merchandising rules, and customer profiles:
```bash
npm run seed
```

### 3. Build All Monorepo Workspaces
Compiles `@cartx/shared`, `@cartx/widget`, `@cartx/api`, `@cartx/console`, `@cartx/demo-store`, and `@cartx/retailos`:
```bash
npm run build
```

### 4. Launch Full Stack
Run all 4 services concurrently with a single command:
```bash
npm run dev
```

Or start specific services individually:
- **API Server & Widget Host**: `npm run dev:backend` (runs on `http://localhost:4000`)
- **Merchant Console**: `npm run dev:console` (runs on `http://localhost:5173`)
- **Demo Storefront**: `npm run dev:store` (runs on `http://localhost:5174`)
- **RetailOS POS Terminal**: `npm run dev:retailos` (runs on `http://localhost:5175`)

---

## 4. Running Automated Tests

Run the full Vitest suite:
```bash
npm test
```

**Results**: **33 passed, 0 failed** across:
- `search-engine.test.ts` (6 tests: Levenshtein distance, intent budget parsing, typo tolerance, synonyms, pinning, facets)
- `cart-engine.test.ts` (9 tests: subtotal math, progress milestones, freebies, coupons, deterministic A/B hashing, upsell affinities)
- `api.test.ts` (18 integration tests: CartX pricing, checkout, analytics, SearchX search, query analytics, RetailOS POS sales, inventory transfers, shift balancing, BOPIS, BORIS returns, Customer 360)

Full test report available in [TEST_REPORT.md](file:///d:/REA/devx-commerce/TEST_REPORT.md).

---

## 5. Live Testing Checklist

1. **Test CartX (Storefront `http://localhost:5174`)**:
   - Open `http://localhost:5174`.
   - Click **Bag** to open the CartX drawer.
   - Add items (e.g. `Acid Wash Heavy Fleece Hoodie`, ₹2,499).
   - Observe the progress bar unlock **Free Shipping** (at ₹999) and auto-award **Free Canvas Tote Bag** (at ₹1,999).
   - Apply coupon `WELCOME10` and watch live savings update.
   - Click "Complete Secure Checkout" to record a live paid order.
2. **Test SearchX (Storefront `http://localhost:5174`)**:
   - Press `⌘K` (or `Ctrl+K`) or click **Search drops...** in the navbar.
   - Type `sneekers` -> notice the typo auto-corrects to `sneakers` and returns the Horizon Chunky Sneakers.
   - Type `pants under 2000` -> notice the budget constraint is parsed (`Max Price: ₹2,000`) and filters only qualifying bottoms.
   - Type `kicks` -> notice the synonym expands to retrieve footwear.
   - Click **+ Bag** directly on any result to add it to CartX.
3. **Test SearchX Studio (Console `http://localhost:5173`)**:
   - Open `http://localhost:5173` and click **SearchX Discovery Studio**.
   - Inspect Query Analytics (searches, clicks, CTR %).
   - Under **Synonyms Dictionary**, add a new synonym (e.g. `threads` -> `tshirt, streetwear`).
   - Under **Live Query Simulator**, run test searches in real time.
4. **Test RetailOS (POS Terminal `http://localhost:5175`)**:
   - Open `http://localhost:5175`.
   - On the **Touchscreen POS**, tap items to add to the register cart.
   - Click **Collect Tender**, select **UPI QR** or **Cash**, and click **Confirm Payment** to print the receipt and deduct floor stock.
   - Click **BOPIS Pickup**, view order `ord_bopis_781`, enter OTP `7482`, and mark collected.
   - Click **BORIS Omnichannel Returns**, submit return for `ord_ctrl_1`, and verify the unit is restocked to local inventory.
   - Click **Multi-Location Matrix**, initiate a stock transfer from the dark warehouse to Indiranagar flagship.
   - Click **Store Manager AI Assistant**, select `Arjun Kapoor`, and view his 360 profile and AI upsell pitches.
