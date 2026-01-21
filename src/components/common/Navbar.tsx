import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Menu, 
  X, 
  Trophy, 
  Users, 
  Calendar, 
  MapPin, 
  Home,
  ChevronDown
} from 'lucide-react';

const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLocationsOpen, setIsLocationsOpen] = useState(false);

  const navItems = [
    { label: 'Inicio', path: '/', icon: <Home size={20} /> },
    { label: 'Temporadas', path: '/temporadas', icon: <Calendar size={20} /> },
    { label: 'Equipos', path: '/equipos', icon: <Users size={20} /> },
    { label: 'Partidos', path: '/partidos', icon: <Trophy size={20} /> },
  ];

  const locations = [
    { name: 'Cuemanco Isla 5', address: '16 campos profesionales', status: 'Activo' },
    { name: 'Zague', address: 'Campos de última generación', status: 'Activo' },
  ];

  return (
    <nav className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo y marca */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <img 
                src="/tochologo.jpg" 
                alt="Tocho Prime Logo" 
                className="h-10 w-10 rounded-lg object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.onerror = null;
                  target.src = "https://via.placeholder.com/40?text=TP";
                }}
              />
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                  TOCHOPRIME
                </h1>
                <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                  <MapPin size={12} />
                  <span>Cuemanco • Zague</span>
                </div>
              </div>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => (
              <button
                key={item.label}
                onClick={() => navigate(item.path)}
                className="flex items-center gap-2 px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-tocho-primary dark:hover:text-blue-400 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                {item.icon}
                <span className="font-medium">{item.label}</span>
              </button>
            ))}
            
            {/* Locations Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsLocationsOpen(!isLocationsOpen)}
                className="flex items-center gap-2 px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-tocho-primary dark:hover:text-blue-400 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <MapPin size={20} />
                <span className="font-medium">Sedes</span>
                <ChevronDown size={16} className={`transition-transform ${isLocationsOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {isLocationsOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 py-2 z-50">
                  {locations.map((location, index) => (
                    <div
                      key={index}
                      className="px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                      onClick={() => navigate('/campos')}
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-gray-900 dark:text-white">{location.name}</span>
                        <span className={`text-xs px-2 py-1 rounded-full ${location.status === 'Activo' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'}`}>
                          {location.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{location.address}</p>
                    </div>
                  ))}
                  <div className="border-t border-gray-200 dark:border-gray-700 mt-2 pt-2 px-4">
                    <button
                      onClick={() => {
                        navigate('/campos');
                        setIsLocationsOpen(false);
                      }}
                      className="w-full text-center text-tocho-primary hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium py-2"
                    >
                      Ver mapa completo →
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Login Button */}
            <button
              onClick={() => navigate('/login')}
              className="ml-4 px-6 py-2 bg-tocho-primary text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
            >
              Iniciar Sesión
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
          <div className="px-4 py-3 space-y-1">
            {navItems.map((item) => (
              <button
                key={item.label}
                onClick={() => {
                  navigate(item.path);
                  setIsMenuOpen(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 text-gray-700 dark:text-gray-300 hover:text-tocho-primary dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                {item.icon}
                <span className="font-medium">{item.label}</span>
              </button>
            ))}
            
            {/* Locations in mobile */}
            <div className="px-4 py-3">
              <div className="font-medium text-gray-900 dark:text-white mb-2">Nuestras Sedes</div>
              {locations.map((location, index) => (
                <div
                  key={index}
                  className="py-2 border-b border-gray-200 dark:border-gray-700 last:border-0"
                >
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-700 dark:text-gray-300">{location.name}</span>
                    <span className={`text-xs px-2 py-1 rounded-full ${location.status === 'Activo' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                      {location.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{location.address}</p>
                </div>
              ))}
              <button
                onClick={() => {
                  navigate('/campos');
                  setIsMenuOpen(false);
                }}
                className="w-full mt-3 text-center text-tocho-primary hover:text-blue-700 text-sm font-medium py-2"
              >
                Ver todas las sedes →
              </button>
            </div>

            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => {
                  navigate('/login');
                  setIsMenuOpen(false);
                }}
                className="w-full py-3 bg-tocho-primary text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
              >
                Iniciar Sesión
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;