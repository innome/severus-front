import React, { useEffect, useState } from 'react';
import { customFetch } from "../utils/customFetch";

const MunicipioSelect = ({ value, onChange }) => {
  const [municipios, setMunicipios] = useState([]);
  const [filter, setFilter] = useState('');
  const [filteredMunicipios, setFilteredMunicipios] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    customFetch('http://localhost:8000/municipios', {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      }
    })
      .then(res => res.json())
      .then(data => {
        setMunicipios(data);
        setFilteredMunicipios(data);
      })
      .catch(err => console.error("Error al cargar municipios:", err));
  }, []);

  useEffect(() => {
    // Normalizamos para eliminar acentos y convertir a minúsculas
    const normalizedFilter = filter.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    const filtered = municipios.filter(municipio => {
      const normalizedName = municipio.nombre.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
      return normalizedName.includes(normalizedFilter);
    });
    setFilteredMunicipios(filtered);
  }, [filter, municipios]);

  return (
    <div>
      <input 
        type="text"
        placeholder="Filtrar por nombre"
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        className="border p-1 rounded w-full mb-2"
      />
      <select 
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="border p-1 rounded w-full"
      >
        <option value="">Selecciona un municipio</option>
        {filteredMunicipios.map(municipio => (
          <option key={municipio.codigo_municipio} value={municipio.codigo_municipio}>
            {municipio.nombre}
          </option>
        ))}
      </select>
    </div>
  );
};

export default MunicipioSelect;
