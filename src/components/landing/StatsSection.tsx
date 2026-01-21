import React from 'react';
import { Trophy, Users, CalendarDays, MapPin, Target, Award } from 'lucide-react';

const StatsSection: React.FC = () => {
  const stats = [
    {
      icon: <Trophy className="text-yellow-500" size={24} />,
      value: '3',
      label: 'Temporadas',
      description: 'Competitivas'
    },
    {
      icon: <Users className="text-blue-500" size={24} />,
      value: '150+',
      label: 'Equipos',
      description: 'Registrados'
    },
    {
      icon: <MapPin className="text-green-500" size={24} />,
      value: '16',
      label: 'Campos',
      description: 'Profesionales'
    },
    {
      icon: <CalendarDays className="text-purple-500" size={24} />,
      value: '1,200+',
      label: 'Partidos',
      description: 'Jugados'
    },
    {
      icon: <Target className="text-red-500" size={24} />,
      value: '7',
      label: 'Categorías',
      description: 'A-G'
    },
    {
      icon: <Award className="text-indigo-500" size={24} />,
      value: '12',
      label: 'Árbitros',
      description: 'Certificados'
    }
  ];

  return (
    <section className="py-16 bg-gray-50 dark:bg-gray-900/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Tocho Prime en Números
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            La liga más grande y organizada del tocho flag
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
          {stats.map((stat, index) => (
            <div 
              key={index} 
              className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-shadow"
            >
              <div className="flex flex-col items-center text-center">
                <div className="mb-4 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
                  {stat.icon}
                </div>
                <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                  {stat.value}
                </div>
                <div className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  {stat.label}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {stat.description}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Additional stats */}
        <div className="mt-12 grid md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-xl">
            <div className="text-4xl font-bold mb-2">99%</div>
            <div className="text-lg font-semibold">Satisfacción</div>
            <div className="text-blue-100">De capitanes y jugadores</div>
          </div>
          
          <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-6 rounded-xl">
            <div className="text-4xl font-bold mb-2">24/7</div>
            <div className="text-lg font-semibold">Soporte</div>
            <div className="text-green-100">Sistema siempre activo</div>
          </div>
          
          <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-6 rounded-xl">
            <div className="text-4xl font-bold mb-2">100%</div>
            <div className="text-lg font-semibold">Profesional</div>
            <div className="text-purple-100">Gestión deportiva</div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default StatsSection;