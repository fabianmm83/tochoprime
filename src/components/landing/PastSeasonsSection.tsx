import React from 'react';
import { Trophy, Calendar, Users, Award, TrendingUp } from 'lucide-react';

const PastSeasonsSection: React.FC = () => {
  const seasons = [
    {
      year: '2023',
      champion: 'Tiburones Azules',
      runnerUp: 'Águilas Doradas',
      totalTeams: 128,
      totalMatches: 856,
      highlight: 'Temporada récord de asistencia'
    },
    {
      year: '2022',
      champion: 'Leones Rojos',
      runnerUp: 'Tiburones Azules',
      totalTeams: 96,
      totalMatches: 642,
      highlight: 'Primera temporada femenil'
    },
    {
      year: '2021',
      champion: 'Halcones Negros',
      runnerUp: 'Leones Rojos',
      totalTeams: 64,
      totalMatches: 420,
      highlight: 'Temporada inaugural'
    }
  ];

  const awards = [
    { player: 'Carlos Martínez', team: 'Tiburones Azules', award: 'MVP Temporada 2023', stats: '28 TDs, 12 intercepciones' },
    { player: 'Ana Rodríguez', team: 'Águilas Doradas', award: 'Mejor Quarterback 2023', stats: '3,452 yardas, 42 TDs' },
    { player: 'Miguel Torres', team: 'Leones Rojos', award: 'Mejor Defensa 2022', stats: '24 capturas, 8 intercepciones' },
    { player: 'Laura Sánchez', team: 'Fénix Femenil', award: 'Revelación 2022', stats: '18 TDs, 650 yardas' }
  ];

  return (
    <section className="py-16 bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Temporadas Pasadas
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            Historia y legado de la liga más competitiva
          </p>
        </div>

        {/* Seasons Timeline */}
        <div className="mb-16">
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-gray-300 dark:bg-gray-700"></div>
            
            <div className="relative grid grid-cols-1 md:grid-cols-3 gap-8">
              {seasons.map((season, index) => (
                <div key={index} className="relative">
                  {/* Timeline dot */}
                  <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 w-8 h-8 bg-tocho-primary rounded-full border-4 border-white dark:border-gray-800 z-10"></div>
                  
                  <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 mt-12">
                    <div className="text-center mb-6">
                      <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 dark:bg-blue-900/30 rounded-full mb-3">
                        <Calendar size={16} className="text-blue-600 dark:text-blue-400" />
                        <span className="font-bold text-blue-700 dark:text-blue-400">
                          Temporada {season.year}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-center gap-4 mb-4">
                        <Trophy size={32} className="text-yellow-500" />
                        <div>
                          <div className="font-bold text-xl text-gray-900 dark:text-white">
                            {season.champion}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            Campeones
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 dark:text-gray-400">Subcampeón:</span>
                        <span className="font-semibold">{season.runnerUp}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 dark:text-gray-400">Equipos:</span>
                        <div className="flex items-center gap-2">
                          <Users size={16} className="text-gray-400" />
                          <span className="font-semibold">{season.totalTeams}</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 dark:text-gray-400">Partidos:</span>
                        <span className="font-semibold">{season.totalMatches}</span>
                      </div>
                      <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                        <div className="flex items-center gap-2">
                          <TrendingUp size={16} className="text-green-500" />
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {season.highlight}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Awards Section */}
        <div>
          <div className="flex items-center gap-3 mb-8">
            <Award size={32} className="text-yellow-500" />
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
              Reconocimientos Especiales
            </h3>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {awards.map((award, index) => (
              <div 
                key={index} 
                className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-shadow"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-yellow-100 to-yellow-200 dark:from-yellow-900/30 dark:to-yellow-800/30 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Trophy size={24} className="text-yellow-600 dark:text-yellow-400" />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-bold text-lg text-gray-900 dark:text-white">
                          {award.player}
                        </h4>
                        <p className="text-gray-600 dark:text-gray-400 text-sm">
                          {award.team}
                        </p>
                      </div>
                      <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs font-semibold rounded-full">
                        {award.award}
                      </span>
                    </div>
                    <div className="mt-3">
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        {award.stats}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Stats Growth */}
          <div className="mt-12 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl p-8 text-white">
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="text-4xl font-bold mb-2">300%</div>
                <div className="text-lg">Crecimiento de equipos</div>
                <div className="text-green-100 text-sm">Desde 2021</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold mb-2">185%</div>
                <div className="text-lg">Más partidos jugados</div>
                <div className="text-green-100 text-sm">Temporada a temporada</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold mb-2">95%</div>
                <div className="text-lg">Equipos recurrentes</div>
                <div className="text-green-100 text-sm">Fidelidad de equipos</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PastSeasonsSection;