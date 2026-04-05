import React from 'react';
import { Bell, User, Search } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const Header: React.FC = () => {
  const { user } = useAuth();

  return (
    <header style={{ 
      height: '70px', 
      background: 'white', 
      borderBottom: '1px solid #e2e8f0', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'space-between',
      padding: '0 2rem',
      position: 'sticky',
      top: 0,
      zIndex: 10
    }}>
      <div style={{ position: 'relative', width: '300px' }}>
        <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
        <input 
          type="text" 
          placeholder="Search records..." 
          style={{ width: '100%', padding: '0.625rem 1rem 0.625rem 2.5rem', border: '1px solid #e2e8f0', borderRadius: '8px', background: '#f8fafc' }}
        />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
        <button style={{ color: '#64748b', background: 'none' }}><Bell size={22} /></button>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', paddingLeft: '1.5rem', borderLeft: '1px solid #e2e8f0' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{user?.name}</div>
            <div style={{ fontSize: '0.75rem', color: '#10b981', textTransform: 'capitalize' }}>{user?.role}</div>
          </div>
          <div style={{ width: '40px', height: '40px', background: '#f1f5f9', borderRadius: '50%', display: 'flex', alignItems: 'center', justifySelf: 'center', color: '#64748b' }}>
            <User size={24} style={{ margin: '0 auto' }} />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;