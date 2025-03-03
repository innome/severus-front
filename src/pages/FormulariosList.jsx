import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { customFetch } from "../utils/customFetch";

// Función para remover acentos / tildes
function normalizeString(str) {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

const FormsList = () => {
  const [items, setItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const limit = 10;
  const navigate = useNavigate();

  useEffect(() => {
    const fetchItems = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('access_token');
        const response = await customFetch('http://127.0.0.1:8000/informacion_tributaria_versionada/', {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          }
        });
        if (!response.ok) {
          throw new Error('Error al obtener la lista');
        }
        const data = await response.json();
        setItems(data);
        setFilteredItems(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchItems();
  }, []);

  // Filtrar localmente por municipio o versión
  useEffect(() => {
    if (search.trim() !== '') {
      const normalizedSearch = normalizeString(search.toLowerCase());
      const filtered = items.filter((item) => {
        const municipio = normalizeString(item.codigo_municipio.toLowerCase());
        const version = normalizeString(item.version.toLowerCase());
        return municipio.includes(normalizedSearch) || version.includes(normalizedSearch);
      });
      setFilteredItems(filtered);
      setPage(1);
    } else {
      setFilteredItems(items);
    }
  }, [search, items]);

  // Paginación
  const paginatedItems = filteredItems.slice((page - 1) * limit, page * limit);

  const handleRowClick = (codigo_municipio, version) => {
    // Redireccionar a la ruta de detalle: /form-detail/:municipioId/:version
    navigate(`/dashboard/formulario/${codigo_municipio}/${version}`);
  };

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Listado de Formularios</h2>

      <div className="mb-4 flex items-center">
        <input
          type="text"
          placeholder="Buscar por municipio o versión..."
          className="border p-2 rounded w-64"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="p-4">Cargando datos...</div>
      ) : error ? (
        <div className="p-4 text-red-500">Error: {error}</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Municipio</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Versión</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acción</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedItems.map((item, idx) => (
                <tr
                  key={idx}
                  className="hover:bg-gray-100 cursor-pointer"
                  onClick={() => handleRowClick(item.codigo_municipio, item.version)}
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.codigo_municipio}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.version}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-500 underline">
                    Ver/Editar
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredItems.length === 0 && (
            <div className="p-4">No se encontraron resultados</div>
          )}
        </div>
      )}

      {filteredItems.length > limit && (
        <div className="mt-4 flex justify-between items-center">
          <button
            className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
            onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
            disabled={page === 1}
          >
            Anterior
          </button>
          <span>Página {page}</span>
          <button
            className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
            onClick={() => setPage((prev) => prev + 1)}
            disabled={page * limit >= filteredItems.length}
          >
            Siguiente
          </button>
        </div>
      )}
    </div>
  );
};

export default FormsList;
