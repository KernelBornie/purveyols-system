import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);

  return (
    <div className="navbar">
      <div className="navbar-brand">
        PURVEYOLS <span>CMS</span>
      </div>
      <div className="navbar-right">
        {user && (
          <div className="navbar-user">
            Welcome, <strong>{user.name}</strong>
            <span className="badge badge-active" style={{ marginLeft: 8 }}>
              {user.role}
            </span>
          </div>
        )}
        <button className="btn btn-secondary btn-sm" onClick={logout}>
          Logout
        </button>
      </div>
    </div>
  );
};

export default Navbar;
