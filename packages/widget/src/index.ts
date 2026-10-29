import {
  calculateCartPricing,
  formatPaise,
  CartItem,
  CartPricingResult,
  Product,
} from '@cartx/shared';
import { getWidgetStyles } from './styles.js';

class CartXWidget {
  private apiBase: string;
  private storeId: string;
  private collectionId?: string;
  private visitorId: string;
  private sessionId: string;

  private rootEl: HTMLElement | null = null;
  private shadow: ShadowRoot | null = null;

  private config: any = null;
  private items: CartItem[] = [];
  private pricing: CartPricingResult | null = null;
  private upsells: any[] = [];
  private catalog: Product[] = [];

  private isOpen = false;
  private appliedCouponCode?: string;
  private urgencySecondsRemaining = 15 * 60; // 15 mins
  private urgencyInterval: any = null;

  constructor() {
    // 1. Detect script attributes
    const script = document.currentScript as HTMLScriptElement | null;
    this.apiBase = script?.getAttribute('data-api') || 'http://localhost:4000';
    this.storeId = script?.getAttribute('data-store') || 'store_aura';
    this.collectionId = script?.getAttribute('data-collection') || undefined;

    // 2. Identify or generate visitor ID for deterministic A/B testing
    this.visitorId = this.getOrCreateId('cartx_visitor_id', 'v_');
    this.sessionId = this.getOrCreateId('cartx_session_id', 's_');

    // 3. Load saved cart items
    this.loadCart();

    // 4. Initialize DOM and listeners
    this.initDOM();
    this.loadConfig();
    this.loadCatalog();
    this.setupShopifyBridge();
  }

  private getOrCreateId(key: string, prefix: string): string {
    let val = localStorage.getItem(key);
    if (!val) {
      val = `${prefix}${Math.random().toString(36).substring(2, 10)}_${Date.now()}`;
      localStorage.setItem(key, val);
    }
    return val;
  }

  private loadCart() {
    try {
      const stored = localStorage.getItem(`cartx_${this.storeId}_items`);
      this.items = stored ? JSON.parse(stored) : [];
      this.appliedCouponCode = localStorage.getItem(`cartx_${this.storeId}_coupon`) || undefined;
    } catch {
      this.items = [];
    }
  }

  private saveCart() {
    try {
      // Save only non-freebie items (freebies are computed dynamically by engine)
      const regularItems = this.items.filter((i) => !i.isFreebie);
      localStorage.setItem(`cartx_${this.storeId}_items`, JSON.stringify(regularItems));
      if (this.appliedCouponCode) {
        localStorage.setItem(`cartx_${this.storeId}_coupon`, this.appliedCouponCode);
      } else {
        localStorage.removeItem(`cartx_${this.storeId}_coupon`);
      }
    } catch {}
  }

  private initDOM() {
    if (document.getElementById('cartx-root')) return;

    this.rootEl = document.createElement('div');
    this.rootEl.id = 'cartx-root';
    document.body.appendChild(this.rootEl);

    this.shadow = this.rootEl.attachShadow({ mode: 'open' });
  }

  private async loadConfig() {
    try {
      const url = new URL(`${this.apiBase}/v1/config`);
      url.searchParams.set('storeId', this.storeId);
      url.searchParams.set('visitorId', this.visitorId);
      if (this.collectionId) {
        url.searchParams.set('collectionId', this.collectionId);
      }

      const res = await fetch(url.toString());
      if (res.ok) {
        this.config = await res.json();
        this.urgencySecondsRemaining = (this.config.cartConfig?.urgencyTimerMinutes || 15) * 60;
        this.recalculate();
        this.render();
      }
    } catch (err) {
      console.warn('[CartX] Failed to fetch config, using fallback defaults', err);
      this.recalculate();
      this.render();
    }
  }

  private async loadCatalog() {
    try {
      const res = await fetch(`${this.apiBase}/v1/products?storeId=${this.storeId}`);
      if (res.ok) {
        const data = await res.json();
        this.catalog = data.products || [];
        this.recalculate();
        this.fetchUpsells();
      }
    } catch {}
  }

