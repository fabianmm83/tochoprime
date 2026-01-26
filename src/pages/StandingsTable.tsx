import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  orderBy,
  doc,
  getDoc
} from 'firebase/firestore';
import { db } from '../services/firebase';
import { 
  TrophyIcon, 
  ChevronUpIcon, 
  ChevronDownIcon, 
  MinusIcon,
  ArrowLeftIcon,
  FunnelIcon,
  UsersIcon,
  CalendarIcon,
} from '@heroicons/react/24/outline';
import { Team, Match, Season, Division, Category } from '../types';

interface Standing {
  teamId: string;
  teamName: string;
  logoUrl?: string;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  points: number;
  form: string[];
  streak: number;
  divisionName: string;
  categoryName: string;
}

interface CategoryStats {
  categoryId: string;
  categoryName: string;
  divisionName: string;
  divisionId: string;
  teamCount: number;
  matchesPlayed: number;
  totalGoals: number;
  avgGoalsPerMatch: number;
}

interface StandingsTableProps {
  seasonId?: string;
  divisionId?: string;
  categoryId?: string;
}

const StandingsTable: React.FC<StandingsTableProps> = ({ 
  seasonId: initialSeasonId,
  divisionId: initialDivisionId,
  categoryId: initialCategoryId
}) => {
  const navigate = useNavigate();
  const [standings, setStandings] = useState<Standing[]>([]);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryStats, setCategoryStats] = useState<CategoryStats[]>([]);
  
  const [selectedSeasonId, setSelectedSeasonId] = useState<string | null>(initialSeasonId || null);
  const [selectedDivisionId, setSelectedDivisionId] = useState<string>(initialDivisionId || 'all');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(initialCategoryId || 'all');
  
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [activeView, setActiveView] = useState<'standings' | 'categories'>('standings');

  // Cargar temporadas
  useEffect(() => {
    loadSeasons();
  }, []);

  // Cargar divisiones y categorías cuando se selecciona temporada
  useEffect(() => {
    if (selectedSeasonId) {
      loadDivisionsAndCategories();
      loadStandings();
    }
  }, [selectedSeasonId, selectedDivisionId, selectedCategoryId]);

  const loadSeasons = async () => {
    try {
      const seasonsQuery = query(
        collection(db, 'seasons'),
        orderBy('startDate', 'desc')
      );
      
      const seasonsSnapshot = await getDocs(seasonsQuery);
      const seasonsData: Season[] = seasonsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Season));
      
      setSeasons(seasonsData);
      
      // Seleccionar la temporada actual por defecto (la más reciente activa)
      const activeSeason = seasonsData.find(s => s.status === 'active') || seasonsData[0];
      if (activeSeason && !selectedSeasonId) {
        setSelectedSeasonId(activeSeason.id);
      }
    } catch (error) {
      console.error('Error loading seasons:', error);
    }
  };

  const loadDivisionsAndCategories = async () => {
    if (!selectedSeasonId) return;
    
    try {
      // Cargar divisiones
      const divisionsQuery = query(
        collection(db, 'divisions'),
        where('seasonId', '==', selectedSeasonId),
        orderBy('order')
      );
      
      const divisionsSnapshot = await getDocs(divisionsQuery);
      const divisionsData: Division[] = divisionsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Division));
      
      setDivisions(divisionsData);
      
      // Cargar categorías
      const categoriesQuery = query(
        collection(db, 'categories'),
        where('seasonId', '==', selectedSeasonId),
        orderBy('level')
      );
      
      const categoriesSnapshot = await getDocs(categoriesQuery);
      const categoriesData: Category[] = categoriesSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data
        } as Category;
      });
      
      setCategories(categoriesData);
      
      // Calcular estadísticas iniciales por categoría
      const initialStats: CategoryStats[] = categoriesData.map(category => {
        const division = divisionsData.find(d => d.id === category.divisionId);
        return {
          categoryId: category.id,
          categoryName: category.name,
          divisionName: division?.name || 'Sin división',
          divisionId: category.divisionId,
          teamCount: category.teamLimit || 0,
          matchesPlayed: 0,
          totalGoals: 0,
          avgGoalsPerMatch: 0
        };
      });
      
      setCategoryStats(initialStats);
    } catch (error) {
      console.error('Error loading divisions/categories:', error);
    }
  };

  const loadStandings = async () => {
    if (!selectedSeasonId) return;
    
    setLoading(true);
    try {
      // Obtener temporada seleccionada
      const seasonDoc = await getDoc(doc(db, 'seasons', selectedSeasonId));
      const seasonData = seasonDoc.data() as Season;
      
      // Obtener equipos con filtros
      const constraints = [
        where('seasonId', '==', selectedSeasonId),
        where('status', '==', 'active')
      ];
      
      if (selectedDivisionId && selectedDivisionId !== 'all') {
        constraints.push(where('divisionId', '==', selectedDivisionId));
      }
      
      if (selectedCategoryId && selectedCategoryId !== 'all') {
        constraints.push(where('categoryId', '==', selectedCategoryId));
      }

      const teamsQuery = query(
        collection(db, 'teams'),
        ...constraints,
        orderBy('name')
      );

      const teamsSnapshot = await getDocs(teamsQuery);
      const teams: Team[] = teamsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Team));

      // Obtener partidos completados con los mismos filtros
      const matchesConstraints = [
        where('seasonId', '==', selectedSeasonId),
        where('status', '==', 'completed')
      ];
      
      if (selectedDivisionId && selectedDivisionId !== 'all') {
        matchesConstraints.push(where('divisionId', '==', selectedDivisionId));
      }
      
      if (selectedCategoryId && selectedCategoryId !== 'all') {
        matchesConstraints.push(where('categoryId', '==', selectedCategoryId));
      }

      const matchesQuery = query(
        collection(db, 'matches'),
        ...matchesConstraints,
        orderBy('matchDate', 'desc')
      );

      const matchesSnapshot = await getDocs(matchesQuery);
      const matches: Match[] = matchesSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          matchDate: data.matchDate?.toDate ? data.matchDate.toDate() : data.matchDate,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : data.createdAt,
          updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : data.updatedAt,
        } as Match;
      });

      // Mapear nombres de divisiones y categorías
      const divisionMap = new Map<string, string>();
      const categoryMap = new Map<string, string>();
      
      divisions.forEach(d => divisionMap.set(d.id, d.name));
      categories.forEach(c => categoryMap.set(c.id, c.name));

      // Calcular estadísticas para cada equipo
      const standingsData: Standing[] = teams.map(team => {
        const teamMatches = matches.filter(match => 
          match.homeTeamId === team.id || match.awayTeamId === team.id
        );

        let wins = 0;
        let draws = 0;
        let losses = 0;
        let goalsFor = 0;
        let goalsAgainst = 0;
        const recentResults: string[] = [];

        teamMatches.forEach(match => {
          const isHome = match.homeTeamId === team.id;
          const teamScore = isHome ? match.homeScore || 0 : match.awayScore || 0;
          const opponentScore = isHome ? match.awayScore || 0 : match.homeScore || 0;

          goalsFor += teamScore;
          goalsAgainst += opponentScore;

          if (teamScore > opponentScore) {
            wins++;
            recentResults.push('W');
          } else if (teamScore < opponentScore) {
            losses++;
            recentResults.push('L');
          } else {
            draws++;
            recentResults.push('D');
          }
        });

        // Calcular racha actual
        let streak = 0;
        if (recentResults.length > 0) {
          const lastResult = recentResults[recentResults.length - 1];
          for (let i = recentResults.length - 1; i >= 0; i--) {
            if (recentResults[i] === lastResult) {
              streak += lastResult === 'W' ? 1 : lastResult === 'L' ? -1 : 0;
            } else {
              break;
            }
          }
        }

        return {
          teamId: team.id,
          teamName: team.name,
          logoUrl: team.logoUrl,
          played: teamMatches.length,
          wins,
          draws,
          losses,
          goalsFor,
          goalsAgainst,
          points: (wins * 3) + draws,
          form: recentResults.slice(-5).reverse(),
          streak,
          divisionName: divisionMap.get(team.divisionId || '') || 'Sin división',
          categoryName: categoryMap.get(team.categoryId || '') || 'Sin categoría'
        };
      });

      // Ordenar por puntos, diferencia de goles, goles a favor
      const sortedStandings = standingsData.sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        const diffA = a.goalsFor - a.goalsAgainst;
        const diffB = b.goalsFor - b.goalsAgainst;
        if (diffB !== diffA) return diffB - diffA;
        return b.goalsFor - a.goalsFor;
      });

      setStandings(sortedStandings);
      
      // Actualizar estadísticas de categorías con datos reales
      updateCategoryStats(sortedStandings, matches);
      
    } catch (error) {
      console.error('Error loading standings:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateCategoryStats = (standingsData: Standing[], matches: Match[]) => {
    const statsMap = new Map<string, CategoryStats>();
    
    // Inicializar estadísticas con datos de categorías
    categories.forEach(category => {
      const division = divisions.find(d => d.id === category.divisionId);
      statsMap.set(category.id, {
        categoryId: category.id,
        categoryName: category.name,
        divisionName: division?.name || 'Sin división',
        divisionId: category.divisionId,
        teamCount: 0,
        matchesPlayed: 0,
        totalGoals: 0,
        avgGoalsPerMatch: 0
      });
    });
    
    // Contar equipos por categoría
    standingsData.forEach(team => {
      const category = categories.find(c => c.name === team.categoryName);
      if (category) {
        const stat = statsMap.get(category.id);
        if (stat) {
          stat.teamCount++;
        }
      }
    });
    
    // Calcular partidos y goles por categoría
    matches.forEach(match => {
      if (match.categoryId) {
        const stat = statsMap.get(match.categoryId);
        if (stat) {
          stat.matchesPlayed++;
          stat.totalGoals += (match.homeScore || 0) + (match.awayScore || 0);
        }
      }
    });
    
    // Calcular promedios
    statsMap.forEach(stat => {
      stat.avgGoalsPerMatch = stat.matchesPlayed > 0 
        ? Number((stat.totalGoals / stat.matchesPlayed).toFixed(2)) 
        : 0;
    });
    
    setCategoryStats(Array.from(statsMap.values()));
  };

  const getFormIcon = (result: string) => {
    switch (result) {
      case 'W': return (
        <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white text-xs" title="Victoria">
          V
        </div>
      );
      case 'D': return (
        <div className="w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center text-white text-xs" title="Empate">
          E
        </div>
      );
      case 'L': return (
        <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white text-xs" title="Derrota">
          D
        </div>
      );
      default: return <div className="w-6 h-6 bg-gray-300 rounded-full"></div>;
    }
  };

  const getStreakIcon = (streak: number) => {
    if (streak > 0) {
      return (
        <div className="flex items-center text-green-600" title={`Racha de ${streak} victorias`}>
          <ChevronUpIcon className="w-4 h-4" />
          <span className="text-xs font-semibold">{streak}</span>
        </div>
      );
    } else if (streak < 0) {
      return (
        <div className="flex items-center text-red-600" title={`Racha de ${Math.abs(streak)} derrotas`}>
          <ChevronDownIcon className="w-4 h-4" />
          <span className="text-xs font-semibold">{Math.abs(streak)}</span>
        </div>
      );
    } else {
      return (
        <div className="flex items-center text-gray-500" title="Sin racha">
          <MinusIcon className="w-4 h-4" />
        </div>
      );
    }
  };

  const handleBack = () => {
    navigate(-1);
  };

  const getCurrentSeasonName = () => {
    if (!selectedSeasonId) return 'Cargando...';
    const season = seasons.find(s => s.id === selectedSeasonId);
    return season?.name || 'Temporada actual';
  };

  const getFilterSummary = () => {
    let summary = '';
    if (selectedDivisionId !== 'all') {
      const division = divisions.find(d => d.id === selectedDivisionId);
      summary += division?.name || '';
    }
    if (selectedCategoryId !== 'all') {
      const category = categories.find(c => c.id === selectedCategoryId);
      if (summary) summary += ' - ';
      summary += category?.name || '';
    }
    return summary || 'Todas las categorías';
  };

  // Vista de carga
  if (loading && standings.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white p-4">
        {/* Header con botón de retroceso */}
        <div className="flex items-center mb-6">
          <button
            onClick={handleBack}
            className="p-2 rounded-full hover:bg-gray-100 mr-3"
          >
            <ArrowLeftIcon className="w-6 h-6 text-gray-700" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Tabla de Posiciones</h1>
        </div>
        
        {/* Skeleton loader */}
        <div className="animate-pulse space-y-4">
          {/* Filtros skeleton */}
          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="h-8 bg-gray-200 rounded-lg w-48 mb-4"></div>
            <div className="flex space-x-3">
              <div className="h-10 bg-gray-200 rounded-lg flex-1"></div>
              <div className="h-10 bg-gray-200 rounded-lg flex-1"></div>
              <div className="h-10 bg-gray-200 rounded-lg flex-1"></div>
            </div>
          </div>
          
          {/* Tabla skeleton */}
          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="space-y-3">
              {[...Array(10)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white p-4 pb-20">
      {/* Header con botón de retroceso */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <button
            onClick={handleBack}
            className="p-2 rounded-full hover:bg-gray-100 mr-3 active:scale-95 transition-transform"
            aria-label="Volver atrás"
          >
            <ArrowLeftIcon className="w-6 h-6 text-gray-700" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Tabla de Posiciones</h1>
            <div className="flex items-center space-x-2 mt-1">
              <CalendarIcon className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-600">{getCurrentSeasonName()}</span>
              {getFilterSummary() !== 'Todas las categorías' && (
                <>
                  <span className="text-gray-300">•</span>
                  <span className="text-sm text-blue-600 font-medium">{getFilterSummary()}</span>
                </>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="p-2 rounded-full hover:bg-gray-100"
            aria-label="Mostrar filtros"
          >
            <FunnelIcon className="w-6 h-6 text-gray-700" />
          </button>
          <div className="w-px h-6 bg-gray-300"></div>
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setActiveView('standings')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-all ${
                activeView === 'standings' 
                  ? 'bg-white shadow-sm text-gray-900' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Posiciones
            </button>
            <button
              onClick={() => setActiveView('categories')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-all ${
                activeView === 'categories' 
                  ? 'bg-white shadow-sm text-gray-900' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Categorías
            </button>
          </div>
        </div>
      </div>

      {/* Filtros */}
      {showFilters && (
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6 animate-slideDown">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
            <FunnelIcon className="w-5 h-5 mr-2 text-gray-500" />
            Filtros
          </h3>
          
          <div className="space-y-4">
            {/* Temporada */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Temporada
              </label>
              <select
                value={selectedSeasonId || ''}
                onChange={(e) => setSelectedSeasonId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {seasons.map(season => (
                  <option key={season.id} value={season.id}>
                    {season.name} {season.status === 'active' ? ' (Activa)' : ''}
                  </option>
                ))}
              </select>
            </div>
            
            {/* División */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                División
              </label>
              <select
                value={selectedDivisionId}
                onChange={(e) => {
                  setSelectedDivisionId(e.target.value);
                  setSelectedCategoryId('all'); // Resetear categoría al cambiar división
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">Todas las divisiones</option>
                {divisions.map(division => (
                  <option key={division.id} value={division.id}>
                    {division.name}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Categoría */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Categoría
              </label>
              <select
                value={selectedCategoryId}
                onChange={(e) => setSelectedCategoryId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={selectedDivisionId === 'all'}
              >
                <option value="all">
                  {selectedDivisionId === 'all' 
                    ? 'Selecciona una división primero' 
                    : 'Todas las categorías'}
                </option>
                {categories
                  .filter(cat => selectedDivisionId === 'all' || cat.divisionId === selectedDivisionId)
                  .map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
              </select>
            </div>
            
            {/* Estadísticas del filtro */}
            <div className="grid grid-cols-2 gap-3 pt-4 border-t border-gray-200">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{standings.length}</div>
                <div className="text-sm text-gray-600">Equipos</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {standings.reduce((sum, team) => sum + team.played, 0)}
                </div>
                <div className="text-sm text-gray-600">Partidos</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Resumen de filtros */}
      <div className="mb-6">
        <div className="flex flex-wrap gap-2">
          {selectedDivisionId !== 'all' && (
            <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
              {divisions.find(d => d.id === selectedDivisionId)?.name}
            </span>
          )}
          {selectedCategoryId !== 'all' && (
            <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
              {categories.find(c => c.id === selectedCategoryId)?.name}
            </span>
          )}
          <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm font-medium">
            {standings.length} equipos
          </span>
        </div>
      </div>

      {/* Vista de Categorías */}
      {activeView === 'categories' && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <UsersIcon className="w-5 h-5 mr-2 text-gray-500" />
            Estadísticas por Categoría
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categoryStats.map(stat => (
              <div 
                key={stat.categoryId}
                className="bg-white rounded-xl shadow-sm p-4 border border-gray-200 hover:border-blue-300 transition-colors"
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900">{stat.categoryName}</h3>
                    <p className="text-sm text-gray-600">{stat.divisionName}</p>
                  </div>
                  <div className="bg-indigo-100 text-indigo-800 rounded-lg px-2 py-1 text-sm font-bold">
                    {stat.teamCount} equipos
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <div className="text-xl font-bold text-gray-900">{stat.matchesPlayed}</div>
                    <div className="text-xs text-gray-600">Partidos</div>
                  </div>
                  <div>
                    <div className="text-xl font-bold text-gray-900">{stat.totalGoals}</div>
                    <div className="text-xs text-gray-600">Goles</div>
                  </div>
                  <div>
                    <div className="text-xl font-bold text-gray-900">{stat.avgGoalsPerMatch}</div>
                    <div className="text-xs text-gray-600">Prom/Gol</div>
                  </div>
                </div>
                
                <button
                  onClick={() => {
                    setSelectedDivisionId(stat.divisionId);
                    setSelectedCategoryId(stat.categoryId);
                    setActiveView('standings');
                  }}
                  className="w-full mt-3 px-3 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-lg text-sm font-medium transition-colors"
                >
                  Ver clasificación
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabla de Posiciones */}
      {activeView === 'standings' && (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {/* Header de la tabla */}
          <div className="bg-gradient-to-r from-indigo-600 to-blue-600 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <TrophyIcon className="w-8 h-8 text-yellow-300" />
                <div>
                  <h2 className="text-xl font-bold text-white">Clasificación</h2>
                  <p className="text-sm text-indigo-200">
                    {selectedCategoryId === 'all' 
                      ? 'Todas las categorías' 
                      : categories.find(c => c.id === selectedCategoryId)?.name}
                  </p>
                </div>
              </div>
              <div className="text-right hidden md:block">
                <div className="text-white font-bold text-lg">
                  {standings.filter(t => t.played > 0).length} / {standings.length} equipos jugaron
                </div>
                <div className="text-indigo-200 text-sm">
                  {new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
              </div>
            </div>
          </div>

          {/* Tabla responsiva */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700 w-12 sticky left-0 bg-gray-50 z-10">
                    #
                  </th>
                  <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700 sticky left-12 bg-gray-50 z-10">
                    Equipo
                  </th>
                  <th className="py-3 px-4 text-center text-sm font-semibold text-gray-700 hidden md:table-cell">
                    PJ
                  </th>
                  <th className="py-3 px-4 text-center text-sm font-semibold text-gray-700">
                    PG
                  </th>
                  <th className="py-3 px-4 text-center text-sm font-semibold text-gray-700 hidden sm:table-cell">
                    PE
                  </th>
                  <th className="py-3 px-4 text-center text-sm font-semibold text-gray-700">
                    PP
                  </th>
                  <th className="py-3 px-4 text-center text-sm font-semibold text-gray-700 hidden lg:table-cell">
                    GF
                  </th>
                  <th className="py-3 px-4 text-center text-sm font-semibold text-gray-700 hidden lg:table-cell">
                    GC
                  </th>
                  <th className="py-3 px-4 text-center text-sm font-semibold text-gray-700">
                    DG
                  </th>
                  <th className="py-3 px-4 text-center text-sm font-semibold text-gray-700">
                    PTS
                  </th>
                  <th className="py-3 px-4 text-center text-sm font-semibold text-gray-700 hidden md:table-cell">
                    Forma
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {standings.length > 0 ? (
                  standings.map((team, index) => (
                    <tr 
                      key={team.teamId} 
                      className={`
                        ${index < 4 ? 'bg-green-50 hover:bg-green-100' : 
                         index >= standings.length - 2 ? 'bg-red-50 hover:bg-red-100' : 
                         'hover:bg-gray-50'}
                        transition-colors
                      `}
                    >
                      <td className="py-4 px-4 sticky left-0 z-0 bg-inherit">
                        <div className="flex items-center justify-center">
                          <span className={`
                            w-8 h-8 flex items-center justify-center rounded-full font-bold
                            ${index === 0 ? 'bg-yellow-100 text-yellow-800 border border-yellow-300' :
                              index === 1 ? 'bg-gray-100 text-gray-800 border border-gray-300' :
                              index === 2 ? 'bg-orange-100 text-orange-800 border border-orange-300' :
                              'bg-gray-50 text-gray-600 border border-gray-200'}
                          `}>
                            {index + 1}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-4 sticky left-12 z-0 bg-inherit">
                        <div className="flex items-center space-x-3">
                          {team.logoUrl ? (
                            <img 
                              src={team.logoUrl} 
                              alt={team.teamName} 
                              className="w-10 h-10 rounded-full object-cover border border-gray-200"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 border border-blue-200 flex items-center justify-center">
                              <span className="text-blue-600 font-bold text-lg">
                                {team.teamName.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          )}
                          <div>
                            <div className="font-semibold text-gray-900">{team.teamName}</div>
                            <div className="flex items-center space-x-3 mt-1">
                              {getStreakIcon(team.streak)}
                              <span className="text-xs text-gray-500">
                                {team.divisionName}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-center font-medium hidden md:table-cell">
                        {team.played}
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className="font-bold text-green-600">{team.wins}</span>
                      </td>
                      <td className="py-4 px-4 text-center font-semibold text-yellow-600 hidden sm:table-cell">
                        {team.draws}
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className="font-bold text-red-600">{team.losses}</span>
                      </td>
                      <td className="py-4 px-4 text-center font-semibold hidden lg:table-cell">
                        {team.goalsFor}
                      </td>
                      <td className="py-4 px-4 text-center font-semibold hidden lg:table-cell">
                        {team.goalsAgainst}
                      </td>
                      <td className={`py-4 px-4 text-center font-bold ${
                        team.goalsFor - team.goalsAgainst > 0 ? 'text-green-600' :
                        team.goalsFor - team.goalsAgainst < 0 ? 'text-red-600' : 'text-gray-600'
                      }`}>
                        {team.goalsFor - team.goalsAgainst > 0 ? '+' : ''}{team.goalsFor - team.goalsAgainst}
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className="inline-block bg-gradient-to-r from-indigo-500 to-blue-500 text-white font-bold py-1 px-3 rounded-full min-w-[50px]">
                          {team.points}
                        </span>
                      </td>
                      <td className="py-4 px-4 hidden md:table-cell">
                        <div className="flex space-x-1 justify-center">
                          {team.form.map((result, i) => (
                            <div key={i} className="transform hover:scale-110 transition-transform">
                              {getFormIcon(result)}
                            </div>
                          ))}
                          {team.form.length < 5 && (
                            [...Array(5 - team.form.length)].map((_, i) => (
                              <div key={`empty-${i}`} className="w-6 h-6 bg-gray-100 rounded-full"></div>
                            ))
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={11} className="py-8 text-center text-gray-500">
                      No hay datos de clasificación disponibles para los filtros seleccionados
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Leyenda */}
          <div className="p-4 bg-gradient-to-r from-gray-50 to-gray-100 border-t border-gray-200">
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center">
                <div className="w-4 h-4 bg-yellow-100 rounded mr-2 border border-yellow-300"></div>
                <span className="font-medium">Primer lugar</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 bg-gray-100 rounded mr-2 border border-gray-300"></div>
                <span className="font-medium">Segundo lugar</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 bg-orange-100 rounded mr-2 border border-orange-300"></div>
                <span className="font-medium">Tercer lugar</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 bg-green-50 rounded mr-2 border border-green-300"></div>
                <span className="font-medium">Zona de playoffs</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 bg-red-50 rounded mr-2 border border-red-300"></div>
                <span className="font-medium">Zona de descenso</span>
              </div>
            </div>
          </div>

          {/* Estadísticas generales */}
          <div className="p-4 border-t border-gray-200 bg-white">
            <h3 className="font-semibold text-gray-900 mb-3">Estadísticas Generales</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-700">
                  {standings.length}
                </div>
                <div className="text-sm text-blue-600">Equipos totales</div>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-700">
                  {standings.reduce((sum, team) => sum + team.played, 0)}
                </div>
                <div className="text-sm text-green-600">Partidos jugados</div>
              </div>
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-700">
                  {standings.reduce((sum, team) => sum + team.goalsFor, 0)}
                </div>
                <div className="text-sm text-purple-600">Goles totales</div>
              </div>
              <div className="text-center p-3 bg-yellow-50 rounded-lg">
                <div className="text-2xl font-bold text-yellow-700">
                  {(standings.reduce((sum, team) => sum + team.played, 0) > 0 
                    ? (standings.reduce((sum, team) => sum + team.goalsFor, 0) / 
                       standings.reduce((sum, team) => sum + team.played, 0)).toFixed(2)
                    : '0.00')}
                </div>
                <div className="text-sm text-yellow-600">Promedio de goles</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Botón flotante para cambiar vista */}
      <div className="fixed bottom-20 right-4 z-50">
        <button
          onClick={() => setActiveView(activeView === 'standings' ? 'categories' : 'standings')}
          className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white p-3 rounded-full shadow-lg hover:shadow-xl active:scale-95 transition-all"
        >
          <div className="w-6 h-6 flex items-center justify-center">
            {activeView === 'standings' ? (
              <UsersIcon className="w-6 h-6" />
            ) : (
              <TrophyIcon className="w-6 h-6" />
            )}
          </div>
        </button>
      </div>
    </div>
  );
};

export default StandingsTable;