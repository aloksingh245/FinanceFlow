import React, { useEffect, useState, useCallback } from 'react';
import { Plus, Search, Trash2, Edit2, RefreshCcw, TrendingUp, TrendingDown, X } from 'lucide-react';
import axiosInstance from '../api/axiosInstance';
import RecordModal from '../components/RecordModal';
import { useAuth } from '../contexts/AuthContext';

const fmt = (n: number) => `₹${Number(n ?? 0).toLocaleString()}`;
type TypeFilter = 'all' | 'income' | 'expense';

const Records: React.FC = () => {
  const { user } = useAuth();
  const canWrite = user?.role === 'admin';
  const seeAll   = user?.role === 'admin' || user?.role === 'analyst';

  const [records,    setRecords]    = useState<any[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, hasMore: false });
  const [showModal,  setShowModal]  = useState(false);
  const [editRecord, setEditRecord] = useState<any>(null);
  const [summary,    setSummary]    = useState({ income: 0, expense: 0 });
  const [page,       setPage]       = useState(1);

  // Filter states
  const [searchInput,     setSearchInput]     = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [typeFilter,      setTypeFilter]      = useState<TypeFilter>('all');
  const [fromDate,        setFromDate]        = useState('');
  const [toDate,          setToDate]          = useState('');

  // Debounce search: update debouncedSearch 350ms after the user stops typing
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchInput), 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  const fetchRecords = useCallback(async (pg: number) => {
    setLoading(true);
    setError('');
    const params = new URLSearchParams({ page: String(pg), limit: '20' });
    if (debouncedSearch) params.set('search', debouncedSearch);
    if (typeFilter !== 'all') params.set('type', typeFilter);
    if (fromDate) params.set('from', fromDate);
    if (toDate)   params.set('to',   toDate);
    try {
      const res = await axiosInstance.get(`/records?${params}`);
      const data: any[] = res.data.data ?? [];
      setRecords(data);
      setPagination(res.data.pagination);
      setSummary({
        income:  data.filter(r => r.type === 'income').reduce((s, r)  => s + Number(r.amount), 0),
        expense: data.filter(r => r.type === 'expense').reduce((s, r) => s + Number(r.amount), 0),
      });
    } catch (err: any) {
      setError(err?.response?.data?.error?.message || 'Failed to load records');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, typeFilter, fromDate, toDate]);

  // Re-fetch whenever any filter or page changes
  useEffect(() => { fetchRecords(page); }, [fetchRecords, page]);

  // Reset to page 1 when filters change
  useEffect(() => { setPage(1); }, [debouncedSearch, typeFilter, fromDate, toDate]);

  const clearFilters = () => {
    setSearchInput('');
    setDebouncedSearch('');
    setTypeFilter('all');
    setFromDate('');
    setToDate('');
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this record?')) return;
    try {
      await axiosInstance.delete(`/records/${id}`);
      fetchRecords(page);
    } catch { alert('Failed to delete record'); }
  };

  const isFiltered = searchInput || typeFilter !== 'all' || fromDate || toDate;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 700, margin: 0 }}>Financial Records</h1>
          <p style={{ color: '#64748b', marginTop: '0.25rem', fontSize: '0.875rem' }}>
            {seeAll ? 'All users — ' : ''}{pagination.total} records total
          </p>
        </div>
        {canWrite && (
          <button className="btn btn-primary" onClick={() => { setEditRecord(null); setShowModal(true); }}>
            <Plus size={18} /> New Record
          </button>
        )}
      </div>

      {/* Summary bar */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
        {[
          { label: 'This Page Income',  val: summary.income,  color: '#10b981', bg: '#d1fae5', Icon: TrendingUp },
          { label: 'This Page Expense', val: summary.expense, color: '#f43f5e', bg: '#fee2e2', Icon: TrendingDown },
        ].map(({ label, val, color, bg, Icon }) => (
          <div key={label} style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: bg, color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icon size={18} />
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 500 }}>{label}</div>
              <div style={{ fontWeight: 700, fontSize: '1.1rem', color }}>{fmt(val)}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="card" style={{ padding: 0 }}>
        {/* Toolbar */}
        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #f1f5f9', display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: '1', minWidth: '200px' }}>
            <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input
              type="text"
              placeholder="Search category…"
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              className="input"
              style={{ margin: 0, paddingLeft: '2.25rem', paddingRight: searchInput ? '2rem' : undefined }}
            />
            {searchInput && (
              <button onClick={() => setSearchInput('')} style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '2px' }}>
                <X size={14} />
              </button>
            )}
          </div>

          <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: '8px', padding: '3px', gap: '2px' }}>
            {(['all', 'income', 'expense'] as TypeFilter[]).map(t => (
              <button key={t} onClick={() => setTypeFilter(t)} style={{
                padding: '0.35rem 0.75rem', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 600,
                border: 'none', cursor: 'pointer', textTransform: 'capitalize',
                background: typeFilter === t ? 'white' : 'transparent',
                color: typeFilter === t ? (t === 'income' ? '#10b981' : t === 'expense' ? '#f43f5e' : '#0f172a') : '#64748b',
                boxShadow: typeFilter === t ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              }}>{t === 'all' ? 'All' : t}</button>
            ))}
          </div>

          <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)}
            className="input" style={{ margin: 0, width: '140px', fontSize: '0.8rem' }} />
          <input type="date" value={toDate} onChange={e => setToDate(e.target.value)}
            className="input" style={{ margin: 0, width: '140px', fontSize: '0.8rem' }} />

          {isFiltered && (
            <button onClick={clearFilters} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.4rem 0.75rem', background: '#fef2f2', color: '#f43f5e', border: '1px solid #fecaca', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}>
              <X size={14} /> Clear
            </button>
          )}

          <button onClick={() => fetchRecords(page)} style={{ marginLeft: 'auto', padding: '0.4rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', cursor: 'pointer', color: '#64748b' }} title="Refresh">
            <RefreshCcw size={16} />
          </button>
        </div>

        {error && (
          <div style={{ padding: '0.75rem 1.25rem', background: '#fef2f2', color: '#b91c1c', fontSize: '0.875rem', borderBottom: '1px solid #fecaca' }}>
            ⚠️ {error} — <button onClick={() => fetchRecords(page)} style={{ background: 'none', border: 'none', color: '#b91c1c', cursor: 'pointer', fontWeight: 700, textDecoration: 'underline' }}>Retry</button>
          </div>
        )}

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Category</th>
                <th>Type</th>
                <th>Amount</th>
                {seeAll && <th>User</th>}
                <th>Notes</th>
                {canWrite && <th style={{ textAlign: 'right' }}>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}>{[1,2,3,4,5].map(j => (
                    <td key={j}><div style={{ height: '16px', background: '#f1f5f9', borderRadius: '4px', width: j===4?'60px':'80%', animation: 'pulse 1.5s infinite' }} /></td>
                  ))}</tr>
                ))
              ) : records.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
                  <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📭</div>
                  <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>No records found</div>
                  <div style={{ fontSize: '0.8rem' }}>{isFiltered ? 'Try clearing your filters' : canWrite ? 'Add your first record using the button above' : 'No records yet'}</div>
                </td></tr>
              ) : records.map(record => (
                <tr key={record.id}>
                  <td style={{ fontSize: '0.875rem', whiteSpace: 'nowrap' }}>{new Date(record.date).toLocaleDateString()}</td>
                  <td style={{ fontWeight: 600 }}>{record.category}</td>
                  <td>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', padding: '0.2rem 0.6rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 600, background: record.type === 'income' ? '#d1fae5' : '#fee2e2', color: record.type === 'income' ? '#065f46' : '#991b1b' }}>
                      {record.type === 'income' ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                      {record.type}
                    </span>
                  </td>
                  <td style={{ fontWeight: 700, color: record.type === 'income' ? '#10b981' : '#f43f5e', whiteSpace: 'nowrap' }}>
                    {record.type === 'income' ? '+' : '-'}{fmt(record.amount)}
                  </td>
                  {seeAll && (
                    <td style={{ fontSize: '0.8rem' }}>
                      <span style={{ background: '#f1f5f9', borderRadius: '6px', padding: '0.15rem 0.5rem', color: '#475569', fontWeight: 500 }}>
                        {record.user_name?.split(' ')[0] ?? '—'}
                      </span>
                    </td>
                  )}
                  <td style={{ color: '#64748b', fontSize: '0.875rem', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {record.notes || <span style={{ color: '#cbd5e1' }}>—</span>}
                  </td>
                  {canWrite && (
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.25rem' }}>
                        <button onClick={() => { setEditRecord(record); setShowModal(true); }} style={{ padding: '0.4rem', background: 'none', color: '#64748b', border: 'none', cursor: 'pointer', borderRadius: '6px' }}><Edit2 size={15} /></button>
                        <button onClick={() => handleDelete(record.id)} style={{ padding: '0.4rem', background: 'none', color: '#f43f5e', border: 'none', cursor: 'pointer', borderRadius: '6px' }}><Trash2 size={15} /></button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ padding: '1rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f1f5f9' }}>
          <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
            {loading ? '…' : `Showing ${records.length === 0 ? 0 : (page - 1) * 20 + 1}–${Math.min(page * 20, pagination.total)} of ${pagination.total}`}
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <button className="btn" disabled={page <= 1 || loading} onClick={() => setPage(p => p - 1)} style={{ border: '1px solid #e2e8f0', opacity: page <= 1 ? 0.4 : 1 }}>← Prev</button>
            <span style={{ fontSize: '0.8rem', color: '#64748b', padding: '0 0.25rem' }}>Page {page} of {Math.max(1, Math.ceil(pagination.total / 20))}</span>
            <button className="btn" disabled={!pagination.hasMore || loading} onClick={() => setPage(p => p + 1)} style={{ border: '1px solid #e2e8f0', opacity: !pagination.hasMore ? 0.4 : 1 }}>Next →</button>
          </div>
        </div>
      </div>

      {showModal && (
        <RecordModal record={editRecord} onClose={() => setShowModal(false)} onSuccess={() => { setShowModal(false); fetchRecords(page); }} />
      )}
    </div>
  );
};

export default Records;
