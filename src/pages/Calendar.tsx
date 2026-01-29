import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '../services/firebase';
import { seasonsService, teamsService, categoriesService, divisionsService, matchesService, fieldsService } from '../services/firestore';
import { 
  CalendarIcon, 
  FunnelIcon,
  ChevronLeftIcon, 
  ChevronRightIcon,
  MapPinIcon,
  TrophyIcon,
  ClockIcon,
  ArrowLeftIcon,
  HomeIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  UsersIcon,
  FlagIcon
} from '@heroicons/react/24/outline';
import { Link, useNavigate } from 'react-router-dom';
import type { Match, Season, Division, Category, Team, Field } from '../types';

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

// Tipo para agrupar por jornada/semana
interface WeekGroup {
  weekNumber: number;
  startDate: Date;
  endDate: Date;
  matches: Match[];
  label: string;
}

const Calendar: React.FC = () => {
  const navigate = useNavigate();
  const [matches, setMatches] = useState<Match[]>([]);
  const [filteredMatches, setFilteredMatches] = useState<Match[]>([]);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [fields, setFields] = useState<Field[]>([]);
  
  const [selectedSeason, setSelectedSeason] = useState<string>('all');
  const [selectedDivision, setSelectedDivision] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedTeam, setSelectedTeam] = useState<string>('all');
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  
  const [view, setView] = useState<'month' | 'week' | 'list'>('list');
  const [loading, setLoading] = useState<boolean>(true);
  const [expandedWeeks, setExpandedWeeks] = useState<Set<number>>(new Set());
  
  // Cargar datos iniciales
  useEffect(() => {
    loadInitialData();
  }, []);
  
  // Aplicar filtros cuando cambian los parámetros
  useEffect(() => {
    applyFilters();
  }, [matches, selectedSeason, selectedDivision, selectedCategory, selectedStatus, selectedTeam, selectedMonth, selectedYear]);
  
  const loadInitialData = async () => {
    setLoading(true);
    try {
      const [seasonsData, allMatches, teamsData, fieldsData] = await Promise.all([
        seasonsService.getSeasons(),
        getAllMatches(),
        teamsService.getAllTeams(),
        fieldsService.getFields()
      ]);
      
      setSeasons(seasonsData);
      setMatches(allMatches);
      setTeams(teamsData);
      setFields(fieldsData);
      
      // Expandir todas las semanas por defecto
      const weekGroups = groupMatchesByWeek(allMatches);
      const initialExpanded = new Set<number>();
      weekGroups.forEach(week => {
        initialExpanded.add(week.weekNumber);
      });
      setExpandedWeeks(initialExpanded);
      
    } catch (error) {
      console.error('Error cargando datos:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const getAllMatches = async (): Promise<Match[]> => {
    try {
      const matchesData = await matchesService.getMatches();
      return matchesData.map(match => ({
        ...match,
        matchDate: parseFirestoreDate(match.matchDate),
        createdAt: parseFirestoreDate(match.createdAt),
        updatedAt: parseFirestoreDate(match.updatedAt),
      }));
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
    
    if (selectedTeam !== 'all') {
      filtered = filtered.filter(match => 
        match.homeTeamId === selectedTeam || match.awayTeamId === selectedTeam
      );
    }
    
    // Filtrar por mes y año
    filtered = filtered.filter(match => {
      try {
        const matchDate = new Date(match.matchDate);
        return matchDate.getMonth() === selectedMonth && 
               matchDate.getFullYear() === selectedYear;
      } catch {
        return false;
      }
    });
    
    // Ordenar por fecha
    filtered.sort((a, b) => new Date(a.matchDate).getTime() - new Date(b.matchDate).getTime());
    setFilteredMatches(filtered);
  };
  
  // Cargar divisiones cuando cambia la temporada
  useEffect(() => {
    if (selectedSeason !== 'all') {
      loadDivisions(selectedSeason);
    } else {
      setDivisions([]);
      setCategories([]);
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
  
  // Cargar categorías cuando cambia la división
  useEffect(() => {
    if (selectedDivision !== 'all') {
      loadCategories(selectedDivision);
    } else {
      setCategories([]);
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
  
  // Navegación de meses
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
  
  // Formatear fechas
  const formatDate = (dateString: string | Date): string => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('es-MX', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    } catch {
      return 'Fecha inválida';
    }
  };
  
  const formatShortDate = (dateString: string | Date): string => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('es-MX', {
        day: '2-digit',
        month: 'short'
      });
    } catch {
      return 'Fecha inválida';
    }
  };
  
  // Obtener equipo por ID
  const getTeamById = (teamId: string): Team | undefined => {
    return teams.find(team => team.id === teamId);
  };
  
  // Obtener campo por ID
  const getFieldById = (fieldId: string): Field | undefined => {
    return fields.find(field => field.id === fieldId);
  };
  
  // Agrupar partidos por fecha para vista de mes
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
  
  // Agrupar partidos por jornada/semana
  const groupMatchesByWeek = (matchesToGroup: Match[]): WeekGroup[] => {
    const weekGroups: WeekGroup[] = [];
    const matchesByRound = new Map<number, Match[]>();
    
    // Agrupar por jornada (round)
    matchesToGroup.forEach(match => {
      const round = match.round || 1;
      if (!matchesByRound.has(round)) {
        matchesByRound.set(round, []);
      }
      matchesByRound.get(round)!.push(match);
    });
    
    // Crear grupos por jornada
    Array.from(matchesByRound.entries()).forEach(([round, roundMatches]) => {
      if (roundMatches.length > 0) {
        // Ordenar partidos por fecha
        roundMatches.sort((a, b) => new Date(a.matchDate).getTime() - new Date(b.matchDate).getTime());
        
        // Encontrar fecha más temprana y más tardía de la jornada
        const dates = roundMatches.map(m => new Date(m.matchDate));
        const startDate = new Date(Math.min(...dates.map(d => d.getTime())));
        const endDate = new Date(Math.max(...dates.map(d => d.getTime())));
        
        weekGroups.push({
          weekNumber: round,
          startDate,
          endDate,
          matches: roundMatches,
          label: `Jornada ${round}`
        });
      }
    });
    
    // Ordenar por número de jornada
    return weekGroups.sort((a, b) => a.weekNumber - b.weekNumber);
  };
  
  // Agrupar partidos por día dentro de una jornada
  const groupMatchesByDay = (matches: Match[]) => {
    const groups: { [date: string]: Match[] } = {};
    
    matches.forEach(match => {
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
    
    return Object.entries(groups)
      .map(([dateStr, dayMatches]) => ({
        date: new Date(dateStr),
        dateStr,
        matches: dayMatches.sort((a, b) => {
          const timeA = a.matchTime || '00:00';
          const timeB = b.matchTime || '00:00';
          return timeA.localeCompare(timeB);
        })
      }))
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  };
  
  // Generar días para vista de mes
  const generateCalendarDays = () => {
    const year = selectedYear;
    const month = selectedMonth;
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();
    
    const days = [];
    const matchesByDate = groupMatchesByDate();
    
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
  
  // Generar días para vista de semana
  const getWeekDays = () => {
    const today = new Date(selectedYear, selectedMonth, 15);
    const currentDay = today.getDay();
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - currentDay);
    
    const weekDays = [];
    const matchesByDate = groupMatchesByDate();
    
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
  
  // Componente de tarjeta de partido
  const MatchCard: React.FC<{ match: Match }> = ({ match }) => {
    const homeTeam = getTeamById(match.homeTeamId);
    const awayTeam = getTeamById(match.awayTeamId);
    const field = getFieldById(match.fieldId);
    const homeLogo = homeTeam?.logoUrl;
    const awayLogo = awayTeam?.logoUrl;
    
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-3 mb-3 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex justify-between items-start mb-2">
          <div className="flex items-center">
            <TrophyIcon className="h-4 w-4 text-gray-400 mr-1" />
            <span className="text-xs text-gray-500">
              {match.isPlayoff ? 'Playoffs' : `Jornada ${match.round}`}
            </span>
          </div>
          <div className="text-right">
            <span className={`text-xs px-2 py-1 rounded-full ${
              match.status === 'completed' ? 'bg-green-100 text-green-800' :
              match.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
              match.status === 'postponed' ? 'bg-orange-100 text-orange-800' :
              match.status === 'cancelled' ? 'bg-red-100 text-red-800' :
              'bg-blue-100 text-blue-800'
            }`}>
              {match.status === 'completed' ? 'Finalizado' :
               match.status === 'in_progress' ? 'En juego' :
               match.status === 'postponed' ? 'Aplazado' :
               match.status === 'cancelled' ? 'Cancelado' :
               'Programado'}
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
              {match.winner === 'home' && (
                <div className="text-xs text-green-600">Ganador: Local</div>
              )}
              {match.winner === 'away' && (
                <div className="text-xs text-green-600">Ganador: Visitante</div>
              )}
              {match.winner === 'draw' && (
                <div className="text-xs text-yellow-600">Empate</div>
              )}
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
            <span className="truncate max-w-[80px]">{field?.name || `Campo ${match.fieldId || '1'}`}</span>
          </div>
        </div>
        
        {match.refereeName && (
          <div className="mt-2 text-xs text-gray-500">
            <UsersIcon className="h-3 w-3 inline mr-1" />
            Árbitro: {match.refereeName}
          </div>
        )}
      </div>
    );
  };
  
  // Función para manejar la expansión/colapso de semanas
  const toggleWeekExpansion = (weekNumber: number) => {
    const newExpanded = new Set(expandedWeeks);
    if (newExpanded.has(weekNumber)) {
      newExpanded.delete(weekNumber);
    } else {
      newExpanded.add(weekNumber);
    }
    setExpandedWeeks(newExpanded);
  };
  
  // Función para expandir todas las semanas
  const expandAllWeeks = () => {
    const weekGroups = groupMatchesByWeek(filteredMatches);
    const allWeekNumbers = weekGroups.map(week => week.weekNumber);
    setExpandedWeeks(new Set(allWeekNumbers));
  };
  
  // Función para colapsar todas las semanas
  const collapseAllWeeks = () => {
    setExpandedWeeks(new Set<number>());
  };
  
  // Componente para vista de lista por jornadas
  const ListView = () => {
    const weekGroups = groupMatchesByWeek(filteredMatches);
    
    if (filteredMatches.length === 0) {
      return (
        <div className="text-center py-12 text-gray-400">
          <CalendarIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p className="text-gray-500">No hay partidos con los filtros seleccionados</p>
          <button
            onClick={() => {
              setSelectedSeason('all');
              setSelectedDivision('all');
              setSelectedCategory('all');
              setSelectedStatus('all');
              setSelectedTeam('all');
            }}
            className="mt-4 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Ver todos los partidos
          </button>
        </div>
      );
    }
    
    return (
      <div className="space-y-6">
        {weekGroups.map(week => {
          const isExpanded = expandedWeeks.has(week.weekNumber);
          const dayGroups = groupMatchesByDay(week.matches);
          
          return (
            <div key={week.weekNumber} className="bg-white rounded-xl shadow-sm overflow-hidden">
              {/* Encabezado de la jornada */}
              <div 
                className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex justify-between items-center cursor-pointer hover:bg-gray-100"
                onClick={() => toggleWeekExpansion(week.weekNumber)}
              >
                <div>
                  <h3 className="font-bold text-gray-800">
                    {week.label} • Semana {week.weekNumber}
                  </h3>
                  <p className="text-sm text-gray-600">
                    Del {formatShortDate(week.startDate)} al {formatShortDate(week.endDate)} • {week.matches.length} partido{week.matches.length !== 1 ? 's' : ''}
                  </p>
                </div>
                <div className="flex items-center">
                  {isExpanded ? (
                    <ChevronUpIcon className="h-5 w-5 text-gray-500" />
                  ) : (
                    <ChevronDownIcon className="h-5 w-5 text-gray-500" />
                  )}
                </div>
              </div>
              
              {/* Contenido expandible */}
              {isExpanded && (
                <div className="divide-y">
                  {dayGroups.map(dayGroup => (
                    <div key={dayGroup.dateStr} className="p-4">
                      <div className="mb-3 pb-2 border-b border-gray-200">
                        <h4 className="font-semibold text-gray-700">
                          Partidos: {formatDate(dayGroup.date)}
                        </h4>
                      </div>
                      
                      {/* Tabla de partidos para el día */}
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead>
                            <tr className="bg-gray-50">
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Hora
                              </th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Lugar
                              </th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Equipo 1
                              </th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                
                              </th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Equipo 2
                              </th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Grupo/Etapa
                              </th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Jornada
                              </th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Estatus
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {dayGroup.matches.map(match => {
                              const homeTeam = getTeamById(match.homeTeamId);
                              const awayTeam = getTeamById(match.awayTeamId);
                              const field = getFieldById(match.fieldId);
                              const homeLogo = homeTeam?.logoUrl;
                              const awayLogo = awayTeam?.logoUrl;
                              
                              return (
                                <tr key={match.id} className="hover:bg-gray-50">
                                  <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                                    <div className="flex items-center">
                                      <ClockIcon className="h-4 w-4 mr-1 text-gray-400" />
                                      {match.matchTime || '00:00'}
                                    </div>
                                  </td>
                                  <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                                    <div className="flex items-center">
                                      <MapPinIcon className="h-4 w-4 mr-1 text-gray-400" />
                                      {field?.code || `Campo ${match.fieldId || '1'}`}
                                    </div>
                                  </td>
                                  <td className="px-3 py-2 whitespace-nowrap">
                                    <div className="flex items-center">
                                      {homeLogo && (
                                        <img src={homeLogo} alt={homeTeam?.name} className="h-6 w-6 rounded-full mr-2 object-contain" />
                                      )}
                                      <div>
                                        <span className="text-sm font-medium text-gray-900 block">
                                          {homeTeam?.name || 'Local'}
                                        </span>
                                        {match.status === 'completed' && (
                                          <span className="text-xs font-bold text-green-600">
                                            {match.homeScore || 0}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </td>
                                  <td className="px-3 py-2 whitespace-nowrap text-sm font-bold text-gray-900 text-center">
                                    VS
                                  </td>
                                  <td className="px-3 py-2 whitespace-nowrap">
                                    <div className="flex items-center">
                                      {awayLogo && (
                                        <img src={awayLogo} alt={awayTeam?.name} className="h-6 w-6 rounded-full mr-2 object-contain" />
                                      )}
                                      <div>
                                        <span className="text-sm font-medium text-gray-900 block">
                                          {awayTeam?.name || 'Visitante'}
                                        </span>
                                        {match.status === 'completed' && (
                                          <span className="text-xs font-bold text-green-600">
                                            {match.awayScore || 0}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </td>
                                  <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                                    {match.isPlayoff ? (
                                      <div className="flex items-center">
                                        <TrophyIcon className="h-4 w-4 mr-1 text-yellow-500" />
                                        <span>
                                          {match.playoffStage === 'quarterfinals' ? 'Cuartos' :
                                           match.playoffStage === 'semifinals' ? 'Semifinal' :
                                           match.playoffStage === 'final' ? 'Final' :
                                           match.playoffStage === 'third_place' ? 'Tercer Lugar' : 'Playoffs'}
                                        </span>
                                      </div>
                                    ) : (
                                      <div className="flex items-center">
                                        <FlagIcon className="h-4 w-4 mr-1 text-blue-500" />
                                        <span>Regular</span>
                                      </div>
                                    )}
                                  </td>
                                  <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                                    Jornada {match.round || '1'}
                                  </td>
                                  <td className="px-3 py-2 whitespace-nowrap">
                                    <span className={`px-2 py-1 text-xs rounded-full ${
                                      match.status === 'completed' ? 'bg-green-100 text-green-800' :
                                      match.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                                      match.status === 'postponed' ? 'bg-orange-100 text-orange-800' :
                                      match.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                      'bg-blue-100 text-blue-800'
                                    }`}>
                                      {match.status === 'completed' ? 'Finalizado' :
                                       match.status === 'in_progress' ? 'En juego' :
                                       match.status === 'postponed' ? 'Aplazado' :
                                       match.status === 'cancelled' ? 'Cancelado' :
                                       'Programado'}
                                    </span>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                      
                      <div className="mt-3 pt-2 border-t border-gray-200 text-sm text-gray-500">
                        <p>Partidos: {dayGroup.matches.length}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };
  
  // Vistas del calendario
  const MonthView = () => {
    const calendarDays = generateCalendarDays();
    const monthNames = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    
    return (
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
              className="min-h-24 border border-gray-200 p-2"
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
                      <span className="text-xs bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full">
                        {dayData.matches.length}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex-grow overflow-y-auto">
                    {dayData.matches.slice(0, 2).map(match => {
                      const homeTeam = getTeamById(match.homeTeamId);
                      const awayTeam = getTeamById(match.awayTeamId);
                      return (
                        <div
                          key={match.id}
                          className="text-xs p-1 mb-1 bg-gray-50 rounded hover:bg-blue-50 cursor-pointer truncate"
                          title={`${homeTeam?.name || 'Local'} vs ${awayTeam?.name || 'Visitante'} - ${match.matchTime}`}
                          onClick={() => navigate(`/partidos/${match.id}`)}
                        >
                          <div className="font-medium truncate">
                            {(homeTeam?.name || 'Loc').substring(0, 4)} vs {(awayTeam?.name || 'Vis').substring(0, 4)}
                          </div>
                          <div className="text-gray-500 text-xs">{match.matchTime || '18:00'}</div>
                        </div>
                      );
                    })}
                    
                    {dayData.matches.length > 2 && (
                      <div className="text-xs text-blue-600 text-center">
                        +{dayData.matches.length - 2} más
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
    );
  };
  
  const WeekView = () => {
    const weekDays = getWeekDays();
    
    return (
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
        
        <div className="grid grid-cols-7 min-h-80">
          {weekDays.map(day => (
            <div key={day.date} className="border-r last:border-r-0 p-2">
              {day.matches.length === 0 ? (
                <div className="text-center text-gray-400 mt-8">
                  <CalendarIcon className="h-6 w-6 mx-auto mb-2 opacity-30" />
                  <p className="text-xs">No hay partidos</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {day.matches.map(match => (
                    <div key={match.id} className="text-xs">
                      <div className="font-medium truncate">
                        {getTeamById(match.homeTeamId)?.name.substring(0, 8) || 'Loc'} vs {getTeamById(match.awayTeamId)?.name.substring(0, 8) || 'Vis'}
                      </div>
                      <div className="text-gray-500">{match.matchTime}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };
  
  const handleGoBack = () => {
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
  
  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  
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
                  Lista por Jornadas
                </button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Filtros mejorados */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <div className="flex items-center mb-4">
            <FunnelIcon className="h-5 w-5 text-gray-500 mr-2" />
            <h3 className="font-medium text-gray-700">Filtros Avanzados</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Temporada</label>
              <select
                value={selectedSeason}
                onChange={(e) => setSelectedSeason(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={selectedDivision === 'all'}
              >
                <option value="all">Todas las categorías</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Equipo</label>
              <select
                value={selectedTeam}
                onChange={(e) => setSelectedTeam(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">Todos los equipos</option>
                {teams.map(team => (
                  <option key={team.id} value={team.id}>{team.name}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Estado</label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">Todos los estados</option>
                <option value="scheduled">Programados</option>
                <option value="in_progress">En juego</option>
                <option value="completed">Finalizados</option>
                <option value="postponed">Aplazados</option>
                <option value="cancelled">Cancelados</option>
              </select>
            </div>
            
            <div className="flex items-end space-x-2">
              <button
                onClick={() => {
                  setSelectedSeason('all');
                  setSelectedDivision('all');
                  setSelectedCategory('all');
                  setSelectedTeam('all');
                  setSelectedStatus('all');
                }}
                className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Limpiar
              </button>
            </div>
          </div>
        </div>
        
        {/* Navegación de mes */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <div className="flex items-center justify-between">
            <button
              onClick={prevMonth}
              className="flex items-center px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <ChevronLeftIcon className="h-5 w-5 mr-1" />
              <span>Mes anterior</span>
            </button>
            
            <div className="text-center">
              <h2 className="text-xl font-bold text-gray-800">
                {monthNames[selectedMonth]} {selectedYear}
              </h2>
              <p className="text-gray-600 text-sm">
                {filteredMatches.length} partido{filteredMatches.length !== 1 ? 's' : ''} • {groupMatchesByWeek(filteredMatches).length} jornada{groupMatchesByWeek(filteredMatches).length !== 1 ? 's' : ''}
              </p>
            </div>
            
            <button
              onClick={nextMonth}
              className="flex items-center px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <span>Siguiente mes</span>
              <ChevronRightIcon className="h-5 w-5 ml-1" />
            </button>
          </div>
        </div>
        
        {/* Vista seleccionada */}
        <div className="mb-6">
          {view === 'month' && <MonthView />}
          {view === 'week' && <WeekView />}
          {view === 'list' && <ListView />}
        </div>
        
        {/* Estadísticas rápidas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
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
        
        {/* Acciones rápidas */}
        <div className="flex flex-wrap gap-3 mb-6">
          <button
            onClick={expandAllWeeks}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Expandir todas las jornadas
          </button>
          <button
            onClick={collapseAllWeeks}
            className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Colapsar todas las jornadas
          </button>
          <Link
            to="/calendario-public"
            className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Ver calendario público
          </Link>
          <button
            onClick={async () => {
              try {
                // Opcional: Recargar datos si es necesario
                await loadInitialData();
              } catch (error) {
                console.error('Error recargando datos:', error);
              }
            }}
            className="px-4 py-2 text-sm bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Actualizar datos
          </button>
        </div>
      </div>
    </div>
  );
};

export default Calendar;