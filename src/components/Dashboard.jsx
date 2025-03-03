import React, { useState } from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
  const { setToken } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleLogout = () => {
    setToken(null);
    navigate('/login');
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <aside className={`bg-gray-800 text-white flex flex-col transition-all duration-300 ${sidebarOpen ? "w-64" : "w-16"}`}>
        <div className="p-4 text-2xl font-bold">
          {sidebarOpen ? "Severus" : "S"}
        </div>
        <nav className="mt-4 flex-1">
          <ul>
            <li className="hover:bg-gray-700">
              <Link to="/dashboard/home" className="block px-4 py-2">
                {sidebarOpen ? "🏚 Home" : "🏚"}
              </Link>
            </li>
            <li className="hover:bg-gray-700">
              <Link to="/dashboard/perfil" className="block px-4 py-2">
                {sidebarOpen ? "👤 Perfil" : "👤"}
              </Link>
            </li>
            <li className="hover:bg-gray-700">
              <Link to="/dashboard/configuracion" className="block px-4 py-2">
                {sidebarOpen ? "⚙ Configuración" : "⚙"}
              </Link>
            </li>
            <li className="hover:bg-gray-700">
                <Link to="/dashboard/municipios" className="block px-4 py-2">
                    {sidebarOpen ? "🗺️ Municipios" : "🗺️"}
                </Link>
            </li>
            <li className="hover:bg-gray-700">
                <Link to="/dashboard/formularios" className="block px-4 py-2">
                    {sidebarOpen ? "📋 Listar formularios" : "📋"}
                </Link>
            </li>
            <li className="hover:bg-gray-700">
                <Link to="/dashboard/createForm" className="block px-4 py-2">
                    {sidebarOpen ? "📋 Añadir Formulario" : "📋"}
                </Link>
            </li>
            <li className="hover:bg-gray-700">
                <Link to="/dashboard/audit" className="block px-4 py-2">
                    {sidebarOpen ? "📋 Logs" : "📋"}
                </Link>
            </li>
          </ul>
        </nav>
      </aside>

      {/* Main Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="flex items-center justify-between bg-gray-200 p-4">
          <div className="flex items-center">
            <button onClick={toggleSidebar} className="mr-4 bg-gray-400 text-white p-2 rounded">
              {sidebarOpen ? "<" : ">"}
            </button>
            <div className="text-3xl font-bold"></div>
          </div>
          <button onClick={handleLogout} className="bg-red-500 text-white px-4 py-2 rounded">
            X
          </button>
        </header>
        {/* Contenido Dinámico */}
        <main className="flex-1 p-4 overflow-y-auto">
          <Outlet />
        </main>
      <footer className="bg-white text-center py-4 border-t border-gray-300">
        <p className="text-gray-600">
          <a href="https://www.instagram.com/_innome_/"><span className="font-semibold">🐢 @_innome_ 🐢</span></a> 
        </p>
      </footer>
      </div>
    </div>
  );
};

export default Dashboard;
