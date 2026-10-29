import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Sparkles, ShoppingBag, ArrowRight, Filter } from 'lucide-react';
import { Product, SearchResponse, formatPaise } from '@cartx/shared';

interface SearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (product: Product) => void;
  apiBase: string;
}

const TRENDING_QUERIES = [
  'sneekers',
  'cargo pants under 2000',
  'kicks',
  'acid wash hoodie',
  'canvas tote',
  'shades',
];

export const SearchOverlay: React.FC<SearchOverlayProps> = ({
  isOpen,
  onClose,
  onAddToCart,
  apiBase,
}) => {
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedPriceRange, setSelectedPriceRange] = useState<{ min?: number; max?: number } | null>(null);
  const [searchResponse, setSearchResponse] = useState<SearchResponse | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Handle keyboard ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Debounced search query
  useEffect(() => {
    if (!isOpen) return;

    const timer = setTimeout(async () => {
      try {
        const params = new URLSearchParams();
        if (query.trim()) params.append('q', query.trim());
        if (selectedCategory) params.append('category', selectedCategory);
        if (selectedPriceRange?.min !== undefined) params.append('minPrice', (selectedPriceRange.min / 100).toString());
        if (selectedPriceRange?.max !== undefined) params.append('maxPrice', (selectedPriceRange.max / 100).toString());

        const res = await fetch(`${apiBase}/v1/search?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          setSearchResponse(data);
        }
      } catch (err) {
        console.error('SearchX API error:', err);
      }
    }, 180);

    return () => clearTimeout(timer);
  }, [query, selectedCategory, selectedPriceRange, isOpen, apiBase]);

  const handleResultClick = (productId: string) => {
    if (query.trim()) {
      fetch(`${apiBase}/v1/search/analytics/click`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: query.trim(),
          productId,
        }),
      }).catch((e) => console.warn('Search click tracking error:', e));
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '30px 20px',
        animation: 'fadeIn 0.15s ease-out',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '820px',
          backgroundColor: '#121215',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: '16px',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.9), 0 0 30px rgba(16, 185, 129, 0.15)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '90vh',
        }}
      >
        {/* Top Header / Input Bar */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            backgroundColor: '#18181c',
          }}
        >
          <Search size={22} style={{ color: '#10b981', flexShrink: 0 }} />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search drops, 'kicks', 'hoodie under 2500', 'sneekers'..."
            style={{
              flex: 1,
              backgroundColor: 'transparent',
              border: 'none',
              outline: 'none',
              fontSize: '18px',
              color: '#ffffff',
              fontWeight: 500,
            }}
          />
          {query && (
            <button
              onClick={() => {
                setQuery('');
                setSelectedCategory(null);
                setSelectedPriceRange(null);
              }}
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                border: 'none',
                color: '#a1a1aa',
                borderRadius: '50%',
                width: '24px',
                height: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <X size={14} />
            </button>
          )}

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 10px',
              backgroundColor: 'rgba(16, 185, 129, 0.12)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: '20px',
              fontSize: '11px',
              color: '#10b981',
              fontWeight: 700,
            }}
          >
            <Sparkles size={12} /> SearchX AI
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#71717a',
              cursor: 'pointer',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* AI Intent & Correction Pill Banner */}
        {searchResponse && (searchResponse.intent.correctedQuery || searchResponse.intent.maxPriceInPaise || searchResponse.intent.detectedCategory) && (
          <div
            style={{
              padding: '8px 24px',
              backgroundColor: 'rgba(16, 185, 129, 0.08)',
              borderBottom: '1px solid rgba(16, 185, 129, 0.15)',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              fontSize: '12px',
              flexWrap: 'wrap',
            }}
          >
            <span style={{ color: '#10b981', fontWeight: 600 }}>Intent Parsed:</span>
            {searchResponse.intent.detectedCategory && (
              <span
                style={{
                  backgroundColor: '#27272a',
                  color: '#fafafa',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  fontSize: '11px',
                }}
              >
                Category: <strong>{searchResponse.intent.detectedCategory}</strong>
              </span>
            )}
            {searchResponse.intent.maxPriceInPaise && (
              <span
                style={{
                  backgroundColor: '#27272a',
                  color: '#38bdf8',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  fontSize: '11px',
                }}
              >
                Max Price: <strong>{formatPaise(searchResponse.intent.maxPriceInPaise)}</strong>
              </span>
            )}
            {searchResponse.intent.correctedQuery && (
              <span
                style={{
                  backgroundColor: '#3b2507',
                  color: '#fbbf24',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  fontSize: '11px',
                }}
              >
                Typo auto-mapped: &ldquo;{query}&rdquo; &rarr; <strong>{searchResponse.intent.correctedQuery}</strong>
              </span>
            )}
          </div>
        )}

        {/* Filter Facet Pills */}
        {searchResponse && searchResponse.facets && (
          <div
            style={{
              padding: '10px 24px',
              backgroundColor: '#151518',
              borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              overflowX: 'auto',
              whiteSpace: 'nowrap',
            }}
          >
            <span style={{ fontSize: '11px', color: '#71717a', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Filter size={12} /> Refine:
            </span>

            {/* Category filters */}
            {searchResponse.facets.categories.map((c) => {
              const active = selectedCategory === c.name;
              return (
                <button
                  key={c.name}
                  onClick={() => setSelectedCategory(active ? null : c.name)}
                  style={{
                    backgroundColor: active ? '#10b981' : '#27272a',
                    color: active ? '#000' : '#d4d4d8',
                    border: 'none',
                    padding: '3px 10px',
                    borderRadius: '12px',
                    fontSize: '11px',
                    fontWeight: active ? 700 : 500,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  {c.name} <span style={{ opacity: 0.6 }}>({c.count})</span>
                </button>
              );
            })}

            {/* Price filters */}
            {searchResponse.facets.priceRanges.map((pr) => {
              const active = selectedPriceRange?.min === pr.min && selectedPriceRange?.max === pr.max;
              return (
                <button
                  key={pr.label}
                  onClick={() => setSelectedPriceRange(active ? null : { min: pr.min, max: pr.max })}
                  style={{
                    backgroundColor: active ? '#38bdf8' : '#27272a',
                    color: active ? '#000' : '#d4d4d8',
                    border: 'none',
                    padding: '3px 10px',
                    borderRadius: '12px',
                    fontSize: '11px',
                    fontWeight: active ? 700 : 500,
                    cursor: 'pointer',
                  }}
                >
                  {pr.label}
                </button>
              );
            })}
          </div>
        )}

        {/* Content Body: Trending or Results */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
          {/* Trending Suggestions when no query */}
          {!query && (
            <div>
              <div style={{ fontSize: '12px', fontWeight: 600, color: '#a1a1aa', marginBottom: '12px' }}>
                TRENDING SEARCHES (NATURAL LANGUAGE & TYPOS)
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '24px' }}>
                {TRENDING_QUERIES.map((tq) => (
                  <button
                    key={tq}
                    onClick={() => setQuery(tq)}
                    style={{
                      backgroundColor: '#27272a',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      color: '#fafafa',
                      padding: '8px 14px',
                      borderRadius: '8px',
                      fontSize: '13px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      transition: 'background 0.15s',
                    }}
                  >
                    <Search size={13} style={{ color: '#10b981' }} />
                    {tq}
                    <ArrowRight size={12} style={{ color: '#52525b' }} />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Results List */}
          {searchResponse && (
            <div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '16px',
                  fontSize: '12px',
                  color: '#71717a',
                }}
              >
                <span>
                  Showing {searchResponse.items.length} matching products for{' '}
                  <strong style={{ color: '#fafafa' }}>&ldquo;{searchResponse.query || 'all drops'}&rdquo;</strong>
                </span>
                <span style={{ fontSize: '11px', color: '#10b981' }}>
                  {searchResponse.executionTimeMs}ms hybrid latency
                </span>
              </div>

              {searchResponse.items.length === 0 ? (
                <div
                  style={{
                    padding: '48px 24px',
                    textAlign: 'center',
                    color: '#71717a',
                  }}
                >
                  <Search size={36} style={{ color: '#3f3f46', marginBottom: '12px' }} />
                  <div style={{ fontSize: '16px', fontWeight: 600, color: '#e4e4e7', marginBottom: '4px' }}>
                    No exact products found
                  </div>
                  <div style={{ fontSize: '13px' }}>
                    Try searching for broader terms like &ldquo;hoodie&rdquo;, &ldquo;kicks&rdquo;, or &ldquo;pants&rdquo;.
                  </div>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px' }}>
                  {searchResponse.items.map((item) => {
                    const prod = item.product;
                    return (
                      <div
                        key={prod.id}
                        onClick={() => handleResultClick(prod.id)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '12px 16px',
                          backgroundColor: '#18181c',
                          borderRadius: '12px',
                          border: '1px solid rgba(255, 255, 255, 0.06)',
                          gap: '16px',
                          transition: 'border-color 0.15s, background 0.15s',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1 }}>
                          <img
                            src={prod.imageUrl}
                            alt={prod.title}
                            style={{
                              width: '56px',
                              height: '56px',
                              borderRadius: '8px',
                              objectFit: 'cover',
                              backgroundColor: '#27272a',
                            }}
                          />
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                              <span style={{ fontSize: '14px', fontWeight: 600, color: '#fafafa' }}>
                                {prod.title}
                              </span>
                              {item.matchType === 'typo_match' && (
                                <span
                                  style={{
                                    fontSize: '10px',
                                    backgroundColor: 'rgba(251, 191, 36, 0.15)',
                                    color: '#fbbf24',
                                    padding: '1px 6px',
                                    borderRadius: '4px',
                                    fontWeight: 600,
                                  }}
                                >
                                  Typo Match
                                </span>
                              )}
                              {item.score >= 50 && (
                                <span
                                  style={{
                                    fontSize: '10px',
                                    backgroundColor: 'rgba(16, 185, 129, 0.15)',
                                    color: '#10b981',
                                    padding: '1px 6px',
                                    borderRadius: '4px',
                                    fontWeight: 600,
                                  }}
                                >
                                  Top Match
                                </span>
                              )}
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px' }}>
                              <span style={{ color: '#10b981', fontWeight: 700 }}>
                                {formatPaise(prod.priceInPaise)}
                              </span>
                              {prod.compareAtPriceInPaise && (
                                <span style={{ color: '#71717a', textDecoration: 'line-through' }}>
                                  {formatPaise(prod.compareAtPriceInPaise)}
                                </span>
                              )}
                              <span style={{ color: '#52525b' }}>•</span>
                              <span style={{ color: '#a1a1aa' }}>{prod.category}</span>
                            </div>
                          </div>
                        </div>

                        {/* Add to Cart button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onAddToCart(prod);
                          }}
                          style={{
                            backgroundColor: '#10b981',
                            color: '#000000',
                            border: 'none',
                            padding: '8px 14px',
                            borderRadius: '8px',
                            fontWeight: 700,
                            fontSize: '12px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            flexShrink: 0,
                          }}
                        >
                          <ShoppingBag size={14} /> + Bag
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer shortcuts */}
        <div
          style={{
            padding: '12px 24px',
            backgroundColor: '#0f0f12',
            borderTop: '1px solid rgba(255, 255, 255, 0.06)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '11px',
            color: '#71717a',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span>
              Press <kbd style={{ background: '#27272a', padding: '2px 5px', borderRadius: '4px' }}>ESC</kbd> to close
            </span>
            <span>
              Press <kbd style={{ background: '#27272a', padding: '2px 5px', borderRadius: '4px' }}>⌘K</kbd> anytime
            </span>
          </div>
          <span style={{ color: '#10b981', fontWeight: 600 }}>
            Powered by DevX SearchX™
          </span>
        </div>
      </div>
    </div>
  );
};
