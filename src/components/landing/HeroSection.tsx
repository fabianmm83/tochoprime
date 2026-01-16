import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, ChevronRight } from 'lucide-react';

const HeroSection: React.FC = () => {
  const navigate = useNavigate();

  return (
    <section className="relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10" />
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 dark:bg-blue-900/30 rounded-full mb-6">
              <span className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></span>
              <span className="text-sm font-semibold text-blue-700 dark:text-blue-400">
                Temporada 2024 Abierta
              </span>
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
              La Liga <span className="text-tocho-primary">#1</span> de 
              <span className="block">Tocho Flag en México</span>
            </h1>
            
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
              Gestiona tu equipo, sigue partidos en vivo y compite en la liga más 
              competitiva con sedes en <span className="font-semibold">Cuemanco</span> y <span className="font-semibold">Zague</span>.
              Sistema profesional para jugadores, capitanes y árbitros.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={() => navigate('/register')}
                className="px-8 py-4 bg-tocho-primary text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
              >
                Registrar Equipo
                <ChevronRight size={20} />
              </button>
              
              <button
                onClick={() => navigate('/partidos')}
                className="px-8 py-4 bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white font-semibold rounded-lg hover:border-tocho-primary transition-colors flex items-center justify-center gap-2"
              >
                <Play size={20} />
                Ver Partidos en Vivo
              </button>
            </div>
            
            {/* Stats mini */}
            <div className="flex gap-8 mt-12">
              <div>
                <div className="text-3xl font-bold text-gray-900 dark:text-white">150+</div>
                <div className="text-gray-600 dark:text-gray-400">Equipos</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-gray-900 dark:text-white">16</div>
                <div className="text-gray-600 dark:text-gray-400">Campos</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-gray-900 dark:text-white">7</div>
                <div className="text-gray-600 dark:text-gray-400">Categorías</div>
              </div>
            </div>
          </div>

          {/* Right Content - Hero Image */}
          <div className="relative">
            <div className="relative rounded-2xl overflow-hidden shadow-2xl">
              {/* Placeholder para imagen hero */}
              <div className="aspect-video bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <div className="text-center text-white p-8">
                  <div className="text-5xl mb-4">🏈</div>
                  <h3 className="text-2xl font-bold mb-2">Tocho Prime en Acción</h3>
                  <p className="opacity-90">Partidos emocionantes en Cuemanco</p>
                </div>
              </div>
              
              {/* Live match badge */}
              <div className="absolute top-4 right-4">
                <div className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-full animate-pulse">
                  <span className="w-2 h-2 bg-white rounded-full"></span>
                  <span className="font-semibold">EN VIVO</span>
                  <span className="text-sm">2 partidos</span>
                </div>
              </div>
            </div>
            
            {/* Floating cards */}
            <div className="absolute -bottom-6 -left-6 bg-white dark:bg-gray-800 p-4 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">🏆</span>
                </div>
                <div>
                  <div className="font-bold text-gray-900 dark:text-white">Campeones 2023</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Tiburones Azules</div>
                </div>
              </div>
            </div>
            
            <div className="absolute -top-6 -right-6 bg-white dark:bg-gray-800 p-4 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">📍</span>
                </div>
                <div>
                  <div className="font-bold text-gray-900 dark:text-white">Sede Principal</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Cuemanco Isla 5</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;