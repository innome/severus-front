import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Home from './pages/Home';
import Perfil from './pages/Perfil';
import Configuracion from './pages/Configuracion';
import Municipios from './pages/Municipios';
import FormulariosList from './pages/FormulariosList';
import FormularioCreate from './pages/FormularioCreate';
import FormularioDetail from './pages/FormularioDetail';
import AuditLogs from "./pages/AuditLogs";
import { useAuth } from './context/AuthContext';

import { decodeJWT } from './utils/jwt'; // importamos la función creada

const AppRoutes = () => {
  const { token, setToken } = useAuth();

  useEffect(() => {
    if (token) {
      const decoded = decodeJWT(token);
      if (decoded && decoded.exp * 1000 < Date.now()) {
        // Token expirado: limpiar y redirigir al login
        setToken(null);
      }
    }
  }, [token, setToken]);

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/dashboard/*"
        element={ token ? <Dashboard /> : <Navigate to="/login" replace /> }
      >
        <Route path="home" element={<Home />} />
        <Route path="perfil" element={<Perfil />} />
        <Route path="configuracion" element={<Configuracion />} />

        <Route path="municipios" element={<Municipios />} />

        <Route path="audit" element={<AuditLogs />} />

        <Route path="formularios" element={<FormulariosList />} />
        <Route path="createForm" element={<FormularioCreate />} />
        <Route path="formulario/:municipioId/:versionId" element={<FormularioDetail />} />

        <Route index element={<Home />} />
        
      </Route>
      <Route path="*" element={<Navigate to={ token ? "/dashboard" : "/login" } replace />} />
    </Routes>
  );
};

function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}

export default App;
