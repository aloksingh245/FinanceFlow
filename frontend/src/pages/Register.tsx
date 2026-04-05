import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';

const ROLES = [
  {
    value: 'viewer',
    label: 'Viewer',
    emoji: '👀',
    color: '#3b82f6',
    bg: '#eff6ff',
    border: '#93c5fd',
    badge: 'Read Only',
    badgeColor: '#1d4ed8',
    badgeBg: '#dbeafe',
    perks: ['View analytics dashboard', 'See financial summary', 'Monthly trend charts'],
  },
  {
    value: 'analyst',
    label: 'Analyst',
    emoji: '📊',
    color: '#10b981',
    bg: '#f0fdf4',
    border: '#6ee7b7',
    badge: 'Read + Analyse',
    badgeColor: '#065f46',
    badgeBg: '#d1fae5',
    perks: ['Everything in Viewer', 'Browse all records', 'Filter & export data'],
  },
  {
    value: 'admin',
    label: 'Admin',
    emoji: '👑',
    color: '#f59e0b',
    bg: '#fffbeb',
    border: '#fcd34d',
    badge: 'Full Access',
    badgeColor: '#92400e',
    badgeBg: '#fef3c7',
    perks: ['Everything in Analyst', 'Create & edit records', 'Manage users & roles'],
  },
];

const Register: React.FC = () => {
  const [name, setName]       = useState('');
  const [email, setEmail]     = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [role, setRole]       = useState('viewer');
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await axiosInstance.post('/auth/register', { name, email, password, role });
      navigate('/login');
    } catch (err: any) {
      const details = err.response?.data?.error?.details;
      setError(details?.[0]?.message || err.response?.data?.error?.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  const selectedRole = ROLES.find(r => r.value === role)!;

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #f0f9ff 0%, #fafafa 50%, #f0fdf4 100%)',
      padding: '2rem',
    }}>
      <div style={{ width: '100%', maxWidth: '480px' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: '56px', height: '56px',
            background: 'linear-gradient(135deg, #10b981, #3b82f6)',
            borderRadius: '16px',
            margin: '0 auto 1rem',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.5rem', boxShadow: '0 4px 14px rgba(16,185,129,0.3)',
          }}>💰</div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>Create your account</h2>
          <p style={{ color: '#64748b', marginTop: '0.4rem', fontSize: '0.95rem' }}>Join FinanceFlow and pick your role</p>
        </div>

        {/* Card */}
        <div style={{
          background: 'white',
          borderRadius: '20px',
          padding: '2rem',
          boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
          border: '1px solid #f1f5f9',
        }}>

          {error && (
            <div style={{
              padding: '0.875rem 1rem',
              background: '#fef2f2',
              color: '#b91c1c',
              borderRadius: '10px',
              marginBottom: '1.5rem',
              fontSize: '0.875rem',
              borderLeft: '4px solid #f87171',
            }}>⚠️ {error}</div>
          )}

          <form onSubmit={handleSubmit}>

            {/* Name */}
            <div style={{ marginBottom: '1.1rem' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#374151', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Full Name</label>
              <input
                type="text" className="input" value={name}
                onChange={e => setName(e.target.value)}
                required placeholder="Alok Kumar Singh"
                style={{ marginTop: '0.4rem' }}
              />
            </div>

            {/* Email */}
            <div style={{ marginBottom: '1.1rem' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#374151', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Email Address</label>
              <input
                type="email" className="input" value={email}
                onChange={e => setEmail(e.target.value)}
                required placeholder="alok@company.com"
                style={{ marginTop: '0.4rem' }}
              />
            </div>

            {/* Password */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#374151', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Password</label>
              <div style={{ position: 'relative', marginTop: '0.4rem' }}>
                <input
                  type={showPass ? 'text' : 'password'}
                  className="input" value={password}
                  onChange={e => setPassword(e.target.value)}
                  required placeholder="Min 12 chars • Aa1@"
                  style={{ paddingRight: '3rem' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  style={{
                    position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem', color: '#94a3b8',
                  }}
                >{showPass ? '🙈' : '👁️'}</button>
              </div>
              <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.4rem' }}>
                Must include uppercase, lowercase, number & special character
              </p>
            </div>

            {/* Role Cards */}
            <div style={{ marginBottom: '1.75rem' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#374151', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                Choose Your Role
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', marginTop: '0.6rem' }}>
                {ROLES.map(r => (
                  <div
                    key={r.value}
                    onClick={() => setRole(r.value)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '1rem',
                      padding: '0.875rem 1rem',
                      borderRadius: '12px',
                      border: `2px solid ${role === r.value ? r.color : '#e2e8f0'}`,
                      background: role === r.value ? r.bg : 'white',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      boxShadow: role === r.value ? `0 0 0 3px ${r.color}22` : 'none',
                    }}
                  >
                    {/* Emoji */}
                    <div style={{
                      width: '40px', height: '40px', borderRadius: '10px',
                      background: role === r.value ? r.color : '#f1f5f9',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '1.2rem', flexShrink: 0,
                      transition: 'all 0.15s ease',
                    }}>{r.emoji}</div>

                    {/* Info */}
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.95rem' }}>{r.label}</span>
                        <span style={{
                          fontSize: '0.65rem', fontWeight: 700, padding: '0.15rem 0.5rem',
                          borderRadius: '999px', background: r.badgeBg, color: r.badgeColor,
                          letterSpacing: '0.04em', textTransform: 'uppercase',
                        }}>{r.badge}</span>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.2rem' }}>
                        {r.perks.join(' • ')}
                      </div>
                    </div>

                    {/* Radio dot */}
                    <div style={{
                      width: '18px', height: '18px', borderRadius: '50%',
                      border: `2px solid ${role === r.value ? r.color : '#cbd5e1'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      {role === r.value && (
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: r.color }} />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '0.875rem',
                background: loading ? '#94a3b8' : `linear-gradient(135deg, ${selectedRole.color}, ${selectedRole.color}cc)`,
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                fontSize: '1rem',
                fontWeight: 700,
                cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: loading ? 'none' : `0 4px 14px ${selectedRole.color}44`,
                transition: 'all 0.2s ease',
                letterSpacing: '0.02em',
              }}
            >
              {loading ? '⏳ Creating account...' : `Create ${selectedRole.label} Account ${selectedRole.emoji}`}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.875rem', color: '#94a3b8' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: '#10b981', fontWeight: 700, textDecoration: 'none' }}>
              Sign in →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
