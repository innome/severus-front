// src/utils/customFetch.js
export const customFetch = async (url, options = {}) => {
    // Se agrega el token Bearer (si existe) a las cabeceras
    const token = localStorage.getItem("access_token");
    const headers = {
      "Content-Type": "application/json",
      ...options.headers,
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  
    const response = await fetch(url, { ...options, headers });
  
    if (response.status === 401) {
      // Redirige al login cuando se recibe 401
      window.location.href = "/login";
      throw new Error("Unauthorized");
    }
  
    return response;
  };
  