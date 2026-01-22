import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, CheckCircle, Clock, Navigation } from 'lucide-react';

const LocationsSection: React.FC = () => {
  const navigate = useNavigate();

  const locations = [
    {
      name: 'Cuemanco Isla 5',
      status: 'active',
      description: 'Sede principal con 16 campos profesionales',
      features: [
        '16 campos de césped natural',
        'baños',
        '3 Área de comida'
      ],
      mapUrl: '#',
      color: 'bg-blue-500',
      stats: '150+ partidos/mes'
    },
    {
      name: 'Zague',
      status: 'active',
      description: 'Sede con 4 campos',
      features: [
        '4 campos de césped natural ',
        'baños ',
        'Área de Comida',
      ],
      mapUrl: '#',
      color: 'bg-purple-500',
      stats: 'Próximamente 2024'
    }
  ];

  return (
    <section className="py-16 bg-white dark:bg-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Nuestras Sedes
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            Instalaciones de primer nivel
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {locations.map((location, index) => (
            <div 
              key={index} 
              className={`border-2 rounded-2xl overflow-hidden hover:shadow-2xl transition-all ${location.status === 'active' ? 'border-blue-200 dark:border-blue-800' : 'border-purple-200 dark:border-purple-800'}`}
            >
              {/* Header */}
              <div className={`p-6 ${location.status === 'active' ? 'bg-blue-50 dark:bg-blue-900/20' : 'bg-purple-50 dark:bg-purple-900/20'}`}>
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${location.color} text-white`}>
                      <MapPin size={24} />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                        {location.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        {location.status === 'active' ? (
                          <>
                            <CheckCircle size={16} className="text-green-500" />
                            <span className="text-green-600 dark:text-green-400 font-medium">Activo</span>
                          </>
                        ) : (
                          <>
                            <Clock size={16} className="text-yellow-500" />
                            <span className="text-yellow-600 dark:text-yellow-400 font-medium">Próximamente</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-sm font-semibold px-3 py-1 rounded-full bg-white dark:bg-gray-800 border">
                    {location.stats}
                  </div>
                </div>
                <p className="text-gray-600 dark:text-gray-400">
                  {location.description}
                </p>
              </div>

              {/* Features */}
              <div className="p-6">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Características:</h4>
                <ul className="space-y-3">
                  {location.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-3">
                      <CheckCircle size={18} className="text-green-500 flex-shrink-0" />
                      <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* Map Preview */}
                <div className="mt-8 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                  <div className="aspect-video bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center">
                    <div className="text-center">
                      <Navigation size={48} className="text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                      <p className="text-gray-600 dark:text-gray-400">Mapa interactivo No disponible</p>
                    </div>
                  </div>
                </div>

                {/* Action Button */}
                <button
                  onClick={() => navigate('/campos')}
                  className={`w-full mt-6 py-3 rounded-lg font-semibold transition-colors ${location.status === 'active' 
                    ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                    : 'bg-purple-600 hover:bg-purple-700 text-white'}`}
                >
                  {location.status === 'active' ? 'Ver Mapa y Campos' : 'Más Información'}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Combined Map CTA */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-center text-white">
          <h3 className="text-2xl font-bold mb-4">¿Listo para jugar en nuestras sedes?</h3>
          <p className="text-blue-100 mb-6">
            Explora nuestros 16 campos en Cuemanco y reserva para tu equipo
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate('/campos')}
              className="px-8 py-3 bg-white text-blue-600 font-semibold rounded-lg hover:bg-blue-50 transition-colors flex items-center justify-center gap-2"
            >
              <Navigation size={20} />
              Explorar Mapa Interactivo
            </button>
            <button
              onClick={() => navigate('/register')}
              className="px-8 py-3 bg-transparent border-2 border-white text-white font-semibold rounded-lg hover:bg-white/10 transition-colors"
            >
              Registrar Equipo
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default LocationsSection;