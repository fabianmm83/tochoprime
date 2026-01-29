import React from 'react';
import { Shield, Users, Trophy, Calendar, CheckCircle } from 'lucide-react';

const SimpleFeatures: React.FC = () => {
  const features = [
    {
      icon: <Users size={24} className="text-blue-500" />,
      title: "371 Equipos",
      description: "Competiendo en 3 divisiones"
    },
    {
      icon: <Calendar size={24} className="text-green-500" />,
      title: "9 Jornadas",
      description: "Temporada Primavera 2026"
    },
    {
      icon: <Trophy size={24} className="text-yellow-500" />,
      title: "20 Categorías",
      description: "Desde A hasta F"
    },
    {
      icon: <Shield size={24} className="text-purple-500" />,
      title: "Profesional",
      description: "Árbitros certificados"
    }
  ];

  return (
    <section className="py-16 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Liga Organizada y Competitiva
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            Todo lo que necesitas para disfrutar del tocho flag
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div 
              key={index}
              className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 text-center"
            >
              <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mx-auto mb-4">
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                {feature.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {feature.description}
              </p>
            </div>
          ))}
        </div>

        {/* Quick facts */}
        <div className="mt-12 bg-gradient-to-r from-tocho-primary to-blue-600 rounded-2xl p-8 text-white">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold">2</div>
              <div className="text-sm opacity-90">Sedes</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold">16</div>
              <div className="text-sm opacity-90">Campos</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold">100%</div>
              <div className="text-sm opacity-90">Césped Natural</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold">24/7</div>
              <div className="text-sm opacity-90">Soporte</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SimpleFeatures;