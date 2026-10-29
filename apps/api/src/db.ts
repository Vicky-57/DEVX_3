import Database from 'better-sqlite3';
import path from 'node:path';
import fs from 'node:fs';

const dataDir = process.env.DATA_DIR || path.resolve(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = process.env.DB_PATH || path.join(dataDir, 'cartx.db');
export const db = new Database(dbPath);

// Enable WAL mode for high performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS stores (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      currency TEXT NOT NULL DEFAULT 'INR',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      store_id TEXT NOT NULL,
      title TEXT NOT NULL,
      handle TEXT NOT NULL,
      description TEXT NOT NULL,
      price_in_paise INTEGER NOT NULL,
      compare_at_price_in_paise INTEGER,
      image_url TEXT NOT NULL,
      category TEXT NOT NULL,
      tags_json TEXT NOT NULL DEFAULT '[]',
      inventory_count INTEGER NOT NULL DEFAULT 50,
      is_available INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS collections (
      id TEXT PRIMARY KEY,
      store_id TEXT NOT NULL,
      title TEXT NOT NULL,
      handle TEXT NOT NULL,
      description TEXT NOT NULL,
      banner_image_url TEXT,
      FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS product_collections (
      product_id TEXT NOT NULL,
      collection_id TEXT NOT NULL,
      PRIMARY KEY (product_id, collection_id),
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
      FOREIGN KEY (collection_id) REFERENCES collections(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS cart_configs (
      id TEXT PRIMARY KEY,
      store_id TEXT NOT NULL,
      name TEXT NOT NULL,
      collection_id TEXT,
      modules_json TEXT NOT NULL,
      theme_json TEXT NOT NULL,
      default_shipping_fee_in_paise INTEGER NOT NULL DEFAULT 9900,
      free_shipping_threshold_in_paise INTEGER NOT NULL DEFAULT 99900,
      urgency_timer_minutes INTEGER NOT NULL DEFAULT 15,
      urgency_banner_text TEXT NOT NULL DEFAULT '⚡ High Demand: Items in cart reserved for limited time',
      collection_banner_headline TEXT,
      collection_banner_subline TEXT,
      show_low_stock_alert INTEGER NOT NULL DEFAULT 1,
      low_stock_threshold INTEGER NOT NULL DEFAULT 5,
      FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS progress_tiers (
      id TEXT PRIMARY KEY,
      store_id TEXT NOT NULL,
      threshold_in_paise INTEGER NOT NULL,
      reward_type TEXT NOT NULL,
      reward_value INTEGER NOT NULL,
      label TEXT NOT NULL,
      icon TEXT NOT NULL,
      free_product_id TEXT,
      FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS freebie_rules (
      id TEXT PRIMARY KEY,
      store_id TEXT NOT NULL,
      min_spend_in_paise INTEGER NOT NULL,
      free_product_id TEXT NOT NULL,
      label TEXT NOT NULL,
      active INTEGER NOT NULL DEFAULT 1,
      FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS bundle_offers (
      id TEXT PRIMARY KEY,
      store_id TEXT NOT NULL,
      title TEXT NOT NULL,
      trigger_product_ids_json TEXT NOT NULL,
      discounted_product_id TEXT NOT NULL,
      discount_percent INTEGER NOT NULL,
      active INTEGER NOT NULL DEFAULT 1,
      FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS coupons (
      id TEXT PRIMARY KEY,
      store_id TEXT NOT NULL,
      code TEXT NOT NULL UNIQUE,
      type TEXT NOT NULL,
      value INTEGER NOT NULL,
      min_spend_in_paise INTEGER NOT NULL DEFAULT 0,
      max_discount_in_paise INTEGER,
      is_stackable INTEGER NOT NULL DEFAULT 0,
      auto_apply INTEGER NOT NULL DEFAULT 0,
      description TEXT NOT NULL,
      active INTEGER NOT NULL DEFAULT 1,
      FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS upsell_rules (
      id TEXT PRIMARY KEY,
      store_id TEXT NOT NULL,
      source_type TEXT NOT NULL,
      source_id TEXT,
      target_product_ids_json TEXT NOT NULL,
      is_pinned INTEGER NOT NULL DEFAULT 0,
      is_hidden INTEGER NOT NULL DEFAULT 0,
      custom_discount_pct INTEGER,
      badge_text TEXT,
      FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS experiments (
      id TEXT PRIMARY KEY,
      store_id TEXT NOT NULL,
      name TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'running',
      description TEXT,
      variants_json TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      store_id TEXT NOT NULL,
      cart_id TEXT,
      visitor_id TEXT NOT NULL,
      experiment_id TEXT,
      variant_id TEXT,
      customer_name TEXT NOT NULL,
      customer_email TEXT NOT NULL,
      customer_phone TEXT,
      shipping_address TEXT NOT NULL,
      items_json TEXT NOT NULL,
      subtotal_in_paise INTEGER NOT NULL,
      discount_in_paise INTEGER NOT NULL DEFAULT 0,
      shipping_fee_in_paise INTEGER NOT NULL DEFAULT 0,
      total_in_paise INTEGER NOT NULL,
      savings_in_paise INTEGER NOT NULL DEFAULT 0,
      applied_coupon_code TEXT,
      payment_method TEXT NOT NULL DEFAULT 'mock',
      status TEXT NOT NULL DEFAULT 'paid',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS analytics_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      store_id TEXT NOT NULL,
      event_name TEXT NOT NULL,
      visitor_id TEXT NOT NULL,
      session_id TEXT NOT NULL,
      experiment_id TEXT,
      variant_id TEXT,
      metadata_json TEXT NOT NULL DEFAULT '{}',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    /* SearchX Tables */
    CREATE TABLE IF NOT EXISTS search_synonyms (
      id TEXT PRIMARY KEY,
      store_id TEXT NOT NULL,
      trigger_word TEXT NOT NULL,
      replacement_words_json TEXT NOT NULL,
      active INTEGER NOT NULL DEFAULT 1,
      FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS search_merchandising_rules (
      id TEXT PRIMARY KEY,
      store_id TEXT NOT NULL,
      query TEXT NOT NULL,
      pinned_product_ids_json TEXT NOT NULL DEFAULT '[]',
      boosted_tags_json TEXT NOT NULL DEFAULT '[]',
      buried_product_ids_json TEXT NOT NULL DEFAULT '[]',
      active INTEGER NOT NULL DEFAULT 1,
      FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS search_queries_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      store_id TEXT NOT NULL,
      query TEXT NOT NULL,
      results_count INTEGER NOT NULL DEFAULT 0,
      clicked_product_id TEXT,
      converted INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    /* RetailOS Tables */
    CREATE TABLE IF NOT EXISTS locations (
      id TEXT PRIMARY KEY,
      store_id TEXT NOT NULL,
      name TEXT NOT NULL,
      type TEXT NOT NULL, /* warehouse, store, outlet */
      address TEXT NOT NULL,
      phone TEXT,
      is_active INTEGER NOT NULL DEFAULT 1,
      FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS location_inventory (
      location_id TEXT NOT NULL,
      product_id TEXT NOT NULL,
      on_hand INTEGER NOT NULL DEFAULT 0,
      reserved INTEGER NOT NULL DEFAULT 0,
      reorder_level INTEGER NOT NULL DEFAULT 10,
      PRIMARY KEY (location_id, product_id),
      FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS store_shifts (
      id TEXT PRIMARY KEY,
      location_id TEXT NOT NULL,
      staff_id TEXT NOT NULL,
      staff_name TEXT NOT NULL,
      opened_at TEXT NOT NULL DEFAULT (datetime('now')),
      closed_at TEXT,
      opening_float_paise INTEGER NOT NULL DEFAULT 500000, /* ₹5,000 */
      expected_cash_paise INTEGER NOT NULL DEFAULT 0,
      actual_cash_paise INTEGER,
      discrepancy_paise INTEGER,
      status TEXT NOT NULL DEFAULT 'open', /* open, closed */
      FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS cash_drawer_logs (
      id TEXT PRIMARY KEY,
      shift_id TEXT NOT NULL,
      type TEXT NOT NULL, /* drop, pickup, sale, refund */
      amount_paise INTEGER NOT NULL,
      reason TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (shift_id) REFERENCES store_shifts(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS bopis_orders (
      order_id TEXT PRIMARY KEY,
      store_id TEXT NOT NULL,
      pickup_location_id TEXT NOT NULL,
      pickup_status TEXT NOT NULL DEFAULT 'pending', /* pending, picking, ready, collected */
      pickup_otp TEXT NOT NULL,
      customer_name TEXT NOT NULL,
      customer_phone TEXT NOT NULL,
      ready_at TEXT,
      collected_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (pickup_location_id) REFERENCES locations(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS returns_exchanges (
      id TEXT PRIMARY KEY,
      store_id TEXT NOT NULL,
      order_id TEXT NOT NULL,
      location_id TEXT NOT NULL,
      customer_name TEXT NOT NULL,
      returned_items_json TEXT NOT NULL,
      refund_amount_paise INTEGER NOT NULL,
      action_type TEXT NOT NULL DEFAULT 'refund', /* refund, exchange, store_credit */
      reason TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'completed',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS store_staff (
      id TEXT PRIMARY KEY,
      location_id TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL, /* store_manager, cashier, inventory_lead */
      pin_code TEXT NOT NULL,
      is_active INTEGER NOT NULL DEFAULT 1,
      FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS customers (
      id TEXT PRIMARY KEY,
      store_id TEXT NOT NULL,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      phone TEXT,
      preferred_size TEXT,
      total_spend_paise INTEGER NOT NULL DEFAULT 0,
      total_orders INTEGER NOT NULL DEFAULT 0,
      return_count INTEGER NOT NULL DEFAULT 0,
      loyalty_tier TEXT NOT NULL DEFAULT 'Gold', /* Member, Silver, Gold, Platinum */
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
    CREATE INDEX IF NOT EXISTS idx_events_name ON analytics_events(event_name);
    CREATE INDEX IF NOT EXISTS idx_events_experiment ON analytics_events(experiment_id, variant_id);
    CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at);
    CREATE INDEX IF NOT EXISTS idx_search_query ON search_queries_log(query);
    CREATE INDEX IF NOT EXISTS idx_loc_inv ON location_inventory(location_id, product_id);
    CREATE INDEX IF NOT EXISTS idx_bopis_status ON bopis_orders(pickup_status);
  `);
}
