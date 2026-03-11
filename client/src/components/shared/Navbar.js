import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const roleLabels = {
  director: 'Director',
  accountant: 'Accountant',
  engineer: 'Engineer',
  foreman: 'Foreman',
  driver: 'Driver',
  procurement: 'Procurement Officer',
  safety: 'Safety Officer',
};

const roleColor = {
  director: '#1a237e',
  accountant: '#1b5e20',
  engineer: '#e65100',
  foreman: '#4a148c',
  driver: '#006064',
  procurement: '#880e4f',
  safety: '#b71c1c',
};

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) return null;
  const bgColor = roleColor[user.role] || '#333';

  return (
    <nav style={{ background: bgColor, color: '#fff', padding: '0.75rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 2px 8px rgba(0,0,0,0.3)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <Link to="/dashboard" style={{ color: '#fff', textDecoration: 'none', fontWeight: 'bold', fontSize: '1.2rem' }}>
          🏗️ PURVEYOLS
        </Link>
        <span style={{ opacity: 0.8, fontSize: '0.85rem', background: 'rgba(255,255,255,0.2)', padding: '2px 10px', borderRadius: '12px' }}>
          {roleLabels[user.role]}
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <span style={{ fontSize: '0.9rem' }}>👤 {user.name}</span>
        <button
          onClick={handleLogout}
          style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', border: '1px solid rgba(255,255,255,0.4)', padding: '6px 14px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem' }}
        >
          Logout
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
