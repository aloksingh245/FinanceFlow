import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Search, Download, RefreshCw, Clock, X, ChevronLeft, ChevronRight } from 'lucide-react';
import axiosInstance from '../api/axiosInstance';

const ACTION_COLORS: Record<string, { bg: string; color: string }> = {
  LOGIN:          { bg: '#dbeafe', color: '#1d4ed8' },
  LOGIN_FAILED:   { bg: '#fee2e2', color: '#b91c1c' },
  LOGOUT:         { bg: '#f1f5f9', color: '#475569' },
  REGISTER:       { bg: '#d1fae5', color: '#065f46' },
  CREATE_RECORD:  { bg: '#d1fae5', color: '#065f46' },
  UPDATE_RECORD:  { bg: '#ede9fe', color: '#6d28d9' },
  DELETE_RECORD:  { bg: '#fee2e2', color: '#b91c1c' },
  RESTORE_RECORD: { bg: '#fef3c7', color: '#92400e' },
  DELETE_USER:    { bg: '#fee2e2', color: '#b91c1c' },
  UPDATE_STATUS:  { bg: '#ede9fe', color: '#6d28d9' },
  UPDATE_ROLE:    { bg: '#fef3c7', color: '#92400e' },
};

const ALL_ACTIONS = Object.keys(ACTION_COLORS);

