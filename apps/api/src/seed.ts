import { db, initSchema } from './db.js';

export function runSeed() {
  initSchema();

  console.log('🌱 Seeding database for CartX...');

  // Clean existing data for clean re-seed
  db.exec(`
    DELETE FROM search_queries_log;
    DELETE FROM search_merchandising_rules;
    DELETE FROM search_synonyms;
    DELETE FROM cash_drawer_logs;
    DELETE FROM store_shifts;
    DELETE FROM bopis_orders;
    DELETE FROM returns_exchanges;
    DELETE FROM location_inventory;
    DELETE FROM locations;
    DELETE FROM store_staff;
    DELETE FROM customers;
    DELETE FROM analytics_events;
    DELETE FROM orders;
    DELETE FROM experiments;
    DELETE FROM upsell_rules;
    DELETE FROM coupons;
    DELETE FROM bundle_offers;
    DELETE FROM freebie_rules;
    DELETE FROM progress_tiers;
    DELETE FROM cart_configs;
    DELETE FROM product_collections;
    DELETE FROM collections;
    DELETE FROM products;
    DELETE FROM stores;
  `);

  const storeId = 'store_aura';

  // 1. Store
  db.prepare(`
    INSERT INTO stores (id, name, currency)
    VALUES (?, ?, ?)
  `).run(storeId, 'AURA D2C Lifestyle', 'INR');

  // 2. Collections
  const collections = [
    { id: 'col_trending', title: 'Trending Now', handle: 'trending', description: 'Our highest converting streetwear and gear.' },
    { id: 'col_streetwear', title: 'Streetwear & Tops', handle: 'streetwear', description: 'Heavyweight tees, luxury hoodies, and boxy fits.' },
    { id: 'col_footwear', title: 'Footwear & Kicks', handle: 'footwear', description: 'Chunky sneakers and retro runners.' },
    { id: 'col_accessories', title: 'Accessories & Essentials', handle: 'accessories', description: 'Bags, caps, bottles, and lifestyle accessories.' },
  ];

  const insertCollection = db.prepare(`
    INSERT INTO collections (id, store_id, title, handle, description)
    VALUES (?, ?, ?, ?, ?)
  `);

  for (const c of collections) {
    insertCollection.run(c.id, storeId, c.title, c.handle, c.description);
  }

  // 3. Products (all prices in paise: ₹1 = 100 paise)
  const products = [
    {
      id: 'prod_tee_heavy',
      title: 'Aura Heavyweight Boxy Tee - Vintage Black',
      handle: 'aura-heavyweight-tee-black',
      description: '280 GSM combed cotton with dropped shoulders and distressed ribbed collar.',
      priceInPaise: 129900, // ₹1,299
      compareAtPriceInPaise: 169900, // ₹1,699
      imageUrl: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=700&q=80',
      category: 'Streetwear',
      tags: ['streetwear', 'tee', 'oversized', 'bestseller'],
      inventoryCount: 65,
      collections: ['col_trending', 'col_streetwear'],
    },
    {
      id: 'prod_hoodie_acid',
      title: 'Acid Wash Heavy Fleece Hoodie - Charcoal',
      handle: 'acid-wash-fleece-hoodie',
      description: '450 GSM French Terry with double-layered hood and kangaroo pocket.',
      priceInPaise: 249900, // ₹2,499
      compareAtPriceInPaise: 329900, // ₹3,299
      imageUrl: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=700&q=80',
      category: 'Streetwear',
      tags: ['hoodie', 'fleece', 'winter', 'luxury'],
      inventoryCount: 30,
      collections: ['col_trending', 'col_streetwear'],
    },
    {
      id: 'prod_cargo_pants',
      title: 'Parachute Tactical Cargo Pants - Olive',
      handle: 'tactical-cargo-pants-olive',
      description: 'Water-resistant ripstop nylon with 6 utility pockets and adjustable ankle toggles.',
      priceInPaise: 219900, // ₹2,199
      compareAtPriceInPaise: 289900,
      imageUrl: 'https://images.unsplash.com/photo-1517445312882-bc9910d016b7?w=700&q=80',
      category: 'Streetwear',
      tags: ['cargo', 'streetwear', 'pants'],
      inventoryCount: 22,
      collections: ['col_streetwear'],
    },
    {
      id: 'prod_sneaker_chunky',
      title: 'Aura Horizon Chunky Sneakers - Bone White',
      handle: 'aura-horizon-chunky-sneakers',
      description: 'Premium split-suede overlays, EVA shock absorption, and architectural outsole.',
      priceInPaise: 399900, // ₹3,999
      compareAtPriceInPaise: 499900,
      imageUrl: 'https://images.unsplash.com/photo-1552346154-21d32810aba3?w=700&q=80',
      category: 'Footwear',
      tags: ['sneakers', 'footwear', 'chunky', 'bestseller'],
      inventoryCount: 18,
      collections: ['col_trending', 'col_footwear'],
    },
    {
      id: 'prod_runner_retro',
      title: 'Retro Track Runner V2 - Emerald Slate',
      handle: 'retro-track-runner-emerald',
      description: 'Breathable engineered mesh with reflective 3M accents and vintage gum sole.',
      priceInPaise: 349900, // ₹3,499
      compareAtPriceInPaise: 429900,
      imageUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=700&q=80',
      category: 'Footwear',
      tags: ['footwear', 'runners', 'retro'],
      inventoryCount: 15,
      collections: ['col_footwear'],
    },
    {
      id: 'prod_dad_cap',
      title: 'Washed Twill Low-Profile Dad Cap - Slate',
      handle: 'washed-twill-dad-cap',
      description: 'Unstructured 6-panel design with custom brass buckle closure.',
      priceInPaise: 69900, // ₹699
      compareAtPriceInPaise: 99900,
      imageUrl: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=700&q=80',
      category: 'Accessories',
      tags: ['cap', 'accessories', 'headwear', 'impulse'],
      inventoryCount: 80,
      collections: ['col_accessories'],
    },
    {
      id: 'prod_canvas_tote',
      title: 'Aura Heavyweight Canvas Tote Bag',
      handle: 'aura-canvas-tote',
      description: '16oz raw canvas with reinforced stitching and inner zip security pocket.',
      priceInPaise: 49900, // ₹499
      compareAtPriceInPaise: 79900,
      imageUrl: 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=700&q=80',
      category: 'Accessories',
      tags: ['tote', 'bag', 'canvas', 'freebie_target'],
      inventoryCount: 150,
      collections: ['col_accessories'],
    },
    {
      id: 'prod_crossbody_bag',
      title: 'Cordura Utility Sling & Crossbody Bag',
      handle: 'utility-sling-bag',
      description: 'Weatherproof 500D Cordura with Fidlock magnetic buckle and stormproof zips.',
      priceInPaise: 149900, // ₹1,499
      compareAtPriceInPaise: 199900,
      imageUrl: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=700&q=80',
      category: 'Accessories',
      tags: ['bag', 'sling', 'cordura', 'accessories'],
      inventoryCount: 35,
      collections: ['col_trending', 'col_accessories'],
    },
    {
      id: 'prod_tumbler',
      title: 'Vacuum Insulated Stainless Tumbler (750ml)',
      handle: 'stainless-vacuum-tumbler',
      description: 'Double-walled copper lining keeps drinks chilled for 24 hours or hot for 12 hours.',
      priceInPaise: 89900, // ₹899
      compareAtPriceInPaise: 119900,
      imageUrl: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=700&q=80',
      category: 'Accessories',
      tags: ['bottle', 'tumbler', 'lifestyle', 'impulse'],
      inventoryCount: 40,
      collections: ['col_accessories'],
    },
    {
      id: 'prod_socks_3pack',
      title: 'Ribbed Cushioned Crew Socks (3-Pack)',
      handle: 'cushioned-crew-socks-3pack',
      description: 'Targeted arch compression with terry loop cushioning for all-day comfort.',
      priceInPaise: 39900, // ₹399
      compareAtPriceInPaise: 59900,
      imageUrl: 'https://images.unsplash.com/photo-1586350977771-b3b0abd50c82?w=700&q=80',
      category: 'Accessories',
      tags: ['socks', 'footwear_care', 'accessories', 'cross_sell'],
      inventoryCount: 90,
      collections: ['col_accessories', 'col_footwear'],
    },
    {
      id: 'prod_sneaker_cleaner',
      title: 'Deep Foam Sneaker Cleaning & Care Kit',
      handle: 'sneaker-cleaning-care-kit',
      description: 'Eco-friendly foaming solution with premium horsehair brush and microfiber cloth.',
      priceInPaise: 59900, // ₹599
      compareAtPriceInPaise: 79900,
      imageUrl: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=700&q=80',
      category: 'Footwear Care',
      tags: ['cleaner', 'shoe_care', 'accessories'],
      inventoryCount: 75,
      collections: ['col_accessories', 'col_footwear'],
    },
    {
      id: 'prod_sticker_pack',
      title: 'Aura Holographic Vinyl Sticker Pack (10 pcs)',
      handle: 'holographic-sticker-pack',
      description: 'UV-resistant and waterproof holographic vinyl die-cut stickers.',
      priceInPaise: 19900, // ₹199
      compareAtPriceInPaise: 29900,
      imageUrl: 'https://images.unsplash.com/photo-1572375992501-4b0892d50c69?w=700&q=80',
      category: 'Merch',
      tags: ['stickers', 'freebie_target'],
      inventoryCount: 300,
      collections: ['col_accessories'],
    },
  ];

  const insertProduct = db.prepare(`
    INSERT INTO products (
      id, store_id, title, handle, description, price_in_paise,
      compare_at_price_in_paise, image_url, category, tags_json, inventory_count
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertProductCollection = db.prepare(`
    INSERT INTO product_collections (product_id, collection_id)
    VALUES (?, ?)
  `);

  for (const p of products) {
    insertProduct.run(
      p.id,
      storeId,
      p.title,
      p.handle,
      p.description,
      p.priceInPaise,
      p.compareAtPriceInPaise,
      p.imageUrl,
      p.category,
      JSON.stringify(p.tags),
      p.inventoryCount
    );

    for (const colId of p.collections) {
      insertProductCollection.run(p.id, colId);
    }
  }

  // 4. Cart Configs
  const defaultConfig = {
    id: 'cfg_default',
    store_id: storeId,
    name: 'Global Main Store Cart',
    collection_id: null,
    modules_json: JSON.stringify({
      urgencyProgressTools: true,
      freebiesAndBundles: true,
      aiUpsellCrossSell: true,
      couponSavingsEngine: true,
      collectionSpecificCarts: true,
      advancedAnalytics: true,
      abTesting: true,
    }),
    theme_json: JSON.stringify({
      primaryColor: '#10b981', // Emerald green
      accentColor: '#f59e0b', // Amber
      backgroundColor: '#09090b', // Dark obsidian
      surfaceColor: '#18181b', // Zinc surface
      textColor: '#fafafa',
      mutedTextColor: '#a1a1aa',
      borderRadiusPx: 12,
      drawerPosition: 'right',
      fontFamily: 'system-ui, -apple-system, sans-serif',
    }),
    default_shipping_fee_in_paise: 9900, // ₹99
    free_shipping_threshold_in_paise: 99900, // ₹999
    urgency_timer_minutes: 15,
    urgency_banner_text: '⚡ High Demand: Reserved in your cart for a limited time',
    collection_banner_headline: '🚀 FREE Shipping On Orders Above ₹999',
    collection_banner_subline: 'Use code WELCOME10 for an extra 10% OFF your first order!',
    show_low_stock_alert: 1,
    low_stock_threshold: 5,
  };

  const footwearConfig = {
    ...defaultConfig,
    id: 'cfg_footwear',
    name: 'Footwear Collection Cart',
    collection_id: 'col_footwear',
    collection_banner_headline: '👟 SNEAKERHEAD EXCLUSIVE: Free Shoe Care Kit with every pair!',
    collection_banner_subline: 'Limited stock: fast selling items reserved for 15 minutes only.',
  };

  const insertConfig = db.prepare(`
    INSERT INTO cart_configs (
      id, store_id, name, collection_id, modules_json, theme_json,
      default_shipping_fee_in_paise, free_shipping_threshold_in_paise,
      urgency_timer_minutes, urgency_banner_text, collection_banner_headline,
      collection_banner_subline, show_low_stock_alert, low_stock_threshold
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertConfig.run(
    defaultConfig.id,
    defaultConfig.store_id,
    defaultConfig.name,
    defaultConfig.collection_id,
    defaultConfig.modules_json,
    defaultConfig.theme_json,
    defaultConfig.default_shipping_fee_in_paise,
    defaultConfig.free_shipping_threshold_in_paise,
    defaultConfig.urgency_timer_minutes,
    defaultConfig.urgency_banner_text,
    defaultConfig.collection_banner_headline,
    defaultConfig.collection_banner_subline,
    defaultConfig.show_low_stock_alert,
    defaultConfig.low_stock_threshold
  );

  insertConfig.run(
    footwearConfig.id,
    footwearConfig.store_id,
    footwearConfig.name,
    footwearConfig.collection_id,
    footwearConfig.modules_json,
    footwearConfig.theme_json,
    footwearConfig.default_shipping_fee_in_paise,
    footwearConfig.free_shipping_threshold_in_paise,
    footwearConfig.urgency_timer_minutes,
    footwearConfig.urgency_banner_text,
    footwearConfig.collection_banner_headline,
    footwearConfig.collection_banner_subline,
    footwearConfig.show_low_stock_alert,
    footwearConfig.low_stock_threshold
  );

  // 5. Progress Tiers
  const tiers = [
    {
      id: 'tier_free_ship',
      threshold_in_paise: 99900, // ₹999
      reward_type: 'free_shipping',
      reward_value: 0,
      label: 'Free Express Shipping',
      icon: 'truck',
      free_product_id: null,
    },
    {
      id: 'tier_free_tote',
      threshold_in_paise: 199900, // ₹1,999
      reward_type: 'freebie',
      reward_value: 0,
      label: 'Free Canvas Tote Bag (₹499 value)',
      icon: 'gift',
      free_product_id: 'prod_canvas_tote',
    },
    {
      id: 'tier_extra_discount',
      threshold_in_paise: 299900, // ₹2,999
      reward_type: 'discount_pct',
      reward_value: 15,
      label: '15% Extra Instant Discount',
      icon: 'percent',
      free_product_id: null,
    },
  ];

  const insertTier = db.prepare(`
    INSERT INTO progress_tiers (
      id, store_id, threshold_in_paise, reward_type, reward_value, label, icon, free_product_id
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const t of tiers) {
    insertTier.run(t.id, storeId, t.threshold_in_paise, t.reward_type, t.reward_value, t.label, t.icon, t.free_product_id);
  }

  // 6. Freebie Rules
  db.prepare(`
    INSERT INTO freebie_rules (id, store_id, min_spend_in_paise, free_product_id, label, active)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run('rule_free_stickers', storeId, 79900, 'prod_sticker_pack', 'Holographic Sticker Pack', 1);

  // 7. Bundle Offers
  db.prepare(`
    INSERT INTO bundle_offers (id, store_id, title, trigger_product_ids_json, discounted_product_id, discount_percent, active)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    'bundle_hoodie_cap',
    storeId,
    'Streetwear Combo (Hoodie + Cap)',
    JSON.stringify(['prod_hoodie_acid']),
    'prod_dad_cap',
    25, // 25% OFF Dad Cap when bought with Hoodie
    1
  );

  // 8. Coupons
  const coupons = [
    {
      id: 'coup_welcome',
      code: 'WELCOME10',
      type: 'percentage',
      value: 10,
      min_spend_in_paise: 99900,
      max_discount_in_paise: 30000,
      is_stackable: 1,
      auto_apply: 1,
      description: '10% OFF first order above ₹999 (Max ₹300)',
    },
    {
      id: 'coup_vip',
      code: 'AURAVIP',
      type: 'fixed_amount',
      value: 50000, // ₹500
      min_spend_in_paise: 250000, // ₹2,500
      max_discount_in_paise: null,
      is_stackable: 0,
      auto_apply: 0,
      description: 'Flat ₹500 OFF on luxury orders above ₹2,500',
    },
    {
      id: 'coup_freeship',
      code: 'FREESHIP',
      type: 'free_shipping',
      value: 0,
      min_spend_in_paise: 0,
      max_discount_in_paise: null,
      is_stackable: 1,
      auto_apply: 0,
      description: 'Free Shipping on any cart size',
    },
  ];

  const insertCoupon = db.prepare(`
    INSERT INTO coupons (
      id, store_id, code, type, value, min_spend_in_paise, max_discount_in_paise, is_stackable, auto_apply, description
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const c of coupons) {
    insertCoupon.run(
      c.id,
      storeId,
      c.code,
      c.type,
      c.value,
      c.min_spend_in_paise,
      c.max_discount_in_paise,
      c.is_stackable,
      c.auto_apply,
      c.description
    );
  }

  // 9. Upsell Rules
  db.prepare(`
    INSERT INTO upsell_rules (
      id, store_id, source_type, source_id, target_product_ids_json, is_pinned, is_hidden, custom_discount_pct, badge_text
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    'upsell_cap_global',
    storeId,
    'global',
    null,
    JSON.stringify(['prod_dad_cap', 'prod_socks_3pack']),
    1,
    0,
    15,
    'Special 15% OFF In-Cart'
  );

  db.prepare(`
    INSERT INTO upsell_rules (
      id, store_id, source_type, source_id, target_product_ids_json, is_pinned, is_hidden, custom_discount_pct, badge_text
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    'upsell_sneaker_care',
    storeId,
    'product',
    'prod_sneaker_chunky',
    JSON.stringify(['prod_sneaker_cleaner', 'prod_socks_3pack']),
    1,
    0,
    20,
    'Sneakerhead Essential (20% OFF)'
  );

  // 10. A/B Experiment
  const experiment = {
    id: 'exp_cartx_launch',
    store_id: storeId,
    name: 'CartX Gamification & Conversion Lift Test',
    status: 'running',
    description: 'Measuring AOV and cart-to-checkout conversion rate of Gamified Tiers vs Standard Cart.',
    variants_json: JSON.stringify([
      {
        id: 'var_control',
        experimentId: 'exp_cartx_launch',
        name: 'Variant A: Standard Cart (No Tiers/Freebies)',
        trafficPct: 50,
        configOverride: {
          modules: {
            urgencyProgressTools: false,
            freebiesAndBundles: false,
            aiUpsellCrossSell: false,
            couponSavingsEngine: true,
            collectionSpecificCarts: false,
            advancedAnalytics: true,
            abTesting: true,
          },
        },
      },
      {
        id: 'var_cartx_full',
        experimentId: 'exp_cartx_launch',
        name: 'Variant B: Full CartX (Gamified Tiers + Freebies + AI Upsells)',
        trafficPct: 50,
        configOverride: {},
      },
    ]),
  };

  db.prepare(`
    INSERT INTO experiments (id, store_id, name, status, description, variants_json)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    experiment.id,
    experiment.store_id,
    experiment.name,
    experiment.status,
    experiment.description,
    experiment.variants_json
  );

  // 11. Seed realistic historical analytics events & orders for dashboard metrics
  console.log('📊 Seeding analytics events and orders for live analytics...');

  const insertEvent = db.prepare(`
    INSERT INTO analytics_events (store_id, event_name, visitor_id, session_id, experiment_id, variant_id, metadata_json, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertOrder = db.prepare(`
    INSERT INTO orders (
      id, store_id, visitor_id, experiment_id, variant_id, customer_name,
      customer_email, shipping_address, items_json, subtotal_in_paise,
      discount_in_paise, shipping_fee_in_paise, total_in_paise, savings_in_paise,
      applied_coupon_code, payment_method, status, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  // Generate 80 visits for Variant A (Control)
  // Control: ~22% conversion, ~₹1,850 AOV
  for (let i = 1; i <= 80; i++) {
    const vId = `visitor_ctrl_${i}`;
    const sId = `session_ctrl_${i}`;
    const date = new Date(Date.now() - (80 - i) * 3600 * 500).toISOString();

    insertEvent.run(storeId, 'cart_opened', vId, sId, experiment.id, 'var_control', '{}', date);
    insertEvent.run(storeId, 'item_added', vId, sId, experiment.id, 'var_control', '{"item":"prod_tee_heavy"}', date);

    if (i <= 18) {
      // 18 converted out of 80 (22.5%)
      insertEvent.run(storeId, 'checkout_completed', vId, sId, experiment.id, 'var_control', '{}', date);
      insertOrder.run(
        `ord_ctrl_${i}`,
        storeId,
        vId,
        experiment.id,
        'var_control',
        `Customer ${i}`,
        `customer${i}@example.com`,
        '104 Indiranagar, Bengaluru, KA',
        JSON.stringify([{ productId: 'prod_tee_heavy', title: 'Aura Heavyweight Boxy Tee', quantity: 1, priceInPaise: 129900 }]),
        129900,
        0,
        9900,
        139800,
        0,
        null,
        'upi',
        'paid',
        date
      );
    }
  }

  // Generate 80 visits for Variant B (CartX Full)
  // CartX: ~31% conversion (+40% relative lift), ~₹2,680 AOV (+45% AOV lift due to upsells and ₹1,999 freebie tier threshold)
  for (let i = 1; i <= 80; i++) {
    const vId = `visitor_cartx_${i}`;
    const sId = `session_cartx_${i}`;
    const date = new Date(Date.now() - (80 - i) * 3600 * 500).toISOString();

    insertEvent.run(storeId, 'cart_opened', vId, sId, experiment.id, 'var_cartx_full', '{}', date);
    insertEvent.run(storeId, 'item_added', vId, sId, experiment.id, 'var_cartx_full', '{"item":"prod_hoodie_acid"}', date);
    insertEvent.run(storeId, 'tier_unlocked', vId, sId, experiment.id, 'var_cartx_full', '{"tier":"tier_free_tote"}', date);

    if (i % 3 === 0) {
      insertEvent.run(storeId, 'upsell_clicked', vId, sId, experiment.id, 'var_cartx_full', '{"item":"prod_dad_cap"}', date);
    }

    if (i <= 25) {
      // 25 converted out of 80 (31.25% conversion!)
      insertEvent.run(storeId, 'checkout_completed', vId, sId, experiment.id, 'var_cartx_full', '{}', date);
      insertOrder.run(
        `ord_cartx_${i}`,
        storeId,
        vId,
        experiment.id,
        'var_cartx_full',
        `VIP Customer ${i}`,
        `vip${i}@example.com`,
        '402 Jubilee Hills, Hyderabad, TS',
        JSON.stringify([
          { productId: 'prod_hoodie_acid', title: 'Acid Wash Heavy Fleece Hoodie', quantity: 1, priceInPaise: 249900 },
          { productId: 'prod_dad_cap', title: 'Washed Twill Low-Profile Dad Cap', quantity: 1, priceInPaise: 59415 },
          { productId: 'prod_canvas_tote', title: '[FREE] Aura Heavyweight Canvas Tote Bag', quantity: 1, priceInPaise: 0, isFreebie: true },
        ]),
        309315,
        10485,
        0,
        298830,
        59900,
        'WELCOME10',
        'upi',
        'paid',
        date
      );
    }
  }

  // 12. Seed SearchX Data (Synonyms, Merchandising Rules, and Search History)
  console.log('🔍 Seeding SearchX synonyms, merchandising rules, and query logs...');

  const synonyms = [
    { trigger: 'kicks', replacements: ['sneakers', 'shoes', 'footwear', 'runners'] },
    { trigger: 'tee', replacements: ['tshirt', 't-shirt', 'top', 'boxy'] },
    { trigger: 'hoodie', replacements: ['fleece', 'sweatshirt', 'winter'] },
    { trigger: 'shades', replacements: ['sunglasses', 'eyewear'] },
    { trigger: 'pack', replacements: ['combo', 'bundle', 'set'] },
  ];

  const insertSynonym = db.prepare(`
    INSERT INTO search_synonyms (id, store_id, trigger_word, replacement_words_json, active)
    VALUES (?, ?, ?, ?, 1)
  `);

  synonyms.forEach((s, idx) => {
    insertSynonym.run(`syn_${idx + 1}`, storeId, s.trigger, JSON.stringify(s.replacements));
  });

  // Merchandising Rule: "summer" pins Dad Cap and Canvas Tote
  db.prepare(`
    INSERT INTO search_merchandising_rules (
      id, store_id, query, pinned_product_ids_json, boosted_tags_json, buried_product_ids_json, active
    ) VALUES (?, ?, ?, ?, ?, ?, 1)
  `).run(
    'rule_merch_summer',
    storeId,
    'summer',
    JSON.stringify(['prod_dad_cap', 'prod_canvas_tote']),
    JSON.stringify(['cotton', 'accessories']),
    JSON.stringify(['prod_hoodie_acid'])
  );

  // Search Queries Log with realistic analytics
  const pastQueries = [
    { q: 'oversized tee', count: 42, clicks: 35, results: 2 },
    { q: 'sneakers', count: 56, clicks: 48, results: 3 },
    { q: 'hoodie under 2500', count: 28, clicks: 22, results: 1 },
    { q: 'shooes', count: 18, clicks: 14, results: 2 }, // Typo test query
    { q: 'kicks', count: 24, clicks: 19, results: 2 },  // Synonym test query
    { q: 'leather jacket', count: 12, clicks: 0, results: 0 }, // Zero results
    { q: 'canvas tote bag', count: 31, clicks: 26, results: 1 },
  ];

  const insertSearchLog = db.prepare(`
    INSERT INTO search_queries_log (store_id, query, results_count, clicked_product_id, created_at)
    VALUES (?, ?, ?, ?, datetime('now', ?))
  `);

  for (const pq of pastQueries) {
    for (let i = 0; i < pq.count; i++) {
      const isClicked = i < pq.clicks;
      const clickedProd = isClicked ? 'prod_tee_heavy' : null;
      const offset = `-${Math.floor(Math.random() * 7)} days`;
      insertSearchLog.run(storeId, pq.q, pq.results, clickedProd, offset);
    }
  }

  // 13. Seed RetailOS Locations, Staff, Shifts, and Multi-Location Inventory
  console.log('🏪 Seeding RetailOS locations, staff, POS shifts, and inventory matrix...');

  const locations = [
    {
      id: 'loc_online',
      name: 'Central E-Commerce Dark Warehouse',
      type: 'warehouse',
      address: 'Plot 42, Electronic City Phase 1, Bengaluru, KA',
      phone: '+91 80 4912 0001',
    },
    {
      id: 'loc_flagship',
      name: 'Indiranagar Flagship Store',
      type: 'store',
      address: '744, 100 Feet Road, Indiranagar, Bengaluru, KA',
      phone: '+91 80 2521 8890',
    },
    {
      id: 'loc_mall',
      name: 'Koramangala Store & Lounge',
      type: 'outlet',
      address: '80 Feet Road, 4th Block, Koramangala, Bengaluru, KA',
      phone: '+91 80 4115 6720',
    },
  ];

  const insertLocation = db.prepare(`
    INSERT INTO locations (id, store_id, name, type, address, phone, is_active)
    VALUES (?, ?, ?, ?, ?, ?, 1)
  `);

  for (const loc of locations) {
    insertLocation.run(loc.id, storeId, loc.name, loc.type, loc.address, loc.phone);
  }

  // Multi-location inventory for all 12 products
  const insertLocInv = db.prepare(`
    INSERT INTO location_inventory (location_id, product_id, on_hand, reserved, reorder_level)
    VALUES (?, ?, ?, ?, ?)
  `);

  for (const prod of products) {
    // Warehouse has bulk stock
    insertLocInv.run('loc_online', prod.id, 60, 4, 15);
    // Flagship has retail floor stock
    insertLocInv.run('loc_flagship', prod.id, 20, 2, 8);
    // Mall store has boutique stock
    insertLocInv.run('loc_mall', prod.id, 12, 1, 5);
  }

  // Store Staff
  const staffMembers = [
    { id: 'staff_karan', locationId: 'loc_flagship', name: 'Karan Mehta', role: 'store_manager', pin: '1234' },
    { id: 'staff_priya', locationId: 'loc_flagship', name: 'Priya Nair', role: 'cashier', pin: '5678' },
    { id: 'staff_rahul', locationId: 'loc_mall', name: 'Rahul Verma', role: 'store_manager', pin: '9012' },
  ];

  const insertStaff = db.prepare(`
    INSERT INTO store_staff (id, location_id, name, role, pin_code, is_active)
    VALUES (?, ?, ?, ?, ?, 1)
  `);

  for (const sm of staffMembers) {
    insertStaff.run(sm.id, sm.locationId, sm.name, sm.role, sm.pin);
  }

  // Open shift for Flagship Store
  const shiftId = 'shift_flagship_live';
  db.prepare(`
    INSERT INTO store_shifts (
      id, location_id, staff_id, staff_name, opened_at, opening_float_paise, expected_cash_paise, status
    ) VALUES (?, ?, ?, ?, datetime('now', '-4 hours'), 500000, 749800, 'open')
  `).run(shiftId, 'loc_flagship', 'staff_karan', 'Karan Mehta');

  // Drawer logs for active shift
  db.prepare(`
    INSERT INTO cash_drawer_logs (id, shift_id, type, amount_paise, reason, created_at)
    VALUES (?, ?, 'opening_float', 500000, 'Opening Float', datetime('now', '-4 hours'))
  `).run('log_shift_open', shiftId);

  db.prepare(`
    INSERT INTO cash_drawer_logs (id, shift_id, type, amount_paise, reason, created_at)
    VALUES (?, ?, 'sale', 249800, 'POS Cash Sale ord_pos_101', datetime('now', '-2 hours'))
  `).run('log_shift_sale1', shiftId);

  // Customers with 360 attributes
  const customers = [
    {
      id: 'cust_arjun',
      name: 'Arjun Kapoor',
      email: 'arjun.k@example.com',
      phone: '+91 98450 12345',
      size: 'L',
      spend: 1849600, // ₹18,496
      orders: 7,
      returns: 0,
      tier: 'Platinum',
      notes: 'Loves oversized fits. Frequently visits Indiranagar flagship on weekends.',
    },
    {
      id: 'cust_sneha',
      name: 'Sneha Reddy',
      email: 'sneha.r@example.com',
      phone: '+91 98860 67890',
      size: 'M',
      spend: 929700, // ₹9,297
      orders: 4,
      returns: 1,
      tier: 'Gold',
      notes: 'Prefers chunky sneakers (Size UK 7) and neutral tones.',
    },
    {
      id: 'cust_vikram',
      name: 'Vikram Malhotra',
      email: 'vikram.m@example.com',
      phone: '+91 99000 54321',
      size: 'XL',
      spend: 499800, // ₹4,998
      orders: 2,
      returns: 0,
      tier: 'Silver',
      notes: 'Activewear and accessories fan.',
    },
  ];

  const insertCust = db.prepare(`
    INSERT INTO customers (
      id, store_id, name, email, phone, preferred_size, total_spend_paise, total_orders, return_count, loyalty_tier, notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const c of customers) {
    insertCust.run(c.id, storeId, c.name, c.email, c.phone, c.size, c.spend, c.orders, c.returns, c.tier, c.notes);
  }

  // BOPIS Orders (Buy Online, Pick Up in Store)
  const bopisOrders = [
    {
      orderId: 'ord_bopis_781',
      locationId: 'loc_flagship',
      status: 'ready',
      otp: '7482',
      customerName: 'Arjun Kapoor',
      customerPhone: '+91 98450 12345',
      items: [{ productId: 'prod_hoodie_acid', title: 'Acid Wash Boxy Hoodie', quantity: 1, priceInPaise: 249900 }],
      totalPaise: 249900,
    },
    {
      orderId: 'ord_bopis_892',
      locationId: 'loc_flagship',
      status: 'picking',
      otp: '3918',
      customerName: 'Sneha Reddy',
      customerPhone: '+91 98860 67890',
      items: [{ productId: 'prod_sneaker_chunky', title: 'Aura Horizon Chunky Sneakers', quantity: 1, priceInPaise: 399900 }],
      totalPaise: 399900,
    },
  ];

  const insertBopisOrder = db.prepare(`
    INSERT INTO orders (
      id, store_id, visitor_id, customer_name, customer_email, customer_phone,
      shipping_address, items_json, subtotal_in_paise, discount_in_paise,
      shipping_fee_in_paise, total_in_paise, savings_in_paise, payment_method, status
    ) VALUES (?, ?, 'visitor_bopis', ?, ?, ?, 'BOPIS Pick Up - Indiranagar Flagship', ?, ?, 0, 0, ?, 0, 'upi', 'paid')
  `);

  const insertBopis = db.prepare(`
    INSERT INTO bopis_orders (
      order_id, store_id, pickup_location_id, pickup_status, pickup_otp, customer_name, customer_phone, ready_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now', '-1 hour'))
  `);

  for (const bo of bopisOrders) {
    insertBopisOrder.run(
      bo.orderId,
      storeId,
      bo.customerName,
      'bopis@customer.com',
      bo.customerPhone,
      JSON.stringify(bo.items),
      bo.totalPaise,
      bo.totalPaise
    );

    insertBopis.run(
      bo.orderId,
      storeId,
      bo.locationId,
      bo.status,
      bo.otp,
      bo.customerName,
      bo.customerPhone
    );
  }

  console.log('✅ Seeding completed successfully!');
}

runSeed();
