// src/pages/AuditLogs.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { customFetch } from "../utils/customFetch";

const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  // Estados para filtrar por distintos campos
  const [filterUsuario, setFilterUsuario] = useState("");
  const [filterAccion, setFilterAccion] = useState("");
  const [filterDetalles, setFilterDetalles] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    // Se usa customFetch para incluir el Bearer automáticamente.
    customFetch("http://127.0.0.1:8000/audit")
      .then((res) => res.json())
      .then((data) => {
        setLogs(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError("Error al cargar los logs");
        setLoading(false);
      });
  }, []);

  // Filtrar logs cada vez que cambien alguno de los filtros o los logs
  useEffect(() => {
    const filtered = logs.filter((log) => {
      return (
        log.usuario.toLowerCase().includes(filterUsuario.toLowerCase()) &&
        log.accion.toLowerCase().includes(filterAccion.toLowerCase()) &&
        log.detalles.toLowerCase().includes(filterDetalles.toLowerCase())
      );
    });
    setFilteredLogs(filtered);
  }, [logs, filterUsuario, filterAccion, filterDetalles]);

  if (loading) return <div className="p-4">Cargando logs...</div>;
  if (error) return <div className="p-4 text-red-500">{error}</div>;

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Logs de Auditoría</h1>
      {/* Filtros: se pueden usar varios inputs para refinar la búsqueda */}
      <div className="mb-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        <input
          type="text"
          placeholder="Filtrar por usuario"
          value={filterUsuario}
          onChange={(e) => setFilterUsuario(e.target.value)}
          className="border p-2 rounded"
        />
        <input
          type="text"
          placeholder="Filtrar por acción"
          value={filterAccion}
          onChange={(e) => setFilterAccion(e.target.value)}
          className="border p-2 rounded"
        />
        <input
          type="text"
          placeholder="Filtrar por detalles"
          value={filterDetalles}
          onChange={(e) => setFilterDetalles(e.target.value)}
          className="border p-2 rounded"
        />
      </div>
      <table className="min-w-full border">
        <thead className="bg-gray-200">
          <tr>
            <th className="border px-4 py-2">ID</th>
            <th className="border px-4 py-2">Usuario</th>
            <th className="border px-4 py-2">Acción</th>
            <th className="border px-4 py-2">Detalles</th>
            <th className="border px-4 py-2">Fecha/Hora</th>
          </tr>
        </thead>
        <tbody>
          {filteredLogs.map((log) => (
            <tr key={log.id}>
              <td className="border px-4 py-2 text-sm">{log.id}</td>
              <td className="border px-4 py-2 text-sm">{log.usuario}</td>
              <td className="border px-4 py-2 text-sm">{log.accion}</td>
              <td className="border px-4 py-2 text-sm">{log.detalles}</td>
              <td className="border px-4 py-2 text-sm">
                {new Date(log.fecha_hora).toLocaleString("es-ES")}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <button 
        className="mt-4 bg-blue-500 text-white px-4 py-2 rounded"
        onClick={() => navigate(-1)}
      >
        Volver
      </button>
    </div>
  );
};

export default AuditLogs;
