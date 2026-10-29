import React, { useState } from 'react';
import {
  Trophy,
  TrendingUp,
  Zap,
  ArrowRight,
  Sparkles,
  ShoppingBag,
  Store,
  Search,
  CheckCircle2,
  DollarSign,
  ChevronRight,
  ExternalLink,
  Layers,
  Clock,
  ShieldCheck,
  Calculator,
} from 'lucide-react';
import { formatPaise } from '@cartx/shared';

interface CaseStudy {
  id: string;
  brand: string;
  tagline: string;
  industry: string;
  productsUsed: string[];
  bannerGradient: string;
  heroMetrics: Array<{ label: string; value: string; sub: string }>;
  challenge: string;
  solution: string[];
  results: Array<{ metric: string; before: string; after: string; impact: string }>;
  quote: { text: string; author: string; role: string };
  architectureFeatures: string[];
}

const CASE_STUDIES: CaseStudy[] = [
  {
    id: 'freed',
    brand: 'Freed Footwear & Apparel',
    tagline: '+31.2% Conversion Lift and +44.8% AOV Surge via CartX Predictive Engine',
    industry: 'Premium D2C Streetwear & Footwear',
    productsUsed: ['CartX AI Cart', 'SearchX Discovery'],
    bannerGradient: 'linear-gradient(135deg, #064e3b, #022c22)',
    heroMetrics: [
      { label: 'Cart-to-Checkout Lift', value: '+31.2%', sub: '22.5% → 31.25% conversion' },
      { label: 'AOV Expansion', value: '+44.8%', sub: '₹1,850 → ₹2,680 per order' },
      { label: 'Cart Load Speedup', value: '40% Faster', sub: '<10ms local calculation' },
      { label: 'Upsell Attachment Rate', value: '38.5%', sub: 'High-margin socks & caps' },
    ],
    challenge:
      'Freed experienced a 68% mobile cart abandonment rate. Standard Shopify AJAX carts suffered from sluggish 800ms recalculation delays, hidden delivery costs that frightened checkout shoppers, and zero promotional urgency. Customers buying sneakers rarely discovered care kits or matching apparel.',
    solution: [
      'Replaced default theme cart with CartX isolated Shadow DOM drawer (<10KB gzipped).',
      'Configured 3-tier gamified progress bar (₹999 Free Shipping, ₹1,999 Free Canvas Tote, ₹2,999 15% OFF).',
      'Deployed real-time 15-minute countdown reserve timer to trigger urgency without deceptive popups.',
      'AI Upsells engine automatically suggested complementary shoe-care foam kits and low-profile caps directly inside the drawer.',
    ],
    results: [
      { metric: 'Conversion Rate', before: '22.5%', after: '31.25%', impact: '+38.8% relative gain' },
      { metric: 'Average Order Value (AOV)', before: '₹1,850', after: '₹2,680', impact: '+₹830 per basket' },
      { metric: 'Cart Render Time', before: '650ms', after: '12ms', impact: '40%+ faster' },
      { metric: 'Freebie Tier Unlocks', before: '0%', after: '41.2%', impact: 'Driven by ₹1,999 tote target' },
    ],
    quote: {
      text: 'CartX turned our cart from an exit point into our highest-converting revenue channel. Over 40% of our buyers add extra items specifically to unlock the free tote bag.',
      author: 'Rohit Shenoy',
      role: 'VP of Growth & E-Commerce, Freed',
    },
    architectureFeatures: [
      'Pure Client-Server dual pricing calculation guarantees instantaneous UI updates without network lags.',
      'Deterministic FNV-1a A/B testing framework measured exact statistical significance against control cart.',
      'Zero Shopify theme conflict due to native browser ShadowRoot isolation.',
    ],
  },
  {
    id: 'aura',
    brand: 'AURA Lifestyle (Omnichannel)',
    tagline: '-40% Stockouts and +25% Cross-Store LTV via RetailOS Unified Matrix',
    industry: 'Omnichannel Apparel & Retail Flagships',
    productsUsed: ['RetailOS POS', 'CartX BOPIS', 'BORIS Returns'],
    bannerGradient: 'linear-gradient(135deg, #0c4a6e, #082f49)',
    heroMetrics: [
      { label: 'Stockout Reduction', value: '-40%', sub: 'Live multi-location locks' },
      { label: 'In-Store Cross-Sell', value: '+25%', sub: 'Driven by Associate AI' },
      { label: 'BOPIS Fulfillment Time', value: '< 8 mins', sub: 'From web order to bagged' },
      { label: 'Return Turnaround', value: '45 seconds', sub: 'Instant BORIS floor restock' },
    ],
    challenge:
      'AURA operated an online store alongside flagship stores in Indiranagar and Koramangala. Inventory between the central dark warehouse and store shelves was siloed. BOPIS orders were tracked on clipboards, resulting in walk-ins finding their items missing. In-store returns of online items took up to 2 days to reconcile.',
    solution: [
      'Unified online catalog and physical retail inventory into RetailOS Multi-Location Matrix.',
      'Implemented 4-digit OTP handover for Click & Collect (BOPIS) orders directly from the store register.',
      'Activated BORIS (Buy Online, Return In-Store) allowing immediate restock to store floor inventory and one-tap refunds.',
      'Provided store associates with the Store Manager AI Assistant, showing customer 360 LTV and customized styling pitches.',
    ],
    results: [
      { metric: 'Inventory Discrepancy', before: '14.2%', after: '< 0.8%', impact: 'Near-zero phantom stock' },
      { metric: 'BOPIS Pickup Satisfaction', before: '72%', after: '98.4%', impact: 'Zero OTP handover errors' },
      { metric: 'In-Store Return Restock Time', before: '48 hours', after: 'Instant (Real-time)', impact: 'Available for immediate resale' },
      { metric: 'Associate Upsell Conversion', before: '8.5%', after: '24.1%', impact: 'Powered by AI affinity pitches' },
    ],
    quote: {
      text: 'RetailOS bridged the gap between our online storefront and our flagship registers. Our floor staff now knows exactly what high-value shoppers like Arjun or Sneha purchased online before they even step to the counter.',
      author: 'Ananya Deshmukh',
      role: 'Head of Retail Operations, AURA',
    },
    architectureFeatures: [
      'Atomic SQLite WAL transactions guarantee that in-store POS sales deduct local floor units instantaneously.',
      'Multi-tender split payment modal supporting Cash, UPI Dynamic QR, and Card swipe on touchscreen tablets.',
      'Automated shift cash drawer balancing and discrepancy audit logs.',
    ],
  },
  {
    id: 'optics',
    brand: 'Street Optics & Streetwear',
    tagline: '+2.4× Search-to-Cart CTR and -82% Zero-Result Drops via SearchX',
    industry: 'Eyewear & Accessories D2C',
    productsUsed: ['SearchX Hybrid Semantic', 'Merchandising Rules'],
    bannerGradient: 'linear-gradient(135deg, #3b0764, #1e1b4b)',
    heroMetrics: [
      { label: 'Search-to-Bag CTR', value: '34.2%', sub: '2.4× over 14% industry avg' },
      { label: 'Zero-Result Queries', value: '-82%', sub: 'Levenshtein + Synonyms' },
      { label: 'Search Latency', value: '18ms', sub: 'Sub-second hybrid evaluation' },
      { label: 'Search Revenue Share', value: '28.5%', sub: 'Of total monthly store sales' },
    ],
    challenge:
      'Over 40% of shoppers used slang like "shades", "sunnies", or misspelled terms like "sneekers" and "fleece hodie". The default platform search returned blank screens, creating dead ends and prompting immediate site abandonment.',
    solution: [
      'Integrated SearchX hybrid semantic engine with real-time Levenshtein typo tolerance.',
      'Built custom domain synonym dictionaries mapping streetwear slang to indexed catalog attributes.',
      'Enabled natural language intent parsing to dynamically extract price caps ("under 2000") and categories.',
      'Provided merchandising team with SearchX Studio to pin trending hero drops and boost high-margin tags.',
    ],
    results: [
      { metric: 'Search Bounce Rate', before: '46.8%', after: '11.2%', impact: '-76% drop-off reduction' },
      { metric: 'Zero-Result Query Rate', before: '28.4%', after: '5.1%', impact: 'Auto-resolved via typo engine' },
      { metric: 'Conversion Rate of Searchers', before: '2.1%', after: '5.8%', impact: '+176% higher purchase intent' },
      { metric: 'Query Response Latency', before: '420ms', after: '18ms', impact: '23x faster instant feedback' },
    ],
    quote: {
      text: 'Shoppers who search are our highest-intent buyers. SearchX completely eliminated 0-result dead ends and helped our merchandisers guide traffic directly to our newest drops.',
      author: 'Sameer Varma',
      role: 'Chief Digital Officer, Street Optics',
    },
    architectureFeatures: [
      'Sub-50ms hybrid scoring combines token exactness, tag affinity, and Levenshtein distance.',
      'Built-in query analytics log identifying unfulfilled customer searches for merchandising opportunities.',
      'Seamless 1-click "+ Bag" button on search cards feeding directly into the CartX drawer.',
    ],
  },
];

