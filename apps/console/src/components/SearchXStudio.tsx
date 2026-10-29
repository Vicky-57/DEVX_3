import React, { useState, useEffect } from 'react';
import {
  Search,
  Sparkles,
  TrendingUp,
  Tag,
  ArrowUpRight,
  Plus,
  Trash2,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  HelpCircle,
  Pin,
  Flame,
} from 'lucide-react';
import { Product, formatPaise } from '@cartx/shared';

interface SearchXStudioProps {
  apiBase: string;
  products: Product[];
}

export const SearchXStudio: React.FC<SearchXStudioProps> = ({ apiBase, products }) => {
  const [subTab, setSubTab] = useState<'analytics' | 'synonyms' | 'merchandising' | 'tester'>('analytics');
  const [analytics, setAnalytics] = useState<any>(null);
  const [synonyms, setSynonyms] = useState<any[]>([]);
  const [merchandisingRules, setMerchandisingRules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  // New synonym form state
  const [newSynonym, setNewSynonym] = useState({
    triggerWord: '',
    replacementsStr: '',
  });

  // New merchandising rule form state
  const [newRule, setNewRule] = useState({
    query: '',
    pinnedProductId: '',
    boostedTag: '',
  });

  // Live tester state
  const [testQuery, setTestQuery] = useState('sneekers');
  const [testResult, setTestResult] = useState<any>(null);
  const [testLoading, setTestLoading] = useState(false);

  const fetchSearchData = async () => {
    setLoading(true);
    try {
      const [anaRes, synRes, merchRes] = await Promise.all([
        fetch(`${apiBase}/v1/admin/search/analytics`),
        fetch(`${apiBase}/v1/admin/search/synonyms`),
        fetch(`${apiBase}/v1/admin/search/merchandising`),
      ]);

      if (anaRes.ok) setAnalytics(await anaRes.json());
      if (synRes.ok) {
        const d = await synRes.json();
        setSynonyms(d.synonyms || []);
      }
      if (merchRes.ok) {
        const d = await merchRes.json();
        setMerchandisingRules(d.rules || []);
      }
    } catch (err) {
      console.error('Error loading SearchX data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSearchData();
  }, []);

  // Run live test query
  const runLiveTest = async (q: string) => {
    setTestLoading(true);
    try {
      const res = await fetch(`${apiBase}/v1/search?q=${encodeURIComponent(q)}`);
      if (res.ok) {
        setTestResult(await res.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setTestLoading(false);
    }
  };

  useEffect(() => {
    if (subTab === 'tester') {
      runLiveTest(testQuery);
    }
  }, [subTab]);

  const handleAddSynonym = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSynonym.triggerWord.trim()) return;

    const words = newSynonym.replacementsStr
      .split(',')
      .map((w) => w.trim().toLowerCase())
      .filter(Boolean);

    try {
      const res = await fetch(`${apiBase}/v1/admin/search/synonyms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          triggerWord: newSynonym.triggerWord.trim().toLowerCase(),
          replacementWords: words,
          active: true,
        }),
      });

      if (res.ok) {
        setStatusMsg(`Synonym "${newSynonym.triggerWord}" added successfully!`);
        setTimeout(() => setStatusMsg(null), 3000);
        setNewSynonym({ triggerWord: '', replacementsStr: '' });
        fetchSearchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteSynonym = async (id: string) => {
    try {
      await fetch(`${apiBase}/v1/admin/search/synonyms/${id}`, { method: 'DELETE' });
      fetchSearchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddMerchRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRule.query.trim()) return;

    try {
      const res = await fetch(`${apiBase}/v1/admin/search/merchandising`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: newRule.query.trim().toLowerCase(),
          pinnedProductIds: newRule.pinnedProductId ? [newRule.pinnedProductId] : [],
          boostedTags: newRule.boostedTag ? [newRule.boostedTag.trim().toLowerCase()] : [],
          buriedProductIds: [],
          active: true,
        }),
      });

      if (res.ok) {
        setStatusMsg(`Merchandising rule for "${newRule.query}" created!`);
        setTimeout(() => setStatusMsg(null), 3000);
        setNewRule({ query: '', pinnedProductId: '', boostedTag: '' });
        fetchSearchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteMerchRule = async (id: string) => {
    try {
      await fetch(`${apiBase}/v1/admin/search/merchandising/${id}`, { method: 'DELETE' });
      fetchSearchData();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <h1 style={{ fontSize: '28px', fontWeight: 800, letterSpacing: '-0.02em', margin: 0 }}>
              SearchX AI Discovery Studio
            </h1>
            <span
              style={{
                backgroundColor: 'rgba(16, 185, 129, 0.15)',
                color: '#10b981',
                padding: '2px 8px',
                borderRadius: '12px',
                fontSize: '11px',
                fontWeight: 700,
                border: '1px solid rgba(16, 185, 129, 0.3)',
              }}
            >
              Hybrid Semantic
            </span>
          </div>
          <p style={{ color: '#71717a', fontSize: '14px', margin: 0 }}>
            Configure typo-tolerance, synonyms dictionary, query pinning, tag boosting, and search analytics.
          </p>
        </div>

        <button
          onClick={fetchSearchData}
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

      {statusMsg && (
        <div
          style={{
            backgroundColor: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid #10b981',
            color: '#34d399',
            padding: '12px 18px',
            borderRadius: '10px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '14px',
          }}
        >
          <CheckCircle size={18} /> {statusMsg}
        </div>
      )}

      {/* Sub Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          paddingBottom: '14px',
          marginBottom: '28px',
        }}
      >
        <button
          onClick={() => setSubTab('analytics')}
          style={{
            backgroundColor: subTab === 'analytics' ? '#10b981' : '#27272a',
            color: subTab === 'analytics' ? '#000' : '#d4d4d8',
            border: 'none',
            padding: '8px 16px',
            borderRadius: '8px',
            fontWeight: 700,
            fontSize: '13px',
            cursor: 'pointer',
          }}
        >
          Query Analytics & Insights
        </button>
        <button
          onClick={() => setSubTab('synonyms')}
          style={{
            backgroundColor: subTab === 'synonyms' ? '#10b981' : '#27272a',
            color: subTab === 'synonyms' ? '#000' : '#d4d4d8',
            border: 'none',
            padding: '8px 16px',
            borderRadius: '8px',
            fontWeight: 700,
            fontSize: '13px',
            cursor: 'pointer',
          }}
        >
          Synonyms Dictionary ({synonyms.length})
        </button>
        <button
          onClick={() => setSubTab('merchandising')}
          style={{
            backgroundColor: subTab === 'merchandising' ? '#10b981' : '#27272a',
            color: subTab === 'merchandising' ? '#000' : '#d4d4d8',
            border: 'none',
            padding: '8px 16px',
            borderRadius: '8px',
            fontWeight: 700,
            fontSize: '13px',
            cursor: 'pointer',
          }}
        >
          Merchandising & Boosts ({merchandisingRules.length})
        </button>
        <button
          onClick={() => setSubTab('tester')}
          style={{
            backgroundColor: subTab === 'tester' ? '#38bdf8' : '#27272a',
            color: subTab === 'tester' ? '#000' : '#d4d4d8',
            border: 'none',
            padding: '8px 16px',
            borderRadius: '8px',
            fontWeight: 700,
            fontSize: '13px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <Search size={14} /> Live Query Simulator
        </button>
      </div>

      {/* SUBTAB 1: ANALYTICS */}
      {subTab === 'analytics' && analytics && (
        <div>
          {/* Summary KPIs */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '28px' }}>
            <div style={kpiCardStyle}>
              <div style={{ fontSize: '13px', color: '#a1a1aa', fontWeight: 600 }}>Total Searches Logged</div>
              <div style={{ fontSize: '32px', fontWeight: 800, color: '#fafafa', margin: '8px 0' }}>
                {analytics.summary.totalSearches}
              </div>
              <div style={{ fontSize: '12px', color: '#10b981' }}>+44% vs previous 7 days</div>
            </div>

            <div style={kpiCardStyle}>
              <div style={{ fontSize: '13px', color: '#a1a1aa', fontWeight: 600 }}>Search Clicks (Add to Bag / View)</div>
              <div style={{ fontSize: '32px', fontWeight: 800, color: '#38bdf8', margin: '8px 0' }}>
                {analytics.summary.totalClicks}
              </div>
              <div style={{ fontSize: '12px', color: '#71717a' }}>High-intent shopping queries</div>
            </div>

            <div style={kpiCardStyle}>
              <div style={{ fontSize: '13px', color: '#a1a1aa', fontWeight: 600 }}>Search Click-Through Rate (CTR)</div>
              <div style={{ fontSize: '32px', fontWeight: 800, color: '#10b981', margin: '8px 0' }}>
                {analytics.summary.ctrPct}%
              </div>
              <div style={{ fontSize: '12px', color: '#34d399' }}>Industry benchmark: ~15%</div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: '24px' }}>
            {/* Top Search Queries Table */}
            <div style={cardStyle}>
              <h2 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px', margin: 0 }}>
                Top Performing Search Terms
              </h2>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px', marginTop: '16px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#71717a' }}>
                    <th style={{ padding: '8px 0' }}>Query</th>
                    <th>Volume</th>
                    <th>Avg Results</th>
                    <th>Clicks</th>
                    <th>CTR %</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.topQueries.map((q: any) => (
                    <tr key={q.query} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: '12px 0', fontWeight: 600, color: '#fafafa' }}>
                        &ldquo;{q.query}&rdquo;
                      </td>
                      <td style={{ color: '#d4d4d8' }}>{q.search_count}</td>
                      <td style={{ color: '#d4d4d8' }}>{Math.round(q.avg_results)}</td>
                      <td style={{ color: '#38bdf8' }}>{q.clicks}</td>
                      <td>
                        <span
                          style={{
                            backgroundColor: q.ctrPct > 50 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255,255,255,0.05)',
                            color: q.ctrPct > 50 ? '#10b981' : '#a1a1aa',
                            padding: '2px 8px',
                            borderRadius: '12px',
                            fontSize: '11px',
                            fontWeight: 700,
                          }}
                        >
                          {q.ctrPct}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Zero-Result Queries */}
            <div style={cardStyle}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <AlertCircle size={18} style={{ color: '#fbbf24' }} />
                <h2 style={{ fontSize: '16px', fontWeight: 700, margin: 0 }}>Zero-Result Queries</h2>
              </div>
              <p style={{ color: '#71717a', fontSize: '12px', margin: '0 0 16px 0' }}>
                Queries shoppers searched for that returned 0 results. Add synonyms or source new inventory!
              </p>

              {analytics.zeroResultQueries.length === 0 ? (
                <div style={{ padding: '24px 0', textAlign: 'center', color: '#71717a', fontSize: '13px' }}>
                  No zero-result searches found! Typo-tolerance is resolving loose terms.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {analytics.zeroResultQueries.map((zq: any) => (
                    <div
                      key={zq.query}
                      style={{
                        padding: '10px 14px',
                        backgroundColor: '#27272a',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 600, color: '#fafafa', fontSize: '13px' }}>
                          &ldquo;{zq.query}&rdquo;
                        </div>
                        <div style={{ fontSize: '11px', color: '#71717a' }}>
                          Searched {zq.count} times
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setNewSynonym({ triggerWord: zq.query, replacementsStr: '' });
                          setSubTab('synonyms');
                        }}
                        style={{
                          backgroundColor: '#fbbf24',
                          color: '#000',
                          border: 'none',
                          padding: '4px 10px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        + Create Synonym
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 2: SYNONYMS */}
      {subTab === 'synonyms' && (
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
          <div style={cardStyle}>
            <h2 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px', margin: 0 }}>
              Active Synonym Dictionaries
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
              {synonyms.map((syn) => (
                <div
                  key={syn.id}
                  style={{
                    padding: '14px 18px',
                    backgroundColor: '#27272a',
                    borderRadius: '10px',
                    border: '1px solid rgba(255,255,255,0.06)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                      <span style={{ fontSize: '15px', fontWeight: 700, color: '#38bdf8' }}>
                        &ldquo;{syn.triggerWord}&rdquo;
                      </span>
                      <span style={{ color: '#71717a', fontSize: '12px' }}>expands into:</span>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {syn.replacementWords.map((rw: string) => (
                        <span
                          key={rw}
                          style={{
                            backgroundColor: '#18181b',
                            color: '#10b981',
                            padding: '2px 8px',
                            borderRadius: '6px',
                            fontSize: '11px',
                            fontWeight: 600,
                            border: '1px solid rgba(16, 185, 129, 0.2)',
                          }}
                        >
                          {rw}
                        </span>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => handleDeleteSynonym(syn.id)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#ef4444',
                      cursor: 'pointer',
                      padding: '6px',
                    }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Add Synonym Form */}
          <div style={cardStyle}>
            <h2 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px', margin: 0 }}>
              + Add New Synonym
            </h2>
            <form onSubmit={handleAddSynonym} style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '16px' }}>
              <div>
                <label style={labelStyle}>Search Trigger Word</label>
                <input
                  type="text"
                  placeholder="e.g. kicks, threads, shades"
                  value={newSynonym.triggerWord}
                  onChange={(e) => setNewSynonym({ ...newSynonym, triggerWord: e.target.value })}
                  style={inputStyle}
                  required
                />
              </div>

              <div>
                <label style={labelStyle}>Replacement Words (comma-separated)</label>
                <input
                  type="text"
                  placeholder="e.g. sneakers, shoes, footwear"
                  value={newSynonym.replacementsStr}
                  onChange={(e) => setNewSynonym({ ...newSynonym, replacementsStr: e.target.value })}
                  style={inputStyle}
                  required
                />
                <span style={{ fontSize: '11px', color: '#71717a', marginTop: '4px', display: 'block' }}>
                  When someone searches the trigger word, products matching these terms will be retrieved.
                </span>
              </div>

              <button type="submit" style={primaryBtnStyle}>
                <Plus size={16} /> Save Synonym
              </button>
            </form>
          </div>
        </div>
      )}

      {/* SUBTAB 3: MERCHANDISING */}
      {subTab === 'merchandising' && (
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
          <div style={cardStyle}>
            <h2 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px', margin: 0 }}>
              Merchandising & Search Pinning Rules
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
              {merchandisingRules.length === 0 ? (
                <div style={{ padding: '24px 0', textAlign: 'center', color: '#71717a' }}>
                  No rules yet. Create one on the right to pin hero products or boost campaign tags!
                </div>
              ) : (
                merchandisingRules.map((rule) => {
                  const pinnedProd = products.find((p) => rule.pinnedProductIds?.includes(p.id));
                  return (
                    <div
                      key={rule.id}
                      style={{
                        padding: '16px 20px',
                        backgroundColor: '#27272a',
                        borderRadius: '10px',
                        border: '1px solid rgba(255,255,255,0.06)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                          <span style={{ fontSize: '15px', fontWeight: 700, color: '#fafafa' }}>
                            When Query Is: &ldquo;{rule.query}&rdquo;
                          </span>
                        </div>
                        {pinnedProd && (
                          <div style={{ fontSize: '12px', color: '#fbbf24', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                            <Pin size={12} /> Pinned #1: <strong>{pinnedProd.title}</strong>
                          </div>
                        )}
                        {rule.boostedTags?.length > 0 && (
                          <div style={{ fontSize: '12px', color: '#10b981', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Flame size={12} /> Boosted Tags:{' '}
                            {rule.boostedTags.map((t: string) => (
                              <span key={t} style={{ backgroundColor: '#18181b', padding: '1px 6px', borderRadius: '4px' }}>
                                #{t}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <button
                        onClick={() => handleDeleteMerchRule(rule.id)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#ef4444',
                          cursor: 'pointer',
                          padding: '6px',
                        }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Add Merch Rule Form */}
          <div style={cardStyle}>
            <h2 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px', margin: 0 }}>
              + Add Merchandising Rule
            </h2>
            <form onSubmit={handleAddMerchRule} style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '16px' }}>
              <div>
                <label style={labelStyle}>Target Search Query</label>
                <input
                  type="text"
                  placeholder="e.g. hoodie, kicks, winter"
                  value={newRule.query}
                  onChange={(e) => setNewRule({ ...newRule, query: e.target.value })}
                  style={inputStyle}
                  required
                />
              </div>

              <div>
                <label style={labelStyle}>Pin Product to Top Position</label>
                <select
                  value={newRule.pinnedProductId}
                  onChange={(e) => setNewRule({ ...newRule, pinnedProductId: e.target.value })}
                  style={inputStyle}
                >
                  <option value="">-- None (Do not pin) --</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title} ({formatPaise(p.priceInPaise)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={labelStyle}>Boost Products with Tag</label>
                <input
                  type="text"
                  placeholder="e.g. heavyweight, bestseller, fleece"
                  value={newRule.boostedTag}
                  onChange={(e) => setNewRule({ ...newRule, boostedTag: e.target.value })}
                  style={inputStyle}
                />
              </div>

              <button type="submit" style={primaryBtnStyle}>
                <Plus size={16} /> Save Merchandising Rule
              </button>
            </form>
          </div>
        </div>
      )}

      {/* SUBTAB 4: TESTER */}
      {subTab === 'tester' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>
          <div style={cardStyle}>
            <h2 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '8px', margin: 0 }}>
              Live Semantic & Typo Simulator
            </h2>
            <p style={{ color: '#71717a', fontSize: '13px', margin: '0 0 16px 0' }}>
              Type any query to test how SearchX ranks products, resolves typos, applies synonyms, and extracts price/category bounds.
            </p>

            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
              <input
                type="text"
                value={testQuery}
                onChange={(e) => setTestQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') runLiveTest(testQuery);
                }}
                placeholder="Try 'sneekers', 'hoodie under 2500', 'kicks'..."
                style={{ ...inputStyle, flex: 1, fontSize: '16px', padding: '12px 16px' }}
              />
              <button
                onClick={() => runLiveTest(testQuery)}
                style={{ ...primaryBtnStyle, padding: '12px 24px', fontSize: '14px' }}
              >
                <Search size={16} /> Test Query
              </button>
            </div>

            {testLoading && <div style={{ color: '#10b981', fontSize: '13px' }}>Evaluating query...</div>}

            {testResult && (
              <div>
                {/* Intent details */}
                <div
                  style={{
                    padding: '12px 18px',
                    backgroundColor: '#27272a',
                    borderRadius: '8px',
                    marginBottom: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    fontSize: '13px',
                  }}
                >
                  <span>
                    Latency: <strong style={{ color: '#10b981' }}>{testResult.executionTimeMs}ms</strong>
                  </span>
                  <span>
                    Total Results: <strong>{testResult.total}</strong>
                  </span>
                  {testResult.intent?.detectedCategory && (
                    <span>
                      Parsed Category: <strong style={{ color: '#38bdf8' }}>{testResult.intent.detectedCategory}</strong>
                    </span>
                  )}
                  {testResult.intent?.maxPriceInPaise && (
                    <span>
                      Max Budget: <strong style={{ color: '#fbbf24' }}>{formatPaise(testResult.intent.maxPriceInPaise)}</strong>
                    </span>
                  )}
                  {testResult.intent?.correctedQuery && (
                    <span>
                      Typo Corrected: <strong style={{ color: '#a78bfa' }}>{testResult.intent.correctedQuery}</strong>
                    </span>
                  )}
                </div>

                {/* Scored Items */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                  {testResult.items.map((item: any) => (
                    <div
                      key={item.product.id}
                      style={{
                        padding: '12px 16px',
                        backgroundColor: '#27272a',
                        borderRadius: '10px',
                        border: '1px solid rgba(255,255,255,0.06)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <img
                          src={item.product.imageUrl}
                          alt={item.product.title}
                          style={{ width: '48px', height: '48px', borderRadius: '6px', objectFit: 'cover' }}
                        />
                        <div>
                          <div style={{ fontWeight: 600, color: '#fafafa', fontSize: '13px' }}>
                            {item.product.title}
                          </div>
                          <div style={{ fontSize: '11px', color: '#71717a' }}>
                            {formatPaise(item.product.priceInPaise)} • {item.product.category}
                          </div>
                        </div>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '12px', fontWeight: 700, color: '#10b981' }}>
                          Score: {item.score}
                        </div>
                        <div style={{ fontSize: '10px', color: '#a1a1aa' }}>
                          {item.matchType}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

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
  justifyContent: 'center',
  gap: '6px',
};
