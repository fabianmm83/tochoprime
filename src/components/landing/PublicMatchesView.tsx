// components/landing/PublicMatchesView.tsx
import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  MapPin, 
  Clock, 
  ChevronRight, 
  Trophy,
  Users,
  Target
} from 'lucide-react';
import { 
  collection, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit,
  documentId
} from 'firebase/firestore';
import { db } from '../../services/firebase';
import { Match, Team } from '../../types';

interface MatchWithTeams extends Match {
  homeTeamData?: Team;
  awayTeamData?: Team;
  categoryName?: string;
  divisionName?: string;
}

const PublicMatchesView: React.FC = () => {
  const [matches, setMatches] = useState<MatchWithTeams[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'upcoming' | 'recent' | 'live'>('upcoming');
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        setLoading(true);
        
        // Construir consulta según el filtro
        const matchesRef = collection(db, 'matches');
        let q;
        
        const now = new Date();
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        
        switch (filter) {
          case 'upcoming':
            q = query(
              matchesRef,
              where('matchDate', '>=', now.toISOString().split('T')[0]),
              where('status', '==', 'scheduled'),
              orderBy('matchDate', 'asc'),
              limit(20)
            );
            break;
            
          case 'recent':
            q = query(
              matchesRef,
              where('matchDate', '>=', yesterday.toISOString().split('T')[0]),
              where('status', '==', 'completed'),
              orderBy('matchDate', 'desc'),
              limit(20)
            );
            break;
            
          case 'live':
            q = query(
              matchesRef,
              where('status', '==', 'in_progress'),
              orderBy('matchDate', 'desc'),
              limit(10)
            );
            break;
            
          default:
            q = query(
              matchesRef,
              orderBy('matchDate', 'desc'),
              limit(20)
            );
        }
        
        const snapshot = await getDocs(q);
        
        if (snapshot.empty) {
          setMatches([]);
          return;
        }
        
        // Extraer IDs de equipos
        const matchData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Match[];
        
        // Obtener todos los teamIds únicos
        const teamIds = Array.from(new Set(
          matchData.flatMap(match => [match.homeTeamId, match.awayTeamId].filter(Boolean))
        ));
        
        // Obtener datos de equipos en batch
        let teamsData: Team[] = [];
        if (teamIds.length > 0) {
          const teamsRef = collection(db, 'teams');
          const teamsQuery = query(
            teamsRef,
            where(documentId(), 'in', teamIds.slice(0, 10)) // Firestore limita a 10 en consultas 'in'
          );
          const teamsSnapshot = await getDocs(teamsQuery);
          teamsData = teamsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as Team[];
        }
        
        // Combinar matches con datos de equipos
        const matchesWithTeams = await Promise.all(
          matchData.map(async (match) => {
            const homeTeamData = teamsData.find(team => team.id === match.homeTeamId);
            const awayTeamData = teamsData.find(team => team.id === match.awayTeamId);
            
            // Obtener nombre de categoría si existe
            let categoryName = '';
            if (match.categoryId) {
              try {
                const categoriesRef = collection(db, 'categories');
                const catQuery = query(
                  categoriesRef,
                  where(documentId(), '==', match.categoryId)
                );
                const catSnapshot = await getDocs(catQuery);
                if (!catSnapshot.empty) {
                  const catData = catSnapshot.docs[0].data();
                  categoryName = catData.name || match.categoryId;
                }
              } catch (error) {
                console.error('Error obteniendo categoría:', error);
              }
            }
            
            // Obtener nombre de división si existe
            let divisionName = '';
            if (match.divisionId) {
              divisionName = match.divisionId === 'varonil' ? 'Varonil' :
                            match.divisionId === 'femenil' ? 'Femenil' :
                            match.divisionId === 'mixto' ? 'Mixto' : match.divisionId;
            }
            
            return {
              ...match,
              homeTeamData,
              awayTeamData,
              categoryName,
              divisionName
            } as MatchWithTeams;
          })
        );
        
        // Extraer categorías únicas para filtro
        const uniqueCategories = Array.from(new Set(
          matchesWithTeams
            .map(match => match.categoryName)
            .filter(Boolean) as string[]
        ));
        setCategories(['all', ...uniqueCategories]);
        
        setMatches(matchesWithTeams);
      } catch (error) {
        console.error('Error cargando partidos:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMatches();
  }, [filter]);

  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (d.toDateString() === today.toDateString()) {
      return 'Hoy';
    } else if (d.toDateString() === tomorrow.toDateString()) {
      return 'Mañana';
    } else {
      return d.toLocaleDateString('es-MX', {
        weekday: 'short',
        day: 'numeric',
        month: 'short'
      });
    }
  };

  const formatTime = (time: string) => {
    if (!time) return '';
    return time.length === 5 ? time : // Si ya tiene formato HH:mm
           time.includes(':') ? time : // Si ya tiene algún formato
           `${time}:00`; // Si es solo la hora
  };

  const getMatchStatus = (match: MatchWithTeams) => {
    switch (match.status) {
      case 'scheduled':
        return { text: 'Programado', color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400' };
      case 'in_progress':
        return { text: 'En Vivo', color: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400' };
      case 'completed':
        return { text: 'Finalizado', color: 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-400' };
      case 'cancelled':
        return { text: 'Cancelado', color: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400' };
      default:
        return { text: 'Por definir', color: 'bg-gray-100 dark:bg-gray-700' };
    }
  };

  const getScoreDisplay = (match: MatchWithTeams) => {
    if (match.status === 'completed' && match.homeScore !== undefined && match.awayScore !== undefined) {
      return `${match.homeScore} - ${match.awayScore}`;
    }
    return 'VS';
  };

  const filteredMatches = selectedCategory === 'all' 
    ? matches 
    : matches.filter(match => match.categoryName === selectedCategory);

  if (loading) {
    return (
      <section className="py-16 bg-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-tocho-primary mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">
              Cargando partidos...
            </p>
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
              Partidos de la Liga
            </span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-6">
            Calendario y Resultados
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            Sigue todos los encuentros de la temporada
          </p>
        </div>

        {/* Filtros principales */}
        <div className="flex flex-wrap gap-2 justify-center mb-6">
          {[
            { key: 'upcoming', label: 'Próximos', icon: Calendar },
            { key: 'recent', label: 'Recientes', icon: Trophy },
            { key: 'live', label: 'En Vivo', icon: Target }
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setFilter(key as any)}
              className={`px-6 py-3 rounded-lg font-semibold transition-all flex items-center gap-2 ${
                filter === key
                  ? 'bg-tocho-primary text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              <Icon size={18} />
              {label}
            </button>
          ))}
        </div>

        {/* Filtro de categorías */}
        {categories.length > 1 && (
          <div className="flex flex-wrap gap-2 justify-center mb-8">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  selectedCategory === category
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {category === 'all' ? 'Todas' : category}
              </button>
            ))}
          </div>
        )}

        {/* Estadísticas rápidas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {matches.filter(m => m.status === 'scheduled').length}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Próximos</div>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {matches.filter(m => m.status === 'in_progress').length}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">En Vivo</div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-300">
              {matches.filter(m => m.status === 'completed').length}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Finalizados</div>
          </div>
        </div>

        {/* Lista de partidos */}
        {filteredMatches.length === 0 ? (
          <div className="text-center py-12">
            <Calendar size={48} className="text-gray-400 dark:text-gray-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              No hay partidos {filter === 'upcoming' ? 'próximos' : filter === 'recent' ? 'recientes' : 'en vivo'}
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {filter === 'upcoming' 
                ? 'El calendario se publicará próximamente' 
                : filter === 'recent'
                ? 'No hay partidos jugados recientemente'
                : 'No hay partidos en vivo en este momento'}
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-6 mb-8">
              {filteredMatches.slice(0, 10).map((match) => {
                const matchDate = new Date(match.matchDate);
                const status = getMatchStatus(match);
                const scoreDisplay = getScoreDisplay(match);
                
                return (
                  <div 
                    key={match.id}
                    className={`bg-gray-50 dark:bg-gray-700 rounded-xl p-6 hover:shadow-lg transition-shadow border ${
                      match.status === 'in_progress' 
                        ? 'border-green-500 dark:border-green-700' 
                        : 'border-gray-200 dark:border-gray-600'
                    }`}
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      {/* Información de fecha/hora */}
                      <div className="flex items-center gap-4">
                        <div className="text-center min-w-[60px]">
                          <div className="text-2xl font-bold text-tocho-primary">
                            {formatDate(matchDate)}
                          </div>
                          <div className="flex items-center justify-center gap-1 text-sm text-gray-600 dark:text-gray-400 mt-1">
                            <Clock size={14} />
                            {formatTime(match.matchTime)}
                          </div>
                        </div>
                        
                        <div className="h-12 w-px bg-gray-300 dark:bg-gray-600"></div>
                        
                        <div>
                          <div className="flex items-center gap-2">
                            <MapPin size={16} className="text-gray-500" />
                            <span className="text-gray-700 dark:text-gray-300">
                              {match.fieldId ? `Campo ${match.fieldId.split('-').pop()}` : 'Por definir'}
                            </span>
                          </div>
                          <div className="mt-2">
                            <span className={`px-3 py-1 text-xs font-semibold rounded-full ${status.color}`}>
                              {status.text}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Equipos y resultado */}
                      <div className="flex-1">
                        <div className="grid grid-cols-5 gap-4 items-center">
                          {/* Equipo local */}
                          <div className="col-span-2 text-right">
                            <div className="font-bold text-lg text-gray-900 dark:text-white truncate">
                              {match.homeTeamData?.name || match.homeTeamId || 'Equipo Local'}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              Local
                              {match.homeTeamData?.divisionId && ` • ${match.homeTeamData.divisionId}`}
                            </div>
                          </div>
                          
                          {/* Marcador */}
                          <div className="col-span-1 text-center">
                            <div className="text-3xl font-bold mb-2">
                              {scoreDisplay}
                            </div>
                            {match.status === 'completed' && match.winner && (
                              <div className="text-xs text-gray-600 dark:text-gray-400">
                                {match.winner === 'home' ? 'Ganó Local' : 
                                 match.winner === 'away' ? 'Ganó Visitante' : 'Empate'}
                              </div>
                            )}
                          </div>
                          
                          {/* Equipo visitante */}
                          <div className="col-span-2 text-left">
                            <div className="font-bold text-lg text-gray-900 dark:text-white truncate">
                              {match.awayTeamData?.name || match.awayTeamId || 'Equipo Visitante'}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              Visitante
                              {match.awayTeamData?.divisionId && ` • ${match.awayTeamData.divisionId}`}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Información adicional */}
                      <div className="text-right">
                        <div className="space-y-2">
                          {match.categoryName && (
                            <div className="inline-block px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full text-sm font-medium">
                              {match.categoryName}
                            </div>
                          )}
                          {match.divisionName && (
                            <div className="text-xs text-gray-600 dark:text-gray-400">
                              {match.divisionName}
                            </div>
                          )}
                        </div>
                        
                        {/* Acción */}
                        <div className="mt-3">
                          <a
                            href="/login"
                            className="inline-flex items-center gap-1 text-tocho-primary hover:text-blue-700 font-medium text-sm"
                          >
                            Ver detalles
                            <ChevronRight size={16} />
                          </a>
                        </div>
                      </div>
                    </div>
                    
                    {/* Información adicional para partidos en vivo */}
                    {match.status === 'in_progress' && (
                      <div className="mt-4 pt-4 border-t border-green-200 dark:border-green-800">
                        <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                          <Target size={16} className="animate-pulse" />
                          <span className="font-semibold">PARTIDO EN VIVO</span>
                          <span className="ml-auto text-sm">
                            Minuto: {match.resultDetails?.halftimeScore ? '2° Tiempo' : '1° Tiempo'}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* CTA */}
            <div className="text-center">
              <div className="mb-4">
                <p className="text-gray-600 dark:text-gray-400">
                  Mostrando {filteredMatches.length} de {matches.length} partidos
                </p>
              </div>
              <a
                href="/login"
                className="inline-flex items-center gap-2 px-8 py-3 bg-tocho-primary text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Users size={20} />
                Inicia sesión para ver todos los partidos y estadísticas
                <ChevronRight size={20} />
              </a>
            </div>
          </>
        )}
      </div>
    </section>
  );
};

export default PublicMatchesView;