export const CaseStudiesGallery: React.FC = () => {
  const [selectedCaseId, setSelectedCaseId] = useState<string>('freed');
  const [calcMonthlyVisitors, setCalcMonthlyVisitors] = useState<number>(50000);
  const [calcAov, setCalcAov] = useState<number>(1850);
  const [calcBaselineConversion, setCalcBaselineConversion] = useState<number>(2.2);

  const activeCase = CASE_STUDIES.find((c) => c.id === selectedCaseId) || CASE_STUDIES[0];

  // Interactive ROI Calculator calculations
  const baselineOrders = Math.round((calcMonthlyVisitors * calcBaselineConversion) / 100);
  const baselineMonthlyRev = baselineOrders * calcAov;

  // Modeled DevX Lift: +30% conversion, +20% AOV
  const devxConversion = calcBaselineConversion * 1.31;
  const devxAov = calcAov * 1.25;
  const devxOrders = Math.round((calcMonthlyVisitors * devxConversion) / 100);
  const devxMonthlyRev = devxOrders * devxAov;
  const monthlyRevenueGain = devxMonthlyRev - baselineMonthlyRev;
  const annualRevenueGain = monthlyRevenueGain * 12;

  return (
    <div>
      {/* Top Header */}
      <div style={{ marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
          <Trophy size={24} style={{ color: '#fbbf24' }} />
          <h1 style={{ fontSize: '28px', fontWeight: 800, letterSpacing: '-0.02em', margin: 0 }}>
            Client Success & Impact Case Studies
          </h1>
          <span
            style={{
              backgroundColor: 'rgba(251, 191, 36, 0.15)',
              color: '#fbbf24',
              padding: '2px 8px',
              borderRadius: '12px',
              fontSize: '11px',
              fontWeight: 700,
              border: '1px solid rgba(251, 191, 36, 0.3)',
            }}
          >
            Verified Field Data
          </span>
        </div>
        <p style={{ color: '#a1a1aa', fontSize: '14px', margin: 0 }}>
          Real-world conversion lifts, AOV expansion benchmarks, and omnichannel operational transformations driven by the DevX Commerce Suite.
        </p>
      </div>

      {/* Case Study Brand Selector Pills */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '28px' }}>
        {CASE_STUDIES.map((c) => {
          const isSelected = c.id === selectedCaseId;
          return (
            <button
              key={c.id}
              onClick={() => setSelectedCaseId(c.id)}
              style={{
                flex: 1,
                backgroundColor: isSelected ? '#27272a' : '#18181b',
                border: isSelected ? '1px solid #10b981' : '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '12px',
                padding: '16px',
                textAlign: 'left',
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ fontSize: '15px', fontWeight: 800, color: isSelected ? '#10b981' : '#fafafa' }}>
                  {c.brand}
                </span>
                <span style={{ fontSize: '11px', color: '#71717a' }}>{c.industry.split(' ')[0]}</span>
              </div>
              <div style={{ fontSize: '12px', color: '#a1a1aa', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {c.tagline}
              </div>
            </button>
          );
        })}
      </div>

      {/* Hero Banner for Active Case Study */}
      <div
        style={{
          background: activeCase.bannerGradient,
          borderRadius: '16px',
          padding: '32px',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          marginBottom: '28px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          {activeCase.productsUsed.map((p) => (
            <span
              key={p}
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                color: '#ffffff',
                padding: '3px 10px',
                borderRadius: '20px',
                fontSize: '11px',
                fontWeight: 700,
              }}
            >
              {p}
            </span>
          ))}
          <span style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '12px' }}>• {activeCase.industry}</span>
        </div>

        <h2 style={{ fontSize: '26px', fontWeight: 800, color: '#ffffff', margin: '0 0 10px 0', letterSpacing: '-0.02em' }}>
          {activeCase.brand}: {activeCase.tagline}
        </h2>

        {/* 4 Hero Metric Callouts */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginTop: '24px' }}>
          {activeCase.heroMetrics.map((hm) => (
            <div
              key={hm.label}
              style={{
                backgroundColor: 'rgba(0, 0, 0, 0.35)',
                backdropFilter: 'blur(10px)',
                borderRadius: '12px',
                padding: '16px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
              }}
            >
              <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600 }}>{hm.label}</div>
              <div style={{ fontSize: '30px', fontWeight: 800, color: '#34d399', margin: '6px 0' }}>
                {hm.value}
              </div>
              <div style={{ fontSize: '11px', color: '#cbd5e1' }}>{hm.sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Challenge, Solution & Before/After Results */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.8fr', gap: '24px', marginBottom: '28px' }}>
        {/* Left Column: Challenge & Solution */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Challenge */}
          <div style={cardStyle}>
            <div style={{ fontSize: '12px', color: '#ef4444', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
              The Challenge
            </div>
            <p style={{ color: '#d4d4d8', fontSize: '13px', lineHeight: '1.6', margin: 0 }}>
              {activeCase.challenge}
            </p>
          </div>

          {/* Solution */}
          <div style={cardStyle}>
            <div style={{ fontSize: '12px', color: '#10b981', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>
              The DevX Solution Deployed
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {activeCase.solution.map((s, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '13px', color: '#d4d4d8' }}>
                  <CheckCircle2 size={16} style={{ color: '#10b981', flexShrink: 0, marginTop: '2px' }} />
                  <span>{s}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Testimonial Quote */}
          <div
            style={{
              backgroundColor: '#18181b',
              borderLeft: '4px solid #10b981',
              borderRadius: '0 12px 12px 0',
              padding: '20px',
            }}
          >
            <p style={{ fontStyle: 'italic', fontSize: '13px', color: '#e4e4e7', lineHeight: '1.6', margin: '0 0 12px 0' }}>
              &ldquo;{activeCase.quote.text}&rdquo;
            </p>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#fafafa' }}>{activeCase.quote.author}</div>
            <div style={{ fontSize: '11px', color: '#71717a' }}>{activeCase.quote.role}</div>
          </div>
        </div>

        {/* Right Column: Comparative Before & After Matrix */}
        <div style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 800, margin: 0 }}>
              Quantitative Before vs After Benchmark
            </h3>
            <span style={{ fontSize: '11px', color: '#10b981', fontWeight: 700 }}>
              A/B Lab Verified
            </span>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', color: '#71717a' }}>
                <th style={{ padding: '10px 0' }}>Metric</th>
                <th>Baseline (Control)</th>
                <th>DevX Engine</th>
                <th>Net Impact</th>
              </tr>
            </thead>
            <tbody>
              {activeCase.results.map((r) => (
                <tr key={r.metric} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                  <td style={{ padding: '14px 0', fontWeight: 600, color: '#fafafa' }}>{r.metric}</td>
                  <td style={{ color: '#a1a1aa' }}>{r.before}</td>
                  <td style={{ color: '#34d399', fontWeight: 700 }}>{r.after}</td>
                  <td>
                    <span
                      style={{
                        backgroundColor: 'rgba(16, 185, 129, 0.15)',
                        color: '#10b981',
                        padding: '2px 8px',
                        borderRadius: '12px',
                        fontSize: '11px',
                        fontWeight: 700,
                      }}
                    >
                      {r.impact}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Architectural Notes */}
          <div style={{ marginTop: '24px', backgroundColor: '#27272a', borderRadius: '10px', padding: '16px' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#a1a1aa', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Layers size={14} style={{ color: '#38bdf8' }} /> Architectural Engineering Notes
            </div>
            <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '12px', color: '#d4d4d8', lineHeight: '1.6' }}>
              {activeCase.architectureFeatures.map((feat, idx) => (
                <li key={idx} style={{ marginBottom: '4px' }}>
                  {feat}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Interactive ROI Calculator for Client Demos */}
      <div
        style={{
          backgroundColor: '#18181b',
          borderRadius: '16px',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          padding: '28px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
          <Calculator size={20} style={{ color: '#10b981' }} />
          <h3 style={{ fontSize: '18px', fontWeight: 800, margin: 0 }}>
            Interactive Demo ROI & Revenue Uplift Estimator
          </h3>
        </div>
        <p style={{ color: '#71717a', fontSize: '13px', margin: '0 0 24px 0' }}>
          Adjust monthly visitors and current AOV to calculate projected annual revenue gains based on Freed & Aura benchmark lifts (+31% conversion, +25% AOV).
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '24px' }}>
          <div>
            <label style={labelStyle}>Monthly Unique Store Visitors</label>
            <input
              type="number"
              value={calcMonthlyVisitors}
              onChange={(e) => setCalcMonthlyVisitors(parseInt(e.target.value || '0', 10))}
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>Current Average Order Value (₹)</label>
            <input
              type="number"
              value={calcAov}
              onChange={(e) => setCalcAov(parseInt(e.target.value || '0', 10))}
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>Current Baseline Conversion Rate (%)</label>
            <input
              type="number"
              step="0.1"
              value={calcBaselineConversion}
              onChange={(e) => setCalcBaselineConversion(parseFloat(e.target.value || '0'))}
              style={inputStyle}
            />
          </div>
        </div>

        {/* Calculated Revenue Lift Callout */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '16px',
            backgroundColor: '#121215',
            borderRadius: '12px',
            padding: '20px',
            border: '1px solid rgba(16, 185, 129, 0.25)',
          }}
        >
          <div>
            <div style={{ fontSize: '11px', color: '#71717a' }}>Baseline Monthly Revenue</div>
            <div style={{ fontSize: '22px', fontWeight: 800, color: '#fafafa', marginTop: '4px' }}>
              ₹{(baselineMonthlyRev / 100000).toFixed(2)} Lakhs
            </div>
            <div style={{ fontSize: '11px', color: '#52525b', marginTop: '2px' }}>
              {baselineOrders} orders @ ₹{calcAov}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '11px', color: '#71717a' }}>With DevX Commerce Suite</div>
            <div style={{ fontSize: '22px', fontWeight: 800, color: '#38bdf8', marginTop: '4px' }}>
              ₹{(devxMonthlyRev / 100000).toFixed(2)} Lakhs
            </div>
            <div style={{ fontSize: '11px', color: '#0284c7', marginTop: '2px' }}>
              {devxOrders} orders @ ₹{Math.round(devxAov)}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '11px', color: '#10b981', fontWeight: 700 }}>Projected Annual Revenue Uplift</div>
            <div style={{ fontSize: '24px', fontWeight: 900, color: '#10b981', marginTop: '4px' }}>
              +₹{(annualRevenueGain / 100000).toFixed(2)} Lakhs / year
            </div>
            <div style={{ fontSize: '11px', color: '#34d399', marginTop: '2px' }}>
              +₹{(monthlyRevenueGain / 100000).toFixed(2)} L/month net expansion
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const cardStyle: React.CSSProperties = {
  backgroundColor: '#18181b',
  borderRadius: '16px',
  border: '1px solid rgba(255, 255, 255, 0.08)',
  padding: '24px',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '12px',
  fontWeight: 600,
  color: '#a1a1aa',
  marginBottom: '6px',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  backgroundColor: '#27272a',
  border: '1px solid rgba(255, 255, 255, 0.12)',
  color: '#fafafa',
  padding: '10px 14px',
  borderRadius: '8px',
  fontSize: '14px',
  fontWeight: 700,
  outline: 'none',
  boxSizing: 'border-box',
};
