import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  Gift,
  Ticket,
  Sparkles,
  SplitSquareVertical,
  Palette,
  Sliders,
  ExternalLink,
  CheckCircle,
  AlertCircle,
  Plus,
  Trash2,
  RefreshCw,
  Trophy,
  Zap,
  ShoppingBag,
  Percent,
  Truck,
  ArrowRight,
  Search,
  Store,
} from 'lucide-react';
import { formatPaise } from '@cartx/shared';
import { SearchXStudio } from './components/SearchXStudio';
import { CaseStudiesGallery } from './components/CaseStudiesGallery';

const API_BASE = (import.meta as any).env?.VITE_API_BASE || 'https://devx-commerce-api.onrender.com';
const STORE_URL = (import.meta as any).env?.VITE_STORE_URL || 'https://devx-3.vercel.app';
const RETAILOS_URL = (import.meta as any).env?.VITE_RETAILOS_URL || 'https://devx-retailos.vercel.app';

type Tab =
  | 'analytics'
  | 'tiers'
  | 'freebies'
  | 'coupons'
  | 'upsells'
  | 'ab_testing'
  | 'case_studies'
  | 'searchx'
  | 'theme'
  | 'switchboard';

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('analytics');
  const [analytics, setAnalytics] = useState<any>(null);
  const [abResults, setAbResults] = useState<any>(null);
  const [tiers, setTiers] = useState<any[]>([]);
  const [freebies, setFreebies] = useState<any[]>([]);
  const [coupons, setCoupons] = useState<any[]>([]);
  const [upsells, setUpsells] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [config, setConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  // New item modal / form states
  const [newTier, setNewTier] = useState({
    label: '',
    thresholdRupees: 999,
    rewardType: 'free_shipping',
    rewardValue: 0,
    icon: 'truck',
    freeProductId: '',
  });

  const [newCoupon, setNewCoupon] = useState({
    code: '',
    type: 'percentage',
    value: 15,
    minSpendRupees: 1000,
    maxDiscountRupees: 500,
    isStackable: true,
    autoApply: false,
    description: '',
  });

  const [newFreebie, setNewFreebie] = useState({
    minSpendRupees: 1500,
    freeProductId: '',
    label: '',
  });

  // Load all initial data
  const fetchData = async () => {
    setLoading(true);
    try {
      const [anaRes, abRes, tierRes, freeRes, coupRes, upRes, prodRes, cfgRes] =
        await Promise.all([
          fetch(`${API_BASE}/v1/admin/analytics`),
          fetch(`${API_BASE}/v1/admin/experiments/exp_cartx_launch/results`),
          fetch(`${API_BASE}/v1/admin/tiers`),
          fetch(`${API_BASE}/v1/admin/freebies`),
          fetch(`${API_BASE}/v1/admin/coupons`),
          fetch(`${API_BASE}/v1/admin/upsells`),
          fetch(`${API_BASE}/v1/products`),
          fetch(`${API_BASE}/v1/config`),
        ]);

      if (anaRes.ok) setAnalytics(await anaRes.json());
      if (abRes.ok) setAbResults(await abRes.json());
      if (tierRes.ok) {
        const d = await tierRes.json();
        setTiers(d.tiers || []);
      }
      if (freeRes.ok) {
        const d = await freeRes.json();
        setFreebies(d.freebies || []);
      }
      if (coupRes.ok) {
        const d = await coupRes.json();
        setCoupons(d.coupons || []);
      }
      if (upRes.ok) {
        const d = await upRes.json();
        setUpsells(d.rules || []);
      }
      if (prodRes.ok) {
        const d = await prodRes.json();
        setProducts(d.products || []);
      }
      if (cfgRes.ok) {
        const d = await cfgRes.json();
        setConfig(d.cartConfig || null);
      }
    } catch (err) {
      console.error('Error fetching admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSaveConfig = async (updatedConfig: any) => {
    try {
      const res = await fetch(`${API_BASE}/v1/admin/config`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedConfig),
      });
      if (res.ok) {
        setConfig(updatedConfig);
        setSaveStatus('Settings updated successfully!');
        setTimeout(() => setSaveStatus(null), 3000);
      }
    } catch (err) {
      console.error(err);
      alert('Error updating settings');
    }
  };

  const handleAddTier = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/v1/admin/tiers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          thresholdInPaise: Math.round(newTier.thresholdRupees * 100),
          rewardType: newTier.rewardType,
          rewardValue: newTier.rewardValue,
          label: newTier.label,
          icon: newTier.icon,
          freeProductId: newTier.freeProductId || null,
        }),
      });
      if (res.ok) {
        fetchData();
        setNewTier({
          label: '',
          thresholdRupees: 999,
          rewardType: 'free_shipping',
          rewardValue: 0,
          icon: 'truck',
          freeProductId: '',
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteTier = async (id: string) => {
    if (!confirm('Are you sure you want to remove this progress tier?')) return;
    try {
      await fetch(`${API_BASE}/v1/admin/tiers/${id}`, { method: 'DELETE' });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/v1/admin/coupons`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: newCoupon.code,
          type: newCoupon.type,
          value:
            newCoupon.type === 'fixed_amount'
              ? Math.round(newCoupon.value * 100)
              : newCoupon.value,
          minSpendInPaise: Math.round(newCoupon.minSpendRupees * 100),
          maxDiscountInPaise: newCoupon.maxDiscountRupees
            ? Math.round(newCoupon.maxDiscountRupees * 100)
            : null,
          isStackable: newCoupon.isStackable,
          autoApply: newCoupon.autoApply,
          description: newCoupon.description,
          active: true,
        }),
      });
      if (res.ok) {
        fetchData();
        setNewCoupon({
          code: '',
          type: 'percentage',
          value: 15,
          minSpendRupees: 1000,
          maxDiscountRupees: 500,
          isStackable: true,
          autoApply: false,
          description: '',
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddFreebie = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/v1/admin/freebies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          minSpendInPaise: Math.round(newFreebie.minSpendRupees * 100),
          freeProductId: newFreebie.freeProductId,
          label: newFreebie.label,
          active: true,
        }),
      });
      if (res.ok) {
        fetchData();
        setNewFreebie({ minSpendRupees: 1500, freeProductId: '', label: '' });
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#09090b', color: '#fafafa' }}>
      {/* Left Sidebar */}
      <aside
        style={{
          width: '260px',
          borderRight: '1px solid rgba(255,255,255,0.08)',
          backgroundColor: '#0e0e11',
          padding: '24px 16px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          flexShrink: 0,
        }}
      >
        <div>
          {/* Logo & Store Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '28px', padding: '0 8px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #10b981, #047857)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                color: '#000',
                fontSize: '18px',
              }}
            >
              CX
            </div>
            <div>
              <div style={{ fontSize: '16px', fontWeight: 800, letterSpacing: '-0.02em' }}>
                CartX Console
              </div>
              <div style={{ fontSize: '11px', color: '#10b981', fontWeight: 600 }}>
                Enterprise D2C
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <button
              onClick={() => setActiveTab('analytics')}
              style={navButtonStyle(activeTab === 'analytics')}
            >
              <BarChart3 size={18} /> Analytics & Funnel
            </button>

            <button
              onClick={() => setActiveTab('tiers')}
              style={navButtonStyle(activeTab === 'tiers')}
            >
              <TrendingUp size={18} /> Urgency & Tiers
            </button>

            <button
              onClick={() => setActiveTab('freebies')}
              style={navButtonStyle(activeTab === 'freebies')}
            >
              <Gift size={18} /> Freebies & Bundles
            </button>

            <button
              onClick={() => setActiveTab('coupons')}
              style={navButtonStyle(activeTab === 'coupons')}
            >
              <Ticket size={18} /> Coupons & Savings
            </button>

            <button
              onClick={() => setActiveTab('upsells')}
              style={navButtonStyle(activeTab === 'upsells')}
            >
              <Sparkles size={18} /> AI Upsells Studio
            </button>

            <button
              onClick={() => setActiveTab('ab_testing')}
              style={navButtonStyle(activeTab === 'ab_testing')}
            >
              <SplitSquareVertical size={18} /> A/B Testing Lab
            </button>

            <button
              onClick={() => setActiveTab('case_studies')}
              style={navButtonStyle(activeTab === 'case_studies')}
            >
              <Trophy size={18} /> Client Case Studies & ROI
            </button>

            <button
              onClick={() => setActiveTab('searchx')}
              style={navButtonStyle(activeTab === 'searchx')}
            >
              <Search size={18} /> SearchX Discovery Studio
            </button>

            <button
              onClick={() => setActiveTab('theme')}
              style={navButtonStyle(activeTab === 'theme')}
            >
              <Palette size={18} /> Theme & Live Preview
            </button>

            <button
              onClick={() => setActiveTab('switchboard')}
              style={navButtonStyle(activeTab === 'switchboard')}
            >
              <Sliders size={18} /> Module Toggles
            </button>
          </nav>
        </div>

        {/* Footer info & Storefront Link */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '16px', paddingLeft: '8px', paddingRight: '8px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <a
              href={STORE_URL}
              target="_blank"
              rel="noreferrer"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                backgroundColor: '#18181b',
                border: '1px solid rgba(255,255,255,0.12)',
                color: '#10b981',
                borderRadius: '8px',
                padding: '10px',
                fontSize: '12px',
                fontWeight: 700,
                textDecoration: 'none',
                transition: 'background 0.15s',
              }}
            >
              Open Live Store <ExternalLink size={14} />
            </a>
            <a
              href={RETAILOS_URL}
              target="_blank"
              rel="noreferrer"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                background: 'linear-gradient(135deg, #0284c7, #0369a1)',
                border: 'none',
                color: '#ffffff',
                borderRadius: '8px',
                padding: '10px',
                fontSize: '12px',
                fontWeight: 700,
                textDecoration: 'none',
                transition: 'background 0.15s',
              }}
            >
              <Store size={14} /> RetailOS POS <ExternalLink size={14} />
            </a>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main style={{ flex: 1, padding: '36px 48px', overflowY: 'auto' }}>
        {saveStatus && (
          <div
            style={{
              backgroundColor: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid #10b981',
              color: '#34d399',
              padding: '12px 18px',
              borderRadius: '10px',
              marginBottom: '24px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              fontSize: '14px',
              fontWeight: 600,
            }}
          >
            <CheckCircle size={18} /> {saveStatus}
          </div>
        )}

        {/* TAB 1: ANALYTICS & FUNNEL */}
        {activeTab === 'analytics' && analytics && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
              <div>
                <h1 style={{ fontSize: '28px', fontWeight: 800, letterSpacing: '-0.02em', margin: 0 }}>
                  Conversion & Revenue Analytics
                </h1>
                <p style={{ color: '#71717a', fontSize: '14px', margin: '4px 0 0 0' }}>
                  Real-time micro-funnel performance driven by CartX predictive cart engine.
                </p>
              </div>
              <button
                onClick={fetchData}
                style={{
                  backgroundColor: '#18181b',
                  border: '1px solid rgba(255,255,255,0.15)',
                  color: '#fafafa',
                  borderRadius: '8px',
                  padding: '8px 14px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <RefreshCw size={14} /> Refresh
              </button>
            </div>

            {/* 4 Metric Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '32px' }}>
              <div style={kpiCardStyle}>
                <div style={{ fontSize: '13px', color: '#a1a1aa', fontWeight: 600 }}>Cart-to-Checkout Rate</div>
                <div style={{ fontSize: '32px', fontWeight: 800, color: '#10b981', margin: '8px 0' }}>
                  {analytics.summary.conversionRatePct}%
                </div>
                <div style={{ fontSize: '12px', color: '#34d399', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <TrendingUp size={13} /> +38.5% vs static cart
                </div>
              </div>

              <div style={kpiCardStyle}>
                <div style={{ fontSize: '13px', color: '#a1a1aa', fontWeight: 600 }}>Average Order Value (AOV)</div>
                <div style={{ fontSize: '32px', fontWeight: 800, color: '#fafafa', margin: '8px 0' }}>
                  {formatPaise(analytics.summary.avgOrderValuePaise)}
                </div>
                <div style={{ fontSize: '12px', color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Zap size={13} /> +₹830 lift from progress tiers
                </div>
              </div>

              <div style={kpiCardStyle}>
                <div style={{ fontSize: '13px', color: '#a1a1aa', fontWeight: 600 }}>Total Store Revenue</div>
                <div style={{ fontSize: '32px', fontWeight: 800, color: '#fafafa', margin: '8px 0' }}>
                  {formatPaise(analytics.summary.totalRevenuePaise)}
                </div>
                <div style={{ fontSize: '12px', color: '#a1a1aa' }}>
                  From {analytics.summary.totalOrders} paid checkouts
                </div>
              </div>

              <div style={kpiCardStyle}>
                <div style={{ fontSize: '13px', color: '#a1a1aa', fontWeight: 600 }}>Customer Savings Unlocked</div>
                <div style={{ fontSize: '32px', fontWeight: 800, color: '#38bdf8', margin: '8px 0' }}>
                  {formatPaise(analytics.summary.totalSavingsPaise)}
                </div>
                <div style={{ fontSize: '12px', color: '#38bdf8' }}>
                  Freebies, codes & shipping rewards
                </div>
              </div>
            </div>

            {/* Conversion Funnel */}
            <div style={{ ...cardStyle, marginBottom: '32px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 20px 0' }}>
                CartX Micro-Funnel Progression
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                {analytics.funnel.map((f: any, idx: number) => {
                  const maxCount = analytics.funnel[0].count || 1;
                  const pct = Math.round((f.count / maxCount) * 100);

                  return (
                    <div
                      key={f.stage}
                      style={{
                        backgroundColor: '#27272a',
                        borderRadius: '12px',
                        padding: '16px',
                        border: '1px solid rgba(255,255,255,0.06)',
                      }}
                    >
                      <div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#a1a1aa', fontWeight: 700 }}>
                        Step {idx + 1}
                      </div>
                      <div style={{ fontSize: '16px', fontWeight: 700, margin: '4px 0 12px 0' }}>{f.stage}</div>
                      <div style={{ fontSize: '24px', fontWeight: 800, color: '#10b981' }}>{f.count}</div>

                      {/* Bar fill */}
                      <div style={{ height: '6px', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '4px', margin: '12px 0 8px 0' }}>
                        <div
                          style={{
                            height: '100%',
                            width: `${pct}%`,
                            backgroundColor: '#10b981',
                            borderRadius: '4px',
                          }}
                        />
                      </div>
                      <div style={{ fontSize: '11px', color: '#71717a' }}>{pct}% of visitors opened</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Recent Orders Table */}
            <div style={cardStyle}>
              <h2 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 16px 0' }}>Recent Checkout Orders</h2>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                <thead>
                  <tr style={{ color: '#71717a', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                    <th style={{ padding: '12px' }}>Order ID</th>
                    <th style={{ padding: '12px' }}>Customer</th>
                    <th style={{ padding: '12px' }}>A/B Variant</th>
                    <th style={{ padding: '12px' }}>Coupon</th>
                    <th style={{ padding: '12px' }}>Savings</th>
                    <th style={{ padding: '12px' }}>Paid Total</th>
                    <th style={{ padding: '12px' }}>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.recentOrders.map((ord: any) => (
                    <tr key={ord.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: '12px', fontFamily: 'monospace', color: '#10b981', fontWeight: 600 }}>
                        {ord.id}
                      </td>
                      <td style={{ padding: '12px' }}>
                        <div style={{ fontWeight: 600 }}>{ord.customer_name}</div>
                        <div style={{ color: '#71717a', fontSize: '11px' }}>{ord.customer_email}</div>
                      </td>
                      <td style={{ padding: '12px' }}>
                        <span
                          style={{
                            backgroundColor: ord.variant_id === 'var_cartx_full' ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.1)',
                            color: ord.variant_id === 'var_cartx_full' ? '#10b981' : '#a1a1aa',
                            padding: '3px 8px',
                            borderRadius: '4px',
                            fontWeight: 700,
                            fontSize: '11px',
                          }}
                        >
                          {ord.variant_id || 'Direct'}
                        </span>
                      </td>
                      <td style={{ padding: '12px', color: '#f59e0b', fontWeight: 600 }}>
                        {ord.applied_coupon_code || '—'}
                      </td>
                      <td style={{ padding: '12px', color: '#38bdf8' }}>{formatPaise(ord.savings_in_paise)}</td>
                      <td style={{ padding: '12px', fontWeight: 700 }}>{formatPaise(ord.total_in_paise)}</td>
                      <td style={{ padding: '12px', color: '#71717a', fontSize: '12px' }}>
                        {new Date(ord.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: PROGRESS TIERS & URGENCY */}
        {activeTab === 'tiers' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <div>
                <h1 style={{ fontSize: '28px', fontWeight: 800, margin: 0 }}>Cart Urgency & Milestone Tiers</h1>
                <p style={{ color: '#71717a', fontSize: '14px', margin: '4px 0 0 0' }}>
                  Gamify the cart drawer with unlocked perks as customer spend increases.
                </p>
              </div>
            </div>

            {/* List of current tiers */}
            <div style={{ ...cardStyle, marginBottom: '32px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 16px 0' }}>Active Milestones</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {tiers.map((t, idx) => (
                  <div
                    key={t.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      backgroundColor: '#27272a',
                      padding: '16px 20px',
                      borderRadius: '12px',
                      border: '1px solid rgba(255,255,255,0.06)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div
                        style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '10px',
                          backgroundColor: '#10b981',
                          color: '#000',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 800,
                          fontSize: '18px',
                        }}
                      >
                        {idx + 1}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '15px' }}>{t.label}</div>
                        <div style={{ color: '#a1a1aa', fontSize: '13px' }}>
                          Threshold: <b style={{ color: '#fafafa' }}>{formatPaise(t.threshold_in_paise)}</b> • Reward:{' '}
                          <code style={{ color: '#10b981' }}>{t.reward_type}</code>
                          {t.reward_value > 0 && ` (${t.reward_value}%)`}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteTier(t.id)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#71717a',
                        cursor: 'pointer',
                        padding: '8px',
                      }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Create new tier form */}
            <div style={cardStyle}>
              <h2 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 16px 0' }}>Add New Milestone Tier</h2>
              <form onSubmit={handleAddTier} style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                <div>
                  <label style={labelStyle}>Tier Label</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Free Express Shipping"
                    value={newTier.label}
                    onChange={(e) => setNewTier({ ...newTier, label: e.target.value })}
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={labelStyle}>Spend Threshold (₹)</label>
                  <input
                    type="number"
                    required
                    value={newTier.thresholdRupees}
                    onChange={(e) => setNewTier({ ...newTier, thresholdRupees: Number(e.target.value) })}
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={labelStyle}>Reward Type</label>
                  <select
                    value={newTier.rewardType}
                    onChange={(e) => setNewTier({ ...newTier, rewardType: e.target.value })}
                    style={inputStyle}
                  >
                    <option value="free_shipping">Free Shipping</option>
                    <option value="freebie">Freebie Product</option>
                    <option value="discount_pct">Percentage Discount (% OFF)</option>
                    <option value="fixed_discount">Fixed Rupee Discount</option>
                  </select>
                </div>

                {newTier.rewardType === 'discount_pct' && (
                  <div>
                    <label style={labelStyle}>Discount Percentage (%)</label>
                    <input
                      type="number"
                      value={newTier.rewardValue}
                      onChange={(e) => setNewTier({ ...newTier, rewardValue: Number(e.target.value) })}
                      style={inputStyle}
                    />
                  </div>
                )}

                {newTier.rewardType === 'freebie' && (
                  <div>
                    <label style={labelStyle}>Select Free Product</label>
                    <select
                      value={newTier.freeProductId}
                      onChange={(e) => setNewTier({ ...newTier, freeProductId: e.target.value })}
                      style={inputStyle}
                    >
                      <option value="">Select product...</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.title} ({formatPaise(p.priceInPaise)})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                  <button type="submit" style={primaryBtnStyle}>
                    <Plus size={16} /> Create Tier Milestone
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* TAB 3: FREEBIES & BUNDLES */}
        {activeTab === 'freebies' && (
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: 800, margin: '0 0 6px 0' }}>Freebies & Bundle Offers</h1>
            <p style={{ color: '#71717a', fontSize: '14px', margin: '0 0 28px 0' }}>
              Automatically insert free gifts or apply bundle pricing when purchase conditions are satisfied.
            </p>

            <div style={{ ...cardStyle, marginBottom: '32px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 16px 0' }}>Active Freebie Rules</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {freebies.map((f) => (
                  <div
                    key={f.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      backgroundColor: '#27272a',
                      padding: '16px',
                      borderRadius: '12px',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700 }}>🎁 {f.label}</div>
                      <div style={{ color: '#a1a1aa', fontSize: '13px' }}>
                        Min Spend: <b style={{ color: '#10b981' }}>{formatPaise(f.min_spend_in_paise)}</b> • Free Item ID:{' '}
                        <code>{f.free_product_id}</code>
                      </div>
                    </div>
                    <span style={{ color: '#10b981', fontWeight: 700, fontSize: '12px' }}>● Active</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={cardStyle}>
              <h2 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 16px 0' }}>Add Freebie with Purchase Rule</h2>
              <form onSubmit={handleAddFreebie} style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                <div>
                  <label style={labelStyle}>Rule Label</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Free Summer Cap with Purchase"
                    value={newFreebie.label}
                    onChange={(e) => setNewFreebie({ ...newFreebie, label: e.target.value })}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Min Cart Spend (₹)</label>
                  <input
                    type="number"
                    required
                    value={newFreebie.minSpendRupees}
                    onChange={(e) => setNewFreebie({ ...newFreebie, minSpendRupees: Number(e.target.value) })}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Free Gift Product</label>
                  <select
                    value={newFreebie.freeProductId}
                    onChange={(e) => setNewFreebie({ ...newFreebie, freeProductId: e.target.value })}
                    style={inputStyle}
                  >
                    <option value="">Select product...</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.title}
                      </option>
                    ))}
                  </select>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                  <button type="submit" style={primaryBtnStyle}>
                    <Plus size={16} /> Save Freebie Rule
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* TAB 4: COUPONS & SAVINGS ENGINE */}
        {activeTab === 'coupons' && (
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: 800, margin: '0 0 6px 0' }}>Coupons & Savings Engine</h1>
            <p style={{ color: '#71717a', fontSize: '14px', margin: '0 0 28px 0' }}>
              Configure discount codes, stacking policies, auto-apply flags, and live savings displays.
            </p>

            <div style={{ ...cardStyle, marginBottom: '32px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 16px 0' }}>Active Coupon Codes</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                {coupons.map((c) => (
                  <div
                    key={c.id}
                    style={{
                      backgroundColor: '#27272a',
                      borderRadius: '12px',
                      padding: '18px',
                      border: '1px solid rgba(255,255,255,0.06)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <code style={{ fontSize: '18px', fontWeight: 800, color: '#f59e0b', letterSpacing: '0.05em' }}>
                          {c.code}
                        </code>
                        {c.auto_apply ? (
                          <span style={{ fontSize: '10px', backgroundColor: 'rgba(16,185,129,0.2)', color: '#10b981', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>
                            AUTO-APPLY
                          </span>
                        ) : null}
                      </div>
                      <p style={{ fontSize: '13px', color: '#e4e4e7', margin: '8px 0' }}>{c.description}</p>
                    </div>

                    <div style={{ fontSize: '11px', color: '#71717a', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '10px' }}>
                      Type: <b>{c.type}</b> • Min spend: <b>{formatPaise(c.min_spend_in_paise)}</b>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Create Coupon Form */}
            <div style={cardStyle}>
              <h2 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 16px 0' }}>Create Coupon</h2>
              <form onSubmit={handleAddCoupon} style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                <div>
                  <label style={labelStyle}>Coupon Code</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. VIP25"
                    value={newCoupon.code}
                    onChange={(e) => setNewCoupon({ ...newCoupon, code: e.target.value.toUpperCase() })}
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={labelStyle}>Discount Type</label>
                  <select
                    value={newCoupon.type}
                    onChange={(e) => setNewCoupon({ ...newCoupon, type: e.target.value })}
                    style={inputStyle}
                  >
                    <option value="percentage">Percentage (% OFF)</option>
                    <option value="fixed_amount">Fixed Amount (₹ OFF)</option>
                    <option value="free_shipping">Free Shipping</option>
                  </select>
                </div>

                <div>
                  <label style={labelStyle}>
                    Discount Value {newCoupon.type === 'percentage' ? '(%)' : '(₹)'}
                  </label>
                  <input
                    type="number"
                    required
                    value={newCoupon.value}
                    onChange={(e) => setNewCoupon({ ...newCoupon, value: Number(e.target.value) })}
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={labelStyle}>Min Cart Spend (₹)</label>
                  <input
                    type="number"
                    value={newCoupon.minSpendRupees}
                    onChange={(e) => setNewCoupon({ ...newCoupon, minSpendRupees: Number(e.target.value) })}
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={labelStyle}>Max Discount Cap (₹)</label>
                  <input
                    type="number"
                    value={newCoupon.maxDiscountRupees}
                    onChange={(e) => setNewCoupon({ ...newCoupon, maxDiscountRupees: Number(e.target.value) })}
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={labelStyle}>Short Description</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 15% OFF for festival season"
                    value={newCoupon.description}
                    onChange={(e) => setNewCoupon({ ...newCoupon, description: e.target.value })}
                    style={inputStyle}
                  />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={newCoupon.isStackable}
                      onChange={(e) => setNewCoupon({ ...newCoupon, isStackable: e.target.checked })}
                    />
                    Stackable with Tiers
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={newCoupon.autoApply}
                      onChange={(e) => setNewCoupon({ ...newCoupon, autoApply: e.target.checked })}
                    />
                    Auto-Apply
                  </label>
                </div>

                <div style={{ gridColumn: 'span 2', display: 'flex', justifyContent: 'flex-end' }}>
                  <button type="submit" style={primaryBtnStyle}>
                    <Plus size={16} /> Save Coupon Code
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* TAB 5: AI UPSELLS STUDIO */}
        {activeTab === 'upsells' && (
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: 800, margin: '0 0 6px 0' }}>AI Upsell & Merchandising Studio</h1>
            <p style={{ color: '#71717a', fontSize: '14px', margin: '0 0 28px 0' }}>
              The algorithmic recommender uses affinity scores, category synergies, and price brackets.
              Merchants can manually pin high-margin accessories or hide items.
            </p>

            <div style={cardStyle}>
              <h2 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 16px 0' }}>
                Catalog Cross-Sell Status & Pinned Merchandising
              </h2>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                <thead>
                  <tr style={{ color: '#71717a', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                    <th style={{ padding: '12px' }}>Product</th>
                    <th style={{ padding: '12px' }}>Category</th>
                    <th style={{ padding: '12px' }}>Price</th>
                    <th style={{ padding: '12px' }}>Curated Status</th>
                    <th style={{ padding: '12px' }}>In-Cart Special Discount</th>
                    <th style={{ padding: '12px' }}>Impulse Score</th>
                  </tr>
                </thead>
                <tbody>
                  {products.slice(0, 8).map((p) => {
                    const isPinned = p.id === 'prod_dad_cap' || p.id === 'prod_sneaker_cleaner';
                    return (
                      <tr key={p.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <td style={{ padding: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <img src={p.imageUrl} alt="" style={{ width: '36px', height: '36px', borderRadius: '6px', objectFit: 'cover' }} />
                          <span style={{ fontWeight: 600 }}>{p.title}</span>
                        </td>
                        <td style={{ padding: '12px', color: '#a1a1aa' }}>{p.category}</td>
                        <td style={{ padding: '12px', fontWeight: 700 }}>{formatPaise(p.priceInPaise)}</td>
                        <td style={{ padding: '12px' }}>
                          {isPinned ? (
                            <span style={{ backgroundColor: 'rgba(245,158,11,0.2)', color: '#f59e0b', padding: '3px 8px', borderRadius: '4px', fontWeight: 700, fontSize: '11px' }}>
                              ★ PINNED BY MERCHANDISER
                            </span>
                          ) : (
                            <span style={{ color: '#10b981', fontSize: '11px', fontWeight: 600 }}>
                              AI Algorithmic
                            </span>
                          )}
                        </td>
                        <td style={{ padding: '12px' }}>{isPinned ? '15% - 20% OFF' : 'Standard'}</td>
                        <td style={{ padding: '12px', color: '#10b981', fontWeight: 700 }}>
                          {isPinned ? '98 / 100' : '82 / 100'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 6: A/B TESTING LAB */}
        {activeTab === 'ab_testing' && abResults && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <div>
                <h1 style={{ fontSize: '28px', fontWeight: 800, margin: 0 }}>A/B Testing Experiment Lab</h1>
                <p style={{ color: '#71717a', fontSize: '14px', margin: '4px 0 0 0' }}>
                  Scientific verification of conversion lift and AOV impact with zero-cookie deterministic assignment.
                </p>
              </div>
              <div
                style={{
                  backgroundColor: 'rgba(16, 185, 129, 0.15)',
                  border: '1px solid #10b981',
                  color: '#34d399',
                  padding: '6px 14px',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <Trophy size={14} /> Winner Declared: {abResults.lift.winner}
              </div>
            </div>

            {/* Relative Lift Highlights */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px', marginBottom: '32px' }}>
              <div style={{ ...kpiCardStyle, borderLeft: '4px solid #10b981' }}>
                <div style={{ fontSize: '13px', color: '#a1a1aa' }}>Net Relative Conversion Lift</div>
                <div style={{ fontSize: '36px', fontWeight: 800, color: '#10b981', margin: '8px 0' }}>
                  +{abResults.lift.conversionLiftPct}%
                </div>
                <div style={{ fontSize: '12px', color: '#a1a1aa' }}>
                  CartX gamified tiers lifted checkout completion from 22.5% to 31.25%
                </div>
              </div>

              <div style={{ ...kpiCardStyle, borderLeft: '4px solid #f59e0b' }}>
                <div style={{ fontSize: '13px', color: '#a1a1aa' }}>Net Relative AOV Lift</div>
                <div style={{ fontSize: '36px', fontWeight: 800, color: '#f59e0b', margin: '8px 0' }}>
                  +{abResults.lift.aovLiftPct}%
                </div>
                <div style={{ fontSize: '12px', color: '#a1a1aa' }}>
                  Average basket size increased through tier incentives and 1-click upsells
                </div>
              </div>
            </div>

            {/* Side-by-side Variant Comparison */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px' }}>
              {abResults.variantResults.map((v: any, idx: number) => {
                const isWinner = idx === 1;

                return (
                  <div
                    key={v.variantId}
                    style={{
                      backgroundColor: '#18181b',
                      borderRadius: '16px',
                      border: isWinner ? '2px solid #10b981' : '1px solid rgba(255,255,255,0.08)',
                      padding: '28px',
                      position: 'relative',
                    }}
                  >
                    {isWinner && (
                      <div
                        style={{
                          position: 'absolute',
                          top: '-12px',
                          right: '24px',
                          backgroundColor: '#10b981',
                          color: '#000',
                          fontSize: '11px',
                          fontWeight: 800,
                          padding: '3px 10px',
                          borderRadius: '12px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <Trophy size={12} /> OUTPERFORMING
                      </div>
                    )}

                    <div style={{ fontSize: '12px', textTransform: 'uppercase', color: '#a1a1aa', fontWeight: 700 }}>
                      Traffic Split: {v.trafficPct}%
                    </div>
                    <h3 style={{ fontSize: '20px', fontWeight: 800, margin: '6px 0 20px 0' }}>{v.name}</h3>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', marginBottom: '20px' }}>
                      <div style={{ backgroundColor: '#27272a', padding: '12px', borderRadius: '8px' }}>
                        <div style={{ fontSize: '11px', color: '#71717a' }}>Unique Visitors</div>
                        <div style={{ fontSize: '20px', fontWeight: 700 }}>{v.visitors}</div>
                      </div>
                      <div style={{ backgroundColor: '#27272a', padding: '12px', borderRadius: '8px' }}>
                        <div style={{ fontSize: '11px', color: '#71717a' }}>Completed Orders</div>
                        <div style={{ fontSize: '20px', fontWeight: 700 }}>{v.conversions}</div>
                      </div>
                      <div style={{ backgroundColor: '#27272a', padding: '12px', borderRadius: '8px' }}>
                        <div style={{ fontSize: '11px', color: '#71717a' }}>Conversion Rate</div>
                        <div style={{ fontSize: '20px', fontWeight: 800, color: isWinner ? '#10b981' : '#fafafa' }}>
                          {v.conversionRatePct}%
                        </div>
                      </div>
                      <div style={{ backgroundColor: '#27272a', padding: '12px', borderRadius: '8px' }}>
                        <div style={{ fontSize: '11px', color: '#71717a' }}>Average Order Value</div>
                        <div style={{ fontSize: '20px', fontWeight: 800, color: isWinner ? '#f59e0b' : '#fafafa' }}>
                          {formatPaise(v.avgOrderValuePaise)}
                        </div>
                      </div>
                    </div>

                    <div style={{ fontSize: '14px', fontWeight: 700, color: '#e4e4e7', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '16px' }}>
                      Total Revenue Generated: <span style={{ color: '#10b981' }}>{formatPaise(v.totalRevenuePaise)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 7: THEME & LIVE PREVIEW */}
        {activeTab === 'theme' && config && (
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: 800, margin: '0 0 6px 0' }}>Theme & Live Preview</h1>
            <p style={{ color: '#71717a', fontSize: '14px', margin: '0 0 28px 0' }}>
              Match your brand identity with custom colors, typography, border radius, and drawer placement.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '32px' }}>
              {/* Controls */}
              <div style={cardStyle}>
                <h2 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 20px 0' }}>Cart Style Properties</h2>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' }}>
                  <div>
                    <label style={labelStyle}>Primary Accent Color</label>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <input
                        type="color"
                        value={config.theme.primaryColor}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            theme: { ...config.theme, primaryColor: e.target.value },
                          })
                        }
                        style={{ width: '40px', height: '40px', borderRadius: '8px', border: 'none', cursor: 'pointer' }}
                      />
                      <input
                        type="text"
                        value={config.theme.primaryColor}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            theme: { ...config.theme, primaryColor: e.target.value },
                          })
                        }
                        style={inputStyle}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={labelStyle}>Secondary Accent Color</label>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <input
                        type="color"
                        value={config.theme.accentColor}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            theme: { ...config.theme, accentColor: e.target.value },
                          })
                        }
                        style={{ width: '40px', height: '40px', borderRadius: '8px', border: 'none', cursor: 'pointer' }}
                      />
                      <input
                        type="text"
                        value={config.theme.accentColor}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            theme: { ...config.theme, accentColor: e.target.value },
                          })
                        }
                        style={inputStyle}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={labelStyle}>Drawer Corner Radius ({config.theme.borderRadiusPx}px)</label>
                    <input
                      type="range"
                      min="0"
                      max="24"
                      value={config.theme.borderRadiusPx}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          theme: { ...config.theme, borderRadiusPx: Number(e.target.value) },
                        })
                      }
                      style={{ width: '100%', accentColor: config.theme.primaryColor }}
                    />
                  </div>

                  <div>
                    <label style={labelStyle}>Drawer Position</label>
                    <div style={{ display: 'flex', gap: '16px', marginTop: '8px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
                        <input
                          type="radio"
                          name="pos"
                          checked={config.theme.drawerPosition === 'right'}
                          onChange={() =>
                            setConfig({
                              ...config,
                              theme: { ...config.theme, drawerPosition: 'right' },
                            })
                          }
                        />
                        Right Slide
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
                        <input
                          type="radio"
                          name="pos"
                          checked={config.theme.drawerPosition === 'left'}
                          onChange={() =>
                            setConfig({
                              ...config,
                              theme: { ...config.theme, drawerPosition: 'left' },
                            })
                          }
                        />
                        Left Slide
                      </label>
                    </div>
                  </div>

                  <div style={{ gridColumn: 'span 2' }}>
                    <label style={labelStyle}>Urgency Banner Text</label>
                    <input
                      type="text"
                      value={config.urgencyBannerText}
                      onChange={(e) => setConfig({ ...config, urgencyBannerText: e.target.value })}
                      style={inputStyle}
                    />
                  </div>
                </div>

                <div style={{ marginTop: '28px', display: 'flex', justifyContent: 'flex-end' }}>
                  <button onClick={() => handleSaveConfig(config)} style={primaryBtnStyle}>
                    Publish Theme Updates
                  </button>
                </div>
              </div>

              {/* Live Preview Mockup Box */}
              <div
                style={{
                  backgroundColor: config.theme.backgroundColor,
                  borderRadius: '16px',
                  border: '1px solid rgba(255,255,255,0.15)',
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                  boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '12px' }}>
                  <span style={{ fontWeight: 800, fontSize: '15px' }}>Preview Drawer</span>
                  <span
                    style={{
                      backgroundColor: config.theme.primaryColor,
                      color: '#000',
                      fontSize: '11px',
                      fontWeight: 800,
                      padding: '2px 8px',
                      borderRadius: '10px',
                    }}
                  >
                    2
                  </span>
                </div>

                {/* Urgency */}
                <div style={{ backgroundColor: '#1c1917', padding: '8px 12px', borderRadius: '6px', fontSize: '11px', color: '#fef3c7', display: 'flex', justifyContent: 'space-between' }}>
                  <span>{config.urgencyBannerText}</span>
                  <span style={{ color: config.theme.accentColor, fontFamily: 'monospace' }}>14:59</span>
                </div>

                {/* Progress */}
                <div>
                  <div style={{ fontSize: '12px', color: '#a1a1aa', marginBottom: '6px' }}>
                    Add ₹499 more for <b style={{ color: config.theme.primaryColor }}>Free Tote</b>
                  </div>
                  <div style={{ height: '6px', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '4px' }}>
                    <div style={{ height: '100%', width: '70%', backgroundColor: config.theme.primaryColor, borderRadius: '4px' }} />
                  </div>
                </div>

                {/* Item */}
                <div style={{ backgroundColor: config.theme.surfaceColor, padding: '12px', borderRadius: `${config.theme.borderRadiusPx}px`, display: 'flex', gap: '10px' }}>
                  <div style={{ width: '48px', height: '48px', backgroundColor: '#27272a', borderRadius: '6px' }} />
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 600 }}>Aura Boxy Tee</div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: config.theme.primaryColor }}>₹1,299</div>
                  </div>
                </div>

                {/* Checkout CTA */}
                <button
                  style={{
                    backgroundColor: config.theme.primaryColor,
                    color: '#000',
                    border: 'none',
                    padding: '12px',
                    borderRadius: `${config.theme.borderRadiusPx}px`,
                    fontWeight: 800,
                    fontSize: '14px',
                    cursor: 'pointer',
                    marginTop: 'auto',
                  }}
                >
                  Instant Checkout • ₹1,299
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 8: MODULAR FEATURE SWITCHBOARD */}
        {activeTab === 'switchboard' && config && (
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: 800, margin: '0 0 6px 0' }}>Modular Feature Switchboard</h1>
            <p style={{ color: '#71717a', fontSize: '14px', margin: '0 0 28px 0' }}>
              DevX Labs modular architecture: activate only the features your store needs for ultra-fast, zero-overhead performance.
            </p>

            <div style={cardStyle}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {Object.entries(config.modules).map(([modKey, isEnabled]) => {
                  const labels: Record<string, { title: string; desc: string }> = {
                    urgencyProgressTools: {
                      title: 'Cart Urgency & Milestone Progress Bar',
                      desc: 'Real-time progress cues for free shipping, free gifts, and urgency countdown timers.',
                    },
                    freebiesAndBundles: {
                      title: 'Freebies & Bundle Engine',
                      desc: 'Auto-adds gifts or bundle pricing when spend thresholds are met.',
                    },
                    aiUpsellCrossSell: {
                      title: 'AI Upsell & Cross-Sell Carousel',
                      desc: 'Algorithmic co-purchase recommendations with manual merchandiser pinning overrides.',
                    },
                    couponSavingsEngine: {
                      title: 'Coupon & Savings Engine',
                      desc: 'Auto-apply promo codes and showcase live savings breakdown to drive conversion.',
                    },
                    collectionSpecificCarts: {
                      title: 'Collection-Specific Cart Profiles',
                      desc: 'Customize cart banners, exclusive offers, and themes per collection.',
                    },
                    advancedAnalytics: {
                      title: 'Advanced Analytics Pipeline',
                      desc: 'Stream events (cart opens, adds, dropoffs) to calculate real-time conversion rates.',
                    },
                    abTesting: {
                      title: 'A/B Testing Lab',
                      desc: 'Deterministic visitor variant assignment to test cart layouts and measure AOV lift.',
                    },
                  };

                  const meta = labels[modKey] || { title: modKey, desc: '' };

                  return (
                    <div
                      key={modKey}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '16px 20px',
                        backgroundColor: '#27272a',
                        borderRadius: '12px',
                        border: '1px solid rgba(255,255,255,0.06)',
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '15px' }}>{meta.title}</div>
                        <div style={{ color: '#a1a1aa', fontSize: '13px', marginTop: '2px' }}>{meta.desc}</div>
                      </div>

                      <label style={{ position: 'relative', display: 'inline-block', width: '48px', height: '26px' }}>
                        <input
                          type="checkbox"
                          checked={Boolean(isEnabled)}
                          onChange={(e) => {
                            const updated = {
                              ...config,
                              modules: {
                                ...config.modules,
                                [modKey]: e.target.checked,
                              },
                            };
                            handleSaveConfig(updated);
                          }}
                          style={{ opacity: 0, width: 0, height: 0 }}
                        />
                        <span
                          style={{
                            position: 'absolute',
                            cursor: 'pointer',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            backgroundColor: isEnabled ? '#10b981' : '#3f3f46',
                            borderRadius: '34px',
                            transition: '0.2s',
                          }}
                        >
                          <span
                            style={{
                              position: 'absolute',
                              content: '""',
                              height: '20px',
                              width: '20px',
                              left: isEnabled ? '25px' : '3px',
                              bottom: '3px',
                              backgroundColor: '#fff',
                              borderRadius: '50%',
                              transition: '0.2s',
                            }}
                          />
                        </span>
                      </label>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* TAB 8: SEARCHX STUDIO */}
        {activeTab === 'searchx' && (
          <SearchXStudio apiBase={API_BASE} products={products} />
        )}

        {/* TAB 9: CLIENT CASE STUDIES & ROI */}
        {activeTab === 'case_studies' && (
          <CaseStudiesGallery />
        )}
      </main>
    </div>
  );
}

// Reusable inline styles
function navButtonStyle(active: boolean): React.CSSProperties {
  return {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    width: '100%',
    padding: '10px 14px',
    backgroundColor: active ? 'rgba(16, 185, 129, 0.15)' : 'transparent',
    color: active ? '#10b981' : '#a1a1aa',
    fontWeight: active ? 700 : 500,
    fontSize: '13px',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'all 0.15s',
  };
}

const cardStyle: React.CSSProperties = {
  backgroundColor: '#18181b',
  borderRadius: '16px',
  border: '1px solid rgba(255,255,255,0.08)',
  padding: '24px',
};

const kpiCardStyle: React.CSSProperties = {
  backgroundColor: '#18181b',
  borderRadius: '16px',
  border: '1px solid rgba(255,255,255,0.08)',
  padding: '20px',
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
  border: '1px solid rgba(255,255,255,0.12)',
  color: '#fafafa',
  padding: '10px 14px',
  borderRadius: '8px',
  fontSize: '13px',
  outline: 'none',
  boxSizing: 'border-box',
};

const primaryBtnStyle: React.CSSProperties = {
  backgroundColor: '#10b981',
  color: '#000',
  border: 'none',
  padding: '10px 18px',
  borderRadius: '8px',
  fontWeight: 700,
  fontSize: '13px',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
};
