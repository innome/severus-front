import React, { useEffect, useState } from 'react';
import { useParams, useNavigate  } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { customFetch } from "../utils/customFetch";

/**
 * Para manejar arrays de tipo [ {"0":"9 enero 2025"}, ... ]
 * convertimos a [ {key:"0", value:"9 enero 2025"}, ... ] durante la edición,
 * y lo revertimos al guardar o al modificar.
 */
function parseDictArray(dictArray) {
  if (!Array.isArray(dictArray)) return [];
  return dictArray.map(obj => {
    const [k, v] = Object.entries(obj)[0];
    return { key: k, value: v };
  });
}
function buildDictArray(parsedArray) {
  if (!Array.isArray(parsedArray)) return [];
  return parsedArray.map(item => ({ [item.key]: item.value }));
}

/**
 * Componente principal: FormDetail
 */
const FormDetail = () => {
  const navigate = useNavigate();
  // Tomamos municipioId y versionId desde la URL
  const { municipioId, versionId } = useParams();

  // Data original recibida del backend
  const [data, setData] = useState(null);
  // Data que editamos en modo edición
  const [editData, setEditData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  // Flag para indicar si estamos en modo edición
  const [isEditing, setIsEditing] = useState(false);

  // Cargar el documento al montar
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('access_token');
        const res = await customFetch(
          `http://127.0.0.1:8000/informacion_tributaria_versionada/${municipioId}/${versionId}`,
          {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`
            }
          }
        );
        if (!res.ok) {
          throw new Error('Error al obtener el documento');
        }
        const json = await res.json();
        setData(json);
        setEditData(json);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [municipioId, versionId]);

  /**
   * 1) handleChange: para campos simples (string, bool, etc.)
   */
  const handleChange = (field, value) => {
    setEditData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  /**
   * 2) handleArrayChange: para arrays de artículos
   * ej: estatuto_tributario, ica, autoretencion_ica, rete_ica
   */
  const handleArrayChange = (arrayField, idx, subfield, value) => {
    setEditData(prev => {
      const updated = { ...prev };
      if (Array.isArray(updated[arrayField])) {
        updated[arrayField] = updated[arrayField].map((item, i) => {
          if (i === idx) {
            return { ...item, [subfield]: value };
          }
          return item;
        });
      }
      return updated;
    });
  };

  /**
   * 3) handleDictArrayChange: para arrays tipo [ {"0":"xxx"}, {"1":"yyy"} ]
   *    Convertimos a [ {key:"0", value:"xxx"}, ... ] y modificamos
   */
  const handleDictArrayChange = (arrayField, idx, subfield, newVal) => {
    setEditData(prev => {
      const updated = { ...prev };
      const parsed = parseDictArray(updated[arrayField] || []);
      parsed[idx][subfield] = newVal;
      updated[arrayField] = buildDictArray(parsed);
      return updated;
    });
  };

  /**
   * 4) handleObjectArrayChange: para arrays de objetos con múltiples campos
   * ej: periodicidad_impuestos, informacion_exogena_municipal_medios_magneticos
   */
  const handleObjectArrayChange = (arrayField, idx, field, value) => {
    setEditData(prev => {
      const updated = { ...prev };
      if (Array.isArray(updated[arrayField])) {
        updated[arrayField] = updated[arrayField].map((obj, i) => {
          if (i === idx) {
            return { ...obj, [field]: value };
          }
          return obj;
        });
      }
      return updated;
    });
  };

  /**
   * 5) Funciones para "Agregar" elementos a arrays
   */
  const handleAddArticle = (arrayField) => {
    // Un artículo nuevo
    const newArticle = { titulo: "", contenido: "" };
    setEditData(prev => {
      const updated = { ...prev };
      if (!Array.isArray(updated[arrayField])) {
        updated[arrayField] = [];
      }
      updated[arrayField] = [...updated[arrayField], newArticle];
      return updated;
    });
  };
  const handleAddDictItem = (arrayField) => {
    // {key:"", value:""}
    setEditData(prev => {
      const updated = { ...prev };
      const parsed = parseDictArray(updated[arrayField] || []);
      parsed.push({ key: "", value: "" });
      updated[arrayField] = buildDictArray(parsed);
      return updated;
    });
  };
  const handleAddObjectItem = (arrayField, defaultObj) => {
    setEditData(prev => {
      const updated = { ...prev };
      if (!Array.isArray(updated[arrayField])) {
        updated[arrayField] = [];
      }
      updated[arrayField] = [...updated[arrayField], defaultObj];
      return updated;
    });
  };

  /**
   * 6) Funciones para "Eliminar" elementos de arrays
   */
  const handleRemoveArticle = (arrayField, index) => {
    setEditData(prev => {
      const updated = { ...prev };
      if (Array.isArray(updated[arrayField])) {
        updated[arrayField] = updated[arrayField].filter((_, i) => i !== index);
      }
      return updated;
    });
  };
  const handleRemoveDictItem = (arrayField, index) => {
    setEditData(prev => {
      const updated = { ...prev };
      const parsed = parseDictArray(updated[arrayField] || []);
      parsed.splice(index, 1);
      updated[arrayField] = buildDictArray(parsed);
      return updated;
    });
  };
  const handleRemoveObjectItem = (arrayField, index) => {
    setEditData(prev => {
      const updated = { ...prev };
      if (Array.isArray(updated[arrayField])) {
        updated[arrayField] = updated[arrayField].filter((_, i) => i !== index);
      }
      return updated;
    });
  };

  /**
   * 7) Guardar cambios (PUT)
   */
  const handleSave = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const res = await customFetch(
        `http://127.0.0.1:8000/informacion_tributaria_versionada/${municipioId}/${versionId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(editData)
        }
      );
      if (!res.ok) {
        throw new Error('Error al actualizar');
      }
      const updatedDoc = await res.json();
      setData(updatedDoc);
      setEditData(updatedDoc);
      setIsEditing(false);
      // Mostrar notificación exitosa
      toast.success('Formulario actualizado exitosamente!');
      // Redireccionar después de unos segundos
      setTimeout(() => {
        navigate('/dashboard/formularios');
      }, 2000);
    } catch (err) {
      setError(err.message);
      toast.error('Hubo un error al actualizar el formulario.');
    }
  };

  /**
   * 8) Toggle inmediato del campo 'activo'
   *    Este botón estará flotante arriba a la derecha.
   */
  const handleToggleActivo = async () => {
    if (!data) return;
    try {
      const newValue = !data.activo;
      // Hacemos un PUT inmediato
      const token = localStorage.getItem('access_token');
      const updatedBody = { ...data, activo: newValue };
      const res = await customFetch(
        `http://127.0.0.1:8000/informacion_tributaria_versionada/${municipioId}/${versionId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(updatedBody)
        }
      );
      if (!res.ok) {
        throw new Error('Error al actualizar el campo activo');
      }
      const updatedDoc = await res.json();
      setData(updatedDoc);
      setEditData(updatedDoc);
    } catch (err) {
      setError(err.message);
    }
  };

  // Render
  if (loading) return <div className="p-4">Cargando...</div>;
  if (error) return <div className="p-4 text-red-500">{error}</div>;
  if (!data) return <div className="p-4">Sin datos</div>;

  // Para facilitar el renderizado en modo edición, usamos editData cuando isEditing es true
  const currentData = isEditing ? editData : data;

  return (
    <div className="p-4 relative">
      {/** BOTÓN FLOTANTE para activo/inactivo en la parte superior derecha */}
      <div className="absolute top-4 right-4 flex flex-col gap-2">
        <button
          onClick={handleToggleActivo}
          className="bg-purple-500 text-white px-4 py-2 rounded shadow"
        >
          {data.activo ? 'Deshabilitar' : 'Habilitar'}
        </button>
      </div>

      <h2 className="text-2xl font-bold mb-4">
        Detalle Formulario (Municipio: {data.codigo_municipio}, Versión: {data.version})
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/**
         * SECCIÓN: Información General
         */}
        <section className="border rounded p-4">
          <h3 className="text-xl font-semibold mb-2">Información General</h3>
          <div className="mb-2">
            <label className="block font-medium">ID:</label>
            <p>{data.id}</p>
          </div>
          <div className="mb-2">
            <label className="block font-medium">Municipio:</label>
            <p>{data.codigo_municipio}</p>
          </div>
          <div className="mb-2">
            <label className="block font-medium">Versión:</label>
            <p>{data.version}</p>
          </div>
          <div className="mb-2">
            <label className="block font-medium">URL PDF:</label>
            {isEditing ? (
              <input
                type="text"
                className="border p-1 rounded w-full"
                value={editData.url_pdf || ''}
                onChange={(e) => handleChange('url_pdf', e.target.value)}
              />
            ) : (
              <p>{data.url_pdf}</p>
            )}
          </div>
          <div className="mb-2">
            <label className="block font-medium">Calendario Tributario:</label>
            {isEditing ? (
              <textarea
                className="border p-1 rounded w-full"
                value={editData.calendario_tributario || ''}
                onChange={(e) => handleChange('calendario_tributario', e.target.value)}
              />
            ) : (
              <p>{data.calendario_tributario}</p>
            )}
          </div>
        </section>

        {/**
         * SECCIÓN: Impuesto Industria y Comercio + Periodicidad
         */}
        <section className="border rounded p-4">
          <h3 className="text-xl font-semibold mb-2">Impuesto Industria y Comercio</h3>
          <div className="mb-2">
            {isEditing ? (
              <textarea
                className="border p-1 rounded w-full"
                value={editData.impuesto_industria_comercio || ''}
                onChange={(e) => handleChange('impuesto_industria_comercio', e.target.value)}
              />
            ) : (
              <p>{data.impuesto_industria_comercio}</p>
            )}
          </div>
          <h4 className="font-bold mt-4">Periodicidad de Impuestos</h4>
          {Array.isArray(currentData.periodicidad_impuestos) &&
            currentData.periodicidad_impuestos.map((obj, idx) => (
              <div key={idx} className="mb-2 border p-2 rounded">
                <label className="block font-medium">Tipo:</label>
                {isEditing ? (
                  <input
                    type="text"
                    className="border p-1 rounded w-full mb-1"
                    value={editData.periodicidad_impuestos[idx].tipo}
                    onChange={(e) =>
                      handleObjectArrayChange('periodicidad_impuestos', idx, 'tipo', e.target.value)
                    }
                  />
                ) : (
                  <p>{obj.tipo}</p>
                )}
                <label className="block font-medium">Periodo:</label>
                {isEditing ? (
                  <input
                    type="text"
                    className="border p-1 rounded w-full"
                    value={editData.periodicidad_impuestos[idx].periodo}
                    onChange={(e) =>
                      handleObjectArrayChange('periodicidad_impuestos', idx, 'periodo', e.target.value)
                    }
                  />
                ) : (
                  <p>{obj.periodo}</p>
                )}
                {isEditing && (
                  <button
                    onClick={() => handleRemoveObjectItem('periodicidad_impuestos', idx)}
                    className="bg-red-500 text-white px-2 py-1 mt-2 rounded"
                  >
                    Eliminar
                  </button>
                )}
              </div>
            ))}
          {isEditing && (
            <button
              onClick={() => handleAddObjectItem('periodicidad_impuestos', { tipo: "", periodo: "" })}
              className="bg-blue-500 text-white px-2 py-1 mt-2 rounded"
            >
              Agregar Periodicidad
            </button>
          )}
        </section>

        {/**
         * SECCIÓN: Estatuto Tributario
         */}
        <section className="border rounded p-4">
          <h3 className="text-xl font-semibold mb-2">Estatuto Tributario</h3>
          {Array.isArray(currentData.estatuto_tributario) &&
            currentData.estatuto_tributario.map((art, idx) => (
              <div key={idx} className="mb-2 border rounded p-2">
                <label className="block font-medium">Título:</label>
                {isEditing ? (
                  <input
                    type="text"
                    className="border p-1 rounded w-full mb-1"
                    value={editData.estatuto_tributario[idx].titulo}
                    onChange={(e) =>
                      handleArrayChange('estatuto_tributario', idx, 'titulo', e.target.value)
                    }
                  />
                ) : (
                  <p>{art.titulo}</p>
                )}
                <label className="block font-medium">Contenido:</label>
                {isEditing ? (
                  <textarea
                    className="border p-1 rounded w-full"
                    value={editData.estatuto_tributario[idx].contenido}
                    onChange={(e) =>
                      handleArrayChange('estatuto_tributario', idx, 'contenido', e.target.value)
                    }
                  />
                ) : (
                  <p>{art.contenido}</p>
                )}
                {isEditing && (
                  <button
                    onClick={() => handleRemoveArticle('estatuto_tributario', idx)}
                    className="bg-red-500 text-white px-2 py-1 mt-2 rounded"
                  >
                    Eliminar
                  </button>
                )}
              </div>
            ))}
          {isEditing && (
            <button
              onClick={() => handleAddArticle('estatuto_tributario')}
              className="bg-blue-500 text-white px-2 py-1 mt-2 rounded"
            >
              Agregar Artículo
            </button>
          )}
        </section>

        {/**
         * SECCIÓN: ICA, Autoretención ICA, Rete ICA
         */}
        <section className="border rounded p-4">
          <h3 className="text-xl font-semibold mb-2">ICA</h3>
          {Array.isArray(currentData.ica) &&
            currentData.ica.map((icaItem, idx) => (
              <div key={idx} className="mb-2 border p-2 rounded">
                <label className="block font-medium">Título:</label>
                {isEditing ? (
                  <input
                    type="text"
                    className="border p-1 rounded w-full mb-1"
                    value={editData.ica[idx].titulo}
                    onChange={(e) => handleArrayChange('ica', idx, 'titulo', e.target.value)}
                  />
                ) : (
                  <p>{icaItem.titulo}</p>
                )}
                <label className="block font-medium">Contenido:</label>
                {isEditing ? (
                  <textarea
                    className="border p-1 rounded w-full"
                    value={editData.ica[idx].contenido}
                    onChange={(e) => handleArrayChange('ica', idx, 'contenido', e.target.value)}
                  />
                ) : (
                  <p>{icaItem.contenido}</p>
                )}
                {isEditing && (
                  <button
                    onClick={() => handleRemoveArticle('ica', idx)}
                    className="bg-red-500 text-white px-2 py-1 mt-2 rounded"
                  >
                    Eliminar
                  </button>
                )}
              </div>
            ))}
          {isEditing && (
            <button
              onClick={() => handleAddArticle('ica')}
              className="bg-blue-500 text-white px-2 py-1 mt-2 rounded"
            >
              Agregar Artículo
            </button>
          )}

          <h4 className="text-lg font-bold mt-4">Autoretención ICA</h4>
          {Array.isArray(currentData.autoretencion_ica) &&
            currentData.autoretencion_ica.map((autoItem, idx) => (
              <div key={idx} className="mb-2 border p-2 rounded">
                <label className="block font-medium">Título:</label>
                {isEditing ? (
                  <input
                    type="text"
                    className="border p-1 rounded w-full mb-1"
                    value={editData.autoretencion_ica[idx].titulo}
                    onChange={(e) =>
                      handleArrayChange('autoretencion_ica', idx, 'titulo', e.target.value)
                    }
                  />
                ) : (
                  <p>{autoItem.titulo}</p>
                )}
                <label className="block font-medium">Contenido:</label>
                {isEditing ? (
                  <textarea
                    className="border p-1 rounded w-full"
                    value={editData.autoretencion_ica[idx].contenido}
                    onChange={(e) =>
                      handleArrayChange('autoretencion_ica', idx, 'contenido', e.target.value)
                    }
                  />
                ) : (
                  <p>{autoItem.contenido}</p>
                )}
                {isEditing && (
                  <button
                    onClick={() => handleRemoveArticle('autoretencion_ica', idx)}
                    className="bg-red-500 text-white px-2 py-1 mt-2 rounded"
                  >
                    Eliminar
                  </button>
                )}
              </div>
            ))}
          {isEditing && (
            <button
              onClick={() => handleAddArticle('autoretencion_ica')}
              className="bg-blue-500 text-white px-2 py-1 mt-2 rounded"
            >
              Agregar Artículo
            </button>
          )}

          <h4 className="text-lg font-bold mt-4">Rete ICA</h4>
          {Array.isArray(currentData.rete_ica) &&
            currentData.rete_ica.map((reteItem, idx) => (
              <div key={idx} className="mb-2 border p-2 rounded">
                <label className="block font-medium">Título:</label>
                {isEditing ? (
                  <input
                    type="text"
                    className="border p-1 rounded w-full mb-1"
                    value={editData.rete_ica[idx].titulo}
                    onChange={(e) =>
                      handleArrayChange('rete_ica', idx, 'titulo', e.target.value)
                    }
                  />
                ) : (
                  <p>{reteItem.titulo}</p>
                )}
                <label className="block font-medium">Contenido:</label>
                {isEditing ? (
                  <textarea
                    className="border p-1 rounded w-full"
                    value={editData.rete_ica[idx].contenido}
                    onChange={(e) =>
                      handleArrayChange('rete_ica', idx, 'contenido', e.target.value)
                    }
                  />
                ) : (
                  <p>{reteItem.contenido}</p>
                )}
                {isEditing && (
                  <button
                    onClick={() => handleRemoveArticle('rete_ica', idx)}
                    className="bg-red-500 text-white px-2 py-1 mt-2 rounded"
                  >
                    Eliminar
                  </button>
                )}
              </div>
            ))}
          {isEditing && (
            <button
              onClick={() => handleAddArticle('rete_ica')}
              className="bg-blue-500 text-white px-2 py-1 mt-2 rounded"
            >
              Agregar Artículo
            </button>
          )}
        </section>

        {/**
         * SECCIÓN: Fechas (fechas_ica, fechas_rete_ica, vencimiento_declaraciones_x_nit, etc.)
         */}
        <section className="border rounded p-4">
          <h3 className="text-xl font-semibold mb-2">Fechas ICA</h3>
          {Array.isArray(currentData.fechas_ica) &&
            currentData.fechas_ica.map((item, idx) => {
              const [k, v] = Object.entries(item)[0];
              return (
                <div key={idx} className="mb-2 border p-2 rounded">
                  <label className="block font-medium">Clave:</label>
                  <p>{k}</p>
                  <label className="block font-medium">Fecha:</label>
                  {isEditing ? (
                    <input
                      type="text"
                      className="border p-1 rounded w-full"
                      value={v}
                      onChange={(e) => handleDictArrayChange('fechas_ica', idx, 'value', e.target.value)}
                    />
                  ) : (
                    <p>{v}</p>
                  )}
                  {isEditing && (
                    <button
                      onClick={() => handleRemoveDictItem('fechas_ica', idx)}
                      className="bg-red-500 text-white px-2 py-1 mt-2 rounded"
                    >
                      Eliminar
                    </button>
                  )}
                </div>
              );
            })}
          {isEditing && (
            <button
              onClick={() => handleAddDictItem('fechas_ica')}
              className="bg-blue-500 text-white px-2 py-1 mt-2 rounded"
            >
              Agregar Fecha
            </button>
          )}

          <h4 className="text-lg font-bold mt-4">Fechas Rete ICA</h4>
          {Array.isArray(currentData.fechas_rete_ica) &&
            currentData.fechas_rete_ica.map((item, idx) => {
              const [k, v] = Object.entries(item)[0];
              return (
                <div key={idx} className="mb-2 border p-2 rounded">
                  <label className="block font-medium">Clave:</label>
                  <p>{k}</p>
                  <label className="block font-medium">Fecha:</label>
                  {isEditing ? (
                    <input
                      type="text"
                      className="border p-1 rounded w-full"
                      value={v}
                      onChange={(e) =>
                        handleDictArrayChange('fechas_rete_ica', idx, 'value', e.target.value)
                      }
                    />
                  ) : (
                    <p>{v}</p>
                  )}
                  {isEditing && (
                    <button
                      onClick={() => handleRemoveDictItem('fechas_rete_ica', idx)}
                      className="bg-red-500 text-white px-2 py-1 mt-2 rounded"
                    >
                      Eliminar
                    </button>
                  )}
                </div>
              );
            })}
          {isEditing && (
            <button
              onClick={() => handleAddDictItem('fechas_rete_ica')}
              className="bg-blue-500 text-white px-2 py-1 mt-2 rounded"
            >
              Agregar Fecha
            </button>
          )}

          <h4 className="text-lg font-bold mt-4">Vencimientos X Nit</h4>
          {Array.isArray(currentData.vencimiento_declaraciones_x_nit) &&
            currentData.vencimiento_declaraciones_x_nit.map((item, idx) => {
              const [k, v] = Object.entries(item)[0];
              return (
                <div key={idx} className="mb-2 border p-2 rounded">
                  <label className="block font-medium">Clave:</label>
                  <p>{k}</p>
                  <label className="block font-medium">Fecha:</label>
                  {isEditing ? (
                    <input
                      type="text"
                      className="border p-1 rounded w-full"
                      value={v}
                      onChange={(e) =>
                        handleDictArrayChange('vencimiento_declaraciones_x_nit', idx, 'value', e.target.value)
                      }
                    />
                  ) : (
                    <p>{v}</p>
                  )}
                  {isEditing && (
                    <button
                      onClick={() => handleRemoveDictItem('vencimiento_declaraciones_x_nit', idx)}
                      className="bg-red-500 text-white px-2 py-1 mt-2 rounded"
                    >
                      Eliminar
                    </button>
                  )}
                </div>
              );
            })}
          {isEditing && (
            <button
              onClick={() => handleAddDictItem('vencimiento_declaraciones_x_nit')}
              className="bg-blue-500 text-white px-2 py-1 mt-2 rounded"
            >
              Agregar Fecha
            </button>
          )}

          <h4 className="text-lg font-bold mt-4">Vencimientos X Nit ICA</h4>
          {Array.isArray(currentData.vencimiento_declaraciones_x_nit_ica) &&
            currentData.vencimiento_declaraciones_x_nit_ica.map((item, idx) => {
              const [k, v] = Object.entries(item)[0];
              return (
                <div key={idx} className="mb-2 border p-2 rounded">
                  <label className="block font-medium">Clave:</label>
                  <p>{k}</p>
                  <label className="block font-medium">Fecha:</label>
                  {isEditing ? (
                    <input
                      type="text"
                      className="border p-1 rounded w-full"
                      value={v}
                      onChange={(e) =>
                        handleDictArrayChange('vencimiento_declaraciones_x_nit_ica', idx, 'value', e.target.value)
                      }
                    />
                  ) : (
                    <p>{v}</p>
                  )}
                  {isEditing && (
                    <button
                      onClick={() => handleRemoveDictItem('vencimiento_declaraciones_x_nit_ica', idx)}
                      className="bg-red-500 text-white px-2 py-1 mt-2 rounded"
                    >
                      Eliminar
                    </button>
                  )}
                </div>
              );
            })}
          {isEditing && (
            <button
              onClick={() => handleAddDictItem('vencimiento_declaraciones_x_nit_ica')}
              className="bg-blue-500 text-white px-2 py-1 mt-2 rounded"
            >
              Agregar Fecha
            </button>
          )}

          <h4 className="text-lg font-bold mt-4">Vencimientos X Nit Rete ICA</h4>
          {Array.isArray(currentData.vencimiento_declaraciones_x_nit_rete_ica) &&
            currentData.vencimiento_declaraciones_x_nit_rete_ica.map((item, idx) => {
              const [k, v] = Object.entries(item)[0];
              return (
                <div key={idx} className="mb-2 border p-2 rounded">
                  <label className="block font-medium">Clave:</label>
                  <p>{k}</p>
                  <label className="block font-medium">Fecha:</label>
                  {isEditing ? (
                    <input
                      type="text"
                      className="border p-1 rounded w-full"
                      value={v}
                      onChange={(e) =>
                        handleDictArrayChange('vencimiento_declaraciones_x_nit_rete_ica', idx, 'value', e.target.value)
                      }
                    />
                  ) : (
                    <p>{v}</p>
                  )}
                  {isEditing && (
                    <button
                      onClick={() => handleRemoveDictItem('vencimiento_declaraciones_x_nit_rete_ica', idx)}
                      className="bg-red-500 text-white px-2 py-1 mt-2 rounded"
                    >
                      Eliminar
                    </button>
                  )}
                </div>
              );
            })}
          {isEditing && (
            <button
              onClick={() => handleAddDictItem('vencimiento_declaraciones_x_nit_rete_ica')}
              className="bg-blue-500 text-white px-2 py-1 mt-2 rounded"
            >
              Agregar Fecha
            </button>
          )}
        </section>

        {/**
         * SECCIÓN: Informacion Exogena / Medios Magnéticos
         */}
        <section className="border rounded p-4">
          <h3 className="text-xl font-semibold mb-2">Información Exógena / Medios Magnéticos</h3>
          {Array.isArray(currentData.informacion_exogena_municipal_medios_magneticos) &&
            currentData.informacion_exogena_municipal_medios_magneticos.map((medio, idx) => (
              <div key={idx} className="mb-2 border p-2 rounded">
                <label className="block font-medium">Título:</label>
                {isEditing ? (
                  <input
                    type="text"
                    className="border p-1 rounded w-full mb-1"
                    value={editData.informacion_exogena_municipal_medios_magneticos[idx].titulo || ''}
                    onChange={(e) =>
                      handleObjectArrayChange(
                        'informacion_exogena_municipal_medios_magneticos',
                        idx,
                        'titulo',
                        e.target.value
                      )
                    }
                  />
                ) : (
                  <p>{medio.titulo}</p>
                )}
                <label className="block font-medium">Contenido:</label>
                {isEditing ? (
                  <textarea
                    className="border p-1 rounded w-full mb-1"
                    value={editData.informacion_exogena_municipal_medios_magneticos[idx].contenido || ''}
                    onChange={(e) =>
                      handleObjectArrayChange(
                        'informacion_exogena_municipal_medios_magneticos',
                        idx,
                        'contenido',
                        e.target.value
                      )
                    }
                  />
                ) : (
                  <p>{medio.contenido}</p>
                )}
                <label className="block font-medium">Fecha Pago:</label>
                {isEditing ? (
                  <input
                    type="text"
                    className="border p-1 rounded w-full mb-1"
                    value={
                      editData.informacion_exogena_municipal_medios_magneticos[idx].fecha_pago || ''
                    }
                    onChange={(e) =>
                      handleObjectArrayChange(
                        'informacion_exogena_municipal_medios_magneticos',
                        idx,
                        'fecha_pago',
                        e.target.value
                      )
                    }
                  />
                ) : (
                  <p>{medio.fecha_pago}</p>
                )}
                <label className="block font-medium">Fecha Vencimiento:</label>
                {isEditing ? (
                  <input
                    type="text"
                    className="border p-1 rounded w-full"
                    value={
                      editData.informacion_exogena_municipal_medios_magneticos[idx].fecha_vencimiento || ''
                    }
                    onChange={(e) =>
                      handleObjectArrayChange(
                        'informacion_exogena_municipal_medios_magneticos',
                        idx,
                        'fecha_vencimiento',
                        e.target.value
                      )
                    }
                  />
                ) : (
                  <p>{medio.fecha_vencimiento || 'N/A'}</p>
                )}
                {isEditing && (
                  <button
                    onClick={() => handleRemoveObjectItem('informacion_exogena_municipal_medios_magneticos', idx)}
                    className="bg-red-500 text-white px-2 py-1 mt-2 rounded"
                  >
                    Eliminar
                  </button>
                )}
              </div>
            ))}
          {isEditing && (
            <button
              onClick={() =>
                handleAddObjectItem('informacion_exogena_municipal_medios_magneticos', {
                  titulo: "",
                  contenido: "",
                  fecha_pago: "",
                  fecha_vencimiento: "",
                  ultimo_nit: []
                })
              }
              className="bg-blue-500 text-white px-2 py-1 mt-2 rounded"
            >
              Agregar Medio Magnético
            </button>
          )}
        </section>
      </div>

      {/** BOTÓN para entrar en modo edición o cancelar cambios */}
      <div className="mt-4 flex space-x-4">
        {!isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            className="bg-blue-500 text-white px-4 py-2 rounded"
          >
            Editar
          </button>
        ) : (
          <>
            <button
              onClick={() => {
                // Revertir cambios
                setEditData(data);
                setIsEditing(false);
              }}
              className="bg-gray-500 text-white px-4 py-2 rounded"
            >
              Cancelar
            </button>
          </>
        )}
      </div>

      {/**
       * BOTÓN GUARDAR flotante en la esquina inferior derecha (visible solo en modo edición)
       */}
      {isEditing && (
        <div className="fixed bottom-4 right-4">
          <button
            onClick={handleSave}
            className="bg-green-500 text-white px-6 py-3 rounded shadow-lg"
          >
            Guardar
          </button>
        </div>
      )}
      <ToastContainer position="top-right" autoClose={3000} />
    </div>
    
  );
};

export default FormDetail;
