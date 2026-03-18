import { createContext, useState, useEffect, useCallback } from "react";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(() => {
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("user");
    setUser(null);
  }, []);

  useEffect(() => {

    const token = sessionStorage.getItem("token");
    const storedUser = sessionStorage.getItem("user");

    if (token && storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        // invalid stored user, clear
      }

      // Verify token with server
      fetch("/api/auth/me", {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.user) {
            setUser(data.user);
            sessionStorage.setItem("user", JSON.stringify(data.user));
          } else {
            logout();
          }
        })
        .catch(() => {
          // network error - keep stored user (offline support)
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }

  }, [logout]);

  return (
    <AuthContext.Provider value={{ user, setUser, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );

};