import React, { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext();

async function apiRequest(path, options = {}) {
  const response = await fetch(path, {
    ...options,
    headers: {
      "content-type": "application/json",
      ...(options.headers || {})
    }
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || "Nao foi possivel autenticar.");
  }
  return data;
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingPublicSettings] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [appPublicSettings] = useState({ public_settings: {} });

  const checkUserAuth = async () => {
    setIsLoadingAuth(true);
    setAuthError(null);
    try {
      const data = await apiRequest("/api/admin/me");
      setUser(data.user);
      setIsAuthenticated(Boolean(data.user));
    } catch {
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoadingAuth(false);
      setAuthChecked(true);
    }
  };

  useEffect(() => {
    checkUserAuth();
  }, []);

  const checkAppState = async () => {
    await checkUserAuth();
  };

  const login = async (email, password) => {
    const data = await apiRequest("/api/admin/login", {
      method: "POST",
      body: JSON.stringify({ email, password })
    });
    setUser(data.user);
    setIsAuthenticated(true);
    setAuthChecked(true);
    return data.user;
  };

  const setupMaster = async ({ full_name, email, password }) => {
    const data = await apiRequest("/api/admin/setup", {
      method: "POST",
      body: JSON.stringify({ full_name, email, password })
    });
    setUser(data.user);
    setIsAuthenticated(true);
    setAuthChecked(true);
    return data.user;
  };

  const logout = async () => {
    try {
      await apiRequest("/api/admin/logout", { method: "POST" });
    } catch {}
    setUser(null);
    setIsAuthenticated(false);
  };

  const navigateToLogin = () => {
    window.location.href = "/admin/login";
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      isLoadingAuth,
      isLoadingPublicSettings,
      authError,
      appPublicSettings,
      authChecked,
      login,
      setupMaster,
      logout,
      navigateToLogin,
      checkUserAuth,
      checkAppState
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
