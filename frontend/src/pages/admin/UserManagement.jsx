import { useState, useEffect, useContext } from "react";
import { AuthContext } from "../../context/AuthContext";
import { listUsers, createUser, deleteUser } from "../../api/users";

const ROLES = ["worker", "engineer", "foreman", "procurement", "driver", "accountant", "safety", "admin", "director"];

const UserManagement = () => {
  const { user: currentUser } = useContext(AuthContext);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: "", email: "", password: "", role: "worker" });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await listUsers();
      setUsers(data);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to load users");
    }
    setLoading(false);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setFormError("");
    setFormLoading(true);
    try {
      const newUser = await createUser(formData);
      setUsers((prev) => [...prev, newUser]);
      setSuccess("User created successfully.");
      setShowForm(false);
      setFormData({ name: "", email: "", password: "", role: "worker" });
    } catch (err) {
      setFormError(err.response?.data?.message || err.message || "Failed to create user");
    }
    setFormLoading(false);
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Deactivate user "${name}"? They will no longer be able to log in.`)) return;
    setSuccess("");
    setError("");
    try {
      await deleteUser(id);
      setUsers((prev) =>
        prev.map((u) => (u._id === id ? { ...u, isActive: false, deletedAt: new Date().toISOString() } : u))
      );
      setSuccess(`User "${name}" has been deactivated.`);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to deactivate user");
    }
  };

  return (
    <div className="page-container">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h2>User Management</h2>
        <button className="btn btn-primary" onClick={() => { setShowForm((v) => !v); setFormError(""); }}>
          {showForm ? "Cancel" : "+ Create User"}
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {showForm && (
        <div className="card" style={{ marginBottom: 24, maxWidth: 520 }}>
          <h3 style={{ marginBottom: 16 }}>New User</h3>
          {formError && <div className="alert alert-error">{formError}</div>}
          <form onSubmit={handleCreate}>
            <div className="form-group">
              <label>Full Name</label>
              <input
                className="form-control"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input
                className="form-control"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input
                className="form-control"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                minLength={6}
              />
            </div>
            <div className="form-group">
              <label>Role</label>
              <select
                className="form-control"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
                ))}
              </select>
            </div>
            <button className="btn btn-primary" disabled={formLoading}>
              {formLoading ? "Creating..." : "Create User"}
            </button>
          </form>
        </div>
      )}

      {loading ? (
        <p>Loading users...</p>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u._id} style={{ opacity: u.isActive ? 1 : 0.5 }}>
                  <td>{u.name}</td>
                  <td>{u.email}</td>
                  <td><span className="role-badge">{u.role}</span></td>
                  <td>
                    <span className={`status-badge ${u.isActive ? "status-active" : "status-inactive"}`}>
                      {u.isActive ? "Active" : "Deactivated"}
                    </span>
                  </td>
                  <td>
                    {u.isActive && u._id !== currentUser?._id && (
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDelete(u._id, u.name)}
                      >
                        Deactivate
                      </button>
                    )}
                    {u._id === currentUser?._id && (
                      <span style={{ color: "#888", fontSize: 13 }}>You</span>
                    )}
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ textAlign: "center", color: "#888" }}>No users found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
