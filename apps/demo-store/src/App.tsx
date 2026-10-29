import React, { useEffect, useState } from 'react';
import { ShoppingBag, Zap, RefreshCw, ExternalLink, Sparkles, CheckCircle2, ShieldCheck, Flame, Search, Store } from 'lucide-react';
import { Product, Collection, formatPaise } from '@cartx/shared';
import { SearchOverlay } from './components/SearchOverlay';

const API_BASE = (import.meta as any).env?.VITE_API_BASE || 'https://devx-commerce-api.onrender.com';
const CONSOLE_URL = (import.meta as any).env?.VITE_CONSOLE_URL || 'https://devx-console.vercel.app';
const RETAILOS_URL = (import.meta as any).env?.VITE_RETAILOS_URL || 'https://devx-retailos.vercel.app';

export default function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [selectedCollection, setSelectedCollection] = useState<string | null>(null);
  const [cartState, setCartState] = useState<{ count: number; total: number }>({ count: 0, total: 0 });
  const [activeVariant, setActiveVariant] = useState<string>('Detecting...');
  const [visitorId, setVisitorId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Load catalog, collections, and active A/B test variant
  useEffect(() => {
    const vId = localStorage.getItem('cartx_visitor_id') || `v_${Math.random().toString(36).substring(2, 9)}_${Date.now()}`;
    localStorage.setItem('cartx_visitor_id', vId);
    setVisitorId(vId);

    async function loadData() {
      try {
        const [prodRes, colRes, configRes] = await Promise.all([
          fetch(`${API_BASE}/v1/products`),
          fetch(`${API_BASE}/v1/collections`),
          fetch(`${API_BASE}/v1/config?visitorId=${vId}`),
        ]);
        if (prodRes.ok) {
          const pData = await prodRes.json();
          setProducts(pData.products || []);
        }
        if (colRes.ok) {
          const cData = await colRes.json();
          setCollections(cData.collections || []);
        }
        if (configRes.ok) {
          const cfgData = await configRes.json();
          if (cfgData.activeExperiment) {
            const vName = cfgData.activeExperiment.assignedVariantName || cfgData.activeExperiment.assignedVariantId;
            setActiveVariant(vName === 'Variant B' ? 'Variant B (CartX AI Suite)' : `${vName}`);
          } else {
            setActiveVariant('Active (Default)');
          }
        }
      } catch (err) {
        console.error('Error fetching store data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();

    // ⌘K or Ctrl+K shortcut to open SearchX
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);

    const handleCartUpdate = (e: any) => {
      if (e.detail) {
        setCartState({
          count: e.detail.itemCount || 0,
          total: e.detail.grandTotalInPaise || 0,
        });
      }
    };

    window.addEventListener('cartx:updated', handleCartUpdate);

    // Initial check from CartX if available
    const checkTimer = setTimeout(() => {
      if ((window as any).CartX?.getCart) {
        const cart = (window as any).CartX.getCart();
        if (cart) {
          setCartState({
            count: cart.itemCount || 0,
            total: cart.pricing?.grandTotalInPaise || 0,
          });
        }
      }
    }, 500);

    return () => {
      window.removeEventListener('cartx:updated', handleCartUpdate);
      window.removeEventListener('keydown', handleGlobalKeyDown);
      clearTimeout(checkTimer);
    };
  }, []);

  // Filter products by selected collection
  const filteredProducts = selectedCollection
    ? products.filter((p) => {
        if (selectedCollection === 'col_footwear') return p.category === 'Footwear';
        if (selectedCollection === 'col_streetwear') return p.category === 'Streetwear';
        if (selectedCollection === 'col_accessories') return p.category === 'Accessories' || p.category === 'Footwear Care';
        return true;
      })
    : products;

  const handleAddToCart = (product: Product) => {
    if ((window as any).CartX?.addItem) {
      (window as any).CartX.addItem({
        productId: product.id,
        title: product.title,
        priceInPaise: product.priceInPaise,
        compareAtPriceInPaise: product.compareAtPriceInPaise,
        imageUrl: product.imageUrl,
        quantity: 1,
      });
    } else {
      alert('CartX is initializing, please click again in a moment.');
    }
  };

  const handleOpenCart = () => {
    if ((window as any).CartX?.open) {
      (window as any).CartX.open();
    }
  };

  const handleResetVisitor = () => {
    const newVisitorId = `v_${Math.random().toString(36).substring(2, 9)}_${Date.now()}`;
    localStorage.setItem('cartx_visitor_id', newVisitorId);
    setVisitorId(newVisitorId);
    window.location.reload();
  };

  const handleCollectionSwitch = (colId: string | null) => {
    setSelectedCollection(colId);
    if ((window as any).CartX?.setCollection && colId) {
      (window as any).CartX.setCollection(colId);
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#09090b', color: '#fafafa' }}>
      {/* Simulation / Inspector Banner */}
      <div
        style={{
          backgroundColor: '#18181b',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          padding: '8px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '12px',
          color: '#a1a1aa',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: '#10b981',
              color: '#000',
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: '12px',
            }}
          >
            <Zap size={13} fill="#000" /> CartX Active
          </span>
          <span>
            Visitor: <code style={{ color: '#38bdf8' }}>{visitorId.slice(0, 14)}...</code>
          </span>
          <span style={{ color: '#52525b' }}>|</span>
          <span style={{ color: '#fbbf24', fontWeight: 600 }}>
            A/B Test Variant: {activeVariant}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={handleResetVisitor}
            style={{
              background: 'transparent',
              border: '1px solid rgba(255,255,255,0.2)',
              color: '#fafafa',
              borderRadius: '6px',
              padding: '4px 10px',
              fontSize: '11px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <RefreshCw size={12} /> Test New Visitor (A/B)
          </button>
          <a
            href={CONSOLE_URL}
            target="_blank"
            rel="noreferrer"
            style={{
              background: '#27272a',
              border: '1px solid rgba(255,255,255,0.15)',
              color: '#10b981',
              fontWeight: 700,
              textDecoration: 'none',
              borderRadius: '6px',
              padding: '4px 12px',
              fontSize: '11px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            Merchant Admin <ExternalLink size={12} />
          </a>
          <a
            href={RETAILOS_URL}
            target="_blank"
            rel="noreferrer"
            style={{
              background: 'linear-gradient(135deg, #0284c7, #0369a1)',
              border: 'none',
              color: '#ffffff',
              fontWeight: 700,
              textDecoration: 'none',
              borderRadius: '6px',
              padding: '4px 12px',
              fontSize: '11px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <Store size={12} /> RetailOS POS <ExternalLink size={12} />
          </a>
        </div>
      </div>

      {/* Main Navbar */}
      <nav
        style={{
          padding: '20px 40px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          backgroundColor: 'rgba(9, 9, 11, 0.8)',
          backdropFilter: 'blur(12px)',
          position: 'sticky',
          top: 0,
          zIndex: 40,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #10b981, #064e3b)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 900,
                color: '#fff',
                fontSize: '18px',
              }}
            >
              A
            </div>
            <span style={{ fontSize: '20px', fontWeight: 800, letterSpacing: '-0.03em' }}>
              AURA
            </span>
            <span
              style={{
                fontSize: '10px',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                color: '#10b981',
                border: '1px solid rgba(16,185,129,0.3)',
                padding: '2px 6px',
                borderRadius: '4px',
              }}
            >
              D2C
            </span>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={() => handleCollectionSwitch(null)}
              style={{
                background: selectedCollection === null ? '#27272a' : 'transparent',
                color: selectedCollection === null ? '#fff' : '#a1a1aa',
                border: 'none',
                borderRadius: '20px',
                padding: '6px 14px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              All Drops
            </button>
            {collections.map((col) => (
              <button
                key={col.id}
                onClick={() => handleCollectionSwitch(col.id)}
                style={{
                  background: selectedCollection === col.id ? '#10b981' : 'transparent',
                  color: selectedCollection === col.id ? '#000' : '#a1a1aa',
                  border: 'none',
                  borderRadius: '20px',
                  padding: '6px 14px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                {col.title}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* SearchX Trigger Button */}
          <button
            onClick={() => setIsSearchOpen(true)}
            style={{
              backgroundColor: '#18181b',
              border: '1px solid rgba(255,255,255,0.15)',
              color: '#d4d4d8',
              padding: '8px 16px',
              borderRadius: '10px',
              fontWeight: 500,
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              cursor: 'pointer',
              transition: 'border-color 0.15s, background 0.15s',
            }}
          >
            <Search size={15} style={{ color: '#10b981' }} />
            <span>Search drops, 'kicks'...</span>
            <kbd
              style={{
                backgroundColor: '#27272a',
                color: '#a1a1aa',
                padding: '2px 6px',
                borderRadius: '4px',
                fontSize: '10px',
                fontWeight: 700,
                border: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              ⌘K
            </kbd>
          </button>

          <button
            onClick={handleOpenCart}
            style={{
              backgroundColor: '#10b981',
              color: '#000',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '10px',
              fontWeight: 800,
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              cursor: 'pointer',
              boxShadow: '0 4px 20px rgba(16, 185, 129, 0.3)',
              transition: 'transform 0.15s',
            }}
          >
            <ShoppingBag size={18} />
            <span>Bag ({cartState.count})</span>
            {cartState.total > 0 && (
              <>
                <span style={{ opacity: 0.3 }}>|</span>
                <span>{formatPaise(cartState.total)}</span>
              </>
            )}
          </button>
        </div>
      </nav>

      {/* Hero Drop Banner */}
      <header
        style={{
          padding: '60px 40px',
          background: 'linear-gradient(180deg, rgba(16, 185, 129, 0.08) 0%, rgba(9, 9, 11, 0) 100%)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: 'rgba(245, 158, 11, 0.12)',
            color: '#f59e0b',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            borderRadius: '20px',
            padding: '4px 14px',
            fontSize: '12px',
            fontWeight: 700,
            marginBottom: '16px',
          }}
        >
          <Flame size={14} /> WINTER / SUMMER DROP 2026
        </div>
        <h1
          style={{
            fontSize: '44px',
            fontWeight: 800,
            letterSpacing: '-0.03em',
            margin: '0 0 16px 0',
            lineHeight: 1.15,
          }}
        >
          Luxury Streetwear & Sneaker Culture.
        </h1>
        <p
          style={{
            fontSize: '16px',
            color: '#a1a1aa',
            maxWidth: '600px',
            margin: '0 auto 24px auto',
            lineHeight: 1.6,
          }}
        >
          High-density heavyweight textiles, artisanal vintage washes, and precision craftsmanship.
          Unlock tiered free gifts and instant savings at checkout.
        </p>

        {/* Gamified perk badges */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '24px',
            flexWrap: 'wrap',
            fontSize: '13px',
            color: '#e4e4e7',
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <CheckCircle2 size={16} color="#10b981" /> Free Express Delivery above ₹999
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <CheckCircle2 size={16} color="#10b981" /> Free Canvas Tote Bag at ₹1,999
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <CheckCircle2 size={16} color="#10b981" /> Extra 15% OFF above ₹2,999
          </span>
        </div>
      </header>

      {/* Product Catalog Grid */}
      <main style={{ maxWidth: '1280px', margin: '0 auto', padding: '40px 24px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '32px',
          }}
        >
          <div>
            <h2 style={{ fontSize: '24px', fontWeight: 700, letterSpacing: '-0.02em', margin: 0 }}>
              {selectedCollection
                ? collections.find((c) => c.id === selectedCollection)?.title
                : 'All Essentials'}
            </h2>
            <p style={{ fontSize: '14px', color: '#71717a', margin: '4px 0 0 0' }}>
              Showing {filteredProducts.length} authentic drops in INR (₹)
            </p>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: '#71717a' }}>
            Loading products...
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '24px',
            }}
          >
            {filteredProducts.map((product) => {
              const discountPct =
                product.compareAtPriceInPaise && product.compareAtPriceInPaise > product.priceInPaise
                  ? Math.round(
                      ((product.compareAtPriceInPaise - product.priceInPaise) /
                        product.compareAtPriceInPaise) *
                        100
                    )
                  : 0;

              return (
                <div
                  key={product.id}
                  style={{
                    backgroundColor: '#18181b',
                    borderRadius: '16px',
                    border: '1px solid rgba(255,255,255,0.08)',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'transform 0.2s, border-color 0.2s',
                  }}
                >
                  <div style={{ position: 'relative', width: '100%', height: '300px', overflow: 'hidden' }}>
                    <img
                      src={product.imageUrl}
                      alt={product.title}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        transition: 'transform 0.4s ease',
                      }}
                    />
                    {discountPct > 0 && (
                      <div
                        style={{
                          position: 'absolute',
                          top: '12px',
                          left: '12px',
                          backgroundColor: '#10b981',
                          color: '#000',
                          fontSize: '11px',
                          fontWeight: 800,
                          padding: '4px 8px',
                          borderRadius: '6px',
                        }}
                      >
                        {discountPct}% OFF
                      </div>
                    )}
                    {product.inventoryCount <= 20 && (
                      <div
                        style={{
                          position: 'absolute',
                          top: '12px',
                          right: '12px',
                          backgroundColor: 'rgba(239, 68, 68, 0.9)',
                          color: '#fff',
                          fontSize: '10px',
                          fontWeight: 700,
                          padding: '3px 8px',
                          borderRadius: '6px',
                          backdropFilter: 'blur(4px)',
                        }}
                      >
                        Only {product.inventoryCount} left
                      </div>
                    )}
                  </div>

                  <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between' }}>
                    <div>
                      <div
                        style={{
                          fontSize: '11px',
                          textTransform: 'uppercase',
                          letterSpacing: '0.08em',
                          color: '#a1a1aa',
                          marginBottom: '6px',
                        }}
                      >
                        {product.category}
                      </div>
                      <h3
                        style={{
                          fontSize: '16px',
                          fontWeight: 700,
                          lineHeight: 1.3,
                          margin: '0 0 8px 0',
                          color: '#fafafa',
                        }}
                      >
                        {product.title}
                      </h3>
                      <p
                        style={{
                          fontSize: '13px',
                          color: '#71717a',
                          margin: '0 0 16px 0',
                          lineHeight: 1.4,
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                      >
                        {product.description}
                      </p>
                    </div>

                    <div>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '16px' }}>
                        <span style={{ fontSize: '20px', fontWeight: 800, color: '#fafafa' }}>
                          {formatPaise(product.priceInPaise)}
                        </span>
                        {product.compareAtPriceInPaise && product.compareAtPriceInPaise > product.priceInPaise && (
                          <span style={{ fontSize: '14px', color: '#71717a', textDecoration: 'line-through' }}>
                            {formatPaise(product.compareAtPriceInPaise)}
                          </span>
                        )}
                      </div>

                      <button
                        onClick={() => handleAddToCart(product)}
                        style={{
                          width: '100%',
                          backgroundColor: '#27272a',
                          border: '1px solid rgba(255,255,255,0.15)',
                          color: '#fafafa',
                          padding: '12px',
                          borderRadius: '10px',
                          fontWeight: 700,
                          fontSize: '13px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px',
                          transition: 'all 0.2s',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#10b981';
                          e.currentTarget.style.color = '#000';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = '#27272a';
                          e.currentTarget.style.color = '#fafafa';
                        }}
                      >
                        <ShoppingBag size={15} /> + Add to Bag
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Integration Architecture Documentation Section */}
        <section
          style={{
            marginTop: '80px',
            backgroundColor: '#18181b',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '20px',
            padding: '36px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <ShieldCheck size={24} color="#10b981" />
            <h3 style={{ fontSize: '20px', fontWeight: 700, margin: 0 }}>
              Shopify & Headless Embed Architecture
            </h3>
          </div>
          <p style={{ color: '#a1a1aa', fontSize: '14px', lineHeight: 1.6, maxWidth: '800px', margin: '0 0 24px 0' }}>
            CartX is engineered as a private app embed. Any brand running on Shopify (Liquid or Hydrogen) or a custom React/Next.js storefront integrates by pasting a single script tag into <code>theme.liquid</code> or the HTML header. The Shadow DOM keeps styles completely isolated from host theme stylesheets.
          </p>

          <div
            style={{
              backgroundColor: '#09090b',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '12px',
              padding: '16px',
              fontFamily: 'monospace',
              fontSize: '13px',
              color: '#34d399',
              overflowX: 'auto',
            }}
          >
            {`<!-- CartX High-Speed Private App Embed -->
<script
  src="http://localhost:4000/cartx.js"
  data-store="store_aura"
  data-api="http://localhost:4000"
  async
></script>`}
          </div>
        </section>
      </main>

      {/* SearchX Semantic Overlay */}
      <SearchOverlay
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onAddToCart={handleAddToCart}
        apiBase={API_BASE}
      />
    </div>
  );
}
