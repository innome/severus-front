import React, { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext();

// Función para decodificar un JWT sin librerías adicionales
function decodeToken(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      window
        .atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error("Error al decodificar el token:", error);
    return null;
  }
}

export const AuthProvider = ({ children }) => {
  // Inicializa el token desde localStorage (si existe)
  const [token, setToken] = useState(() => localStorage.getItem("access_token") || null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    if (token) {
      localStorage.setItem("access_token", token);
      const decoded = decodeToken(token);
      setUser(decoded);
    } else {
      localStorage.removeItem("access_token");
      setUser(null);
    }
  }, [token]);

  return (
    <AuthContext.Provider value={{ token, setToken, user }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
