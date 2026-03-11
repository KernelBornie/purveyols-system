import { useContext } from 'react';
import { NavLink } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const navItems = [
  { to: '/dashboard', label: '🏠 Dashboard', roles: ['director', 'engineer', 'foreman', 'procurement', 'driver', 'accountant', 'worker'] },
  { to: '/projects', label: '🏗️ Projects', roles: ['director', 'engineer', 'foreman'] },
  { to: '/workers', label: '👷 Workers', roles: ['director', 'engineer', 'foreman'] },
  { to: '/logbooks', label: '📋 Logbooks', roles: ['director', 'engineer', 'foreman', 'driver'] },
  { to: '/funding-requests', label: '💰 Funding Requests', roles: ['director', 'engineer', 'accountant'] },
  { to: '/procurement', label: '🛒 Procurement', roles: ['director', 'procurement', 'engineer'] },
  { to: '/payments', label: '💳 Payments', roles: ['director', 'accountant'] },
];

const Sidebar = () => {
  const { user } = useContext(AuthContext);

  if (!user) return null;

  const visibleItems = navItems.filter(item => item.roles.includes(user.role));

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        PURVEYOLS <span>CMS</span>
      </div>
      <nav className="sidebar-nav">
        {visibleItems.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => isActive ? 'active' : ''}
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="sidebar-footer">
        <div>{user.name}</div>
        <span className="role-badge">{user.role}</span>
      </div>
    </div>
  );
};

export default Sidebar;
