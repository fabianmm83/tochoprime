import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '../services/firebase';
import { seasonsService, teamsService, categoriesService, divisionsService } from '../services/firestore';
import { 
  CalendarIcon, 
  FunnelIcon,
  ChevronLeftIcon, 
  ChevronRightIcon,
  MapPinIcon,
  TrophyIcon,
  ClockIcon,
  ArrowLeftIcon,
  HomeIcon
} from '@heroicons/react/24/outline';
import { Link, useNavigate } from 'react-router-dom';
import type { Match, Season, Division, Category, Team } from '../types';

const parseFirestoreDate = (dateValue: any): Date => {
  if (!dateValue) return new Date();
  
  if (dateValue && typeof dateValue.toDate === 'function') {
    return dateValue.toDate();
  }
  
  if (dateValue instanceof Date) {
    return dateValue;
  }
  
  if (typeof dateValue === 'string' && dateValue.includes('T')) {
    return new Date(dateValue);
  }
  
  try {
    return new Date(dateValue);
  } catch {
    return new Date();
  }
};

const Calendar: React.FC = () => {
  const navigate = useNavigate();
  const [matches, setMatches] = useState<Match[]>([]);
  const [filteredMatches, setFilteredMatches] = useState<Match[]>([]);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  
  const [selectedSeason, setSelectedSeason] = useState<string>('all');
  const [selectedDivision, setSelectedDivision] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  
  const [view, setView] = useState<'month' | 'week' | 'list'>('month');
  const [loading, setLoading] = useState<boolean>(true);
  
  useEffect(() => {
    loadInitialData();
  }, []);
  
  useEffect(() => {
    applyFilters();
  }, [matches, selectedSeason, selectedDivision, selectedCategory, selectedStatus, selectedMonth, selectedYear]);
  
  const loadInitialData = async () => {
    setLoading(true);
    try {
      const seasonsData = await seasonsService.getSeasons();
      setSeasons(seasonsData);
      
      const allMatches = await getAllMatches();
      setMatches(allMatches);
      
      const teamsData = await teamsService.getAllTeams();
      setTeams(teamsData);
      
    } catch (error) {
      console.error('Error cargando datos:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const getAllMatches = async (): Promise<Match[]> => {
    try {
      const matchesRef = collection(db, 'matches');
      const q = query(matchesRef, orderBy('matchDate', 'asc'));
      const snapshot = await getDocs(q);
      
      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          matchDate: parseFirestoreDate(data.matchDate),
          createdAt: parseFirestoreDate(data.createdAt),
          updatedAt: parseFirestoreDate(data.updatedAt),
        } as Match;
      });
    } catch (error) {
      console.error('Error obteniendo partidos:', error);
      return [];
    }
  };
  
  const applyFilters = () => {
    let filtered = [...matches];
    
    if (selectedSeason !== 'all') {
      filtered = filtered.filter(match => match.seasonId === selectedSeason);
    }
    
    if (selectedDivision !== 'all') {
      filtered = filtered.filter(match => match.divisionId === selectedDivision);
    }
    
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(match => match.categoryId === selectedCategory);
    }
    
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(match => match.status === selectedStatus);
    }
    
    filtered = filtered.filter(match => {
      try {
        const matchDate = new Date(match.matchDate);
        return matchDate.getMonth() === selectedMonth && 
               matchDate.getFullYear() === selectedYear;
      } catch {
        return false;
      }
    });
    
    filtered.sort((a, b) => new Date(a.matchDate).getTime() - new Date(b.matchDate).getTime());
    setFilteredMatches(filtered);
  };
  
  useEffect(() => {
    if (selectedSeason !== 'all') {
      loadDivisions(selectedSeason);
    }
  }, [selectedSeason]);
  
  const loadDivisions = async (seasonId: string) => {
    try {
      const divisionsData = await divisionsService.getDivisionsBySeason(seasonId);
      setDivisions(divisionsData);
    } catch (error) {
      console.error('Error cargando divisiones:', error);
    }
  };
  
  useEffect(() => {
    if (selectedDivision !== 'all') {
      loadCategories(selectedDivision);
    }
  }, [selectedDivision]);
  
  const loadCategories = async (divisionId: string) => {
    try {
      const categoriesData = await categoriesService.getCategoriesByDivision(divisionId);
      setCategories(categoriesData);
    } catch (error) {
      console.error('Error cargando categorías:', error);
    }
  };
  
  const nextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear(prev => prev + 1);
    } else {
      setSelectedMonth(prev => prev + 1);
    }
  };
  
  const prevMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear(prev => prev - 1);
    } else {
      setSelectedMonth(prev => prev - 1);
    }
  };
  
  const formatDate = (dateString: string | Date): string => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('es-MX', {
        weekday: 'short',
        day: 'numeric',
        month: 'short'
      });
    } catch {
      return 'Fecha inválida';
    }
  };
  
  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  
  const getTeamById = (teamId: string): Team | undefined => {
    return teams.find(team => team.id === teamId);
  };
  
  const groupMatchesByDate = () => {
    const groups: { [date: string]: Match[] } = {};
    
    filteredMatches.forEach(match => {
      try {
        const date = new Date(match.matchDate);
        const dateStr = date.toISOString().split('T')[0];
        if (!groups[dateStr]) {
          groups[dateStr] = [];
        }
        groups[dateStr].push(match);
      } catch {
        // Ignorar fechas inválidas
      }
    });
    
    return groups;
  };
  
  const matchesByDate = groupMatchesByDate();
  
  const generateCalendarDays = () => {
    const year = selectedYear;
    const month = selectedMonth;
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();
    
    const days = [];
    
    for (let i = 0; i < startingDay; i++) {
      days.push(null);
    }
    
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dateStr = date.toISOString().split('T')[0];
      const dayMatches = matchesByDate[dateStr] || [];
      
      days.push({
        day,
        date: dateStr,
        dateObj: date,
        matches: dayMatches
      });
    }
    
    return days;
  };
  
  const calendarDays = generateCalendarDays();
  
  const getWeekDays = () => {
    const today = new Date(selectedYear, selectedMonth, 15);
    const currentDay = today.getDay();
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - currentDay);
    
    const weekDays = [];
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      const dayMatches = matchesByDate[dateStr] || [];
      
      weekDays.push({
        date: dateStr,
        dateObj: date,
        dayName: date.toLocaleDateString('es-MX', { weekday: 'short' }),
        dayNumber: date.getDate(),
        matches: dayMatches
      });
    }
    
    return weekDays;
  };
  
  const weekDays = getWeekDays();
  
  const MatchCard: React.FC<{ match: Match }> = ({ match }) => {
    const homeTeam = getTeamById(match.homeTeamId);
    const awayTeam = getTeamById(match.awayTeamId);
    const homeLogo = homeTeam?.logoUrl;
    const awayLogo = awayTeam?.logoUrl;
    
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-3 mb-3 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex justify-between items-start mb-2">
          <div className="flex items-center">
            <TrophyIcon className="h-4 w-4 text-gray-400 mr-1" />
            <span className="text-xs text-gray-500">Jornada {match.round}</span>
          </div>
          <div className="text-right">
            <span className={`text-xs px-2 py-1 rounded-full ${
              match.status === 'completed' ? 'bg-green-100 text-green-800' :
              match.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
              'bg-blue-100 text-blue-800'
            }`}>
              {match.status === 'completed' ? 'Finalizado' :
               match.status === 'in_progress' ? 'En juego' : 'Programado'}
            </span>
          </div>
        </div>
        
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            {homeLogo && (
              <img src={homeLogo} alt={homeTeam?.name} className="h-8 w-8 object-contain rounded-full" />
            )}
            <span className="font-medium truncate max-w-[100px]">{homeTeam?.name || 'Equipo Local'}</span>
          </div>
          
          {match.status === 'completed' ? (
            <div className="text-center">
              <div className="text-xl font-bold">
                {match.homeScore || 0} - {match.awayScore || 0}
              </div>
            </div>
          ) : (
            <div className="text-gray-400 font-bold">VS</div>
          )}
          
          <div className="flex items-center space-x-2">
            <span className="font-medium truncate max-w-[100px]">{awayTeam?.name || 'Equipo Visitante'}</span>
            {awayLogo && (
              <img src={awayLogo} alt={awayTeam?.name} className="h-8 w-8 object-contain rounded-full" />
            )}
          </div>
        </div>
        
        <div className="flex justify-between items-center text-sm text-gray-600">
          <div className="flex items-center">
            <ClockIcon className="h-4 w-4 mr-1" />
            <span>{match.matchTime || '18:00'}</span>
          </div>
          <div className="flex items-center">
            <MapPinIcon className="h-4 w-4 mr-1" />
            <span className="truncate max-w-[80px]">Campo {match.fieldId || '1'}</span>
          </div>
        </div>
      </div>
    );
  };
  
  const handleGoBack = () => {
    // Verificar si hay una página anterior o ir al dashboard
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/dashboard');
    }
  };
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando calendario...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header con botón de regreso */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center">
          <button
            onClick={handleGoBack}
            className="flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            <span>Regresar</span>
          </button>
          <div className="ml-4 flex items-center">
            <CalendarIcon className="h-6 w-6 text-blue-600 mr-2" />
            <h1 className="text-lg font-semibold text-gray-800">Calendario</h1>
          </div>
        </div>
      </div>
      
      <div className="p-4">
        {/* Botón rápido para ir al dashboard */}
        <div className="mb-4">
          <Link
            to="/dashboard"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <HomeIcon className="h-5 w-5 mr-2" />
            Ir al Dashboard
          </Link>
        </div>
        
        <div className="mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
            <div className="flex items-center mb-4 md:mb-0">
              <CalendarIcon className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Calendario de Partidos</h1>
                <p className="text-gray-600">Sigue todos los partidos de la temporada</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="flex bg-white rounded-lg border border-gray-300 p-1">
                <button
                  onClick={() => setView('month')}
                  className={`px-3 py-1 rounded text-sm ${view === 'month' ? 'bg-blue-100 text-blue-600' : 'text-gray-600'}`}
                >
                  Mes
                </button>
                <button
                  onClick={() => setView('week')}
                  className={`px-3 py-1 rounded text-sm ${view === 'week' ? 'bg-blue-100 text-blue-600' : 'text-gray-600'}`}
                >
                  Semana
                </button>
                <button
                  onClick={() => setView('list')}
                  className={`px-3 py-1 rounded text-sm ${view === 'list' ? 'bg-blue-100 text-blue-600' : 'text-gray-600'}`}
                >
                  Lista
                </button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Filtros */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <div className="flex items-center mb-4">
            <FunnelIcon className="h-5 w-5 text-gray-500 mr-2" />
            <h3 className="font-medium text-gray-700">Filtros</h3>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Temporada</label>
              <select
                value={selectedSeason}
                onChange={(e) => setSelectedSeason(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Todas las temporadas</option>
                {seasons.map(season => (
                  <option key={season.id} value={season.id}>{season.name}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">División</label>
              <select
                value={selectedDivision}
                onChange={(e) => setSelectedDivision(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                disabled={selectedSeason === 'all'}
              >
                <option value="all">Todas las divisiones</option>
                {divisions.map(division => (
                  <option key={division.id} value={division.id}>{division.name}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Categoría</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                disabled={selectedDivision === 'all'}
              >
                <option value="all">Todas las categorías</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Estado</label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Todos los estados</option>
                <option value="scheduled">Programados</option>
                <option value="in_progress">En juego</option>
                <option value="completed">Completados</option>
                <option value="cancelled">Cancelados</option>
              </select>
            </div>
            
            <div className="flex items-end">
              <button
                onClick={() => {
                  setSelectedSeason('all');
                  setSelectedDivision('all');
                  setSelectedCategory('all');
                  setSelectedStatus('all');
                }}
                className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Limpiar filtros
              </button>
            </div>
          </div>
        </div>
        
        {/* Navegación de mes */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <div className="flex items-center justify-between">
            <button
              onClick={prevMonth}
              className="p-2 hover:bg-gray-100 rounded-lg flex items-center"
            >
              <ChevronLeftIcon className="h-5 w-5 text-gray-600" />
              <span className="ml-1 text-sm md:hidden">Anterior</span>
            </button>
            
            <div className="text-center">
              <h2 className="text-xl font-bold text-gray-800">
                {monthNames[selectedMonth]} {selectedYear}
              </h2>
              <p className="text-gray-600 text-sm">
                {filteredMatches.length} partido{filteredMatches.length !== 1 ? 's' : ''} encontrado{filteredMatches.length !== 1 ? 's' : ''}
              </p>
            </div>
            
            <button
              onClick={nextMonth}
              className="p-2 hover:bg-gray-100 rounded-lg flex items-center"
            >
              <span className="mr-1 text-sm md:hidden">Siguiente</span>
              <ChevronRightIcon className="h-5 w-5 text-gray-600" />
            </button>
          </div>
        </div>
        
        {/* Vista seleccionada */}
        {view === 'month' && (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="grid grid-cols-7 border-b">
              {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(day => (
                <div key={day} className="p-3 text-center font-medium text-gray-700 bg-gray-50">
                  {day}
                </div>
              ))}
            </div>
            
            <div className="grid grid-cols-7">
              {calendarDays.map((dayData, index) => (
                <div
                  key={index}
                  className="min-h-32 border border-gray-200 p-2"
                >
                  {dayData ? (
                    <div className="h-full flex flex-col">
                      <div className="flex justify-between items-start mb-1">
                        <span className={`font-medium text-sm ${
                          dayData.day === new Date().getDate() && 
                          selectedMonth === new Date().getMonth() && 
                          selectedYear === new Date().getFullYear() 
                            ? 'bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center' 
                            : 'text-gray-700'
                        }`}>
                          {dayData.day}
                        </span>
                        {dayData.matches.length > 0 && (
                          <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-full">
                            {dayData.matches.length}
                          </span>
                        )}
                      </div>
                      
                      <div className="flex-grow overflow-y-auto max-h-24">
                        {dayData.matches.slice(0, 3).map(match => {
                          const homeTeam = getTeamById(match.homeTeamId);
                          const awayTeam = getTeamById(match.awayTeamId);
                          return (
                            <div
                              key={match.id}
                              className="text-xs p-1 mb-1 bg-gray-50 rounded hover:bg-blue-50 cursor-pointer truncate"
                              title={`${homeTeam?.name || 'Local'} vs ${awayTeam?.name || 'Visitante'} - ${match.matchTime}`}
                            >
                              <div className="font-medium truncate">
                                {(homeTeam?.name || 'Loc').substring(0, 3)} vs {(awayTeam?.name || 'Vis').substring(0, 3)}
                              </div>
                              <div className="text-gray-500 text-xs">{match.matchTime || '18:00'}</div>
                            </div>
                          );
                        })}
                        
                        {dayData.matches.length > 3 && (
                          <div className="text-xs text-blue-600 text-center">
                            +{dayData.matches.length - 3} más
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="h-full bg-gray-50"></div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
        
        {view === 'week' && (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="grid grid-cols-7 border-b">
              {weekDays.map(day => (
                <div key={day.date} className="p-3 text-center border-r last:border-r-0">
                  <div className="text-sm text-gray-500">{day.dayName}</div>
                  <div className={`text-lg font-medium ${
                    day.dayNumber === new Date().getDate() && 
                    day.dateObj.getMonth() === new Date().getMonth() &&
                    day.dateObj.getFullYear() === new Date().getFullYear()
                      ? 'bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center mx-auto'
                      : 'text-gray-800'
                  }`}>
                    {day.dayNumber}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="grid grid-cols-7 min-h-96">
              {weekDays.map(day => (
                <div key={day.date} className="border-r last:border-r-0 p-3">
                  {day.matches.length === 0 ? (
                    <div className="text-center text-gray-400 mt-8">
                      <CalendarIcon className="h-8 w-8 mx-auto mb-2 opacity-30" />
                      <p className="text-sm">No hay partidos</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {day.matches.map(match => (
                        <MatchCard key={match.id} match={match} />
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
        
        {view === 'list' && (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="p-4 border-b">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-gray-700">
                  {filteredMatches.length} partido{filteredMatches.length !== 1 ? 's' : ''} encontrado{filteredMatches.length !== 1 ? 's' : ''}
                </h3>
                <div className="text-sm text-gray-500">
                  {monthNames[selectedMonth]} {selectedYear}
                </div>
              </div>
            </div>
            
            <div className="divide-y">
              {filteredMatches.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <CalendarIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-gray-500">No hay partidos con los filtros seleccionados</p>
                  <button
                    onClick={() => {
                      setSelectedSeason('all');
                      setSelectedDivision('all');
                      setSelectedCategory('all');
                      setSelectedStatus('all');
                    }}
                    className="mt-4 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Ver todos los partidos
                  </button>
                </div>
              ) : (
                filteredMatches.map(match => (
                  <div key={match.id} className="p-4 hover:bg-gray-50">
                    <MatchCard match={match} />
                  </div>
                ))
              )}
            </div>
          </div>
        )}
        
        {/* Estadísticas rápidas */}
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl shadow-sm">
            <div className="flex items-center">
              <div className="text-2xl font-bold text-blue-600">
                {matches.filter(m => m.status === 'scheduled').length}
              </div>
              <div className="ml-3">
                <div className="text-sm font-medium text-gray-900">Programados</div>
                <div className="text-xs text-gray-500">Por jugar</div>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-xl shadow-sm">
            <div className="flex items-center">
              <div className="text-2xl font-bold text-yellow-600">
                {matches.filter(m => m.status === 'in_progress').length}
              </div>
              <div className="ml-3">
                <div className="text-sm font-medium text-gray-900">En juego</div>
                <div className="text-xs text-gray-500">Actualmente</div>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-xl shadow-sm">
            <div className="flex items-center">
              <div className="text-2xl font-bold text-green-600">
                {matches.filter(m => m.status === 'completed').length}
              </div>
              <div className="ml-3">
                <div className="text-sm font-medium text-gray-900">Finalizados</div>
                <div className="text-xs text-gray-500">Completados</div>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-xl shadow-sm">
            <div className="flex items-center">
              <div className="text-2xl font-bold text-gray-600">
                {matches.length}
              </div>
              <div className="ml-3">
                <div className="text-sm font-medium text-gray-900">Total partidos</div>
                <div className="text-xs text-gray-500">Temporada</div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Información adicional */}
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>Los partidos se actualizan automáticamente. Toca cualquier partido para ver detalles completos.</p>
        </div>
      </div>
    </div>
  );
};

export default Calendar;