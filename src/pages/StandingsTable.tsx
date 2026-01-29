// src/pages/StandingsTable.tsx
import React, { useState, useEffect } from 'react';
import { 
  Trophy, 
  Filter, 
  Download, 
  ChevronDown, 
  Users, 
  BarChart3,
  RefreshCw,
  Search
} from 'lucide-react';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '../services/firebase';
import { Team, Match, Category, Season } from '../types';

interface TeamStanding {
  id: string;
  name: string;
  division: string;
  category: string;
  matchesPlayed: number;
  wins: number;
  losses: number;
  draws: number;
  pointsFor: number;    // Puntos a favor (touchdowns + extras)
  pointsAgainst: number; // Puntos en contra
  points: number;       // Puntos totales (3 por victoria, 1 por empate)
  difference: number;   // Diferencia (PF - PC)
  average: number;      // Promedio de puntos por juego
}

const StandingsTable: React.FC = () => {
  const [standings, setStandings] = useState<TeamStanding[]>([]);
  const [loading, setLoading] = useState(true);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  
  // Estados para filtros
  const [selectedSeason, setSelectedSeason] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Estados para estadísticas generales
  const [totalMatches, setTotalMatches] = useState(0);
  const [totalPointsScored, setTotalPointsScored] = useState(0);
  const [averagePointsPerMatch, setAveragePointsPerMatch] = useState(0);
  const [totalTeams, setTotalTeams] = useState(0);

  // Cargar temporadas
  useEffect(() => {
    const fetchSeasons = async () => {
      try {
        const seasonsRef = collection(db, 'seasons');
        const q = query(seasonsRef, orderBy('startDate', 'desc'));
        const snapshot = await getDocs(q);
        
        const seasonsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Season[];
        
        setSeasons(seasonsData);
        
        // Seleccionar la primera temporada activa por defecto
        const activeSeason = seasonsData.find(s => s.status === 'active');
        if (activeSeason) {
          setSelectedSeason(activeSeason.id);
        } else if (seasonsData.length > 0) {
          setSelectedSeason(seasonsData[0].id);
        }
      } catch (error) {
        console.error('Error cargando temporadas:', error);
      }
    };

    fetchSeasons();
  }, []);

  // Cargar categorías cuando se selecciona temporada
  useEffect(() => {
    if (!selectedSeason) return;

    const fetchCategories = async () => {
      try {
        const categoriesRef = collection(db, 'categories');
        const q = query(
          categoriesRef,
          where('seasonId', '==', selectedSeason),
          where('isActive', '==', true)
        );
        
        const snapshot = await getDocs(q);
        const categoriesData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Category[];
        
        setCategories(categoriesData);
        
        // Seleccionar la primera categoría por defecto
        if (categoriesData.length > 0) {
          setSelectedCategory(categoriesData[0].id);
        }
      } catch (error) {
        console.error('Error cargando categorías:', error);
      }
    };

    fetchCategories();
  }, [selectedSeason]);

  // Cargar tabla de posiciones
  useEffect(() => {
    if (!selectedCategory) return;

    const fetchStandings = async () => {
      try {
        setLoading(true);
        
        // 1. Obtener equipos de la categoría seleccionada
        const teamsRef = collection(db, 'teams');
        const teamsQuery = query(
          teamsRef,
          where('categoryId', '==', selectedCategory),
          where('status', 'in', ['active', 'approved'])
        );
        
        const teamsSnapshot = await getDocs(teamsQuery);
        
        if (teamsSnapshot.empty) {
          setStandings([]);
          setTotalTeams(0);
          setLoading(false);
          return;
        }

        const teams = teamsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Team[];

        setTotalTeams(teams.length);

        // 2. Obtener partidos de la categoría
        const matchesRef = collection(db, 'matches');
        const matchesQuery = query(
          matchesRef,
          where('categoryId', '==', selectedCategory),
          where('status', '==', 'completed')
        );
        
        const matchesSnapshot = await getDocs(matchesQuery);
        const matches = matchesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Match[];

        setTotalMatches(matches.length);

        // 3. Calcular estadísticas por equipo
        const standingsData: TeamStanding[] = teams.map(team => {
          const teamMatches = matches.filter(match => 
            match.homeTeamId === team.id || match.awayTeamId === team.id
          );

          let wins = 0;
          let losses = 0;
          let draws = 0;
          let pointsFor = 0;
          let pointsAgainst = 0;

          teamMatches.forEach(match => {
            const isHome = match.homeTeamId === team.id;
            const teamScore = isHome ? match.homeScore || 0 : match.awayScore || 0;
            const opponentScore = isHome ? match.awayScore || 0 : match.homeScore || 0;

            pointsFor += teamScore;
            pointsAgainst += opponentScore;

            if (match.winner === 'draw') {
              draws++;
            } else if (
              (isHome && match.winner === 'home') || 
              (!isHome && match.winner === 'away')
            ) {
              wins++;
            } else {
              losses++;
            }
          });

          const matchesPlayed = wins + losses + draws;
          const points = (wins * 3) + (draws * 1); // 3 puntos por victoria, 1 por empate
          const difference = pointsFor - pointsAgainst;
          const average = matchesPlayed > 0 ? (pointsFor / matchesPlayed) : 0;

          return {
            id: team.id,
            name: team.name,
            division: team.divisionId || '',
            category: team.categoryId || '',
            matchesPlayed,
            wins,
            losses,
            draws,
            pointsFor,
            pointsAgainst,
            points,
            difference,
            average: Number(average.toFixed(2))
          };
        });

        // 4. Ordenar por puntos (desc) y diferencia (desc)
        standingsData.sort((a, b) => {
          if (b.points !== a.points) return b.points - a.points;
          if (b.difference !== a.difference) return b.difference - a.difference;
          if (b.pointsFor !== a.pointsFor) return b.pointsFor - a.pointsFor;
          return a.name.localeCompare(b.name);
        });

        setStandings(standingsData);

        // 5. Calcular estadísticas generales
        const totalPoints = standingsData.reduce((sum, team) => sum + team.pointsFor, 0);
        const avgPoints = matches.length > 0 ? (totalPoints / matches.length) : 0;

        setTotalPointsScored(totalPoints);
        setAveragePointsPerMatch(Number(avgPoints.toFixed(1)));

      } catch (error) {
        console.error('Error cargando tabla de posiciones:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStandings();
  }, [selectedCategory]);

  // Filtrar standings por búsqueda
  const filteredStandings = standings.filter(standing =>
    standing.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    standing.division.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Descargar tabla como CSV
  const downloadCSV = () => {
    const headers = ['Posición', 'Equipo', 'División', 'JJ', 'JG', 'JP', 'E', 'PF', 'PC', 'Dif', 'Avg', 'Pts'];
    
    const csvContent = [
      headers.join(','),
      ...filteredStandings.map((standing, index) => [
        index + 1,
        `"${standing.name}"`,
        getDivisionName(standing.division),
        standing.matchesPlayed,
        standing.wins,
        standing.losses,
        standing.draws,
        standing.pointsFor,
        standing.pointsAgainst,
        standing.difference,
        standing.average,
        standing.points
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tabla-posiciones-${selectedCategory || 'general'}.csv`;
    a.click();
  };

  // Obtener nombre de la categoría seleccionada
  const selectedCategoryName = categories.find(c => c.id === selectedCategory)?.name || '';

  // Obtener nombre de la temporada seleccionada
  const selectedSeasonName = seasons.find(s => s.id === selectedSeason)?.name || '';

  if (loading && standings.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-tocho-primary mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Cargando tabla de posiciones...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                <Trophy className="text-yellow-500" />
                Tabla de Posiciones
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Seguimiento de estadísticas por categoría
              </p>
            </div>
            
            <button
              onClick={downloadCSV}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center gap-2 transition-colors"
            >
              <Download size={20} />
              Exportar CSV
            </button>
          </div>

          {/* Filtros */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 mb-6 shadow border border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Filtro Temporada */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Temporada
                </label>
                <div className="relative">
                  <select
                    value={selectedSeason}
                    onChange={(e) => setSelectedSeason(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-tocho-primary focus:border-transparent appearance-none"
                  >
                    <option value="">Seleccionar temporada</option>
                    {seasons.map(season => (
                      <option key={season.id} value={season.id}>
                        {season.name} ({season.status === 'active' ? 'Activa' : 'Inactiva'})
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-2.5 h-5 w-5 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {/* Filtro Categoría */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Categoría
                </label>
                <div className="relative">
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-tocho-primary focus:border-transparent appearance-none"
                    disabled={!selectedSeason || categories.length === 0}
                  >
                    <option value="">Seleccionar categoría</option>
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-2.5 h-5 w-5 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {/* Búsqueda */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Buscar equipo
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Buscar por nombre o división..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-tocho-primary focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Info de selección */}
            {(selectedSeasonName || selectedCategoryName) && (
              <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="flex items-center gap-4 text-sm">
                  {selectedSeasonName && (
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-700 dark:text-gray-300">Temporada:</span>
                      <span className="text-blue-600 dark:text-blue-400">{selectedSeasonName}</span>
                    </div>
                  )}
                  {selectedCategoryName && (
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-700 dark:text-gray-300">Categoría:</span>
                      <span className="text-green-600 dark:text-green-400">{selectedCategoryName}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Estadísticas generales */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <Users className="text-blue-600 dark:text-blue-400" size={20} />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">{totalTeams}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Equipos</div>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <Trophy className="text-green-600 dark:text-green-400" size={20} />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">{totalMatches}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Partidos</div>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                  <BarChart3 className="text-purple-600 dark:text-purple-400" size={20} />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">{totalPointsScored}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Puntos Totales</div>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                  <Filter className="text-yellow-600 dark:text-yellow-400" size={20} />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">{averagePointsPerMatch}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Prom. Puntos/Partido</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabla de posiciones */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100 dark:bg-gray-700">
                <tr>
                  <th className="p-4 text-left font-semibold text-gray-900 dark:text-white">Lugar</th>
                  <th className="p-4 text-left font-semibold text-gray-900 dark:text-white">Equipo</th>
                  <th className="p-4 text-center font-semibold text-gray-900 dark:text-white">División</th>
                  <th className="p-4 text-center font-semibold text-gray-900 dark:text-white">JJ</th>
                  <th className="p-4 text-center font-semibold text-gray-900 dark:text-white">JG</th>
                  <th className="p-4 text-center font-semibold text-gray-900 dark:text-white">JP</th>
                  <th className="p-4 text-center font-semibold text-gray-900 dark:text-white">E</th>
                  <th className="p-4 text-center font-semibold text-gray-900 dark:text-white">PF</th>
                  <th className="p-4 text-center font-semibold text-gray-900 dark:text-white">PC</th>
                  <th className="p-4 text-center font-semibold text-gray-900 dark:text-white">Dif</th>
                  <th className="p-4 text-center font-semibold text-gray-900 dark:text-white">Avg.</th>
                  <th className="p-4 text-center font-semibold text-gray-900 dark:text-white">Pts.</th>
                </tr>
              </thead>
              <tbody>
                {filteredStandings.length === 0 ? (
                  <tr>
                    <td colSpan={12} className="p-8 text-center text-gray-600 dark:text-gray-400">
                      {selectedCategory 
                        ? 'No hay equipos en esta categoría' 
                        : 'Selecciona una categoría para ver la tabla de posiciones'}
                    </td>
                  </tr>
                ) : (
                  filteredStandings.map((standing, index) => (
                    <tr 
                      key={standing.id}
                      className={`border-t border-gray-200 dark:border-gray-700 ${
                        index === 0 ? 'bg-yellow-50 dark:bg-yellow-900/20' :
                        index === 1 ? 'bg-gray-100 dark:bg-gray-700' :
                        index === 2 ? 'bg-orange-50 dark:bg-orange-900/20' :
                        index % 2 === 0 ? 'bg-gray-50 dark:bg-gray-800/50' : ''
                      } hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors`}
                    >
                      <td className="p-4">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          index === 0 ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400 font-bold' :
                          index === 1 ? 'bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-300 font-bold' :
                          index === 2 ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-400 font-bold' :
                          'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-400'
                        }`}>
                          {index + 1}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="font-medium text-gray-900 dark:text-white">
                          {standing.name}
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        <span className={`px-2 py-1 text-xs font-semibold rounded ${
                          standing.division === 'varonil' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400' :
                          standing.division === 'femenil' ? 'bg-pink-100 dark:bg-pink-900/30 text-pink-800 dark:text-pink-400' :
                          'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-400'
                        }`}>
                          {getDivisionName(standing.division)}
                        </span>
                      </td>
                      <td className="p-4 text-center text-gray-700 dark:text-gray-300">
                        {standing.matchesPlayed}
                      </td>
                      <td className="p-4 text-center text-green-600 dark:text-green-400 font-semibold">
                        {standing.wins}
                      </td>
                      <td className="p-4 text-center text-red-600 dark:text-red-400 font-semibold">
                        {standing.losses}
                      </td>
                      <td className="p-4 text-center text-yellow-600 dark:text-yellow-400 font-semibold">
                        {standing.draws}
                      </td>
                      <td className="p-4 text-center font-bold text-gray-900 dark:text-white">
                        {standing.pointsFor}
                      </td>
                      <td className="p-4 text-center font-bold text-gray-900 dark:text-white">
                        {standing.pointsAgainst}
                      </td>
                      <td className={`p-4 text-center font-bold ${
                        standing.difference > 0 ? 'text-green-600 dark:text-green-400' :
                        standing.difference < 0 ? 'text-red-600 dark:text-red-400' :
                        'text-gray-600 dark:text-gray-400'
                      }`}>
                        {standing.difference > 0 ? '+' : ''}{standing.difference}
                      </td>
                      <td className="p-4 text-center text-gray-700 dark:text-gray-300 font-medium">
                        {standing.average}
                      </td>
                      <td className="p-4 text-center font-bold text-gray-900 dark:text-white">
                        {standing.points}
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
                <span className="font-semibold">Mostrando {filteredStandings.length} de {standings.length} equipos</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.location.reload()}
                  className="flex items-center gap-2 px-3 py-1 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 rounded-lg transition-colors"
                >
                  <RefreshCw size={16} />
                  Actualizar
                </button>
                <span className="font-semibold">Actualizado:</span> {new Date().toLocaleString('es-MX')}
              </div>
            </div>
          </div>
        </div>

        {/* Leyenda */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Leyenda de columnas</h4>
            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
              <li><span className="font-medium">JJ:</span> Juegos Jugados</li>
              <li><span className="font-medium">JG:</span> Juegos Ganados</li>
              <li><span className="font-medium">JP:</span> Juegos Perdidos</li>
              <li><span className="font-medium">E:</span> Empates</li>
              <li><span className="font-medium">PF:</span> Puntos a Favor (Touchdowns + Extras)</li>
              <li><span className="font-medium">PC:</span> Puntos en Contra</li>
              <li><span className="font-medium">Dif:</span> Diferencia (PF - PC)</li>
              <li><span className="font-medium">Avg:</span> Promedio de puntos por juego</li>
              <li><span className="font-medium">Pts:</span> Puntos Totales (3 por victoria, 1 por empate)</li>
            </ul>
          </div>

          <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Sistema de puntuación</h4>
            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
              <li>✅ Victoria: <span className="font-medium">3 puntos</span></li>
              <li>🤝 Empate: <span className="font-medium">1 punto</span></li>
              <li>❌ Derrota: <span className="font-medium">0 puntos</span></li>
              <li>🏈 Touchdown: <span className="font-medium">1 puntos</span></li>
              
            </ul>
            <div className="mt-3 pt-3 border-t border-yellow-200 dark:border-yellow-800">
              <h5 className="font-semibold text-sm mb-1">Criterios de desempate:</h5>
              <ol className="text-xs space-y-1 list-decimal pl-4">
                <li>Puntos totales</li>
                <li>Diferencia de puntos</li>
                <li>Puntos a favor</li>
                <li>Enfrentamiento directo</li>
                <li>Sorteo</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper function para nombres de división
function getDivisionName(divisionId: string): string {
  switch (divisionId) {
    case 'varonil': return 'Varonil';
    case 'femenil': return 'Femenil';
    case 'mixto': return 'Mixto';
    default: return divisionId || 'General';
  }
}

export default StandingsTable;