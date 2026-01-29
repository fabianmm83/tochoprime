// components/landing/PublicStandings.tsx
import React, { useState, useEffect } from 'react';
import { Trophy, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { Team } from '../../types';

interface Standing {
  position: number;
  team: Team;
  matchesPlayed: number;
  wins: number;
  losses: number;
  draws: number;
  points: number;
  streak: string;
  change: 'up' | 'down' | 'same';
}

const PublicStandings: React.FC = () => {
  const [standings, setStandings] = useState<Standing[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('Varonil A');
  
  // Esto debería venir de tu base de datos
  const categories = ['Varonil A', 'Femenil A', 'Mixto A', 'Varonil B'];

  useEffect(() => {
    const fetchStandings = async () => {
      try {
        setLoading(true);
        
        // Obtener equipos ordenados por puntos
        const teamsRef = collection(db, 'teams');
        const q = query(
          teamsRef,
          where('status', 'in', ['active', 'approved']),
          orderBy('stats.points', 'desc'),
          limit(10)
        );
        
        const snapshot = await getDocs(q);
        
        if (snapshot.empty) {
          setStandings([]);
          return;
        }
        
        const teamsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Team[];
        
        // Convertir equipos a standings
        const standingsData: Standing[] = teamsData.map((team, index) => {
          const stats = team.stats || {
            matchesPlayed: 0,
            wins: 0,
            losses: 0,
            draws: 0,
            points: 0
          };
          
          // Simular datos para demostración
          const streak = index < 3 ? 'W' + (index + 3) : 
                        index < 6 ? 'L' + (index - 2) : 'D' + (index - 5);
          const change = index < 2 ? 'up' : 
                        index < 5 ? 'same' : 'down';
          
          return {
            position: index + 1,
            team,
            matchesPlayed: stats.matchesPlayed,
            wins: stats.wins,
            losses: stats.losses,
            draws: stats.draws || 0,
            points: stats.points,
            streak: streak,
            change: change
          };
        });
        
        setStandings(standingsData);
      } catch (error) {
        console.error('Error cargando tabla de posiciones:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStandings();
  }, []);

  if (loading) {
    return (
      <section className="py-16 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-tocho-primary mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Cargando tabla de posiciones...</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-6 py-3 bg-yellow-50 dark:bg-yellow-900/30 rounded-full mb-6">
            <Trophy size={20} className="text-yellow-600 dark:text-yellow-400" />
            <span className="font-semibold text-yellow-700 dark:text-yellow-400">
              Tabla de Posiciones
            </span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-6">
            Clasificación Actual
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            Seguimiento en tiempo real de todas las categorías
          </p>
        </div>

        {/* Selector de categoría */}
        <div className="flex flex-wrap gap-2 justify-center mb-8">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                selectedCategory === category
                  ? 'bg-tocho-primary text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Tabla */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100 dark:bg-gray-700">
                <tr>
                  <th className="p-4 text-left font-semibold text-gray-900 dark:text-white">Pos</th>
                  <th className="p-4 text-left font-semibold text-gray-900 dark:text-white">Equipo</th>
                  <th className="p-4 text-center font-semibold text-gray-900 dark:text-white">PJ</th>
                  <th className="p-4 text-center font-semibold text-gray-900 dark:text-white">V</th>
                  <th className="p-4 text-center font-semibold text-gray-900 dark:text-white">D</th>
                  <th className="p-4 text-center font-semibold text-gray-900 dark:text-white">E</th>
                  <th className="p-4 text-center font-semibold text-gray-900 dark:text-white">Pts</th>
                  <th className="p-4 text-center font-semibold text-gray-900 dark:text-white">Racha</th>
                  <th className="p-4 text-center font-semibold text-gray-900 dark:text-white">Tendencia</th>
                </tr>
              </thead>
              <tbody>
                {standings.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-gray-600 dark:text-gray-400">
                      No hay datos disponibles
                    </td>
                  </tr>
                ) : (
                  standings.map((standing) => (
                    <tr 
                      key={standing.position}
                      className={`border-t border-gray-200 dark:border-gray-700 ${
                        standing.position <= 3 ? 'bg-blue-50/50 dark:bg-blue-900/20' : ''
                      }`}
                    >
                      <td className="p-4">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          standing.position === 1 ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400' :
                          standing.position === 2 ? 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300' :
                          standing.position === 3 ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-400' :
                          'bg-gray-50 dark:bg-gray-800'
                        }`}>
                          {standing.position}
                        </div>
                      </td>
                      <td className="p-4 font-medium text-gray-900 dark:text-white">
                        {standing.team.name}
                      </td>
                      <td className="p-4 text-center text-gray-700 dark:text-gray-300">{standing.matchesPlayed}</td>
                      <td className="p-4 text-center text-green-600 dark:text-green-400 font-semibold">{standing.wins}</td>
                      <td className="p-4 text-center text-red-600 dark:text-red-400 font-semibold">{standing.losses}</td>
                      <td className="p-4 text-center text-gray-600 dark:text-gray-400">{standing.draws}</td>
                      <td className="p-4 text-center font-bold text-gray-900 dark:text-white">{standing.points}</td>
                      <td className="p-4 text-center">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          standing.streak.startsWith('W') 
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400' 
                            : standing.streak.startsWith('L')
                            ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-400'
                        }`}>
                          {standing.streak}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        {standing.change === 'up' && <TrendingUp size={20} className="text-green-500 mx-auto" />}
                        {standing.change === 'down' && <TrendingDown size={20} className="text-red-500 mx-auto" />}
                        {standing.change === 'same' && <Minus size={20} className="text-gray-500 mx-auto" />}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          {/* Footer de tabla */}
          <div className="bg-gray-50 dark:bg-gray-700 px-6 py-4 border-t border-gray-200 dark:border-gray-600">
            <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
              <div>
                <span className="font-semibold">Categoría:</span> {selectedCategory}
              </div>
              <div>
                <span className="font-semibold">Actualizado:</span> Hoy, {new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center mt-8">
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Inicia sesión para ver estadísticas detalladas y todas las categorías
          </p>
          <a
            href="/login"
            className="inline-flex items-center gap-2 px-6 py-3 bg-tocho-primary text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
          >
            Iniciar Sesión
          </a>
        </div>
      </div>
    </section>
  );
};

export default PublicStandings;