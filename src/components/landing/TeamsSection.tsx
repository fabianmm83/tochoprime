import React, { useState } from 'react';
import { Users, Trophy, Star, Target, TrendingUp, ChevronRight } from 'lucide-react';

const TeamsSection: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState('all');

  const categories = [
    { id: 'all', name: 'Todos', count: 150 },
    { id: 'varonil', name: 'Varonil', count: 80 },
    { id: 'femenil', name: 'Femenil', count: 40 },
    { id: 'mixto', name: 'Mixto', count: 30 }
  ];

  const topTeams = [
    {
      name: 'Tiburones Azules',
      category: 'Varonil A',
      wins: 28,
      losses: 2,
      points: 84,
      streak: 'W8',
      players: 15,
      founded: 2021,
      color: 'bg-blue-500'
    },
    {
      name: 'Águilas Doradas',
      category: 'Varonil A',
      wins: 25,
      losses: 5,
      points: 75,
      streak: 'W5',
      players: 14,
      founded: 2020,
      color: 'bg-yellow-500'
    },
    {
      name: 'Leones Rojos',
      category: 'Varonil B',
      wins: 22,
      losses: 8,
      points: 66,
      streak: 'W3',
      players: 16,
      founded: 2022,
      color: 'bg-red-500'
    },
    {
      name: 'Fénix Femenil',
      category: 'Femenil A',
      wins: 26,
      losses: 4,
      points: 78,
      streak: 'W6',
      players: 14,
      founded: 2022,
      color: 'bg-purple-500'
    },
    {
      name: 'Halcones Negros',
      category: 'Mixto A',
      wins: 24,
      losses: 6,
      points: 72,
      streak: 'W4',
      players: 15,
      founded: 2021,
      color: 'bg-gray-800'
    },
    {
      name: 'Dragones Verdes',
      category: 'Varonil C',
      wins: 20,
      losses: 10,
      points: 60,
      streak: 'L2',
      players: 13,
      founded: 2023,
      color: 'bg-green-500'
    }
  ];

  const featuredPlayers = [
    { name: 'Carlos Martínez', team: 'Tiburones', position: 'QB', stats: '3,452 YDS, 42 TDs', avatar: 'CM' },
    { name: 'Ana Rodríguez', team: 'Águilas', position: 'WR', stats: '1,280 YDS, 18 TDs', avatar: 'AR' },
    { name: 'Miguel Torres', team: 'Leones', position: 'LB', stats: '24 Sacks, 8 INTs', avatar: 'MT' },
    { name: 'Laura Sánchez', team: 'Fénix', position: 'QB', stats: '2,890 YDS, 35 TDs', avatar: 'LS' }
  ];

  return (
    <section className="py-16 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Equipos Destacados
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            Conoce a los mejores equipos y jugadores de la liga
          </p>
        </div>

        {/* Categories */}
        <div className="flex flex-wrap gap-2 justify-center mb-12">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setActiveCategory(category.id)}
              className={`px-6 py-3 rounded-full font-semibold transition-all ${
                activeCategory === category.id
                  ? 'bg-tocho-primary text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              {category.name}
              <span className="ml-2 text-sm opacity-80">({category.count})</span>
            </button>
          ))}
        </div>

        {/* Top Teams Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {topTeams.map((team, index) => (
            <div 
              key={index} 
              className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-xl transition-all"
            >
              {/* Team Header */}
              <div className={`p-6 ${team.color} text-white`}>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-2xl font-bold">{team.name}</h3>
                    <p className="opacity-90">{team.category}</p>
                  </div>
                  {index < 3 && (
                    <div className="flex items-center gap-1">
                      <Star size={20} className="fill-yellow-300 text-yellow-300" />
                      <Star size={20} className="fill-yellow-300 text-yellow-300" />
                      <Star size={20} className="fill-yellow-300 text-yellow-300" />
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Trophy size={20} />
                    <span className="font-semibold">Fundado: {team.founded}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users size={20} />
                    <span>{team.players} jugadores</span>
                  </div>
                </div>
              </div>

              {/* Team Stats */}
              <div className="p-6">
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-gray-900 dark:text-white">{team.wins}</div>
                    <div className="text-gray-600 dark:text-gray-400 text-sm">Victorias</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-gray-900 dark:text-white">{team.losses}</div>
                    <div className="text-gray-600 dark:text-gray-400 text-sm">Derrotas</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-gray-900 dark:text-white">{team.points}</div>
                    <div className="text-gray-600 dark:text-gray-400 text-sm">Puntos</div>
                  </div>
                  <div className="text-center">
                    <div className={`text-3xl font-bold ${
                      team.streak.startsWith('W') ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {team.streak}
                    </div>
                    <div className="text-gray-600 dark:text-gray-400 text-sm">Racha</div>
                  </div>
                </div>

                {/* Action */}
                <button className="w-full py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2">
                  Ver Perfil Completo
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Featured Players */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-8">
            <Target size={32} className="text-red-500" />
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
              Jugadores Estelares
            </h3>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredPlayers.map((player, index) => (
              <div 
                key={index} 
                className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all"
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                    {player.avatar}
                  </div>
                  <div>
                    <h4 className="font-bold text-lg text-gray-900 dark:text-white">
                      {player.name}
                    </h4>
                    <p className="text-gray-600 dark:text-gray-400">
                      {player.team} • {player.position}
                    </p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-sm text-gray-700 dark:text-gray-300 font-medium">
                    {player.stats}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <TrendingUp size={16} />
                    <span>Temporada destacada 2023</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Registration CTA */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-center text-white">
          <h3 className="text-2xl font-bold mb-4">¿Quieres que tu equipo aparezca aquí?</h3>
          <p className="text-blue-100 mb-6">
            Regístrate en la próxima temporada y compite por ser el mejor
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="px-8 py-3 bg-white text-blue-600 font-semibold rounded-lg hover:bg-blue-50 transition-colors flex items-center justify-center gap-2">
              <Users size={20} />
              Registrar Equipo
            </button>
            <button className="px-8 py-3 bg-transparent border-2 border-white text-white font-semibold rounded-lg hover:bg-white/10 transition-colors">
              Ver Calendario Completo
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TeamsSection;