import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import MunicipioSelect from '../components/MunicipioSelect';
// import AuditLogger from "../components/AuditLogger"
import { customFetch } from "../utils/customFetch";


// Función para formatear la fecha (de ISO a "D MMMM YYYY" en español)
const formatDate = (isoDate) => {
  if (!isoDate) return "";
  const date = new Date(isoDate);
  return new Intl.DateTimeFormat('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(date);
};

// Hook para calcular la siguiente versión según el municipio
const useNextVersion = (codigoMunicipio) => {
  const [nextVersion, setNextVersion] = useState("0.0.1");

  useEffect(() => {
    if (!codigoMunicipio) return;
    const token = localStorage.getItem('access_token');
    customFetch("http://127.0.0.1:8000/informacion_tributaria_versionada/", {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      }
    })
      .then(res => res.json())
      .then(forms => {
        // Filtrar formularios para este municipio
        const versiones = forms
          .filter(f => f.codigo_municipio === codigoMunicipio)
          .map(f => f.version);
        if (versiones.length === 0) {
          setNextVersion("0.0.1");
        } else {
          // Asumimos formato "0.0.X": tomamos el máximo del último dígito
          const max = Math.max(...versiones.map(v => parseInt(v.split('.').pop(), 10)));
          setNextVersion(`0.0.${max + 1}`);
        }
      })
      .catch(err => console.error("Error al obtener versiones:", err));
  }, [codigoMunicipio]);

  return nextVersion;
};

