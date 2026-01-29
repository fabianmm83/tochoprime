// components/landing/UpcomingMatches.tsx
import React, { useState, useEffect } from 'react';
import { Calendar, MapPin, Clock, ChevronRight } from 'lucide-react';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { Match, Team } from '../../types';

interface MatchWithTeams extends Match {
  homeTeamData?: Team;
  awayTeamData?: Team;
}

const UpcomingMatches: React.FC = () => {
  const [matches, setMatches] = useState<MatchWithTeams[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState('hoy');

  useEffect(() => {
    const fetchUpcomingMatches = async () => {
      try {
        setLoading(true);
        
        // Obtener partidos próximos (scheduled)
        const matchesRef = collection(db, 'matches');
        const q = query(
          matchesRef,
          where('status', '==', 'scheduled'),
          orderBy('matchDate', 'asc'),
          limit(10)
        );
        
        const snapshot = await getDocs(q);
        
        if (snapshot.empty) {
          setMatches([]);
          return;
        }
        
        const matchesData = await Promise.all(
          snapshot.docs.map(async (doc) => {
            const match = {
              id: doc.id,
              ...doc.data()
            } as Match;
            
            // Obtener datos de los equipos
            let homeTeamData: Team | undefined;
            let awayTeamData: Team | undefined;
            
            if (match.homeTeamId) {
              const homeTeamDoc = await getDocs(
                query(collection(db, 'teams'), where('id', '==', match.homeTeamId))
              );
              if (!homeTeamDoc.empty) {
                homeTeamData = homeTeamDoc.docs[0].data() as Team;
              }
            }
            
            if (match.awayTeamId) {
              const awayTeamDoc = await getDocs(
                query(collection(db, 'teams'), where('id', '==', match.awayTeamId))
              );
              if (!awayTeamDoc.empty) {
                awayTeamData = awayTeamDoc.docs[0].data() as Team;
              }
            }
            
            return {
              ...match,
              homeTeamData,
              awayTeamData
            } as MatchWithTeams;
          })
        );
        
        setMatches(matchesData);
      } catch (error) {
        console.error('Error cargando partidos:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUpcomingMatches();
  }, []);

  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleDateString('es-MX', {
      weekday: 'short',
      day: 'numeric',
      month: 'short'
    });
  };

  const formatTime = (time: string) => {
    return time;
  };

  const getMatchStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400';
      case 'in_progress': return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400';
      case 'completed': return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-400';
      default: return 'bg-gray-100 dark:bg-gray-700';
    }
  };

  if (loading) {
    return (
      <section className="py-16 bg-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-tocho-primary mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Cargando partidos...</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 bg-white dark:bg-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-6 py-3 bg-green-50 dark:bg-green-900/30 rounded-full mb-6">
            <Calendar size={20} className="text-green-600 dark:text-green-400" />
            <span className="font-semibold text-green-700 dark:text-green-400">
              Próximos Partidos
            </span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-6">
            Calendario de Juegos
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            No te pierdas los próximos encuentros de la temporada
          </p>
        </div>

        {/* Filtros de fecha */}
        <div className="flex flex-wrap gap-2 justify-center mb-8">
          {['hoy', 'mañana', 'esta semana', 'todos'].map((date) => (
            <button
              key={date}
              onClick={() => setSelectedDate(date)}
              className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                selectedDate === date
                  ? 'bg-tocho-primary text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {date.charAt(0).toUpperCase() + date.slice(1)}
            </button>
          ))}
        </div>

        {/* Lista de partidos */}
        {matches.length === 0 ? (
          <div className="text-center py-12">
            <Calendar size={48} className="text-gray-400 dark:text-gray-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              No hay partidos próximos
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Pronto se publicará el calendario oficial
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-4 mb-8">
              {matches.slice(0, 6).map((match) => {
                const matchDate = new Date(match.matchDate);
                const formattedDate = formatDate(matchDate);
                
                return (
                  <div 
                    key={match.id}
                    className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6 hover:shadow-lg transition-shadow border border-gray-200 dark:border-gray-600"
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      {/* Info de fecha/hora */}
                      <div className="flex items-center gap-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-tocho-primary">
                            {matchDate.getDate()}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {matchDate.toLocaleDateString('es-MX', { weekday: 'short' })}
                          </div>
                        </div>
                        <div className="h-12 w-px bg-gray-300 dark:bg-gray-600"></div>
                        <div>
                          <div className="flex items-center gap-2 text-gray-900 dark:text-white">
                            <Clock size={18} />
                            <span className="font-semibold">{formatTime(match.matchTime)}</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 mt-1">
                            <MapPin size={16} />
                            <span>Cuemanco Isla • Campo {match.fieldId?.split('-').pop() || 'N/A'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Equipos */}
                      <div className="flex-1 text-center md:text-left">
                        <div className="grid grid-cols-3 gap-4 items-center">
                          <div className="text-right">
                            <div className="font-bold text-lg text-gray-900 dark:text-white truncate">
                              {match.homeTeamData?.name || match.homeTeamId}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">Local</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-gray-400 mx-4">vs</div>
                            <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getMatchStatusColor(match.status)}`}>
                              {match.status === 'scheduled' ? 'Programado' : 
                               match.status === 'in_progress' ? 'En vivo' : 
                               'Finalizado'}
                            </span>
                          </div>
                          <div className="text-left">
                            <div className="font-bold text-lg text-gray-900 dark:text-white truncate">
                              {match.awayTeamData?.name || match.awayTeamId}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">Visitante</div>
                          </div>
                        </div>
                      </div>

                      {/* Categoría y acción */}
                      <div className="text-right">
                        <div className="inline-block px-4 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full text-sm font-semibold mb-3">
                          {match.categoryId?.replace('-', ' ').toUpperCase() || 'SIN CATEGORÍA'}
                        </div>
                        <div>
                          <a
                            href="/login"
                            className="text-tocho-primary hover:text-blue-700 font-semibold flex items-center gap-1 justify-end"
                          >
                            Ver detalles
                            <ChevronRight size={18} />
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* CTA */}
            <div className="text-center">
              <a
                href="/login"
                className="inline-flex items-center gap-2 px-8 py-3 bg-tocho-primary text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Calendar size={20} />
                Inicia sesión para ver Calendario Completo
                <ChevronRight size={20} />
              </a>
            </div>
          </>
        )}
      </div>
    </section>
  );
};

export default UpcomingMatches;