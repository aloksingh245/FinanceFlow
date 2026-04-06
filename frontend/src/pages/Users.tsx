import React, { useEffect, useState, useCallback } from 'react';
1import { User, Trash2, Shield, UserMinus, UserCheck, Search, X, RefreshCw } from 'lucide-react';
import axiosInstance from '../api/axiosInstance';

const ROLE_COLORS: Record<string, { bg: string; color: string }> = {
  admin:   { bg: '#ede9fe', color: '#6d28d9' },
  analyst: { bg: '#dbeafe', color: '#1d4ed8' },
  viewer:  { bg: '#f1f5f9', color: '#475569' },
};

const Users: React.FC = () => {
  const [users,      setUsers]      = useState<any[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState('');
  const [search,     setSearch]     = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, hasMore: false });

  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Debounce search input
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  const fetchUsers = useCallback(async (pg: number) => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ page: String(pg), limit: '20' });
      if (debouncedSearch) params.set('search', debouncedSearch);
      const res = await axiosInstance.get(`/users?${params}`);
      setUsers(res.data.data ?? []);
      setPagination(res.data.pagination);
    } catch (err: any) {
      setError(err?.response?.data?.error?.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch]);

  const [page, setPage] = useState(1);

  useEffect(() => { setPage(1); }, [debouncedSearch]);
  useEffect(() => { fetchUsers(page); }, [fetchUsers, page]);

  const toggleStatus = async (userId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    try {
      await axiosInstance.patch(`/users/${userId}/status`, { status: newStatus });
      fetchUsers(pagination.page);
    } catch {
      alert('Failed to update user status');
    }
  };

  const handleDelete = async (userId: string) => {
    if (!window.confirm('Delete this user? This action soft-deletes them — they cannot log in but their records remain.')) return;
    try {
      await axiosInstance.delete(`/users/${userId}`);
      fetchUsers(pagination.page);
    } catch (err: any) {
      alert(err?.response?.data?.error?.message || 'Failed to delete user');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 700, margin: 0 }}>User Management</h1>
          <p style={{ color: '#64748b', marginTop: '0.25rem', fontSize: '0.875rem' }}>
            {pagination.total} users total
          </p>
        </div>
      </div>

      <div className="card" style={{ padding: 0 }}>
        {/* Toolbar */}
        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #f1f5f9', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1, maxWidth: '320px' }}>
            <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input
              type="text"
              placeholder="Search by name or email…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="input"
              style={{ margin: 0, paddingLeft: '2.25rem', paddingRight: search ? '2rem' : undefined }}
            />
            {search && (
              <button onClick={() => setSearch('')} style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '2px' }}>
                <X size={14} />
              </button>
            )}
          </div>
          <button onClick={() => fetchUsers(page)} style={{ padding: '0.4rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', cursor: 'pointer', color: '#64748b', marginLeft: 'auto' }} title="Refresh">
            <RefreshCw size={16} />
          </button>
        </div>

        {/* Error */}
        {error && (
          <div style={{ padding: '0.75rem 1.25rem', background: '#fef2f2', color: '#b91c1c', fontSize: '0.875rem', borderBottom: '1px solid #fecaca' }}>
            ⚠️ {error}
          </div>
        )}

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>User</th>
                <th>Role</th>
                <th>Status</th>
                <th>Joined</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {[1,2,3,4,5].map(j => (
                      <td key={j}><div style={{ height: '16px', background: '#f1f5f9', borderRadius: '4px', width: j === 1 ? '60%' : '45%', animation: 'pulse 1.5s infinite' }} /></td>
                    ))}
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
                    <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🔍</div>
                    <div style={{ fontWeight: 600 }}>{search ? `No users matching "${search}"` : 'No users found'}</div>
                  </td>
                </tr>
              ) : (
                users.map(u => (
                  <tr key={u.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{
                          width: '36px', height: '36px', borderRadius: '50%', flexShrink: 0,
                          background: ROLE_COLORS[u.role]?.bg ?? '#f1f5f9',
                          color: ROLE_COLORS[u.role]?.color ?? '#64748b',
                          display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                          <User size={16} />
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{u.name}</div>
                          <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                        padding: '0.2rem 0.6rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 600,
                        background: ROLE_COLORS[u.role]?.bg ?? '#f1f5f9',
                        color: ROLE_COLORS[u.role]?.color ?? '#64748b',
                      }}>
                        <Shield size={11} />
                        {u.role}
                      </span>
                    </td>
                    <td>
                      <span style={{
                        padding: '0.2rem 0.6rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 600,
                        background: u.status === 'active' ? '#d1fae5' : '#fee2e2',
                        color: u.status === 'active' ? '#065f46' : '#991b1b',
                      }}>
                        {u.status}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.875rem', color: '#64748b', whiteSpace: 'nowrap' }}>
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.25rem' }}>
                        <button
                          onClick={() => toggleStatus(u.id, u.status)}
                          title={u.status === 'active' ? 'Deactivate' : 'Activate'}
                          style={{ padding: '0.4rem', background: 'none', border: 'none', cursor: 'pointer', borderRadius: '6px', color: u.status === 'active' ? '#f43f5e' : '#10b981' }}
                        >
                          {u.status === 'active' ? <UserMinus size={16} /> : <UserCheck size={16} />}
                        </button>
                        <button
                          onClick={() => handleDelete(u.id)}
                          title="Delete user"
                          style={{ padding: '0.4rem', background: 'none', border: 'none', cursor: 'pointer', borderRadius: '6px', color: '#94a3b8' }}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div style={{ padding: '1rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f1f5f9' }}>
          <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
            {loading ? '…' : `Showing ${users.length === 0 ? 0 : (pagination.page - 1) * pagination.limit + 1}–${Math.min(pagination.page * pagination.limit, pagination.total)} of ${pagination.total}`}
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <button className="btn" disabled={pagination.page <= 1 || loading} onClick={() => fetchUsers(pagination.page - 1)}
              style={{ border: '1px solid #e2e8f0', opacity: pagination.page <= 1 ? 0.4 : 1 }}>← Prev</button>
            <span style={{ fontSize: '0.8rem', color: '#64748b', padding: '0 0.25rem' }}>
              Page {pagination.page} of {Math.max(1, Math.ceil(pagination.total / pagination.limit))}
            </span>
            <button className="btn" disabled={!pagination.hasMore || loading} onClick={() => fetchUsers(pagination.page + 1)}
              style={{ border: '1px solid #e2e8f0', opacity: !pagination.hasMore ? 0.4 : 1 }}>Next →</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Users;
