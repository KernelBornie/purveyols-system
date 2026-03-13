import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { login } from "../api/auth";

const Login = () => {

  const navigate = useNavigate();
  const { setUser } = useContext(AuthContext);

  const [email,setEmail] = useState("");
  const [password,setPassword] = useState("");
  const [loading,setLoading] = useState(false);
  const [error,setError] = useState("");

  const handleSubmit = async (e) => {

    e.preventDefault();

    setLoading(true);
    setError("");

    try {

      const data = await login(email,password);

      console.log("LOGIN SUCCESS:", data);

      // Store only essential user fields to minimize local exposure
      const essentialUser = {
        _id: data.user._id,
        name: data.user.name,
        email: data.user.email,
        role: data.user.role,
      };

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(essentialUser));

      setUser(data.user);

      navigate("/dashboard");

    } catch(err) {

      console.error(err);

      setError(err.message);

    }

    setLoading(false);

  };

  return (

    <div className="login-wrapper">

      <div className="login-card">

        <h2>PURVEYOLS CMS</h2>

        <p className="subtitle">
          Construction Management System – Sign in to your account
        </p>

        {error && (
          <div className="alert alert-error">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>

          <div className="form-group">

            <label>Email Address</label>

            <input
              className="form-control"
              type="email"
              value={email}
              onChange={(e)=>setEmail(e.target.value)}
              required
            />

          </div>

          <div className="form-group">

            <label>Password</label>

            <input
              className="form-control"
              type="password"
              value={password}
              onChange={(e)=>setPassword(e.target.value)}
              required
            />

          </div>

          <button
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>

        </form>

      </div>

    </div>

  );

};

export default Login;