export interface Product {
  id: string;
  storeId: string;
  title: string;
  handle: string;
  description: string;
  priceInPaise: number;
  compareAtPriceInPaise?: number;
  imageUrl: string;
  category: string;
  tags: string[];
  inventoryCount: number;
  isAvailable: boolean;
  createdAt?: string;
}

export interface Collection {
  id: string;
  storeId: string;
  title: string;
  handle: string;
  description: string;
  bannerImageUrl?: string;
}

export interface CartItem {
  id: string;
  productId: string;
  title: string;
  priceInPaise: number;
  compareAtPriceInPaise?: number;
  quantity: number;
  imageUrl: string;
  isFreebie?: boolean;
  freebieRuleId?: string;
  appliedDiscountPercent?: number;
  selectedOptions?: Record<string, string>;
}

export type RewardType = 'free_shipping' | 'freebie' | 'discount_pct' | 'fixed_discount';

export interface ProgressTier {
  id: string;
  thresholdInPaise: number;
  rewardType: RewardType;
  rewardValue: number; // e.g. 10 for 10%, or paise for fixed
  label: string;
  icon: string; // e.g. "truck", "gift", "percent", "sparkles"
  freeProductId?: string;
}

export interface FreebieRule {
  id: string;
  storeId: string;
  minSpendInPaise: number;
  freeProductId: string;
  label: string;
  active: boolean;
}

export interface BundleOffer {
  id: string;
  storeId: string;
  title: string;
  triggerProductIds: string[];
  discountedProductId: string;
  discountPercent: number; // e.g. 25 = 25% off
  active: boolean;
}

export type CouponType = 'percentage' | 'fixed_amount' | 'free_shipping';

export interface Coupon {
  id: string;
  code: string;
  type: CouponType;
  value: number; // e.g. 15 for 15%, or 20000 for ₹200
  minSpendInPaise: number;
  maxDiscountInPaise?: number;
  isStackable: boolean;
  autoApply: boolean;
  description: string;
  active: boolean;
}

export interface UpsellRule {
  id: string;
  storeId: string;
  sourceType: 'global' | 'product' | 'collection';
  sourceId?: string; // product id or collection id, or undefined if global
  targetProductIds: string[];
  isPinned: boolean;
  isHidden: boolean;
  customDiscountPct?: number; // e.g. 10 for "Special in-cart price 10% OFF"
  badgeText?: string;
}

export interface Variant {
  id: string;
  experimentId: string;
  name: string; // "Control", "Gamified Tiers", "Sticky Banner"
  trafficPct: number; // 0..100
  configOverride?: Partial<CartConfig>;
}

export interface Experiment {
  id: string;
  storeId: string;
  name: string;
  status: 'draft' | 'running' | 'paused' | 'concluded';
  description?: string;
  variants: Variant[];
  createdAt: string;
}

export interface ThemeConfig {
  primaryColor: string;
  accentColor: string;
  backgroundColor: string;
  surfaceColor: string;
  textColor: string;
  mutedTextColor: string;
  borderRadiusPx: number;
  drawerPosition: 'right' | 'left';
  fontFamily: string;
}

export interface ModuleSettings {
  urgencyProgressTools: boolean;
  freebiesAndBundles: boolean;
  aiUpsellCrossSell: boolean;
  couponSavingsEngine: boolean;
  collectionSpecificCarts: boolean;
  advancedAnalytics: boolean;
  abTesting: boolean;
}

export interface CartConfig {
  id: string;
  storeId: string;
  name: string;
  collectionId?: string; // undefined means default/global
  modules: ModuleSettings;
  theme: ThemeConfig;
  defaultShippingFeeInPaise: number;
  freeShippingThresholdInPaise: number;
  urgencyTimerMinutes: number;
  urgencyBannerText: string;
  collectionBannerHeadline?: string;
  collectionBannerSubline?: string;
  showLowStockAlert: boolean;
  lowStockThreshold: number;
}

export interface SavingsBreakdownItem {
  label: string;
  amountInPaise: number;
  type: 'tier' | 'coupon' | 'freebie' | 'bundle';
}

export interface CartPricingInput {
  items: CartItem[];
  tiers?: ProgressTier[];
  freebieRules?: FreebieRule[];
  bundleOffers?: BundleOffer[];
  coupons?: Coupon[];
  catalog?: Product[];
  appliedCouponCode?: string;
  shippingFeeInPaise?: number;
  config?: CartConfig;
}

export interface CartPricingResult {
  items: CartItem[];
  itemCount: number;
  subtotalInPaise: number;
  discountInPaise: number;
  shippingFeeInPaise: number;
  grandTotalInPaise: number;
  totalSavingsInPaise: number;
  savingsBreakdown: SavingsBreakdownItem[];
  activeTiersReached: ProgressTier[];
  nextTier: {
    tier: ProgressTier;
    amountNeededInPaise: number;
    progressPct: number;
  } | null;
  autoAddedFreebies: CartItem[];
  appliedCoupon?: Coupon;
  couponError?: string;
}

