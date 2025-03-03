import { useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { customFetch } from "../utils/customFetch";

const AuditLogger = ({ accion, detalles }) => {
  const { user, token } = useAuth();
  useEffect(() => {
    if (!user) return; // Si no hay usuario, no se registra la auditoría
    token = localStorage.getItem("access_token");
    customFetch("http://127.0.0.1:8000/audit", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        usuario: user.sub, // Usamos el nombre de usuario del usuario autenticado
        accion,
        detalles
      })
    }).catch((err) =>
      console.error("Error al registrar auditoría:", err)
    );
  }, [user, accion, detalles]);

  return null;
};

export default AuditLogger;
