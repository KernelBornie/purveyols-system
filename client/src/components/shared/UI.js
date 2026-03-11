import React from 'react';

const Card = ({ title, children, style = {} }) => (
  <div style={{
    background: '#fff',
    borderRadius: '8px',
    padding: '1.5rem',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    marginBottom: '1rem',
    ...style,
  }}>
    {title && <h3 style={{ margin: '0 0 1rem 0', color: '#333', borderBottom: '2px solid #f0f0f0', paddingBottom: '0.5rem' }}>{title}</h3>}
    {children}
  </div>
);

export const StatCard = ({ label, value, icon, color = '#1a237e' }) => (
  <div style={{
    background: '#fff',
    borderRadius: '8px',
    padding: '1.25rem',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    borderLeft: `4px solid ${color}`,
  }}>
    {icon && <span style={{ fontSize: '2rem' }}>{icon}</span>}
    <div>
      <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color }}>{value}</div>
      <div style={{ fontSize: '0.85rem', color: '#666' }}>{label}</div>
    </div>
  </div>
);

export const Badge = ({ status }) => {
  const colors = {
    pending: { bg: '#fff3e0', text: '#e65100' },
    approved: { bg: '#e8f5e9', text: '#2e7d32' },
    rejected: { bg: '#ffebee', text: '#c62828' },
    completed: { bg: '#e8f5e9', text: '#2e7d32' },
    failed: { bg: '#ffebee', text: '#c62828' },
    processing: { bg: '#e3f2fd', text: '#1565c0' },
    disbursed: { bg: '#ede7f6', text: '#4527a0' },
    ordered: { bg: '#e3f2fd', text: '#1565c0' },
    delivered: { bg: '#e8f5e9', text: '#2e7d32' },
    cancelled: { bg: '#fce4ec', text: '#880e4f' },
    open: { bg: '#fff3e0', text: '#e65100' },
    investigating: { bg: '#e3f2fd', text: '#1565c0' },
    closed: { bg: '#e8f5e9', text: '#2e7d32' },
  };
  const c = colors[status] || { bg: '#f5f5f5', text: '#666' };
  return (
    <span style={{ background: c.bg, color: c.text, padding: '2px 10px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: '600', textTransform: 'capitalize' }}>
      {status}
    </span>
  );
};

export const LoadingSpinner = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '3rem' }}>
    <div style={{ width: '40px', height: '40px', border: '4px solid #e0e0e0', borderTop: '4px solid #1a237e', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </div>
);

export const FormField = ({ label, error, children, required }) => (
  <div style={{ marginBottom: '1rem' }}>
    <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500', fontSize: '0.9rem', color: '#333' }}>
      {label}{required && <span style={{ color: '#c62828' }}> *</span>}
    </label>
    {children}
    {error && <span style={{ color: '#c62828', fontSize: '0.8rem' }}>{error}</span>}
  </div>
);

export const Input = ({ error, ...props }) => (
  <input
    style={{
      width: '100%',
      padding: '8px 12px',
      border: `1px solid ${error ? '#c62828' : '#ddd'}`,
      borderRadius: '6px',
      fontSize: '0.9rem',
      outline: 'none',
      boxSizing: 'border-box',
    }}
    {...props}
  />
);

export const Select = ({ error, children, ...props }) => (
  <select
    style={{
      width: '100%',
      padding: '8px 12px',
      border: `1px solid ${error ? '#c62828' : '#ddd'}`,
      borderRadius: '6px',
      fontSize: '0.9rem',
      outline: 'none',
      background: '#fff',
      boxSizing: 'border-box',
    }}
    {...props}
  >
    {children}
  </select>
);

export const Button = ({ variant = 'primary', children, ...props }) => {
  const styles = {
    primary: { background: '#1a237e', color: '#fff', border: 'none' },
    success: { background: '#2e7d32', color: '#fff', border: 'none' },
    danger: { background: '#c62828', color: '#fff', border: 'none' },
    secondary: { background: '#fff', color: '#333', border: '1px solid #ddd' },
    warning: { background: '#e65100', color: '#fff', border: 'none' },
  };
  const s = styles[variant] || styles.primary;
  return (
    <button
      style={{
        ...s,
        padding: '8px 18px',
        borderRadius: '6px',
        cursor: props.disabled ? 'not-allowed' : 'pointer',
        fontSize: '0.9rem',
        fontWeight: '500',
        opacity: props.disabled ? 0.6 : 1,
        transition: 'opacity 0.2s',
      }}
      {...props}
    >
      {children}
    </button>
  );
};

export const Alert = ({ type = 'info', children }) => {
  const colors = {
    info: { bg: '#e3f2fd', border: '#1565c0', text: '#1565c0' },
    success: { bg: '#e8f5e9', border: '#2e7d32', text: '#2e7d32' },
    error: { bg: '#ffebee', border: '#c62828', text: '#c62828' },
    warning: { bg: '#fff3e0', border: '#e65100', text: '#e65100' },
  };
  const c = colors[type] || colors.info;
  return (
    <div style={{ background: c.bg, border: `1px solid ${c.border}`, color: c.text, padding: '10px 14px', borderRadius: '6px', marginBottom: '1rem', fontSize: '0.9rem' }}>
      {children}
    </div>
  );
};

export default Card;