export interface AnalyticsEvent {
  id?: string;
  storeId: string;
  eventName:
    | 'cart_opened'
    | 'cart_closed'
    | 'item_added'
    | 'item_removed'
    | 'quantity_updated'
    | 'tier_unlocked'
    | 'freebie_awarded'
    | 'upsell_rendered'
    | 'upsell_clicked'
    | 'coupon_applied'
    | 'checkout_started'
    | 'checkout_completed';
  visitorId: string;
  sessionId: string;
  experimentId?: string;
  variantId?: string;
  metadata?: Record<string, unknown>;
  createdAt?: string;
}

export interface Order {
  id: string;
  storeId: string;
  cartId?: string;
  visitorId: string;
  experimentId?: string;
  variantId?: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  shippingAddress: string;
  items: CartItem[];
  subtotalInPaise: number;
  discountInPaise: number;
  shippingFeeInPaise: number;
  totalInPaise: number;
  savingsInPaise: number;
  appliedCouponCode?: string;
  paymentMethod: 'upi' | 'card' | 'cod' | 'mock' | 'pos_split';
  status: 'paid' | 'pending' | 'cancelled';
  createdAt: string;
}

/* ==================== SearchX Types ==================== */

export interface SearchSynonym {
  id: string;
  storeId: string;
  triggerWord: string;
  replacementWords: string[];
  active: boolean;
}

export interface SearchMerchandisingRule {
  id: string;
  storeId: string;
  query: string;
  pinnedProductIds: string[];
  boostedTags: string[];
  buriedProductIds: string[];
  active: boolean;
}

export interface SearchQueryIntent {
  rawQuery: string;
  cleanQuery: string;
  detectedCategory?: string;
  maxPriceInPaise?: number;
  minPriceInPaise?: number;
  extractedTags: string[];
}

export interface SearchResultItem {
  product: Product;
  score: number;
  matchType: 'pinned' | 'exact' | 'typo_match' | 'semantic' | 'synonym';
  matchedTerms: string[];
}

export interface SearchFacetItem {
  name: string;
  count: number;
}

export interface SearchResponse {
  query: string;
  correctedQuery?: string;
  intent: SearchQueryIntent;
  total: number;
  items: SearchResultItem[];
  facets: {
    categories: SearchFacetItem[];
    priceRanges: Array<{ label: string; count: number; min: number; max: number }>;
  };
  executionTimeMs: number;
}

/* ==================== RetailOS Types ==================== */

export type LocationType = 'warehouse' | 'store' | 'outlet';

export interface RetailLocation {
  id: string;
  storeId: string;
  name: string;
  type: LocationType;
  address: string;
  phone?: string;
  isActive: boolean;
}

export interface LocationStock {
  locationId: string;
  locationName: string;
  locationType: LocationType;
  onHand: number;
  reserved: number;
  available: number;
  reorderLevel: number;
}

export interface ProductInventorySummary {
  productId: string;
  productTitle: string;
  sku: string;
  totalOnHand: number;
  totalAvailable: number;
  totalReserved: number;
  locations: LocationStock[];
}

export interface StoreShift {
  id: string;
  locationId: string;
  staffId: string;
  staffName: string;
  openedAt: string;
  closedAt?: string;
  openingFloatPaise: number;
  expectedCashPaise: number;
  actualCashPaise?: number;
  discrepancyPaise?: number;
  status: 'open' | 'closed';
}

export interface CashDrawerLog {
  id: string;
  shiftId: string;
  type: 'drop' | 'pickup' | 'sale' | 'refund';
  amountPaise: number;
  reason: string;
  createdAt: string;
}

export type BOPISStatus = 'pending' | 'picking' | 'ready' | 'collected';

export interface BOPISOrderRecord {
  orderId: string;
  storeId: string;
  pickupLocationId: string;
  pickupLocationName?: string;
  pickupStatus: BOPISStatus;
  pickupOtp: string;
  customerName: string;
  customerPhone: string;
  items: CartItem[];
  totalInPaise: number;
  readyAt?: string;
  collectedAt?: string;
  createdAt: string;
}

export interface ReturnExchangeRecord {
  id: string;
  storeId: string;
  orderId: string;
  locationId: string;
  locationName?: string;
  customerName: string;
  returnedItems: Array<{ productId: string; title: string; quantity: number; priceInPaise: number }>;
  refundAmountPaise: number;
  actionType: 'refund' | 'exchange' | 'store_credit';
  reason: string;
  status: 'completed';
  createdAt: string;
}

export interface StoreStaffMember {
  id: string;
  locationId: string;
  name: string;
  role: 'store_manager' | 'cashier' | 'inventory_lead';
  pinCode: string;
  isActive: boolean;
}

export interface CustomerProfile360 {
  id: string;
  storeId: string;
  name: string;
  email: string;
  phone?: string;
  preferredSize?: string;
  totalSpendPaise: number;
  totalOrders: number;
  returnCount: number;
  loyaltyTier: 'Member' | 'Silver' | 'Gold' | 'Platinum';
  notes?: string;
  pastOrders: Order[];
  aiRecommendations: Array<{
    productId: string;
    title: string;
    priceInPaise: number;
    imageUrl: string;
    pitchReason: string;
  }>;
}

export interface POSPaymentSplit {
  type: 'cash' | 'upi' | 'card' | 'store_credit';
  amountPaise: number;
}

export interface POSSaleInput {
  storeId?: string;
  locationId: string;
  staffId: string;
  staffName: string;
  customerId?: string;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  items: CartItem[];
  payments: POSPaymentSplit[];
  discountPaise?: number;
  notes?: string;
}