const FormularioCreate = () => {
  const navigate = useNavigate();
  const [auditEvent, setAuditEvent] = useState(null);
  // Estado inicial; para los campos de fecha, se almacenarán como strings ISO (YYYY-MM-DD)
  const [formData, setFormData] = useState({
    codigo_municipio: "",
    version: "",
    activo: true,
    url_pdf: "",
    calendario_tributario: "",
    estatuto_tributario: [],
    ica: [],
    autoretencion_ica: [],
    // Para fechas se usa un array de strings (ISO)
    fechas_ica: [],
    rete_ica: [],
    fechas_rete_ica: [],
    impuesto_industria_comercio: "",
    periodicidad_impuestos: [],
    informacion_exogena_municipal_medios_magneticos: [],
    vencimiento_declaraciones_x_nit: [],
    vencimiento_declaraciones_x_nit_ica: [],
    vencimiento_declaraciones_x_nit_rete_ica: []
  });

  // Actualizar versión automáticamente cuando se selecciona el municipio
  const nextVersion = useNextVersion(formData.codigo_municipio);
  useEffect(() => {
    setFormData(prev => ({ ...prev, version: nextVersion }));
  }, [nextVersion]);

  // Handlers para campos simples
  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Para arrays de artículos (con { titulo, contenido })
  const handleArrayChange = (arrayField, idx, subfield, value) => {
    setFormData(prev => {
      const updated = { ...prev };
      updated[arrayField] = updated[arrayField].map((item, i) => 
        i === idx ? { ...item, [subfield]: value } : item
      );
      return updated;
    });
  };

  const handleAddArticle = (arrayField) => {
    setFormData(prev => {
      const updated = { ...prev };
      updated[arrayField] = [...(updated[arrayField] || []), { titulo: "", contenido: "" }];
      return updated;
    });
  };

  const handleRemoveArticle = (arrayField, idx) => {
    setFormData(prev => {
      const updated = { ...prev };
      updated[arrayField] = updated[arrayField].filter((_, i) => i !== idx);
      return updated;
    });
  };

  // Para campos de periodicidad: "tipo" se restringe a opciones fijas y "periodo" es input normal
  const periodicidadOptions = ["mensual", "bimensual", "trimestral", "semestral", "anual"];
  const handlePeriodicidadChange = (idx, field, value) => {
    setFormData(prev => {
      const updated = { ...prev };
      updated.periodicidad_impuestos = updated.periodicidad_impuestos.map((item, i) =>
        i === idx ? { ...item, [field]: value } : item
      );
      return updated;
    });
  };

  const handleAddPeriodicidad = () => {
    setFormData(prev => ({
      ...prev,
      periodicidad_impuestos: [...(prev.periodicidad_impuestos || []), { tipo: "mensual", periodo: "" }]
    }));
  };

  const handleRemovePeriodicidad = (idx) => {
    setFormData(prev => ({
      ...prev,
      periodicidad_impuestos: prev.periodicidad_impuestos.filter((_, i) => i !== idx)
    }));
  };

  // Para los campos de fecha, trabajamos con arrays de strings (ISO); se usan inputs tipo "date"
  const handleDateChange = (arrayField, idx, value) => {
    setFormData(prev => {
      const updated = { ...prev };
      updated[arrayField] = updated[arrayField].map((item, i) => i === idx ? value : item);
      return updated;
    });
  };

  const handleAddDate = (arrayField) => {
    setFormData(prev => {
      const updated = { ...prev };
      updated[arrayField] = [...(updated[arrayField] || []), ""];
      return updated;
    });
  };

  const handleRemoveDate = (arrayField, idx) => {
    setFormData(prev => {
      const updated = { ...prev };
      updated[arrayField] = updated[arrayField].filter((_, i) => i !== idx);
      return updated;
    });
  };

  // Para arrays de objetos con múltiples campos (por ejemplo, información exógena)
  const handleObjectArrayChange = (arrayField, idx, field, value) => {
    setFormData(prev => {
      const updated = { ...prev };
      updated[arrayField] = updated[arrayField].map((obj, i) =>
        i === idx ? { ...obj, [field]: value } : obj
      );
      return updated;
    });
  };

  const handleAddObjectItem = (arrayField, defaultObj) => {
    setFormData(prev => ({
      ...prev,
      [arrayField]: [...(prev[arrayField] || []), defaultObj]
    }));
  };

  const handleRemoveObjectItem = (arrayField, idx) => {
    setFormData(prev => ({
      ...prev,
      [arrayField]: prev[arrayField].filter((_, i) => i !== idx)
    }));
  };

  // Al enviar, transformamos los arrays de fechas a objetos con claves secuenciales usando el formato requerido.
  const transformDates = (dateArray) => {
    return dateArray.map((date, idx) => ({ [idx]: formatDate(date) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('access_token');
      // Preparamos el payload, transformando los campos de fecha
      const payload = {
        ...formData,
        fechas_ica: transformDates(formData.fechas_ica),
        fechas_rete_ica: transformDates(formData.fechas_rete_ica),
        vencimiento_declaraciones_x_nit: transformDates(formData.vencimiento_declaraciones_x_nit),
        vencimiento_declaraciones_x_nit_ica: transformDates(formData.vencimiento_declaraciones_x_nit_ica),
        vencimiento_declaraciones_x_nit_rete_ica: transformDates(formData.vencimiento_declaraciones_x_nit_rete_ica)
      };

      const res = await fetch("http://127.0.0.1:8000/informacion_tributaria_versionada/", {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        throw new Error("Error al crear el formulario");
      }
      await res.json();
      toast.success("¡Formulario creado exitosamente!");
      setAuditEvent({
        accion: "Agregar",
        detalles: `El usuario agregó el formulario para el municipio: ${formData.codigo_municipio}`
      });
      setTimeout(() => {
        navigate('/dashboard/formularios');
      }, 2000);
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div className="p-4 relative">
      <h2 className="text-2xl font-bold mb-4">Crear Formulario</h2>
      <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
        {/* Columna Izquierda */}
        <div>
          {/* Información General */}
          <section className="border rounded p-4 mb-4">
            <h3 className="text-xl font-semibold mb-2">Información General</h3>
            <div className="mb-2">
              <label className="block font-medium">Municipio:</label>
              <MunicipioSelect 
                value={formData.codigo_municipio}
                onChange={(val) => handleChange("codigo_municipio", val)}
              />
            </div>
            <div className="mb-2">
              <label className="block font-medium">Versión:</label>
              <input
                type="text"
                value={formData.version}
                readOnly
                className="border p-1 rounded w-full bg-gray-100"
              />
            </div>
            <div className="mb-2">
              <label className="block font-medium">Activo:</label>
              <select
                value={formData.activo}
                onChange={(e) => handleChange("activo", e.target.value === "true")}
                className="border p-1 rounded w-full"
              >
                <option value="true">Sí</option>
                <option value="false">No</option>
              </select>
            </div>
            <div className="mb-2">
              <label className="block font-medium">URL PDF:</label>
              <input
                type="text"
                value={formData.url_pdf}
                onChange={(e) => handleChange("url_pdf", e.target.value)}
                className="border p-1 rounded w-full"
              />
            </div>
            <div className="mb-2">
              <label className="block font-medium">Calendario Tributario:</label>
              <textarea
                value={formData.calendario_tributario}
                onChange={(e) => handleChange("calendario_tributario", e.target.value)}
                className="border p-1 rounded w-full"
              />
            </div>
          </section>

          {/* Estatuto Tributario */}
          <section className="border rounded p-4 mb-4">
            <h3 className="text-xl font-semibold mb-2">Estatuto Tributario</h3>
            {formData.estatuto_tributario.map((art, idx) => (
              <div key={idx} className="mb-2 border p-2 rounded">
                <label className="block font-medium">Título:</label>
                <input
                  type="text"
                  value={art.titulo}
                  onChange={(e) => handleArrayChange("estatuto_tributario", idx, "titulo", e.target.value)}
                  className="border p-1 rounded w-full mb-1"
                />
                <label className="block font-medium">Contenido:</label>
                <textarea
                  value={art.contenido}
                  onChange={(e) => handleArrayChange("estatuto_tributario", idx, "contenido", e.target.value)}
                  className="border p-1 rounded w-full"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveArticle("estatuto_tributario", idx)}
                  className="bg-red-500 text-white px-2 py-1 mt-2 rounded"
                >
                  Eliminar
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => handleAddArticle("estatuto_tributario")}
              className="bg-blue-500 text-white px-2 py-1 mt-2 rounded"
            >
              Agregar Artículo
            </button>
          </section>

          {/* ICA */}
          <section className="border rounded p-4 mb-4">
            <h3 className="text-xl font-semibold mb-2">ICA</h3>
            {formData.ica.map((art, idx) => (
              <div key={idx} className="mb-2 border p-2 rounded">
                <label className="block font-medium">Título:</label>
                <input
                  type="text"
                  value={art.titulo}
                  onChange={(e) => handleArrayChange("ica", idx, "titulo", e.target.value)}
                  className="border p-1 rounded w-full mb-1"
                />
                <label className="block font-medium">Contenido:</label>
                <textarea
                  value={art.contenido}
                  onChange={(e) => handleArrayChange("ica", idx, "contenido", e.target.value)}
                  className="border p-1 rounded w-full"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveArticle("ica", idx)}
                  className="bg-red-500 text-white px-2 py-1 mt-2 rounded"
                >
                  Eliminar
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => handleAddArticle("ica")}
              className="bg-blue-500 text-white px-2 py-1 mt-2 rounded"
            >
              Agregar Artículo
            </button>
          </section>

          {/* Autoretención ICA */}
          <section className="border rounded p-4 mb-4">
            <h3 className="text-xl font-semibold mb-2">Autoretención ICA</h3>
            {formData.autoretencion_ica.map((art, idx) => (
              <div key={idx} className="mb-2 border p-2 rounded">
                <label className="block font-medium">Título:</label>
                <input
                  type="text"
                  value={art.titulo}
                  onChange={(e) => handleArrayChange("autoretencion_ica", idx, "titulo", e.target.value)}
                  className="border p-1 rounded w-full mb-1"
                />
                <label className="block font-medium">Contenido:</label>
                <textarea
                  value={art.contenido}
                  onChange={(e) => handleArrayChange("autoretencion_ica", idx, "contenido", e.target.value)}
                  className="border p-1 rounded w-full"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveArticle("autoretencion_ica", idx)}
                  className="bg-red-500 text-white px-2 py-1 mt-2 rounded"
                >
                  Eliminar
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => handleAddArticle("autoretencion_ica")}
              className="bg-blue-500 text-white px-2 py-1 mt-2 rounded"
            >
              Agregar Artículo
            </button>
          </section>
        </div>

        {/* Columna Derecha */}
        <div>
          {/* Fechas ICA */}
          <section className="border rounded p-4 mb-4">
            <h3 className="text-xl font-semibold mb-2">Fechas ICA</h3>
            {formData.fechas_ica.map((date, idx) => (
              <div key={idx} className="mb-2 border p-2 rounded">
                <label className="block font-medium">Fecha:</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => handleDateChange("fechas_ica", idx, e.target.value)}
                  className="border p-1 rounded w-full"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveDate("fechas_ica", idx)}
                  className="bg-red-500 text-white px-2 py-1 mt-2 rounded"
                >
                  Eliminar
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => handleAddDate("fechas_ica")}
              className="bg-blue-500 text-white px-2 py-1 mt-2 rounded"
            >
              Agregar Fecha
            </button>
          </section>

          {/* Rete ICA */}
          <section className="border rounded p-4 mb-4">
            <h3 className="text-xl font-semibold mb-2">Rete ICA</h3>
            {formData.rete_ica.map((art, idx) => (
              <div key={idx} className="mb-2 border p-2 rounded">
                <label className="block font-medium">Título:</label>
                <input
                  type="text"
                  value={art.titulo}
                  onChange={(e) => handleArrayChange("rete_ica", idx, "titulo", e.target.value)}
                  className="border p-1 rounded w-full mb-1"
                />
                <label className="block font-medium">Contenido:</label>
                <textarea
                  value={art.contenido}
                  onChange={(e) => handleArrayChange("rete_ica", idx, "contenido", e.target.value)}
                  className="border p-1 rounded w-full"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveArticle("rete_ica", idx)}
                  className="bg-red-500 text-white px-2 py-1 mt-2 rounded"
                >
                  Eliminar
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => handleAddArticle("rete_ica")}
              className="bg-blue-500 text-white px-2 py-1 mt-2 rounded"
            >
              Agregar Artículo
            </button>
          </section>

          {/* Fechas Rete ICA */}
          <section className="border rounded p-4 mb-4">
            <h3 className="text-xl font-semibold mb-2">Fechas Rete ICA</h3>
            {formData.fechas_rete_ica.map((date, idx) => (
              <div key={idx} className="mb-2 border p-2 rounded">
                <label className="block font-medium">Fecha:</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => handleDateChange("fechas_rete_ica", idx, e.target.value)}
                  className="border p-1 rounded w-full"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveDate("fechas_rete_ica", idx)}
                  className="bg-red-500 text-white px-2 py-1 mt-2 rounded"
                >
                  Eliminar
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => handleAddDate("fechas_rete_ica")}
              className="bg-blue-500 text-white px-2 py-1 mt-2 rounded"
            >
              Agregar Fecha
            </button>
          </section>

          {/* Impuesto Industria y Comercio */}
          <section className="border rounded p-4 mb-4">
            <h3 className="text-xl font-semibold mb-2">Impuesto Industria y Comercio</h3>
            <textarea
              value={formData.impuesto_industria_comercio}
              onChange={(e) => handleChange("impuesto_industria_comercio", e.target.value)}
              className="border p-1 rounded w-full"
            />
          </section>

          {/* Periodicidad Impuestos */}
          <section className="border rounded p-4 mb-4">
            <h3 className="text-xl font-semibold mb-2">Periodicidad Impuestos</h3>
            {formData.periodicidad_impuestos.map((item, idx) => (
              <div key={idx} className="mb-2 border p-2 rounded">
                <label className="block font-medium">Tipo:</label>
                <select
                  value={item.tipo}
                  onChange={(e) => handlePeriodicidadChange(idx, "tipo", e.target.value)}
                  className="border p-1 rounded w-full mb-1"
                >
                  {periodicidadOptions.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
                <label className="block font-medium">Periodo (descripción):</label>
                <input
                  type="text"
                  value={item.periodo}
                  onChange={(e) => handlePeriodicidadChange(idx, "periodo", e.target.value)}
                  className="border p-1 rounded w-full"
                />
                <button
                  type="button"
                  onClick={() => handleRemovePeriodicidad(idx)}
                  className="bg-red-500 text-white px-2 py-1 mt-2 rounded"
                >
                  Eliminar
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={handleAddPeriodicidad}
              className="bg-blue-500 text-white px-2 py-1 mt-2 rounded"
            >
              Agregar Periodicidad
            </button>
          </section>

          {/* Información Exógena / Medios Magnéticos */}
          <section className="border rounded p-4 mb-4">
            <h3 className="text-xl font-semibold mb-2">Información Exógena / Medios Magnéticos</h3>
            {formData.informacion_exogena_municipal_medios_magneticos.map((item, idx) => (
              <div key={idx} className="mb-2 border p-2 rounded">
                <label className="block font-medium">Título:</label>
                <input
                  type="text"
                  value={item.titulo}
                  onChange={(e) => handleObjectArrayChange("informacion_exogena_municipal_medios_magneticos", idx, "titulo", e.target.value)}
                  className="border p-1 rounded w-full mb-1"
                />
                <label className="block font-medium">Último NIT (separado por comas):</label>
                <input
                  type="text"
                  value={item.ultimo_nit ? item.ultimo_nit.join(", ") : ""}
                  onChange={(e) => {
                    const nums = e.target.value.split(",").map(n => n.trim());
                    handleObjectArrayChange("informacion_exogena_municipal_medios_magneticos", idx, "ultimo_nit", nums);
                  }}
                  className="border p-1 rounded w-full mb-1"
                />
                <label className="block font-medium">Fecha Pago:</label>
                <input
                  type="date"
                  value={item.fecha_pago}
                  onChange={(e) => handleObjectArrayChange("informacion_exogena_municipal_medios_magneticos", idx, "fecha_pago", e.target.value)}
                  className="border p-1 rounded w-full mb-1"
                />
                <label className="block font-medium">Fecha Vencimiento:</label>
                <input
                  type="date"
                  value={item.fecha_vencimiento || ""}
                  onChange={(e) => handleObjectArrayChange("informacion_exogena_municipal_medios_magneticos", idx, "fecha_vencimiento", e.target.value)}
                  className="border p-1 rounded w-full mb-1"
                />
                <label className="block font-medium">Contenido:</label>
                <textarea
                  value={item.contenido}
                  onChange={(e) => handleObjectArrayChange("informacion_exogena_municipal_medios_magneticos", idx, "contenido", e.target.value)}
                  className="border p-1 rounded w-full"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveObjectItem("informacion_exogena_municipal_medios_magneticos", idx)}
                  className="bg-red-500 text-white px-2 py-1 mt-2 rounded"
                >
                  Eliminar
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => handleAddObjectItem("informacion_exogena_municipal_medios_magneticos", {
                titulo: "",
                ultimo_nit: [],
                fecha_pago: "",
                fecha_vencimiento: "",
                contenido: ""
              })}
              className="bg-blue-500 text-white px-2 py-1 mt-2 rounded"
            >
              Agregar Medio Magnético
            </button>
          </section>

          {/* Vencimiento Declaraciones x NIT */}
          <section className="border rounded p-4 mb-4">
            <h3 className="text-xl font-semibold mb-2">Vencimiento Declaraciones x NIT</h3>
            {formData.vencimiento_declaraciones_x_nit.map((date, idx) => (
              <div key={idx} className="mb-2 border p-2 rounded">
                <label className="block font-medium">Fecha:</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => handleDateChange("vencimiento_declaraciones_x_nit", idx, e.target.value)}
                  className="border p-1 rounded w-full"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveDate("vencimiento_declaraciones_x_nit", idx)}
                  className="bg-red-500 text-white px-2 py-1 mt-2 rounded"
                >
                  Eliminar
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => handleAddDate("vencimiento_declaraciones_x_nit")}
              className="bg-blue-500 text-white px-2 py-1 mt-2 rounded"
            >
              Agregar Fecha
            </button>
          </section>

          {/* Vencimiento Declaraciones x NIT ICA */}
          <section className="border rounded p-4 mb-4">
            <h3 className="text-xl font-semibold mb-2">Vencimiento Declaraciones x NIT ICA</h3>
            {formData.vencimiento_declaraciones_x_nit_ica.map((date, idx) => (
              <div key={idx} className="mb-2 border p-2 rounded">
                <label className="block font-medium">Fecha:</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => handleDateChange("vencimiento_declaraciones_x_nit_ica", idx, e.target.value)}
                  className="border p-1 rounded w-full"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveDate("vencimiento_declaraciones_x_nit_ica", idx)}
                  className="bg-red-500 text-white px-2 py-1 mt-2 rounded"
                >
                  Eliminar
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => handleAddDate("vencimiento_declaraciones_x_nit_ica")}
              className="bg-blue-500 text-white px-2 py-1 mt-2 rounded"
            >
              Agregar Fecha
            </button>
          </section>

          {/* Vencimiento Declaraciones x NIT Rete ICA */}
          <section className="border rounded p-4 mb-4">
            <h3 className="text-xl font-semibold mb-2">Vencimiento Declaraciones x NIT Rete ICA</h3>
            {formData.vencimiento_declaraciones_x_nit_rete_ica.map((date, idx) => (
              <div key={idx} className="mb-2 border p-2 rounded">
                <label className="block font-medium">Fecha:</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => handleDateChange("vencimiento_declaraciones_x_nit_rete_ica", idx, e.target.value)}
                  className="border p-1 rounded w-full"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveDate("vencimiento_declaraciones_x_nit_rete_ica", idx)}
                  className="bg-red-500 text-white px-2 py-1 mt-2 rounded"
                >
                  Eliminar
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => handleAddDate("vencimiento_declaraciones_x_nit_rete_ica")}
              className="bg-blue-500 text-white px-2 py-1 mt-2 rounded"
            >
              Agregar Fecha
            </button>
          </section>
        </div>
      </form>
        {/* {auditEvent && (
                <AuditLogger 
                accion={auditEvent.accion} 
                detalles={auditEvent.detalles} 
                />
            )} */}
      {/* Botones flotantes: Guardar y Cancelar */}
      <div className="fixed bottom-4 right-4 flex flex-col gap-2">
        <button
          onClick={handleSubmit}
          className="bg-green-500 text-white px-6 py-3 rounded shadow-lg"
        >
          Guardar
        </button>
        <button
          onClick={() => navigate('/dashboard/formularios')}
          className="bg-gray-500 text-white px-6 py-3 rounded shadow-lg"
        >
          Cancelar
        </button>
      </div>
      <ToastContainer position="top-right" autoClose={3000} />
    </div>  
  );
};

export default FormularioCreate;