const AuditLogs: React.FC = () => {
  const [logs, setLogs]               = useState<any[]>([]);
  const [loading, setLoading]         = useState(true);
  const [pagination, setPagination]   = useState({ page: 1, limit: 20, total: 0, hasMore: false });
  const [search, setSearch]           = useState('');
  const [filterAction, setFilterAction] = useState('');
  const [filterFrom, setFilterFrom]   = useState('');
  const [filterTo, setFilterTo]       = useState('');
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  const [stats, setStats]             = useState<Record<string, number>>({});
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Debounce search input
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  const fetchLogs = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (filterAction)    params.set('action', filterAction);
      if (filterFrom)      params.set('from', filterFrom);
      if (filterTo)        params.set('to', filterTo);
      if (debouncedSearch) params.set('search', debouncedSearch);

      const response = await axiosInstance.get(`/audit/logs?${params}`);
      const data: any[] = response.data.data ?? [];
      const pag = response.data.pagination ?? {};

      setLogs(data);
      setPagination({ ...pag, page });
      setLastRefreshed(new Date());

      const counts: Record<string, number> = {};
      data.forEach(l => { counts[l.action] = (counts[l.action] || 0) + 1; });
      setStats(counts);
    } catch (err) {
      console.error('Error fetching audit logs', err);
    } finally {
      setLoading(false);
    }
  }, [filterAction, filterFrom, filterTo, debouncedSearch]);

  // Re-fetch when any filter changes; reset to page 1
  useEffect(() => { setCurrentPage(1); }, [filterAction, filterFrom, filterTo, debouncedSearch]);
  useEffect(() => { fetchLogs(currentPage); }, [fetchLogs, currentPage]);

  // auto-refresh every 30 seconds
  useEffect(() => {
    if (autoRefresh) {
      timerRef.current = setInterval(() => fetchLogs(pagination.page), 30_000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [autoRefresh, pagination.page, fetchLogs]);

  const clearFilters = () => {
    setFilterAction('');
    setFilterFrom('');
    setFilterTo('');
    setSearch('');
    setDebouncedSearch('');
  };

  const exportCSV = () => {
    if (!logs.length) return;
    const headers = ['Timestamp', 'Action', 'Entity', 'User Name', 'User Email', 'User ID', 'IP Address', 'Request ID'];
    const rows = logs.map(l => [
      new Date(l.timestamp).toLocaleString(),
      l.action,
      l.entity,
      l.user_name  ?? 'SYSTEM',
      l.user_email ?? '',
      l.user_id    ?? '',
      l.ip_address ?? '',
      l.request_id ?? '',
    ]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const hasFilters = filterAction || filterFrom || filterTo || search;

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 700, margin: 0 }}>System Audit Logs</h1>
          <p style={{ color: '#64748b', marginTop: '0.25rem', fontSize: '0.875rem' }}>
            Immutable record of all system actions — {pagination.total} total entries
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
            Last updated {lastRefreshed.toLocaleTimeString()}
          </span>
          <button
            onClick={() => setAutoRefresh(p => !p)}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.4rem',
              padding: '0.5rem 0.875rem', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 600,
              border: '1px solid', cursor: 'pointer',
              background: autoRefresh ? '#d1fae5' : 'white', borderColor: autoRefresh ? '#6ee7b7' : '#e2e8f0',
              color: autoRefresh ? '#065f46' : '#475569',
            }}
          >
            <RefreshCw size={14} className={autoRefresh ? 'spin' : ''} />
            {autoRefresh ? 'Live' : 'Auto Refresh'}
          </button>
          <button
            onClick={() => fetchLogs(pagination.page)}
            style={{ padding: '0.5rem', borderRadius: '8px', border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer', color: '#475569' }}
            title="Refresh now"
          >
            <RefreshCw size={16} />
          </button>
          <button
            onClick={exportCSV}
            disabled={!logs.length}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.4rem',
              padding: '0.5rem 0.875rem', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 600,
              border: 'none', cursor: logs.length ? 'pointer' : 'not-allowed',
              background: logs.length ? '#0f172a' : '#e2e8f0', color: logs.length ? 'white' : '#94a3b8',
            }}
          >
            <Download size={14} />
            Export CSV
          </button>
        </div>
      </div>

      {/* Stats Bar */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {Object.entries(stats).sort((a, b) => b[1] - a[1]).map(([action, count]) => {
          const style = ACTION_COLORS[action] || { bg: '#f1f5f9', color: '#475569' };
          return (
            <button
              key={action}
              onClick={() => setFilterAction(filterAction === action ? '' : action)}
              style={{
                padding: '0.35rem 0.75rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 700,
                border: `2px solid ${filterAction === action ? style.color : 'transparent'}`,
                background: style.bg, color: style.color, cursor: 'pointer',
              }}
            >
              {action} <span style={{ opacity: 0.7 }}>×{count}</span>
            </button>
          );
        })}
      </div>

      {/* Filters */}
      <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1rem', marginBottom: '1rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
        {/* Search */}
        <div style={{ position: 'relative', flex: '1', minWidth: '200px' }}>
          <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, email, action..."
            style={{ width: '100%', paddingLeft: '2.25rem', padding: '0.5rem 0.75rem 0.5rem 2.25rem', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box' }}
          />
        </div>

        {/* Action filter */}
        <select
          value={filterAction}
          onChange={e => setFilterAction(e.target.value)}
          style={{ padding: '0.5rem 0.75rem', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '0.875rem', color: filterAction ? '#0f172a' : '#94a3b8', background: 'white', cursor: 'pointer' }}
        >
          <option value="">All Actions</option>
          {ALL_ACTIONS.map(a => <option key={a} value={a}>{a}</option>)}
        </select>

        {/* Date From */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <label style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>From</label>
          <input
            type="date" value={filterFrom} onChange={e => setFilterFrom(e.target.value)}
            style={{ padding: '0.5rem', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '0.875rem' }}
          />
        </div>

        {/* Date To */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <label style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>To</label>
          <input
            type="date" value={filterTo} onChange={e => setFilterTo(e.target.value)}
            style={{ padding: '0.5rem', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '0.875rem' }}
          />
        </div>

        {hasFilters && (
          <button onClick={clearFilters} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', padding: '0.5rem 0.75rem', background: '#fee2e2', color: '#b91c1c', border: 'none', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}>
            <X size={14} /> Clear
          </button>
        )}
      </div>

      {/* Table */}
      <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                {['Timestamp', 'Action', 'User', 'Entity', 'IP Address'].map(h => (
                  <th key={h} style={{ padding: '0.875rem 1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>Loading...</td></tr>
              ) : logs.length === 0 ? (
                <tr><td colSpan={5} style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>No logs found{hasFilters ? ' — try clearing filters' : ''}</td></tr>
              ) : logs.map(log => {
                const ac = ACTION_COLORS[log.action] || { bg: '#f1f5f9', color: '#475569' };
                return (
                  <tr key={log.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    {/* Timestamp */}
                    <td style={{ padding: '0.875rem 1rem', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: '#64748b' }}>
                        <Clock size={13} />
                        {new Date(log.timestamp).toLocaleString()}
                      </div>
                    </td>

                    {/* Action badge */}
                    <td style={{ padding: '0.875rem 1rem' }}>
                      <span style={{ display: 'inline-block', padding: '0.25rem 0.6rem', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 700, background: ac.bg, color: ac.color, whiteSpace: 'nowrap' }}>
                        {log.action}
                      </span>
                    </td>

                    {/* User */}
                    <td style={{ padding: '0.875rem 1rem' }}>
                      {log.user_name ? (
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '0.85rem', color: '#0f172a' }}>{log.user_name}</div>
                          <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{log.user_email}</div>
                        </div>
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontFamily: 'monospace' }}>
                          {log.user_id ? log.user_id.split('-')[0] + '...' : 'SYSTEM'}
                        </span>
                      )}
                    </td>

                    {/* Entity */}
                    <td style={{ padding: '0.875rem 1rem' }}>
                      <div style={{ fontSize: '0.85rem', fontWeight: 500, color: '#374151' }}>{log.entity}</div>
                      {log.entity_id && (
                        <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontFamily: 'monospace' }}>
                          {log.entity_id.split('-')[0]}...
                        </div>
                      )}
                    </td>

                    {/* IP */}
                    <td style={{ padding: '0.875rem 1rem' }}>
                      <span style={{ fontSize: '0.8rem', fontFamily: 'monospace', color: '#64748b', background: '#f8fafc', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                        {log.ip_address || 'local'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div style={{ padding: '1rem 1.25rem', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.875rem', color: '#64748b' }}>
            Page {pagination.page} — {pagination.total} total logs
          </span>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              disabled={pagination.page <= 1}
              onClick={() => fetchLogs(pagination.page - 1)}
              style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.5rem 0.875rem', border: '1px solid #e2e8f0', borderRadius: '8px', background: 'white', cursor: pagination.page <= 1 ? 'not-allowed' : 'pointer', opacity: pagination.page <= 1 ? 0.4 : 1, fontSize: '0.875rem' }}
            >
              <ChevronLeft size={16} /> Prev
            </button>
            <button
              disabled={!pagination.hasMore}
              onClick={() => fetchLogs(pagination.page + 1)}
              style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.5rem 0.875rem', border: '1px solid #e2e8f0', borderRadius: '8px', background: 'white', cursor: !pagination.hasMore ? 'not-allowed' : 'pointer', opacity: !pagination.hasMore ? 0.4 : 1, fontSize: '0.875rem' }}
            >
              Next <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuditLogs;