  private async fetchUpsells() {
    if (!this.config?.cartConfig?.modules?.aiUpsellCrossSell) {
      this.upsells = [];
      return;
    }

    try {
      const res = await fetch(`${this.apiBase}/v1/upsells`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeId: this.storeId,
          items: this.items,
          limit: 4,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        this.upsells = data.recommendations || [];
        this.render();
      }
    } catch {}
  }

  private recalculate() {
    const tiers = this.config?.tiers || [];
    const freebieRules = this.config?.freebieRules || [];
    const bundleOffers = this.config?.bundleOffers || [];
    const coupons = this.config?.coupons || [];

    // Run local pure engine
    this.pricing = calculateCartPricing({
      items: this.items,
      tiers,
      freebieRules,
      bundleOffers,
      coupons,
      catalog: this.catalog,
      appliedCouponCode: this.appliedCouponCode,
      shippingFeeInPaise: this.config?.cartConfig?.defaultShippingFeeInPaise ?? 9900,
      config: this.config?.cartConfig,
    });

    // Update items to include auto-added freebies
    this.items = this.pricing.items;

    // Dispatch update event for host page to sync badges
    window.dispatchEvent(
      new CustomEvent('cartx:updated', {
        detail: {
          itemCount: this.pricing.itemCount,
          subtotalInPaise: this.pricing.subtotalInPaise,
          grandTotalInPaise: this.pricing.grandTotalInPaise,
        },
      })
    );
  }

  private startUrgencyTimer() {
    if (this.urgencyInterval) clearInterval(this.urgencyInterval);

    this.urgencyInterval = setInterval(() => {
      if (this.urgencySecondsRemaining > 0) {
        this.urgencySecondsRemaining--;
        const timerEl = this.shadow?.querySelector('.cartx-urgency-timer');
        if (timerEl) {
          const m = Math.floor(this.urgencySecondsRemaining / 60);
          const s = this.urgencySecondsRemaining % 60;
          timerEl.textContent = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
        }
      } else {
        clearInterval(this.urgencyInterval);
      }
    }, 1000);
  }

  public open() {
    this.isOpen = true;
    this.render();
    this.startUrgencyTimer();
    this.trackEvent('cart_opened');

    // Notify listeners
    window.dispatchEvent(new CustomEvent('cartx:opened'));
  }

  public close() {
    this.isOpen = false;
    this.render();
    if (this.urgencyInterval) clearInterval(this.urgencyInterval);
    this.trackEvent('cart_closed');
    window.dispatchEvent(new CustomEvent('cartx:closed'));
  }

  public toggle() {
    if (this.isOpen) this.close();
    else this.open();
  }

