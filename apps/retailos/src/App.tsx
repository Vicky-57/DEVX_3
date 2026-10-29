import React, { useState, useEffect } from 'react';
import {
  Store,
  CreditCard,
  PackageCheck,
  RotateCcw,
  Boxes,
  Receipt,
  UserCheck,
  Search,
  Plus,
  Minus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  QrCode,
  DollarSign,
  ArrowRightLeft,
  ExternalLink,
  Sparkles,
  RefreshCw,
  ShoppingBag,
  Printer,
  ChevronRight,
  ShieldCheck,
  Lock,
} from 'lucide-react';
import { formatPaise } from '@cartx/shared';

const API_BASE = (import.meta as any).env?.VITE_API_BASE || 'https://devx-commerce-api.onrender.com';
const STORE_URL = (import.meta as any).env?.VITE_STORE_URL || 'https://devx-3.vercel.app';
const CONSOLE_URL = (import.meta as any).env?.VITE_CONSOLE_URL || 'https://devx-console.vercel.app';

type RetailTab = 'pos' | 'bopis' | 'returns' | 'inventory' | 'shifts' | 'clienteling';

interface CartItem {
  productId: string;
  title: string;
  priceInPaise: number;
  quantity: number;
  imageUrl: string;
  category: string;
}

export default function App() {
  const [activeTab, setActiveTab] = useState<RetailTab>('pos');
  const [locations, setLocations] = useState<any[]>([]);
  const [selectedLocationId, setSelectedLocationId] = useState<string>('loc_flagship');
  const [inventoryMatrix, setInventoryMatrix] = useState<any[]>([]);
  const [bopisOrders, setBopisOrders] = useState<any[]>([]);
  const [activeShift, setActiveShift] = useState<any>(null);
  const [shiftLogs, setShiftLogs] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [customerSearch, setCustomerSearch] = useState<string>('Arjun');
  const [loading, setLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // POS State
  const [posCart, setPosCart] = useState<CartItem[]>([]);
  const [posDiscountPaise, setPosDiscountPaise] = useState<number>(0);
  const [posSearchTerm, setPosSearchTerm] = useState<string>('');
  const [posCategory, setPosCategory] = useState<string>('All');
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'upi' | 'card'>('upi');
  const [tenderCashAmountPaise, setTenderCashAmountPaise] = useState<number>(0);
  const [lastReceipt, setLastReceipt] = useState<any>(null);

  // BOPIS OTP verification state
  const [otpInputs, setOtpInputs] = useState<Record<string, string>>({});

  // BORIS Return state
  const [returnOrderId, setReturnOrderId] = useState<string>('ord_ctrl_1');
  const [returnReason, setReturnReason] = useState<string>('wrong_size');
  const [returnStatusMsg, setReturnStatusMsg] = useState<string | null>(null);

  // Stock Transfer state
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [transferProdId, setTransferProdId] = useState<string>('');
  const [transferQty, setTransferQty] = useState<number>(5);
  const [transferFromLoc, setTransferFromLoc] = useState<string>('loc_online');

  // Shift reconcilation state
  const [closeActualCashPaise, setCloseActualCashPaise] = useState<number>(500000);
  const [cashDropAmountPaise, setCashDropAmountPaise] = useState<number>(200000);
  const [cashDropReason, setCashDropReason] = useState<string>('Mid-day safe deposit drop');

  // Fetch initial RetailOS data
  const loadRetailData = async () => {
    setLoading(true);
    try {
      const [locRes, invRes, bopisRes, shiftRes, custRes] = await Promise.all([
        fetch(`${API_BASE}/v1/retail/locations`),
        fetch(`${API_BASE}/v1/retail/inventory?locationId=${selectedLocationId}`),
        fetch(`${API_BASE}/v1/retail/bopis?locationId=${selectedLocationId}`),
        fetch(`${API_BASE}/v1/retail/shifts/current?locationId=${selectedLocationId}`),
        fetch(`${API_BASE}/v1/retail/customers`),
      ]);

      if (locRes.ok) {
        const d = await locRes.json();
        setLocations(d.locations || []);
      }
      if (invRes.ok) {
        const d = await invRes.json();
        setInventoryMatrix(d.inventory || []);
      }
      if (bopisRes.ok) {
        const d = await bopisRes.json();
        setBopisOrders(d.bopisOrders || []);
      }
      if (shiftRes.ok) {
        const d = await shiftRes.json();
        setActiveShift(d.activeShift || null);
        setShiftLogs(d.logs || []);
      }
      if (custRes.ok) {
        const d = await custRes.json();
        setCustomers(d.customers || []);
      }
    } catch (err) {
      console.error('Error loading RetailOS data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRetailData();
  }, [selectedLocationId]);

  // Load Customer 360 profile
  const loadCustomer360 = async (idOrQuery: string) => {
    try {
      const res = await fetch(`${API_BASE}/v1/retail/customers/${idOrQuery}/360`);
      if (res.ok) {
        const d = await res.json();
        setSelectedCustomer(d.customer);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (activeTab === 'clienteling' && !selectedCustomer) {
      loadCustomer360('cust_arjun');
    }
  }, [activeTab]);

  // POS Handlers
  const handleAddToPosCart = (prod: any) => {
    // Check available stock at current location
    const locItem = inventoryMatrix.find((m) => m.product.id === prod.id);
    const locStock = locItem?.locations.find((l: any) => l.locationId === selectedLocationId);
    const avail = locStock ? locStock.available : 0;

    const existing = posCart.find((i) => i.productId === prod.id);
    if (existing && existing.quantity >= avail) {
      alert(`Cannot add more than ${avail} available in-store units.`);
      return;
    }

    if (existing) {
      setPosCart(
        posCart.map((i) => (i.productId === prod.id ? { ...i, quantity: i.quantity + 1 } : i))
      );
    } else {
      setPosCart([
        ...posCart,
        {
          productId: prod.id,
          title: prod.title,
          priceInPaise: prod.price_in_paise || prod.priceInPaise,
          quantity: 1,
          imageUrl: prod.image_url || prod.imageUrl,
          category: prod.category,
        },
      ]);
    }
  };

  const handleUpdateCartQty = (productId: string, delta: number) => {
    setPosCart(
      posCart
        .map((i) => {
          if (i.productId === productId) {
            const next = i.quantity + delta;
            return next > 0 ? { ...i, quantity: next } : null;
          }
          return i;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const posSubtotalPaise = posCart.reduce((sum, item) => sum + item.priceInPaise * item.quantity, 0);
  const posTotalPaise = Math.max(0, posSubtotalPaise - posDiscountPaise);

  const handleExecutePosSale = async () => {
    if (posCart.length === 0) return;

    try {
      const payments = [
        {
          type: paymentMethod,
          amountPaise: posTotalPaise,
        },
      ];

      const res = await fetch(`${API_BASE}/v1/retail/pos/sale`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          locationId: selectedLocationId,
          staffId: 'staff_karan',
          staffName: 'Karan Mehta',
          customerName: 'In-Store Walk-in Customer',
          customerPhone: '+91 98888 77777',
          items: posCart,
          payments,
          discountPaise: posDiscountPaise,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setLastReceipt(data.receipt);
        setPosCart([]);
        setPosDiscountPaise(0);
        setIsCheckoutModalOpen(false);
        loadRetailData();
      } else {
        const err = await res.json();
        alert(`Checkout failed: ${err.error || 'Server error'}`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // BOPIS Handlers
  const handleUpdateBopisStatus = async (orderId: string, nextStatus: string, otpProvided?: string) => {
    try {
      const res = await fetch(`${API_BASE}/v1/retail/bopis/${orderId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: nextStatus,
          otpProvided,
        }),
      });

      if (res.ok) {
        setStatusMessage(`BOPIS Order ${orderId} marked as ${nextStatus}!`);
        setTimeout(() => setStatusMessage(null), 3000);
        loadRetailData();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to update pickup status');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // BORIS Return Handlers
  const handleProcessReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/v1/retail/returns`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: returnOrderId,
          locationId: selectedLocationId,
          returnedItems: [
            {
              productId: 'prod_tee_heavy',
              title: 'Aura Heavyweight Boxy Tee',
              quantity: 1,
              priceInPaise: 129900,
            },
          ],
          reason: returnReason,
          actionType: 'refund',
        }),
      });

      if (res.ok) {
        const d = await res.json();
        setReturnStatusMsg(`Return accepted! ₹1,299 refunded and 1 unit restocked to local store.`);
        setTimeout(() => setReturnStatusMsg(null), 4000);
        loadRetailData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Inventory Transfer Handler
  const handleExecuteTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/v1/retail/inventory/transfer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: transferProdId,
          fromLocationId: transferFromLoc,
          toLocationId: selectedLocationId,
          quantity: transferQty,
        }),
      });

      if (res.ok) {
        setStatusMessage(`Transferred ${transferQty} units into current location!`);
        setTimeout(() => setStatusMessage(null), 3000);
        setTransferModalOpen(false);
        loadRetailData();
      } else {
        const err = await res.json();
        alert(err.error || 'Transfer failed');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Shift Cash Drop
  const handleCashDrop = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeShift) return;

    try {
      const res = await fetch(`${API_BASE}/v1/retail/shifts/log`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shiftId: activeShift.id,
          type: 'drop',
          amountPaise: cashDropAmountPaise,
          reason: cashDropReason,
        }),
      });

      if (res.ok) {
        setStatusMessage(`Recorded cash drop of ${formatPaise(cashDropAmountPaise)}.`);
        setTimeout(() => setStatusMessage(null), 3000);
        loadRetailData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Close Shift & Reconcile
  const handleCloseShift = async () => {
    if (!activeShift) return;
    if (!confirm('Are you sure you want to close this register shift and generate the discrepancy report?')) return;

    try {
      const res = await fetch(`${API_BASE}/v1/retail/shifts/close`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shiftId: activeShift.id,
          actualCashPaise: closeActualCashPaise,
        }),
      });

      if (res.ok) {
        const d = await res.json();
        alert(
          `Shift Closed!\nExpected: ${formatPaise(d.expectedCashPaise)}\nActual: ${formatPaise(d.actualCashPaise)}\nDiscrepancy: ${formatPaise(d.discrepancyPaise)}`
        );
        loadRetailData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const selectedLoc = locations.find((l) => l.id === selectedLocationId);

  // Filter products for POS
  const filteredProducts = inventoryMatrix.filter((item) => {
    const p = item.product;
    const matchCat = posCategory === 'All' || p.category.toLowerCase().includes(posCategory.toLowerCase());
    const matchSearch = !posSearchTerm || p.title.toLowerCase().includes(posSearchTerm.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: '#090d16', color: '#f1f5f9' }}>
      {/* Top Header Bar */}
      <header
        style={{
          height: '64px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          backgroundColor: '#0d131f',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 24px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #0284c7, #0369a1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontWeight: 900,
              }}
            >
              <Store size={18} />
            </div>
            <div>
              <div style={{ fontSize: '15px', fontWeight: 800, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '6px' }}>
                DevX RetailOS™
                <span
                  style={{
                    backgroundColor: 'rgba(2, 132, 199, 0.15)',
                    color: '#38bdf8',
                    padding: '1px 6px',
                    borderRadius: '4px',
                    fontSize: '10px',
                    fontWeight: 700,
                    border: '1px solid rgba(2, 132, 199, 0.3)',
                  }}
                >
                  POS & Operations
                </span>
              </div>
              <div style={{ fontSize: '11px', color: '#64748b' }}>Omnichannel Terminal & Register</div>
            </div>
          </div>

          <span style={{ color: '#334155' }}>|</span>

          {/* Location Switcher */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', color: '#94a3b8' }}>Active Station:</span>
            <select
              value={selectedLocationId}
              onChange={(e) => setSelectedLocationId(e.target.value)}
              style={{
                backgroundColor: '#1e293b',
                color: '#f8fafc',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                padding: '6px 12px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 600,
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.name} ({loc.type.toUpperCase()})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Status Pills & Links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          {activeShift ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: 'rgba(16, 185, 129, 0.12)',
                color: '#10b981',
                padding: '4px 10px',
                borderRadius: '20px',
                fontSize: '11px',
                fontWeight: 700,
                border: '1px solid rgba(16, 185, 129, 0.25)',
              }}
            >
              <CheckCircle2 size={13} /> Shift Open • Drawer: {formatPaise(activeShift.expected_cash_paise)}
            </div>
          ) : (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: 'rgba(239, 68, 68, 0.12)',
                color: '#ef4444',
                padding: '4px 10px',
                borderRadius: '20px',
                fontSize: '11px',
                fontWeight: 700,
              }}
            >
              <Lock size={13} /> Shift Closed
            </div>
          )}

          <div style={{ fontSize: '12px', color: '#94a3b8' }}>
            Associate: <strong style={{ color: '#f1f5f9' }}>Karan Mehta</strong>
          </div>

          <span style={{ color: '#334155' }}>|</span>

          <a
            href={STORE_URL}
            target="_blank"
            rel="noreferrer"
            style={{
              color: '#38bdf8',
              fontSize: '11px',
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            Storefront <ExternalLink size={11} />
          </a>
          <a
            href={CONSOLE_URL}
            target="_blank"
            rel="noreferrer"
            style={{
              color: '#10b981',
              fontSize: '11px',
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            Console <ExternalLink size={11} />
          </a>
        </div>
      </header>

      {/* Main Container */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Left Vertical Nav */}
        <nav
          style={{
            width: '240px',
            backgroundColor: '#0d131f',
            borderRight: '1px solid rgba(255, 255, 255, 0.08)',
            padding: '20px 12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
          }}
        >
          <button
            onClick={() => setActiveTab('pos')}
            style={navBtnStyle(activeTab === 'pos')}
          >
            <CreditCard size={18} /> Touchscreen POS
          </button>

          <button
            onClick={() => setActiveTab('bopis')}
            style={navBtnStyle(activeTab === 'bopis')}
          >
            <PackageCheck size={18} /> BOPIS Pickup ({bopisOrders.filter((b) => b.pickup_status !== 'collected').length})
          </button>

          <button
            onClick={() => setActiveTab('returns')}
            style={navBtnStyle(activeTab === 'returns')}
          >
            <RotateCcw size={18} /> BORIS Omnichannel Returns
          </button>

          <button
            onClick={() => setActiveTab('inventory')}
            style={navBtnStyle(activeTab === 'inventory')}
          >
            <Boxes size={18} /> Multi-Location Matrix
          </button>

          <button
            onClick={() => setActiveTab('shifts')}
            style={navBtnStyle(activeTab === 'shifts')}
          >
            <Receipt size={18} /> Cash Drawer & Shift
          </button>

          <button
            onClick={() => setActiveTab('clienteling')}
            style={navBtnStyle(activeTab === 'clienteling')}
          >
            <UserCheck size={18} /> Store Manager AI Assistant
          </button>
        </nav>

        {/* Central Workspace Area */}
        <main style={{ flex: 1, overflowY: 'auto', padding: '24px 32px' }}>
          {statusMessage && (
            <div
              style={{
                backgroundColor: 'rgba(16, 185, 129, 0.15)',
                border: '1px solid #10b981',
                color: '#34d399',
                padding: '12px 18px',
                borderRadius: '8px',
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '13px',
              }}
            >
              <CheckCircle2 size={16} /> {statusMessage}
            </div>
          )}

          {/* TAB 1: TOUCHSCREEN POS */}
          {activeTab === 'pos' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1.7fr 1fr', gap: '24px', height: '100%' }}>
              {/* Product Catalog Screen */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Search & Categories */}
                <div style={{ display: 'flex', gap: '12px' }}>
                  <div style={{ flex: 1, position: 'relative' }}>
                    <Search size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: '#64748b' }} />
                    <input
                      type="text"
                      placeholder="Scan SKU barcode or search products..."
                      value={posSearchTerm}
                      onChange={(e) => setPosSearchTerm(e.target.value)}
                      style={{
                        width: '100%',
                        backgroundColor: '#1e293b',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        padding: '10px 14px 10px 38px',
                        borderRadius: '8px',
                        color: '#f8fafc',
                        fontSize: '13px',
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '6px' }}>
                    {['All', 'Streetwear', 'Footwear', 'Accessories'].map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setPosCategory(cat)}
                        style={{
                          backgroundColor: posCategory === cat ? '#0284c7' : '#1e293b',
                          color: posCategory === cat ? '#ffffff' : '#94a3b8',
                          border: 'none',
                          padding: '8px 14px',
                          borderRadius: '8px',
                          fontSize: '12px',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Touch Product Grid */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: '12px',
                    overflowY: 'auto',
                    maxHeight: 'calc(100vh - 200px)',
                  }}
                >
                  {filteredProducts.map((item) => {
                    const p = item.product;
                    const locStock = item.locations.find((l: any) => l.locationId === selectedLocationId);
                    const avail = locStock ? locStock.available : 0;
                    const isOutOfStock = avail <= 0;

                    return (
                      <div
                        key={p.id}
                        onClick={() => !isOutOfStock && handleAddToPosCart(p)}
                        style={{
                          backgroundColor: '#131b2c',
                          borderRadius: '12px',
                          border: '1px solid rgba(255, 255, 255, 0.06)',
                          padding: '12px',
                          cursor: isOutOfStock ? 'not-allowed' : 'pointer',
                          opacity: isOutOfStock ? 0.45 : 1,
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          transition: 'transform 0.1s, border-color 0.1s',
                        }}
                      >
                        <img
                          src={p.image_url || p.imageUrl}
                          alt={p.title}
                          style={{
                            width: '100%',
                            height: '110px',
                            objectFit: 'cover',
                            borderRadius: '8px',
                            marginBottom: '10px',
                          }}
                        />
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: 600, color: '#f8fafc', marginBottom: '4px' }}>
                            {p.title}
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '14px', fontWeight: 800, color: '#38bdf8' }}>
                              {formatPaise(p.price_in_paise || p.priceInPaise)}
                            </span>
                            <span
                              style={{
                                fontSize: '11px',
                                color: avail <= 3 ? '#fbbf24' : '#10b981',
                                fontWeight: 600,
                              }}
                            >
                              {avail} on floor
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* POS Terminal Cart & Cash Register */}
              <div
                style={{
                  backgroundColor: '#131b2c',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  height: 'calc(100vh - 120px)',
                  padding: '20px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '12px' }}>
                  <div style={{ fontSize: '16px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <ShoppingBag size={18} /> Register Cart
                  </div>
                  <button
                    onClick={() => setPosCart([])}
                    style={{ background: 'transparent', border: 'none', color: '#64748b', fontSize: '12px', cursor: 'pointer' }}
                  >
                    Clear Cart
                  </button>
                </div>

                {/* Cart items scrollable */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '12px 0' }}>
                  {posCart.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px 0', color: '#64748b', fontSize: '13px' }}>
                      Tap products on the left or scan a barcode to add to customer bag.
                    </div>
                  ) : (
                    posCart.map((item) => (
                      <div
                        key={item.productId}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '10px 0',
                          borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                        }}
                      >
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '13px', fontWeight: 600, color: '#f8fafc' }}>{item.title}</div>
                          <div style={{ fontSize: '12px', color: '#38bdf8' }}>{formatPaise(item.priceInPaise)}</div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <button
                            onClick={() => handleUpdateCartQty(item.productId, -1)}
                            style={qtyBtnStyle}
                          >
                            <Minus size={12} />
                          </button>
                          <span style={{ fontSize: '13px', fontWeight: 700, minWidth: '18px', textAlign: 'center' }}>
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => handleUpdateCartQty(item.productId, 1)}
                            style={qtyBtnStyle}
                          >
                            <Plus size={12} />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Subtotal & Tender Buttons */}
                <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px', color: '#94a3b8' }}>
                    <span>Subtotal:</span>
                    <span>{formatPaise(posSubtotalPaise)}</span>
                  </div>
                  {posDiscountPaise > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px', color: '#10b981' }}>
                      <span>Associate Discount:</span>
                      <span>-{formatPaise(posDiscountPaise)}</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', fontSize: '18px', fontWeight: 800 }}>
                    <span>Total Due:</span>
                    <span style={{ color: '#38bdf8' }}>{formatPaise(posTotalPaise)}</span>
                  </div>

                  <button
                    disabled={posCart.length === 0}
                    onClick={() => {
                      setTenderCashAmountPaise(posTotalPaise);
                      setIsCheckoutModalOpen(true);
                    }}
                    style={{
                      width: '100%',
                      backgroundColor: posCart.length === 0 ? '#334155' : '#0284c7',
                      color: '#ffffff',
                      border: 'none',
                      padding: '14px',
                      borderRadius: '10px',
                      fontSize: '15px',
                      fontWeight: 800,
                      cursor: posCart.length === 0 ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                    }}
                  >
                    <CreditCard size={18} /> Collect Tender ({formatPaise(posTotalPaise)})
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: BOPIS STATION */}
          {activeTab === 'bopis' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div>
                  <h1 style={{ fontSize: '24px', fontWeight: 800, margin: 0 }}>
                    BOPIS Click & Collect Station
                  </h1>
                  <p style={{ color: '#64748b', fontSize: '13px', margin: '4px 0 0 0' }}>
                    Orders purchased online via CartX for in-store pickup at {selectedLoc?.name}.
                  </p>
                </div>
                <button onClick={loadRetailData} style={refreshBtnStyle}>
                  <RefreshCw size={14} /> Refresh
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                {bopisOrders.map((bo) => {
                  const isCollected = bo.pickup_status === 'collected';
                  const isReady = bo.pickup_status === 'ready';

                  return (
                    <div
                      key={bo.id}
                      style={{
                        backgroundColor: '#131b2c',
                        borderRadius: '14px',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        padding: '20px',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                        <div>
                          <div style={{ fontSize: '16px', fontWeight: 800, color: '#f8fafc' }}>
                            {bo.customer_name}
                          </div>
                          <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                            Order: <code>{bo.order_id}</code> • Phone: {bo.customer_phone}
                          </div>
                        </div>

                        <span
                          style={{
                            backgroundColor: isCollected
                              ? 'rgba(16, 185, 129, 0.15)'
                              : isReady
                              ? 'rgba(56, 189, 248, 0.15)'
                              : 'rgba(251, 191, 36, 0.15)',
                            color: isCollected ? '#10b981' : isReady ? '#38bdf8' : '#fbbf24',
                            padding: '4px 10px',
                            borderRadius: '12px',
                            fontSize: '11px',
                            fontWeight: 700,
                            textTransform: 'uppercase',
                          }}
                        >
                          {bo.pickup_status}
                        </span>
                      </div>

                      {/* Items */}
                      <div style={{ backgroundColor: '#1e293b', borderRadius: '8px', padding: '12px', marginBottom: '16px' }}>
                        {bo.items &&
                          bo.items.map((it: any) => (
                            <div key={it.productId} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                              <span>
                                {it.quantity}x {it.title}
                              </span>
                              <span style={{ color: '#38bdf8' }}>{formatPaise(it.priceInPaise)}</span>
                            </div>
                          ))}
                      </div>

                      {/* Status Action Buttons */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {bo.pickup_status === 'picking' && (
                          <button
                            onClick={() => handleUpdateBopisStatus(bo.order_id, 'ready')}
                            style={{
                              flex: 1,
                              backgroundColor: '#0284c7',
                              color: '#fff',
                              border: 'none',
                              padding: '10px',
                              borderRadius: '8px',
                              fontWeight: 700,
                              fontSize: '12px',
                              cursor: 'pointer',
                            }}
                          >
                            Mark Picked & Ready for Customer
                          </button>
                        )}

                        {bo.pickup_status === 'ready' && (
                          <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
                            <input
                              type="text"
                              placeholder={`Enter 4-digit OTP (e.g. ${bo.pickup_otp})`}
                              value={otpInputs[bo.order_id] || ''}
                              onChange={(e) =>
                                setOtpInputs({ ...otpInputs, [bo.order_id]: e.target.value })
                              }
                              style={{
                                flex: 1,
                                backgroundColor: '#1e293b',
                                border: '1px solid rgba(255, 255, 255, 0.15)',
                                color: '#f8fafc',
                                padding: '8px 12px',
                                borderRadius: '8px',
                                fontSize: '12px',
                                outline: 'none',
                              }}
                            />
                            <button
                              onClick={() =>
                                handleUpdateBopisStatus(bo.order_id, 'collected', otpInputs[bo.order_id])
                              }
                              style={{
                                backgroundColor: '#10b981',
                                color: '#000',
                                border: 'none',
                                padding: '8px 14px',
                                borderRadius: '8px',
                                fontWeight: 700,
                                fontSize: '12px',
                                cursor: 'pointer',
                              }}
                            >
                              Verify OTP & Handover
                            </button>
                          </div>
                        )}

                        {isCollected && (
                          <div style={{ fontSize: '12px', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <CheckCircle2 size={14} /> Collected by Customer
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: BORIS OMNNICHANNEL RETURNS */}
          {activeTab === 'returns' && (
            <div style={{ maxWidth: '680px' }}>
              <div style={{ marginBottom: '24px' }}>
                <h1 style={{ fontSize: '24px', fontWeight: 800, margin: 0 }}>
                  BORIS — Buy Online, Return In-Store
                </h1>
                <p style={{ color: '#64748b', fontSize: '13px', margin: '4px 0 0 0' }}>
                  Customers can bring any online CartX purchase into {selectedLoc?.name} for instant physical restocking and immediate refund.
                </p>
              </div>

              {returnStatusMsg && (
                <div
                  style={{
                    backgroundColor: 'rgba(16, 185, 129, 0.15)',
                    border: '1px solid #10b981',
                    color: '#34d399',
                    padding: '12px 18px',
                    borderRadius: '8px',
                    marginBottom: '20px',
                    fontSize: '13px',
                  }}
                >
                  {returnStatusMsg}
                </div>
              )}

              <div style={{ backgroundColor: '#131b2c', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.08)', padding: '24px' }}>
                <form onSubmit={handleProcessReturn} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <label style={labelStyle}>Online Order ID</label>
                    <input
                      type="text"
                      value={returnOrderId}
                      onChange={(e) => setReturnOrderId(e.target.value)}
                      placeholder="e.g. ord_ctrl_1, ord_cartx_1"
                      style={inputStyle}
                      required
                    />
                  </div>

                  <div>
                    <label style={labelStyle}>Returned Product & Value</label>
                    <div style={{ padding: '12px', backgroundColor: '#1e293b', borderRadius: '8px', fontSize: '13px' }}>
                      <div style={{ fontWeight: 600 }}>Aura Heavyweight Boxy Tee (Qty: 1)</div>
                      <div style={{ color: '#38bdf8' }}>Refund Due: ₹1,299.00</div>
                    </div>
                  </div>

                  <div>
                    <label style={labelStyle}>Return Reason</label>
                    <select
                      value={returnReason}
                      onChange={(e) => setReturnReason(e.target.value)}
                      style={inputStyle}
                    >
                      <option value="wrong_size">Wrong Size / Fit (Customer needs size exchange)</option>
                      <option value="defective">Fabric defect or stitching issue</option>
                      <option value="changed_mind">Buyer changed mind / preference</option>
                      <option value="not_as_pictured">Color differs from photos</option>
                    </select>
                  </div>

                  <div style={{ padding: '12px', backgroundColor: 'rgba(56, 189, 248, 0.08)', borderRadius: '8px', fontSize: '12px', color: '#94a3b8' }}>
                    Restocking Action: Item will be tagged and immediately added to <strong>{selectedLoc?.name}</strong> local available floor inventory.
                  </div>

                  <button
                    type="submit"
                    style={{
                      backgroundColor: '#ef4444',
                      color: '#ffffff',
                      border: 'none',
                      padding: '12px',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                    }}
                  >
                    <RotateCcw size={16} /> Accept In-Store Return & Refund ₹1,299
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* TAB 4: MULTI-LOCATION MATRIX */}
          {activeTab === 'inventory' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div>
                  <h1 style={{ fontSize: '24px', fontWeight: 800, margin: 0 }}>
                    Omnichannel Inventory Matrix
                  </h1>
                  <p style={{ color: '#64748b', fontSize: '13px', margin: '4px 0 0 0' }}>
                    Real-time stock balance across warehouse, flagship store, and mall lounge.
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    onClick={() => {
                      setTransferProdId(inventoryMatrix[0]?.product.id || '');
                      setTransferModalOpen(true);
                    }}
                    style={{
                      backgroundColor: '#0284c7',
                      color: '#fff',
                      border: 'none',
                      padding: '8px 14px',
                      borderRadius: '8px',
                      fontSize: '13px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <ArrowRightLeft size={14} /> Stock Transfer
                  </button>
                  <button onClick={loadRetailData} style={refreshBtnStyle}>
                    <RefreshCw size={14} /> Refresh
                  </button>
                </div>
              </div>

              <div style={{ backgroundColor: '#131b2c', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.08)', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#1e293b', color: '#94a3b8', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
                      <th style={{ padding: '14px 20px' }}>Product</th>
                      <th>Category</th>
                      <th>Price</th>
                      {locations.map((loc) => (
                        <th key={loc.id} style={{ color: loc.id === selectedLocationId ? '#38bdf8' : '#94a3b8' }}>
                          {loc.name.split(' ')[0]} {loc.id === selectedLocationId && '★'}
                        </th>
                      ))}
                      <th>Network Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inventoryMatrix.map((item) => {
                      const p = item.product;
                      return (
                        <tr key={p.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                          <td style={{ padding: '12px 20px', fontWeight: 600, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <img src={p.image_url || p.imageUrl} alt="" style={{ width: '32px', height: '32px', borderRadius: '6px', objectFit: 'cover' }} />
                            {p.title}
                          </td>
                          <td style={{ color: '#94a3b8' }}>{p.category}</td>
                          <td style={{ color: '#38bdf8', fontWeight: 700 }}>
                            {formatPaise(p.price_in_paise || p.priceInPaise)}
                          </td>
                          {locations.map((loc) => {
                            const ls = item.locations.find((l: any) => l.locationId === loc.id);
                            const avail = ls ? ls.available : 0;
                            return (
                              <td key={loc.id}>
                                <span
                                  style={{
                                    backgroundColor: avail <= 3 ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                                    color: avail <= 3 ? '#ef4444' : '#10b981',
                                    padding: '2px 8px',
                                    borderRadius: '6px',
                                    fontSize: '12px',
                                    fontWeight: 700,
                                  }}
                                >
                                  {avail} units
                                </span>
                              </td>
                            );
                          })}
                          <td style={{ fontWeight: 800, color: '#f8fafc' }}>{item.totalAvailable} units</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 5: CASH DRAWER & SHIFTS */}
          {activeTab === 'shifts' && (
            <div>
              <div style={{ marginBottom: '20px' }}>
                <h1 style={{ fontSize: '24px', fontWeight: 800, margin: 0 }}>
                  Cash Drawer & Shift Register Balancing
                </h1>
                <p style={{ color: '#64748b', fontSize: '13px', margin: '4px 0 0 0' }}>
                  Manage physical drawer tenders, mid-day safe drops, and end-of-shift reconciliation for {selectedLoc?.name}.
                </p>
              </div>

              {activeShift && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
                  <div style={kpiBoxStyle}>
                    <div style={{ fontSize: '12px', color: '#94a3b8' }}>Opening Cash Float</div>
                    <div style={{ fontSize: '24px', fontWeight: 800, color: '#f8fafc', margin: '4px 0' }}>
                      {formatPaise(activeShift.opening_float_paise)}
                    </div>
                  </div>

                  <div style={kpiBoxStyle}>
                    <div style={{ fontSize: '12px', color: '#94a3b8' }}>Expected Cash in Drawer</div>
                    <div style={{ fontSize: '24px', fontWeight: 800, color: '#10b981', margin: '4px 0' }}>
                      {formatPaise(activeShift.expected_cash_paise)}
                    </div>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>Float + Cash Sales - Drops</div>
                  </div>

                  <div style={kpiBoxStyle}>
                    <div style={{ fontSize: '12px', color: '#94a3b8' }}>Shift Status</div>
                    <div style={{ fontSize: '24px', fontWeight: 800, color: '#38bdf8', margin: '4px 0', textTransform: 'uppercase' }}>
                      {activeShift.status}
                    </div>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>Opened by {activeShift.staff_name}</div>
                  </div>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '24px' }}>
                {/* Drawer Activity Log */}
                <div style={{ backgroundColor: '#131b2c', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.08)', padding: '20px' }}>
                  <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 700 }}>
                    Cash Drawer Event Log
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {shiftLogs.map((log) => (
                      <div
                        key={log.id}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '10px 14px',
                          backgroundColor: '#1e293b',
                          borderRadius: '8px',
                          fontSize: '13px',
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 600, color: '#f8fafc' }}>{log.reason}</div>
                          <div style={{ fontSize: '11px', color: '#64748b' }}>{log.created_at}</div>
                        </div>
                        <div
                          style={{
                            fontWeight: 800,
                            color: log.type === 'drop' ? '#ef4444' : '#10b981',
                          }}
                        >
                          {log.type === 'drop' ? '-' : '+'}
                          {formatPaise(log.amount_paise)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Mid-day Drop & End Shift */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {/* Record Cash Drop */}
                  <div style={{ backgroundColor: '#131b2c', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.08)', padding: '20px' }}>
                    <h3 style={{ margin: '0 0 12px 0', fontSize: '15px', fontWeight: 700 }}>
                      Record Safe Cash Drop
                    </h3>
                    <form onSubmit={handleCashDrop} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <input
                        type="number"
                        placeholder="Amount in Rupees"
                        value={cashDropAmountPaise / 100}
                        onChange={(e) => setCashDropAmountPaise(Math.round(parseFloat(e.target.value || '0') * 100))}
                        style={inputStyle}
                      />
                      <input
                        type="text"
                        value={cashDropReason}
                        onChange={(e) => setCashDropReason(e.target.value)}
                        style={inputStyle}
                      />
                      <button
                        type="submit"
                        style={{
                          backgroundColor: '#334155',
                          color: '#fff',
                          border: 'none',
                          padding: '10px',
                          borderRadius: '8px',
                          fontWeight: 700,
                          fontSize: '12px',
                          cursor: 'pointer',
                        }}
                      >
                        Log Safe Drop
                      </button>
                    </form>
                  </div>

                  {/* End Shift & Discrepancy */}
                  <div style={{ backgroundColor: '#131b2c', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.08)', padding: '20px' }}>
                    <h3 style={{ margin: '0 0 8px 0', fontSize: '15px', fontWeight: 700, color: '#ef4444' }}>
                      Close Register Shift
                    </h3>
                    <p style={{ color: '#64748b', fontSize: '12px', margin: '0 0 12px 0' }}>
                      Perform physical cash count and reconcile discrepancy.
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div>
                        <label style={labelStyle}>Actual Counted Cash (₹)</label>
                        <input
                          type="number"
                          value={closeActualCashPaise / 100}
                          onChange={(e) => setCloseActualCashPaise(Math.round(parseFloat(e.target.value || '0') * 100))}
                          style={inputStyle}
                        />
                      </div>
                      <button
                        onClick={handleCloseShift}
                        style={{
                          backgroundColor: '#ef4444',
                          color: '#fff',
                          border: 'none',
                          padding: '10px',
                          borderRadius: '8px',
                          fontWeight: 700,
                          fontSize: '12px',
                          cursor: 'pointer',
                        }}
                      >
                        Reconcile & Close Shift
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: CLIENTELING & STORE MANAGER AI ASSISTANT */}
          {activeTab === 'clienteling' && selectedCustomer && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div>
                  <h1 style={{ fontSize: '24px', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    Store Manager AI Assistant <Sparkles size={20} style={{ color: '#38bdf8' }} />
                  </h1>
                  <p style={{ color: '#64748b', fontSize: '13px', margin: '4px 0 0 0' }}>
                    Customer 360 unified profiles with cross-channel purchase history and AI personalized floor upsell pitches.
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  {['cust_arjun', 'cust_sneha', 'cust_vikram'].map((cid) => (
                    <button
                      key={cid}
                      onClick={() => loadCustomer360(cid)}
                      style={{
                        backgroundColor: selectedCustomer.id === cid ? '#0284c7' : '#1e293b',
                        color: selectedCustomer.id === cid ? '#fff' : '#94a3b8',
                        border: 'none',
                        padding: '6px 12px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      {cid === 'cust_arjun' ? 'Arjun Kapoor' : cid === 'cust_sneha' ? 'Sneha Reddy' : 'Vikram M.'}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 2fr', gap: '24px' }}>
                {/* 360 Profile Summary Card */}
                <div style={{ backgroundColor: '#131b2c', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.08)', padding: '24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '18px' }}>
                    <div
                      style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '50%',
                        backgroundColor: '#0284c7',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '20px',
                        fontWeight: 800,
                        color: '#fff',
                      }}
                    >
                      {selectedCustomer.name.slice(0, 1)}
                    </div>
                    <div>
                      <div style={{ fontSize: '18px', fontWeight: 800 }}>{selectedCustomer.name}</div>
                      <div style={{ fontSize: '12px', color: '#94a3b8' }}>{selectedCustomer.phone} • {selectedCustomer.email}</div>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '20px' }}>
                    <div style={{ backgroundColor: '#1e293b', padding: '12px', borderRadius: '8px' }}>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>Omnichannel LTV</div>
                      <div style={{ fontSize: '18px', fontWeight: 800, color: '#10b981' }}>
                        {formatPaise(selectedCustomer.totalSpendPaise)}
                      </div>
                    </div>

                    <div style={{ backgroundColor: '#1e293b', padding: '12px', borderRadius: '8px' }}>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>Loyalty Tier</div>
                      <div style={{ fontSize: '18px', fontWeight: 800, color: '#fbbf24' }}>
                        {selectedCustomer.loyaltyTier}
                      </div>
                    </div>

                    <div style={{ backgroundColor: '#1e293b', padding: '12px', borderRadius: '8px' }}>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>Preferred Fit</div>
                      <div style={{ fontSize: '16px', fontWeight: 700 }}>
                        Size {selectedCustomer.preferredSize}
                      </div>
                    </div>

                    <div style={{ backgroundColor: '#1e293b', padding: '12px', borderRadius: '8px' }}>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>Return Rate</div>
                      <div style={{ fontSize: '16px', fontWeight: 700, color: '#38bdf8' }}>
                        {selectedCustomer.returnCount} returns
                      </div>
                    </div>
                  </div>

                  <div style={{ fontSize: '12px', color: '#94a3b8', fontStyle: 'italic', backgroundColor: '#1e293b', padding: '10px 14px', borderRadius: '8px' }}>
                    &ldquo;{selectedCustomer.notes}&rdquo;
                  </div>
                </div>

                {/* AI Floor Associate Recommendation Pitches */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ backgroundColor: '#131b2c', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.08)', padding: '24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                      <Sparkles size={18} style={{ color: '#38bdf8' }} />
                      <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800 }}>
                        AI Smart In-Store Upsell Pitches
                      </h3>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {selectedCustomer.aiRecommendations &&
                        selectedCustomer.aiRecommendations.map((rec: any) => (
                          <div
                            key={rec.productId}
                            style={{
                              backgroundColor: '#1e293b',
                              borderRadius: '10px',
                              padding: '14px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: '14px',
                            }}
                          >
                            <img
                              src={rec.imageUrl}
                              alt=""
                              style={{ width: '48px', height: '48px', borderRadius: '8px', objectFit: 'cover' }}
                            />
                            <div style={{ flex: 1 }}>
                              <div style={{ fontWeight: 700, fontSize: '14px', color: '#f8fafc' }}>
                                {rec.title}
                              </div>
                              <div style={{ fontSize: '12px', color: '#38bdf8', marginTop: '2px' }}>
                                AI Pitch: <em>{rec.pitchReason}</em>
                              </div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <div style={{ fontWeight: 800, color: '#10b981' }}>
                                {formatPaise(rec.priceInPaise)}
                              </div>
                              <button
                                onClick={() => {
                                  handleAddToPosCart(rec);
                                  setActiveTab('pos');
                                }}
                                style={{
                                  backgroundColor: '#0284c7',
                                  color: '#fff',
                                  border: 'none',
                                  padding: '4px 10px',
                                  borderRadius: '6px',
                                  fontSize: '11px',
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                  marginTop: '6px',
                                }}
                              >
                                + Ring Up
                              </button>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>

                  {/* Past Orders */}
                  <div style={{ backgroundColor: '#131b2c', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.08)', padding: '20px' }}>
                    <h3 style={{ margin: '0 0 12px 0', fontSize: '15px', fontWeight: 700 }}>
                      Recent Cross-Channel Purchases
                    </h3>
                    {selectedCustomer.pastOrders &&
                      selectedCustomer.pastOrders.map((ord: any) => (
                        <div
                          key={ord.id}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            padding: '8px 0',
                            borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                            fontSize: '12px',
                          }}
                        >
                          <div>
                            <span style={{ fontWeight: 600, color: '#f8fafc' }}>{ord.id}</span>
                            <span style={{ color: '#64748b', marginLeft: '8px' }}>({ord.payment_method})</span>
                          </div>
                          <span style={{ color: '#10b981', fontWeight: 700 }}>
                            {formatPaise(ord.total_in_paise)}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* POS CHECKOUT SPLIT TENDER MODAL */}
      {isCheckoutModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
          }}
        >
          <div
            style={{
              backgroundColor: '#131b2c',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '16px',
              padding: '28px',
              width: '460px',
            }}
          >
            <h2 style={{ margin: '0 0 8px 0', fontSize: '20px', fontWeight: 800 }}>
              Collect Split Tender Payment
            </h2>
            <div style={{ fontSize: '28px', fontWeight: 800, color: '#38bdf8', marginBottom: '20px' }}>
              {formatPaise(posTotalPaise)}
            </div>

            {/* Payment Method Selector */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '20px' }}>
              <button
                onClick={() => setPaymentMethod('upi')}
                style={{
                  backgroundColor: paymentMethod === 'upi' ? '#0284c7' : '#1e293b',
                  color: paymentMethod === 'upi' ? '#fff' : '#94a3b8',
                  border: 'none',
                  padding: '12px',
                  borderRadius: '8px',
                  fontWeight: 700,
                  fontSize: '13px',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <QrCode size={18} /> UPI QR
              </button>

              <button
                onClick={() => setPaymentMethod('card')}
                style={{
                  backgroundColor: paymentMethod === 'card' ? '#0284c7' : '#1e293b',
                  color: paymentMethod === 'card' ? '#fff' : '#94a3b8',
                  border: 'none',
                  padding: '12px',
                  borderRadius: '8px',
                  fontWeight: 700,
                  fontSize: '13px',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <CreditCard size={18} /> Card Tap
              </button>

              <button
                onClick={() => setPaymentMethod('cash')}
                style={{
                  backgroundColor: paymentMethod === 'cash' ? '#0284c7' : '#1e293b',
                  color: paymentMethod === 'cash' ? '#fff' : '#94a3b8',
                  border: 'none',
                  padding: '12px',
                  borderRadius: '8px',
                  fontWeight: 700,
                  fontSize: '13px',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <DollarSign size={18} /> Cash
              </button>
            </div>

            {paymentMethod === 'upi' && (
              <div style={{ textAlign: 'center', padding: '16px', backgroundColor: '#1e293b', borderRadius: '12px', marginBottom: '20px' }}>
                <QrCode size={100} style={{ margin: '0 auto 8px auto', color: '#f8fafc' }} />
                <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                  Scan with any UPI app (GPay, PhonePe, Paytm)
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => setIsCheckoutModalOpen(false)}
                style={{
                  flex: 1,
                  backgroundColor: '#1e293b',
                  color: '#94a3b8',
                  border: 'none',
                  padding: '12px',
                  borderRadius: '8px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleExecutePosSale}
                style={{
                  flex: 2,
                  backgroundColor: '#10b981',
                  color: '#000',
                  border: 'none',
                  padding: '12px',
                  borderRadius: '8px',
                  fontWeight: 800,
                  fontSize: '14px',
                  cursor: 'pointer',
                }}
              >
                Confirm Payment & Print Receipt
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PRINTABLE RECEIPT MODAL */}
      {lastReceipt && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 110,
          }}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              color: '#000000',
              fontFamily: 'monospace',
              padding: '28px',
              borderRadius: '8px',
              width: '380px',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.8)',
            }}
          >
            <div style={{ textAlign: 'center', marginBottom: '16px' }}>
              <div style={{ fontSize: '20px', fontWeight: 900 }}>AURA FLAGSHIP STORE</div>
              <div style={{ fontSize: '11px', color: '#666' }}>Indiranagar, Bengaluru, KA</div>
              <div style={{ fontSize: '11px', color: '#666' }}>GSTIN: 29AABCA1234F1Z6</div>
            </div>

            <div style={{ borderTop: '1px dashed #999', borderBottom: '1px dashed #999', padding: '8px 0', margin: '8px 0', fontSize: '11px' }}>
              <div>Receipt: {lastReceipt.receiptNumber}</div>
              <div>Date: {new Date(lastReceipt.timestamp).toLocaleString()}</div>
              <div>Staff: {lastReceipt.staffName}</div>
            </div>

            <div style={{ margin: '12px 0' }}>
              {lastReceipt.items.map((it: any) => (
                <div key={it.productId} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', margin: '4px 0' }}>
                  <span>
                    {it.quantity}x {it.title}
                  </span>
                  <span>{formatPaise(it.priceInPaise * it.quantity)}</span>
                </div>
              ))}
            </div>

            <div style={{ borderTop: '1px dashed #999', paddingTop: '8px', fontSize: '14px', fontWeight: 800, display: 'flex', justifyContent: 'space-between' }}>
              <span>TOTAL PAID</span>
              <span>{formatPaise(lastReceipt.total)}</span>
            </div>

            <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '11px', color: '#666' }}>
              <div>Thank you for shopping at Aura!</div>
              <div>Returns accepted within 14 days with receipt.</div>
            </div>

            <button
              onClick={() => setLastReceipt(null)}
              style={{
                width: '100%',
                backgroundColor: '#000',
                color: '#fff',
                border: 'none',
                padding: '10px',
                borderRadius: '6px',
                fontWeight: 700,
                marginTop: '16px',
                cursor: 'pointer',
              }}
            >
              Done (Close Receipt)
            </button>
          </div>
        </div>
      )}

      {/* STOCK TRANSFER MODAL */}
      {transferModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
          }}
        >
          <div style={{ backgroundColor: '#131b2c', padding: '24px', borderRadius: '16px', width: '420px', border: '1px solid rgba(255,255,255,0.1)' }}>
            <h2 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: 800 }}>
              Initiate Stock Transfer
            </h2>
            <form onSubmit={handleExecuteTransfer} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={labelStyle}>Product to Transfer</label>
                <select
                  value={transferProdId}
                  onChange={(e) => setTransferProdId(e.target.value)}
                  style={inputStyle}
                  required
                >
                  {inventoryMatrix.map((item) => (
                    <option key={item.product.id} value={item.product.id}>
                      {item.product.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={labelStyle}>Source Location</label>
                <select
                  value={transferFromLoc}
                  onChange={(e) => setTransferFromLoc(e.target.value)}
                  style={inputStyle}
                >
                  <option value="loc_online">Central E-Commerce Dark Warehouse</option>
                  <option value="loc_mall">Koramangala Store & Lounge</option>
                </select>
              </div>

              <div>
                <label style={labelStyle}>Quantity Units</label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={transferQty}
                  onChange={(e) => setTransferQty(parseInt(e.target.value || '1', 10))}
                  style={inputStyle}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setTransferModalOpen(false)}
                  style={{ flex: 1, backgroundColor: '#1e293b', color: '#94a3b8', border: 'none', padding: '10px', borderRadius: '8px', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ flex: 2, backgroundColor: '#0284c7', color: '#fff', border: 'none', padding: '10px', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}
                >
                  Confirm Transfer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// Inline Styles
function navBtnStyle(active: boolean): React.CSSProperties {
  return {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 14px',
    backgroundColor: active ? 'rgba(2, 132, 199, 0.15)' : 'transparent',
    color: active ? '#38bdf8' : '#94a3b8',
    fontWeight: active ? 700 : 500,
    fontSize: '13px',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'all 0.15s',
  };
}

const qtyBtnStyle: React.CSSProperties = {
  backgroundColor: '#1e293b',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  color: '#f8fafc',
  width: '24px',
  height: '24px',
  borderRadius: '6px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
};

const kpiBoxStyle: React.CSSProperties = {
  backgroundColor: '#131b2c',
  border: '1px solid rgba(255, 255, 255, 0.08)',
  borderRadius: '12px',
  padding: '16px',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '12px',
  fontWeight: 600,
  color: '#94a3b8',
  marginBottom: '6px',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  backgroundColor: '#1e293b',
  border: '1px solid rgba(255, 255, 255, 0.12)',
  color: '#f8fafc',
  padding: '10px 14px',
  borderRadius: '8px',
  fontSize: '13px',
  outline: 'none',
  boxSizing: 'border-box',
};

const refreshBtnStyle: React.CSSProperties = {
  backgroundColor: '#1e293b',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  color: '#f8fafc',
  padding: '8px 14px',
  borderRadius: '8px',
  fontSize: '13px',
  fontWeight: 600,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
};
