// components/common/Navbar.tsx (versión pública)
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, Trophy, Users, Calendar, MapPin, Home, BarChart3 } from 'lucide-react';

const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const publicLinks = [
    { name: 'Inicio', path: '/', icon: <Home size={20} /> },
    { name: 'Equipos', path: '/equipos-public', icon: <Users size={20} /> },
    { name: 'Partidos', path: '/partidos-public', icon: <Calendar size={20} /> },
    { name: 'Tabla de Posiciones', path: '/tabla-posiciones-public', icon: <BarChart3 size={20} /> },
    { name: 'Calendario', path: '/calendario-public', icon: <Calendar size={20} /> },
    { name: 'Sedes', path: '/sedes', icon: <MapPin size={20} /> },
  ];

  return (
    <nav className="bg-white dark:bg-gray-800 shadow-lg border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-tocho-primary rounded-lg flex items-center justify-center">
                <Trophy size={24} className="text-white" />
              </div>
              <div>
                <span className="text-xl font-bold text-gray-900 dark:text-white">TOCHO</span>
                <span className="text-xl font-bold text-tocho-primary">PRIME</span>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            {publicLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                className="px-4 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-tocho-primary transition-colors flex items-center gap-2"
              >
                {link.icon}
                {link.name}
              </Link>
            ))}
            <button
              onClick={() => navigate('/login')}
              className="ml-4 px-6 py-2 bg-tocho-primary text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
            >
              Iniciar Sesión
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-gray-700 dark:text-gray-300 hover:text-tocho-primary"
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden border-t border-gray-200 dark:border-gray-700">
            <div className="pt-2 pb-3 space-y-1">
              {publicLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.path}
                  className="flex items-center gap-3 px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-tocho-primary transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  {link.icon}
                  {link.name}
                </Link>
              ))}
              <div className="px-4 pt-4">
                <button
                  onClick={() => {
                    navigate('/login');
                    setIsOpen(false);
                  }}
                  className="w-full py-3 bg-tocho-primary text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                >
                  Iniciar Sesión
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;