  public addItem(item: Partial<CartItem> & { productId: string; title: string; priceInPaise: number }) {
    const existingIndex = this.items.findIndex(
      (i) => i.productId === item.productId && !i.isFreebie
    );

    if (existingIndex > -1) {
      this.items[existingIndex].quantity += item.quantity || 1;
    } else {
      const newItem: CartItem = {
        id: `item_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        productId: item.productId,
        title: item.title,
        priceInPaise: item.priceInPaise,
        compareAtPriceInPaise: item.compareAtPriceInPaise,
        quantity: item.quantity || 1,
        imageUrl: item.imageUrl || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=300',
      };
      this.items.push(newItem);
    }

    this.saveCart();
    this.recalculate();
    this.fetchUpsells();
    this.render();
    this.open();

    this.trackEvent('item_added', {
      productId: item.productId,
      title: item.title,
      priceInPaise: item.priceInPaise,
    });
  }

  public updateQuantity(itemId: string, qty: number) {
    if (qty <= 0) {
      this.removeItem(itemId);
      return;
    }

    const item = this.items.find((i) => i.id === itemId);
    if (item && !item.isFreebie) {
      item.quantity = qty;
      this.saveCart();
      this.recalculate();
      this.fetchUpsells();
      this.render();
      this.trackEvent('quantity_updated', { itemId, quantity: qty });
    }
  }

  public removeItem(itemId: string) {
    const item = this.items.find((i) => i.id === itemId);
    if (item?.isFreebie) return; // Freebies are auto-managed

    this.items = this.items.filter((i) => i.id !== itemId);
    this.saveCart();
    this.recalculate();
    this.fetchUpsells();
    this.render();
    this.trackEvent('item_removed', { itemId });
  }

  public applyCoupon(code: string) {
    this.appliedCouponCode = code.trim().toUpperCase();
    this.saveCart();
    this.recalculate();
    this.render();
    if (this.pricing?.appliedCoupon) {
      this.trackEvent('coupon_applied', { code: this.appliedCouponCode });
    }
  }

  public removeCoupon() {
    this.appliedCouponCode = undefined;
    this.saveCart();
    this.recalculate();
    this.render();
  }

  public setCollection(collectionId: string) {
    this.collectionId = collectionId;
    this.loadConfig();
  }

  public getCart() {
    return {
      items: this.items,
      pricing: this.pricing,
      itemCount: this.pricing?.itemCount || 0,
    };
  }

  private async checkout() {
    this.trackEvent('checkout_started');

    const customerName = prompt('Enter your full name for order delivery:', 'Rahul Sharma') || 'Rahul Sharma';
    const customerEmail = prompt('Enter your email address:', 'rahul@example.com') || 'rahul@example.com';
    const address = prompt('Enter delivery address:', 'Apt 4B, Koramangala 4th Block, Bengaluru, KA') || 'Koramangala, Bengaluru';

    try {
      const res = await fetch(`${this.apiBase}/v1/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeId: this.storeId,
          visitorId: this.visitorId,
          experimentId: this.config?.activeExperiment?.id,
          variantId: this.config?.activeExperiment?.assignedVariantId,
          customerName,
          customerEmail,
          shippingAddress: address,
          items: this.items,
          subtotalInPaise: this.pricing?.subtotalInPaise || 0,
          discountInPaise: this.pricing?.discountInPaise || 0,
          shippingFeeInPaise: this.pricing?.shippingFeeInPaise || 0,
          totalInPaise: this.pricing?.grandTotalInPaise || 0,
          savingsInPaise: this.pricing?.totalSavingsInPaise || 0,
          appliedCouponCode: this.pricing?.appliedCoupon?.code,
          paymentMethod: 'upi',
        }),
      });

      if (res.ok) {
        const data = await res.json();
        alert(
          `🎉 Order Confirmed!\n\nOrder ID: ${data.order.id}\nAmount Paid: ${formatPaise(
            data.order.totalInPaise
          )}\nConfirmation sent to: ${data.order.customerEmail}`
        );

        // Clear cart
        this.items = [];
        this.appliedCouponCode = undefined;
        this.saveCart();
        this.recalculate();
        this.close();
      } else {
        alert('Checkout error, please try again.');
      }
    } catch (err) {
      console.error('[CartX] Checkout failed', err);
      alert('Network error during checkout.');
    }
  }

  private trackEvent(eventName: string, metadata: Record<string, unknown> = {}) {
    try {
      fetch(`${this.apiBase}/v1/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeId: this.storeId,
          events: [
            {
              eventName,
              visitorId: this.visitorId,
              sessionId: this.sessionId,
              experimentId: this.config?.activeExperiment?.id,
              variantId: this.config?.activeExperiment?.assignedVariantId,
              metadata,
            },
          ],
        }),
      }).catch(() => {});
    } catch {}
  }

  private setupShopifyBridge() {
    // Intercept clicks on common cart open triggers
    document.addEventListener('click', (e) => {
      const target = (e.target as HTMLElement)?.closest(
        '[data-cartx-trigger], [href="/cart"], .cart-icon, .cart-button, #cart-icon-bubble'
      );
      if (target) {
        e.preventDefault();
        this.toggle();
      }
    });
  }

  private render() {
    if (!this.shadow) return;

    const theme = this.config?.cartConfig?.theme || {
      primaryColor: '#10b981',
      accentColor: '#f59e0b',
      backgroundColor: '#09090b',
      surfaceColor: '#18181b',
      textColor: '#fafafa',
      mutedTextColor: '#a1a1aa',
      borderRadiusPx: 12,
      drawerPosition: 'right',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    };

    const modules = this.config?.cartConfig?.modules || {
      urgencyProgressTools: true,
      freebiesAndBundles: true,
      aiUpsellCrossSell: true,
      couponSavingsEngine: true,
    };

    const pricing = this.pricing || {
      items: this.items,
      itemCount: this.items.length,
      subtotalInPaise: 0,
      discountInPaise: 0,
      shippingFeeInPaise: 0,
      grandTotalInPaise: 0,
      totalSavingsInPaise: 0,
      savingsBreakdown: [],
      activeTiersReached: [],
      nextTier: null,
      autoAddedFreebies: [],
    };

    const m = Math.floor(this.urgencySecondsRemaining / 60);
    const s = this.urgencySecondsRemaining % 60;
    const timeStr = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;

    // Progress bar math
    const nextTier = pricing.nextTier;
    const progressPct = nextTier ? nextTier.progressPct : 100;
    const progressMsg = nextTier
      ? `Add <span class="cartx-progress-highlight">${formatPaise(
          nextTier.amountNeededInPaise
        )}</span> more to unlock <span class="cartx-progress-highlight">${nextTier.tier.label}</span>!`
      : '🎉 You have unlocked all rewards and VIP discounts!';

    const tiers = this.config?.tiers || [];

    this.shadow.innerHTML = `
      <style>${getWidgetStyles(theme)}</style>

      <div class="cartx-backdrop ${this.isOpen ? 'open' : ''}" id="cartx-backdrop"></div>

      <div class="cartx-drawer ${this.isOpen ? 'open' : ''}" id="cartx-drawer">
        <!-- Header -->
        <div class="cartx-header">
          <div class="cartx-header-title">
            <span>Your Cart</span>
            <span class="cartx-header-badge">${pricing.itemCount}</span>
          </div>
          <button class="cartx-close-btn" id="cartx-close-btn" aria-label="Close cart">&times;</button>
        </div>

        <!-- Urgency Banner -->
        ${
          modules.urgencyProgressTools
            ? `
          <div class="cartx-urgency-banner">
            <span>${this.config?.cartConfig?.urgencyBannerText || '⚡ High Demand: Reserved in your cart'}</span>
            <span class="cartx-urgency-timer">${timeStr}</span>
          </div>
        `
            : ''
        }

        <!-- Gamified Progress Bar Section -->
        ${
          modules.urgencyProgressTools && tiers.length > 0
            ? `
          <div class="cartx-progress-section">
            <div class="cartx-progress-label">
              <span>${progressMsg}</span>
            </div>
            <div class="cartx-progress-track">
              <div class="cartx-progress-fill" style="width: ${progressPct}%;"></div>
              <div class="cartx-milestones">
                ${tiers
                  .map((t: any) => {
                    const unlocked = pricing.subtotalInPaise >= t.thresholdInPaise;
                    return `
                    <div class="cartx-milestone-marker ${unlocked ? 'unlocked' : ''}" title="${t.label}">
                      ${unlocked ? '✓' : '★'}
                    </div>
                  `;
                  })
                  .join('')}
              </div>
            </div>
            <div class="cartx-milestone-labels">
              ${tiers
                .map((t: any) => {
                  const unlocked = pricing.subtotalInPaise >= t.thresholdInPaise;
                  return `
                  <span class="cartx-milestone-text ${unlocked ? 'unlocked' : ''}">
                    ${t.label}
                  </span>
                `;
                })
                .join('')}
            </div>
          </div>
        `
            : ''
        }

        <!-- Scrollable Body -->
        <div class="cartx-body">
          ${
            pricing.items.length === 0
              ? `
            <div class="cartx-empty">
              <div class="cartx-empty-icon">🛍️</div>
              <div class="cartx-empty-title">Your cart is empty</div>
              <div class="cartx-empty-sub">Explore our bestselling collections and unlock free express delivery!</div>
            </div>
          `
              : `
            <!-- Item List -->
            ${pricing.items
              .map(
                (item) => `
              <div class="cartx-item-card">
                <img src="${item.imageUrl}" alt="${item.title}" class="cartx-item-image" />
                <div class="cartx-item-details">
                  <div>
                    <div class="cartx-item-title">${item.title}</div>
                    ${
                      item.isFreebie
                        ? `<div class="cartx-item-freebie-badge">🎁 FREE GIFT</div>`
                        : ''
                    }
                  </div>
                  <div class="cartx-item-pricing">
                    <span class="cartx-item-price">${
                      item.priceInPaise === 0 ? 'FREE' : formatPaise(item.priceInPaise)
                    }</span>
                    ${
                      item.compareAtPriceInPaise && item.compareAtPriceInPaise > item.priceInPaise
                        ? `<span class="cartx-item-compare">${formatPaise(item.compareAtPriceInPaise)}</span>`
                        : ''
                    }
                  </div>
                  <div class="cartx-item-controls">
                    ${
                      item.isFreebie
                        ? `<span style="font-size: 11px; color: #10b981; font-weight: 600;">Auto-added with reward</span>`
                        : `
                      <div class="cartx-qty-stepper">
                        <button class="cartx-qty-btn" data-action="dec" data-id="${item.id}">-</button>
                        <span class="cartx-qty-val">${item.quantity}</span>
                        <button class="cartx-qty-btn" data-action="inc" data-id="${item.id}">+</button>
                      </div>
                      <button class="cartx-remove-btn" data-action="remove" data-id="${item.id}">Remove</button>
                    `
                    }
                  </div>
                </div>
              </div>
            `
              )
              .join('')}

            <!-- AI / Curated Cross-Sell Section -->
            ${
              modules.aiUpsellCrossSell && this.upsells.length > 0
                ? `
              <div class="cartx-upsell-section">
                <div class="cartx-upsell-header">
                  <span class="cartx-upsell-title">✨ Frequently Added Together</span>
                </div>
                <div class="cartx-upsell-carousel">
                  ${this.upsells
                    .map(
                      (u) => `
                    <div class="cartx-upsell-card">
                      <div>
                        ${
                          u.badgeText
                            ? `<div class="cartx-upsell-badge">${u.badgeText}</div>`
                            : ''
                        }
                        <img src="${u.imageUrl}" alt="${u.title}" class="cartx-upsell-img" />
                        <div class="cartx-upsell-name">${u.title}</div>
                      </div>
                      <div>
                        <div class="cartx-upsell-price">${formatPaise(
                          u.discountedPriceInPaise || u.priceInPaise
                        )}</div>
                        <button class="cartx-upsell-add-btn" data-action="upsell-add" data-id="${u.id}">
                          + Add to Cart
                        </button>
                      </div>
                    </div>
                  `
                    )
                    .join('')}
                </div>
              </div>
            `
                : ''
            }

            <!-- Coupon Box -->
            ${
              modules.couponSavingsEngine
                ? `
              ${
                pricing.appliedCoupon
                  ? `
                <div class="cartx-coupon-active">
                  <span>🎟️ Code <b>${pricing.appliedCoupon.code}</b> Applied (${pricing.appliedCoupon.description})</span>
                  <button class="cartx-remove-btn" id="cartx-remove-coupon" style="color: #ef4444;">Remove</button>
                </div>
              `
                  : `
                <div class="cartx-coupon-box">
                  <input
                    type="text"
                    id="cartx-coupon-input"
                    class="cartx-coupon-input"
                    placeholder="Discount or Gift Card Code..."
                    value="${this.appliedCouponCode || ''}"
                  />
                  <button id="cartx-apply-coupon-btn" class="cartx-coupon-btn">Apply</button>
                </div>
                ${
                  pricing.couponError
                    ? `<div style="font-size: 11px; color: #ef4444; margin-top: 4px;">${pricing.couponError}</div>`
                    : ''
                }
              `
              }
            `
                : ''
            }
          `
          }
        </div>

        <!-- Footer -->
        ${
          pricing.items.length > 0
            ? `
          <div class="cartx-footer">
            ${
              pricing.totalSavingsInPaise > 0
                ? `
              <div class="cartx-savings-banner">
                <span>🔥 You're saving on this order</span>
                <span>${formatPaise(pricing.totalSavingsInPaise)}</span>
              </div>
            `
                : ''
            }

            <div class="cartx-row">
              <span>Subtotal</span>
              <span>${formatPaise(pricing.subtotalInPaise)}</span>
            </div>

            ${
              pricing.discountInPaise > 0
                ? `
              <div class="cartx-row" style="color: #10b981;">
                <span>Discounts & Offers</span>
                <span>-${formatPaise(pricing.discountInPaise)}</span>
              </div>
            `
                : ''
            }

            <div class="cartx-row">
              <span>Standard Delivery</span>
              <span>${
                pricing.shippingFeeInPaise === 0
                  ? '<b style="color: #10b981;">FREE</b>'
                  : formatPaise(pricing.shippingFeeInPaise)
              }</span>
            </div>

            <div class="cartx-row total">
              <span>Grand Total</span>
              <span>${formatPaise(pricing.grandTotalInPaise)}</span>
            </div>

            <button class="cartx-checkout-btn" id="cartx-checkout-btn">
              <span>Instant Checkout • ${formatPaise(pricing.grandTotalInPaise)}</span>
              <span>➔</span>
            </button>

            <div class="cartx-secure-badge">
              <span>🔒 256-bit Encrypted Checkout • UPI, Cards & COD Supported</span>
            </div>
          </div>
        `
            : ''
        }
      </div>
    `;

    this.attachEvents();
  }

  private attachEvents() {
    if (!this.shadow) return;

    // Close buttons
    this.shadow.getElementById('cartx-close-btn')?.addEventListener('click', () => this.close());
    this.shadow.getElementById('cartx-backdrop')?.addEventListener('click', () => this.close());

    // Stepper buttons
    this.shadow.querySelectorAll('[data-action="inc"]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id')!;
        const item = this.items.find((i) => i.id === id);
        if (item) this.updateQuantity(id, item.quantity + 1);
      });
    });

    this.shadow.querySelectorAll('[data-action="dec"]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id')!;
        const item = this.items.find((i) => i.id === id);
        if (item) this.updateQuantity(id, item.quantity - 1);
      });
    });

    this.shadow.querySelectorAll('[data-action="remove"]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id')!;
        this.removeItem(id);
      });
    });

    // Upsell Add Button
    this.shadow.querySelectorAll('[data-action="upsell-add"]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id')!;
        const upsellItem = this.upsells.find((u) => u.id === id);
        if (upsellItem) {
          this.trackEvent('upsell_clicked', { productId: id, title: upsellItem.title });
          this.addItem({
            productId: upsellItem.id,
            title: upsellItem.title,
            priceInPaise: upsellItem.discountedPriceInPaise || upsellItem.priceInPaise,
            compareAtPriceInPaise: upsellItem.priceInPaise,
            imageUrl: upsellItem.imageUrl,
            quantity: 1,
          });
        }
      });
    });

    // Coupon Apply & Remove
    const couponBtn = this.shadow.getElementById('cartx-apply-coupon-btn');
    const couponInput = this.shadow.getElementById('cartx-coupon-input') as HTMLInputElement | null;
    couponBtn?.addEventListener('click', () => {
      if (couponInput && couponInput.value.trim()) {
        this.applyCoupon(couponInput.value.trim());
      }
    });

    this.shadow.getElementById('cartx-remove-coupon')?.addEventListener('click', () => {
      this.removeCoupon();
    });

    // Checkout Button
    this.shadow.getElementById('cartx-checkout-btn')?.addEventListener('click', () => {
      this.checkout();
    });
  }
}

let instance: CartXWidget | null = null;

function getInstance(): CartXWidget {
  if (!instance) {
    instance = new CartXWidget();
  }
  return instance;
}

const CartX = {
  open: () => getInstance().open(),
  close: () => getInstance().close(),
  toggle: () => getInstance().toggle(),
  addItem: (item: any) => getInstance().addItem(item),
  removeItem: (id: string) => getInstance().removeItem(id),
  updateQuantity: (id: string, qty: number) => getInstance().updateQuantity(id, qty),
  applyCoupon: (code: string) => getInstance().applyCoupon(code),
  removeCoupon: () => getInstance().removeCoupon(),
  setCollection: (colId: string) => getInstance().setCollection(colId),
  getCart: () => getInstance().getCart(),
  getInstance,
};

declare global {
  interface Window {
    CartX: typeof CartX;
  }
}

if (typeof window !== 'undefined') {
  (window as any).CartX = CartX;
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => getInstance());
  } else {
    getInstance();
  }
}

export default CartX;
