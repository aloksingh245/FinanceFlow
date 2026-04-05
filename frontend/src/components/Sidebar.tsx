import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Receipt, 
  Users, 
  ShieldCheck, 
  LogOut,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const Sidebar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const menuItems = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/', roles: ['viewer', 'analyst', 'admin'] },
    { name: 'Records', icon: Receipt, path: '/records', roles: ['analyst', 'admin'] },
    { name: 'User Management', icon: Users, path: '/users', roles: ['admin'] },
    { name: 'Audit Logs', icon: ShieldCheck, path: '/audit', roles: ['admin'] },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const filteredMenu = menuItems.filter(item => user && item.roles.includes(user.role));

  return (
    <div style={{ width: '260px', background: '#0f172a', color: 'white', height: '100vh', display: 'flex', flexDirection: 'column', position: 'fixed' }}>
      <div style={{ padding: '2rem', fontSize: '1.5rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <div style={{ width: '32px', height: '32px', background: '#10b981', borderRadius: '8px' }}></div>
        FinanceFlow
      </div>

      <nav style={{ flex: 1, padding: '1rem' }}>
        {filteredMenu.map(item => (
          <NavLink 
            key={item.path} 
            to={item.path}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.875rem 1rem',
              color: isActive ? 'white' : '#94a3b8',
              textDecoration: 'none',
              borderRadius: '8px',
              background: isActive ? '#1e293b' : 'transparent',
              marginBottom: '0.5rem',
              transition: 'all 0.2s'
            })}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <item.icon size={20} />
              {item.name}
            </div>
            <ChevronRight size={16} style={{ opacity: 0.5 }} />
          </NavLink>
        ))}
      </nav>

      <div style={{ padding: '1rem', borderTop: '1px solid #1e293b' }}>
        <button 
          onClick={handleLogout}
          style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.875rem 1rem', color: '#f43f5e', background: 'transparent', borderRadius: '8px' }}
        >
          <LogOut size={20} />
          Sign Out
        </button>
      </div>
    </div>
  );
};

export default Sidebar;