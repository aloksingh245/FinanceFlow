import React, { useEffect, useState, useCallback } from 'react';
import { TrendingUp, TrendingDown, RefreshCw, ArrowRight, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';
import SummaryCards from '../components/SummaryCards';
import { LineChart, CategoryChart } from '../components/Charts';
import { useAuth } from '../contexts/AuthContext';

const RANGES = [
  { label: 'This Month',    days: 0,   preset: 'month' },
  { label: 'Last 30 Days',  days: 30,  preset: '' },
  { label: 'Last 90 Days',  days: 90,  preset: '' },
  { label: 'This Year',     days: 0,   preset: 'year' },
  { label: 'Last 12 Months',days: 365, preset: '' },
];

const getRange = (preset: string, days: number) => {
  const now = new Date();
  const to = now.toISOString().split('T')[0];
  let from: string;

  if (preset === 'month') {
    from = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  } else if (preset === 'year') {
    from = new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0];
  } else {
    const d = new Date(now);
    d.setDate(d.getDate() - days);
    from = d.toISOString().split('T')[0];
  }
  return { from, to };
};

const fmt = (n: number) => `₹${Number(n ?? 0).toLocaleString()}`;

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isAdmin   = user?.role === 'admin';
  const seeAll    = !!user; // all authenticated users see aggregated analytics data

  const [summary,       setSummary]       = useState<any>(null);
  const [recent,        setRecent]        = useState<any[]>([]);
  const [monthlyData,   setMonthlyData]   = useState<any[]>([]);
  const [categoryData,  setCategoryData]  = useState<any[]>([]);
  const [userBreakdown, setUserBreakdown] = useState<any[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState('');
  const [activeRange,   setActiveRange]   = useState(4); // default: Last 12 Months

  const canWrite = isAdmin;
  const canRead  = isAdmin || user?.role === 'analyst';

  const fetchAll = useCallback(async (rangeIdx: number, adminOverride?: boolean) => {
    const adminView = adminOverride ?? isAdmin; // breakdown is admin-only
    setLoading(true);
    setError('');
    const { from, to } = getRange(RANGES[rangeIdx].preset, RANGES[rangeIdx].days);
    const q = `from=${from}&to=${to}`;
    try {
      const [sumRes, recentRes, monthRes, catRes] = await Promise.all([
        axiosInstance.get(`/analytics/summary?${q}`),
        axiosInstance.get('/analytics/recent'),
        axiosInstance.get(`/analytics/monthly?${q}`),
        axiosInstance.get(`/analytics/category?${q}`),
      ]);
      setSummary(sumRes.data.data);
      setRecent(recentRes.data.data ?? []);
      setMonthlyData(monthRes.data.data ?? []);
      setCategoryData(catRes.data.data ?? []);

      if (adminView) {
        const bdRes = await axiosInstance.get(`/analytics/users/breakdown?${q}`);
        setUserBreakdown(bdRes.data.data ?? []);
      }
    } catch (err: any) {
      const msg = err?.response?.data?.error?.message || err?.message || 'Failed to load dashboard data';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  // Fetch once on mount, then whenever range changes
  useEffect(() => { fetchAll(activeRange); }, [activeRange]);

  // Re-fetch when user role resolves (isAdmin flips from false → true after localStorage load)
  useEffect(() => {
    if (isAdmin) fetchAll(activeRange, true);
  }, [isAdmin]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 700, margin: 0 }}>Financial Overview</h1>
          <p style={{ color: '#64748b', marginTop: '0.25rem', fontSize: '0.875rem' }}>
            Welcome back, <strong>{user?.name}</strong>
            {seeAll && <span style={{ marginLeft: '0.5rem', background: '#ede9fe', color: '#7c3aed', borderRadius: '6px', padding: '0.1rem 0.5rem', fontSize: '0.75rem', fontWeight: 700 }}>All Users</span>}
            {' '}— {RANGES[activeRange].label}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: '10px', padding: '3px', gap: '2px', flexWrap: 'wrap' }}>
            {RANGES.map((r, i) => (
              <button
                key={i}
                onClick={() => setActiveRange(i)}
                style={{
                  padding: '0.4rem 0.875rem', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 600,
                  border: 'none', cursor: 'pointer', transition: 'all 0.15s',
                  background: activeRange === i ? 'white' : 'transparent',
                  color: activeRange === i ? '#0f172a' : '#64748b',
                  boxShadow: activeRange === i ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
                }}
              >{r.label}</button>
            ))}
          </div>
          <button
            onClick={() => fetchAll(activeRange)}
            style={{ padding: '0.5rem', borderRadius: '8px', border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer', color: '#475569' }}
            title="Refresh"
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div style={{ padding: '0.875rem 1rem', background: '#fef2f2', color: '#b91c1c', borderRadius: '10px', marginBottom: '1.5rem', fontSize: '0.875rem', borderLeft: '4px solid #f87171' }}>
          ⚠️ {error} — <button onClick={() => fetchAll(activeRange)} style={{ background: 'none', border: 'none', color: '#b91c1c', cursor: 'pointer', fontWeight: 700, textDecoration: 'underline' }}>Retry</button>
        </div>
      )}

      {/* Summary Cards */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '1.5rem', marginBottom: '2rem' }}>
          {[0,1,2].map(i => <div key={i} style={{ height: '120px', background: '#f8fafc', borderRadius: '16px', animation: 'pulse 1.5s infinite' }} />)}
        </div>
      ) : summary ? (
        <SummaryCards summary={summary} />
      ) : null}

      {/* Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: '1.5rem', marginTop: '1.75rem' }}>
        <div style={{ background: 'white', borderRadius: '16px', padding: '1.5rem', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div>
              <h3 style={{ fontWeight: 700, margin: 0, fontSize: '1rem' }}>Cash Flow Trend</h3>
              <p style={{ color: '#94a3b8', fontSize: '0.75rem', margin: '0.2rem 0 0' }}>Monthly income vs expenses</p>
            </div>
            <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem' }}>
              {[['Income','#10b981'],['Expense','#f43f5e']].map(([l,c]) => (
                <div key={l} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: c }} />
                  <span style={{ color: '#64748b', fontWeight: 500 }}>{l}</span>
                </div>
              ))}
            </div>
          </div>
          <div style={{ height: '280px' }}>
            <LineChart monthlyData={monthlyData} />
          </div>
        </div>

        <div style={{ background: 'white', borderRadius: '16px', padding: '1.5rem', border: '1px solid #e2e8f0' }}>
          <div style={{ marginBottom: '1.25rem' }}>
            <h3 style={{ fontWeight: 700, margin: 0, fontSize: '1rem' }}>Expense Breakdown</h3>
            <p style={{ color: '#94a3b8', fontSize: '0.75rem', margin: '0.2rem 0 0' }}>By category</p>
          </div>
          <div style={{ height: '280px' }}>
            <CategoryChart categoryData={categoryData} />
          </div>
        </div>
      </div>

      {/* Admin — Per-User Breakdown */}
      {isAdmin && userBreakdown.length > 0 && (
        <div style={{ background: 'white', borderRadius: '16px', padding: '1.5rem', border: '1px solid #e2e8f0', marginTop: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#ede9fe', color: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Users size={18} />
            </div>
            <div>
              <h3 style={{ fontWeight: 700, margin: 0, fontSize: '1rem' }}>Per-User Breakdown</h3>
              <p style={{ color: '#94a3b8', fontSize: '0.75rem', margin: 0 }}>Admin view — {RANGES[activeRange].label}</p>
            </div>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #f1f5f9' }}>
                  {['User', 'Email', 'Income', 'Expenses', 'Net Balance', 'Records'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '0.5rem 0.75rem', color: '#64748b', fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {userBreakdown.map((row: any) => (
                  <tr key={row.user_id} style={{ borderBottom: '1px solid #f8fafc' }}>
                    <td style={{ padding: '0.625rem 0.75rem', fontWeight: 600, color: '#0f172a' }}>{row.user_name}</td>
                    <td style={{ padding: '0.625rem 0.75rem', color: '#64748b' }}>{row.email}</td>
                    <td style={{ padding: '0.625rem 0.75rem', color: '#10b981', fontWeight: 600 }}>{fmt(row.total_income)}</td>
                    <td style={{ padding: '0.625rem 0.75rem', color: '#f43f5e', fontWeight: 600 }}>{fmt(row.total_expense)}</td>
                    <td style={{ padding: '0.625rem 0.75rem', fontWeight: 700, color: row.net_balance >= 0 ? '#10b981' : '#f43f5e' }}>
                      {row.net_balance >= 0 ? '+' : ''}{fmt(row.net_balance)}
                    </td>
                    <td style={{ padding: '0.625rem 0.75rem', color: '#64748b' }}>
                      <span style={{ background: '#f1f5f9', borderRadius: '6px', padding: '0.15rem 0.5rem', fontWeight: 600 }}>{row.record_count}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Recent Transactions */}
      <div style={{ background: 'white', borderRadius: '16px', padding: '1.5rem', border: '1px solid #e2e8f0', marginTop: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div>
            <h3 style={{ fontWeight: 700, margin: 0, fontSize: '1rem' }}>Recent Transactions</h3>
            <p style={{ color: '#94a3b8', fontSize: '0.75rem', margin: '0.2rem 0 0' }}>
              {seeAll ? 'Last 10 entries across all users' : 'Last 10 entries'}
            </p>
          </div>
          {canRead && (
            <button
              onClick={() => navigate('/records')}
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 0.875rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 600, color: '#475569', cursor: 'pointer' }}
            >
              View All <ArrowRight size={14} />
            </button>
          )}
        </div>

        {recent.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8', fontSize: '0.875rem' }}>
            No transactions yet
            {canWrite && <span> — <button onClick={() => navigate('/records')} style={{ color: '#10b981', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>add one</button></span>}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '0.875rem' }}>
            {recent.map((tx: any) => (
              <div key={tx.id} style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', padding: '0.875rem', background: '#f8fafc', borderRadius: '12px' }}>
                <div style={{
                  width: '40px', height: '40px', borderRadius: '10px', flexShrink: 0,
                  background: tx.type === 'income' ? '#d1fae5' : '#fee2e2',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: tx.type === 'income' ? '#10b981' : '#f43f5e'
                }}>
                  {tx.type === 'income' ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.875rem', color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tx.category}</div>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                    {new Date(tx.date).toLocaleDateString()}
                    {seeAll && tx.user_name && (
                      <span style={{ marginLeft: '0.5rem', background: '#ede9fe', color: '#7c3aed', borderRadius: '4px', padding: '0.05rem 0.35rem', fontSize: '0.7rem', fontWeight: 600 }}>
                        {tx.user_name.split(' ')[0]}
                      </span>
                    )}
                  </div>
                </div>
                <div style={{ fontWeight: 700, fontSize: '0.95rem', color: tx.type === 'income' ? '#10b981' : '#f43f5e', whiteSpace: 'nowrap' }}>
                  {tx.type === 'income' ? '+' : '-'}₹{Number(tx.amount).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
