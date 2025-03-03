import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { customFetch } from "../utils/customFetch";

function normalizeString(str) {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

const MunicipiosTable = () => {
  const [allMunicipios, setAllMunicipios] = useState([]);
  const [filteredMunicipios, setFilteredMunicipios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const limit = 10; // Número de registros por página
  const navigate = useNavigate();

  // Se obtiene la lista completa de municipios de una sola vez
  useEffect(() => {
    const fetchMunicipios = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('access_token');
        const response = await customFetch('http://localhost:8000/municipios', {
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          }
        });
        if (!response.ok) {
          throw new Error('Error al obtener municipios');
        }
        const data = await response.json();
        setAllMunicipios(data);
        setFilteredMunicipios(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchMunicipios();
  }, []);

  // Se filtra localmente cada vez que cambie el término de búsqueda o la lista completa
  useEffect(() => {
    if (search.trim() !== '') {
      const normalizedSearch = normalizeString(search.toLowerCase());
      const filtered = allMunicipios.filter(muni => 
        normalizeString(muni.nombre.toLowerCase()).includes(normalizedSearch) ||
        normalizeString(muni.codigo_municipio.toLowerCase()).includes(normalizedSearch)
      );
      setFilteredMunicipios(filtered);
      setPage(1);
    } else {
      setFilteredMunicipios(allMunicipios);
    }
  }, [search, allMunicipios]);

  // Se aplica la paginación sobre los resultados filtrados
  const paginatedMunicipios = filteredMunicipios.slice((page - 1) * limit, page * limit);

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Listado de Municipios</h2>
      
      <div className="mb-4 flex justify-between items-center">
        <input 
          type="text"
          placeholder="Buscar municipio..."
          className="border p-2 rounded w-64"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      
      {loading ? (
        <div className="p-4">Cargando municipios...</div>
      ) : error ? (
        <div className="p-4 text-red-500">Error: {error}</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Código Municipio
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Nombre
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedMunicipios.map((muni, index) => (
                <tr 
                  key={index}
                  className="hover:bg-gray-100 cursor-pointer"
                  onClick={() => navigate(`/dashboard/formulario/${muni.codigo_municipio}`)}
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {muni.codigo_municipio}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {muni.nombre}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredMunicipios.length === 0 && <div className="p-4">No se encontraron resultados</div>}
        </div>
      )}

      {/* Controles de paginación */}
      {filteredMunicipios.length > 0 && (
        <div className="mt-4 flex justify-between items-center">
          <button 
            className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
            onClick={() => setPage(prev => Math.max(prev - 1, 1))}
            disabled={page === 1}
          >
            Anterior
          </button>
          <span>Página {page}</span>
          <button 
            className="px-4 py-2 bg-blue-500 text-white rounded"
            onClick={() => setPage(prev => prev + 1)}
            disabled={page * limit >= filteredMunicipios.length}
          >
            Siguiente
          </button>
        </div>
      )}
    </div>
  );
};

export default MunicipiosTable;
