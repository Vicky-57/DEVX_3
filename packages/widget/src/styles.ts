export function getWidgetStyles(theme: {
  primaryColor: string;
  accentColor: string;
  backgroundColor: string;
  surfaceColor: string;
  textColor: string;
  mutedTextColor: string;
  borderRadiusPx: number;
  drawerPosition: 'right' | 'left';
  fontFamily: string;
}): string {
  const isLeft = theme.drawerPosition === 'left';

  return `
    :host {
      all: initial;
      font-family: ${theme.fontFamily || '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'};
      box-sizing: border-box;
      z-index: 9999999;
      position: relative;
    }

    *, *::before, *::after {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    .cartx-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(0, 0, 0, 0.7);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.3s cubic-bezier(0.16, 1, 0.3, 1);
      z-index: 9999990;
    }

    .cartx-backdrop.open {
      opacity: 1;
      pointer-events: auto;
    }

    .cartx-drawer {
      position: fixed;
      top: 0;
      ${isLeft ? 'left: 0;' : 'right: 0;'}
      width: 100%;
      max-width: 440px;
      height: 100vh;
      height: 100dvh;
      background: ${theme.backgroundColor || '#09090b'};
      color: ${theme.textColor || '#fafafa'};
      box-shadow: ${isLeft ? '20px 0 50px rgba(0,0,0,0.8)' : '-20px 0 50px rgba(0,0,0,0.8)'};
      transform: ${isLeft ? 'translateX(-100%)' : 'translateX(100%)'};
      transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1);
      display: flex;
      flex-direction: column;
      z-index: 9999995;
      border-${isLeft ? 'right' : 'left'}: 1px solid rgba(255, 255, 255, 0.08);
      overflow: hidden;
    }

    .cartx-drawer.open {
      transform: translateX(0);
    }

    /* Header */
    .cartx-header {
      padding: 18px 20px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      background: ${theme.surfaceColor || '#18181b'};
    }

    .cartx-header-title {
      font-size: 17px;
      font-weight: 700;
      display: flex;
      align-items: center;
      gap: 8px;
      letter-spacing: -0.02em;
    }

    .cartx-header-badge {
      font-size: 12px;
      background: ${theme.primaryColor || '#10b981'};
      color: #000;
      font-weight: 700;
      padding: 2px 8px;
      border-radius: 20px;
    }

    .cartx-close-btn {
      background: transparent;
      border: none;
      color: ${theme.mutedTextColor || '#a1a1aa'};
      font-size: 22px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      border-radius: 8px;
      transition: all 0.2s;
    }

    .cartx-close-btn:hover {
      background: rgba(255, 255, 255, 0.1);
      color: #fff;
    }

    /* Urgency Banner */
    .cartx-urgency-banner {
      background: linear-gradient(90deg, #1c1917, #292524);
      border-bottom: 1px solid rgba(245, 158, 11, 0.2);
      padding: 10px 18px;
      font-size: 12px;
      color: #fef3c7;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
    }

    .cartx-urgency-timer {
      font-weight: 800;
      color: #f59e0b;
      font-family: monospace;
      font-size: 13px;
    }

    /* Progress Tier Bar */
    .cartx-progress-section {
      padding: 16px 20px;
      background: rgba(24, 24, 27, 0.7);
      border-bottom: 1px solid rgba(255, 255, 255, 0.06);
    }

    .cartx-progress-label {
      font-size: 13px;
      font-weight: 600;
      margin-bottom: 10px;
      display: flex;
      justify-content: space-between;
      color: #e4e4e7;
    }

    .cartx-progress-highlight {
      color: ${theme.primaryColor || '#10b981'};
      font-weight: 700;
    }

    .cartx-progress-track {
      position: relative;
      height: 8px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 10px;
      overflow: visible;
      margin: 12px 0 20px 0;
    }

    .cartx-progress-fill {
      height: 100%;
      background: linear-gradient(90deg, ${theme.primaryColor || '#10b981'}, #34d399);
      border-radius: 10px;
      transition: width 0.4s cubic-bezier(0.16, 1, 0.3, 1);
      box-shadow: 0 0 12px rgba(16, 185, 129, 0.4);
    }

    .cartx-milestones {
      display: flex;
      justify-content: space-between;
      position: absolute;
      top: -6px;
      left: 0;
      width: 100%;
      pointer-events: none;
    }

    .cartx-milestone-marker {
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background: #27272a;
      border: 2px solid rgba(255, 255, 255, 0.2);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 9px;
      color: #a1a1aa;
      transition: all 0.3s;
    }

    .cartx-milestone-marker.unlocked {
      background: ${theme.primaryColor || '#10b981'};
      border-color: #fff;
      color: #000;
      box-shadow: 0 0 10px rgba(16, 185, 129, 0.6);
      transform: scale(1.15);
    }

    .cartx-milestone-labels {
      display: flex;
      justify-content: space-between;
      font-size: 11px;
      color: #71717a;
      margin-top: 4px;
    }

    .cartx-milestone-text.unlocked {
      color: ${theme.primaryColor || '#10b981'};
      font-weight: 600;
    }

    /* Scrollable Body */
    .cartx-body {
      flex: 1;
      overflow-y: auto;
      padding: 16px 20px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .cartx-body::-webkit-scrollbar {
      width: 5px;
    }
    .cartx-body::-webkit-scrollbar-thumb {
      background: rgba(255, 255, 255, 0.15);
      border-radius: 10px;
    }

    /* Cart Items */
    .cartx-item-card {
      display: flex;
      gap: 14px;
      padding: 12px;
      background: ${theme.surfaceColor || '#18181b'};
      border-radius: ${theme.borderRadiusPx || 12}px;
      border: 1px solid rgba(255, 255, 255, 0.05);
      position: relative;
      transition: border-color 0.2s;
    }

    .cartx-item-card:hover {
      border-color: rgba(255, 255, 255, 0.12);
    }

    .cartx-item-image {
      width: 76px;
      height: 76px;
      object-fit: cover;
      border-radius: 8px;
      background: #27272a;
      flex-shrink: 0;
    }

    .cartx-item-details {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }

    .cartx-item-title {
      font-size: 14px;
      font-weight: 600;
      line-height: 1.3;
      color: #fafafa;
    }

    .cartx-item-freebie-badge {
      display: inline-block;
      font-size: 10px;
      font-weight: 800;
      color: #10b981;
      background: rgba(16, 185, 129, 0.15);
      padding: 2px 6px;
      border-radius: 4px;
      margin-top: 4px;
      width: fit-content;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .cartx-item-pricing {
      display: flex;
      align-items: center;
      gap: 8px;
      margin: 6px 0;
    }

    .cartx-item-price {
      font-size: 15px;
      font-weight: 700;
      color: #fafafa;
    }

    .cartx-item-compare {
      font-size: 13px;
      color: #71717a;
      text-decoration: line-through;
    }

    .cartx-item-controls {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .cartx-qty-stepper {
      display: flex;
      align-items: center;
      background: #27272a;
      border-radius: 6px;
      border: 1px solid rgba(255, 255, 255, 0.1);
      overflow: hidden;
    }

    .cartx-qty-btn {
      background: transparent;
      border: none;
      color: #fafafa;
      width: 26px;
      height: 26px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      font-weight: 700;
      font-size: 14px;
      transition: background 0.15s;
    }

    .cartx-qty-btn:hover {
      background: rgba(255, 255, 255, 0.1);
    }

    .cartx-qty-val {
      font-size: 13px;
      font-weight: 600;
      min-width: 24px;
      text-align: center;
    }

    .cartx-remove-btn {
      background: transparent;
      border: none;
      color: #71717a;
      cursor: pointer;
      font-size: 12px;
      text-decoration: underline;
      transition: color 0.15s;
    }

    .cartx-remove-btn:hover {
      color: #ef4444;
    }

    /* AI / Curated Upsells Section */
    .cartx-upsell-section {
      background: rgba(24, 24, 27, 0.5);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: ${theme.borderRadiusPx || 12}px;
      padding: 14px;
    }

    .cartx-upsell-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 12px;
    }

    .cartx-upsell-title {
      font-size: 13px;
      font-weight: 700;
      color: #e4e4e7;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .cartx-upsell-carousel {
      display: flex;
      gap: 10px;
      overflow-x: auto;
      padding-bottom: 4px;
    }

    .cartx-upsell-carousel::-webkit-scrollbar {
      height: 3px;
    }
    .cartx-upsell-carousel::-webkit-scrollbar-thumb {
      background: rgba(255, 255, 255, 0.2);
    }

    .cartx-upsell-card {
      width: 140px;
      flex-shrink: 0;
      background: #18181b;
      border-radius: 8px;
      border: 1px solid rgba(255, 255, 255, 0.08);
      padding: 10px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }

    .cartx-upsell-badge {
      font-size: 9px;
      font-weight: 800;
      color: #f59e0b;
      background: rgba(245, 158, 11, 0.15);
      padding: 2px 4px;
      border-radius: 4px;
      margin-bottom: 6px;
      width: fit-content;
    }

    .cartx-upsell-img {
      width: 100%;
      height: 90px;
      object-fit: cover;
      border-radius: 6px;
      background: #27272a;
      margin-bottom: 6px;
    }

    .cartx-upsell-name {
      font-size: 12px;
      font-weight: 600;
      line-height: 1.2;
      height: 28px;
      overflow: hidden;
      margin-bottom: 6px;
    }

    .cartx-upsell-price {
      font-size: 13px;
      font-weight: 700;
      color: ${theme.primaryColor || '#10b981'};
      margin-bottom: 8px;
    }

    .cartx-upsell-add-btn {
      background: rgba(16, 185, 129, 0.15);
      border: 1px solid ${theme.primaryColor || '#10b981'};
      color: ${theme.primaryColor || '#10b981'};
      font-size: 11px;
      font-weight: 700;
      padding: 6px 0;
      width: 100%;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.2s;
    }

    .cartx-upsell-add-btn:hover {
      background: ${theme.primaryColor || '#10b981'};
      color: #000;
    }

    /* Coupon Section */
    .cartx-coupon-box {
      display: flex;
      gap: 8px;
      background: #18181b;
      padding: 8px 12px;
      border-radius: 8px;
      border: 1px solid rgba(255, 255, 255, 0.08);
    }

    .cartx-coupon-input {
      flex: 1;
      background: transparent;
      border: none;
      color: #fafafa;
      font-size: 13px;
      outline: none;
      text-transform: uppercase;
      font-weight: 600;
      letter-spacing: 0.05em;
    }

    .cartx-coupon-input::placeholder {
      text-transform: none;
      font-weight: 400;
      color: #71717a;
    }

    .cartx-coupon-btn {
      background: #27272a;
      border: none;
      color: #fafafa;
      font-size: 12px;
      font-weight: 700;
      padding: 6px 12px;
      border-radius: 6px;
      cursor: pointer;
      transition: background 0.15s;
    }

    .cartx-coupon-btn:hover {
      background: #3f3f46;
    }

    .cartx-coupon-active {
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: rgba(16, 185, 129, 0.1);
      border: 1px dashed ${theme.primaryColor || '#10b981'};
      padding: 8px 12px;
      border-radius: 8px;
      font-size: 12px;
      color: #10b981;
      font-weight: 600;
    }

    /* Empty Cart State */
    .cartx-empty {
      text-align: center;
      padding: 60px 20px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
    }

    .cartx-empty-icon {
      font-size: 48px;
      opacity: 0.4;
    }

    .cartx-empty-title {
      font-size: 18px;
      font-weight: 700;
      color: #fafafa;
    }

    .cartx-empty-sub {
      font-size: 13px;
      color: #a1a1aa;
      max-width: 260px;
    }

    /* Footer & Totals */
    .cartx-footer {
      border-top: 1px solid rgba(255, 255, 255, 0.08);
      background: ${theme.surfaceColor || '#18181b'};
      padding: 18px 20px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .cartx-savings-banner {
      background: linear-gradient(90deg, rgba(16, 185, 129, 0.2), rgba(16, 185, 129, 0.05));
      border: 1px solid rgba(16, 185, 129, 0.3);
      padding: 8px 12px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 700;
      color: #34d399;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .cartx-row {
      display: flex;
      justify-content: space-between;
      font-size: 13px;
      color: #a1a1aa;
    }

    .cartx-row.total {
      font-size: 17px;
      font-weight: 800;
      color: #fafafa;
      padding-top: 6px;
      border-top: 1px dashed rgba(255, 255, 255, 0.1);
    }

    .cartx-checkout-btn {
      background: ${theme.primaryColor || '#10b981'};
      color: #000;
      border: none;
      font-size: 15px;
      font-weight: 800;
      padding: 14px;
      border-radius: ${theme.borderRadiusPx || 12}px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      letter-spacing: -0.01em;
      transition: transform 0.15s, filter 0.15s;
      box-shadow: 0 4px 20px rgba(16, 185, 129, 0.3);
    }

    .cartx-checkout-btn:hover {
      filter: brightness(1.1);
      transform: translateY(-1px);
    }

    .cartx-checkout-btn:active {
      transform: translateY(1px);
    }

    .cartx-secure-badge {
      font-size: 11px;
      color: #71717a;
      text-align: center;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
    }
  `;
}
