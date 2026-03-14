import { useContext } from 'react';
import { NavLink } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const navItems = [
  { to: '/dashboard', label: '🏠 Dashboard', roles: ['director', 'engineer', 'foreman', 'procurement', 'driver', 'accountant', 'worker', 'safety', 'admin'] },
  { to: '/projects', label: '🏗️ Projects', roles: ['director', 'engineer', 'foreman'] },
  { to: '/workers', label: '👷 Workers', roles: ['director', 'engineer', 'foreman', 'accountant'] },
  { to: '/logbooks', label: '📋 Logbooks', roles: ['director', 'accountant', 'driver'] },
  { to: '/funding-requests', label: '💰 Funding Requests', roles: ['director', 'engineer', 'accountant', 'foreman', 'driver', 'procurement'] },
  { to: '/procurement', label: '🛒 Materials / Procurement', roles: ['director', 'procurement', 'engineer', 'foreman', 'driver', 'safety'] },
  { to: '/boq', label: '📋 Bills of Quantities', roles: ['director', 'engineer', 'admin'] },
  { to: '/subcontracts', label: '🏗️ Subcontracts', roles: ['director', 'engineer', 'admin'] },
  { to: '/payments', label: '💳 Payments', roles: ['director', 'accountant'] },
  { to: '/safety', label: '⚠️ Safety Reports', roles: ['director', 'safety', 'engineer'] },
  { to: '/reports', label: '📊 Reports', roles: ['director', 'accountant', 'engineer'] },
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
