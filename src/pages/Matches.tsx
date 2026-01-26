import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  matchesService, 
  seasonsService, 
  divisionsService, 
  teamsService,
  refereesService 
} from '../services/firestore';
import { Match, Season, Division, Team, Referee } from '../types';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/common/Modal';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Notification from '../components/common/Notification';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const Matches: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Estados
  const [matches, setMatches] = useState<Match[]>([]);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [referees, setReferees] = useState<Referee[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);
  
  // Filtros
  const [selectedSeason, setSelectedSeason] = useState<string>('');
  const [selectedDivision, setSelectedDivision] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Cargar datos iniciales
  useEffect(() => {
    loadData();
  }, []);
  
  // Cargar datos cuando cambian los filtros
  useEffect(() => {
    if (selectedSeason) {
      loadDivisions(selectedSeason);
      loadMatches(selectedSeason);
      loadReferees(selectedSeason);
    }
  }, [selectedSeason]);
  
  useEffect(() => {
    if (selectedDivision) {
      loadTeams(selectedDivision);
      loadMatchesByDivision(selectedDivision);
    }
  }, [selectedDivision]);
  
  const loadData = async () => {
    try {
      setLoading(true);
      const seasonsData = await seasonsService.getSeasons();
      setSeasons(seasonsData);
      
      if (seasonsData.length > 0) {
        setSelectedSeason(seasonsData[0].id);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      setNotification({
        type: 'error',
        message: 'Error al cargar los datos'
      });
    } finally {
      setLoading(false);
    }
  };
  
  const loadDivisions = async (seasonId: string) => {
    try {
      const divisionsData = await divisionsService.getDivisionsBySeason(seasonId);
      setDivisions(divisionsData);
      
      if (divisionsData.length > 0) {
        setSelectedDivision(divisionsData[0].id);
      }
    } catch (error) {
      console.error('Error loading divisions:', error);
    }
  };
  
  const loadTeams = async (divisionId: string) => {
    try {
      const teamsData = await teamsService.getTeamsByDivision(divisionId);
      setTeams(teamsData);
    } catch (error) {
      console.error('Error loading teams:', error);
    }
  };
  
  const loadMatches = async (seasonId: string) => {
    try {
      const matchesData = await matchesService.getMatches(seasonId);
      setMatches(matchesData);
    } catch (error) {
      console.error('Error loading matches:', error);
    }
  };
  
  const loadMatchesByDivision = async (divisionId: string) => {
    try {
      const matchesData = await matchesService.getMatchesByDivision(divisionId);
      setMatches(matchesData);
    } catch (error) {
      console.error('Error loading matches by division:', error);
    }
  };
  
  const loadReferees = async (seasonId: string) => {
    try {
      const refereesData = await refereesService.getReferees(seasonId);
      setReferees(refereesData);
    } catch (error) {
      console.error('Error loading referees:', error);
    }
  };
  
  // Helper para obtener nombre del equipo
  const getTeamDisplayName = (match: Match, teamType: 'home' | 'away'): string => {
    if (teamType === 'home' && match.homeTeam?.name) return match.homeTeam.name;
    if (teamType === 'away' && match.awayTeam?.name) return match.awayTeam.name;
    
    const teamId = teamType === 'home' ? match.homeTeamId : match.awayTeamId;
    const foundTeam = teams.find(t => t.id === teamId);
    
    return foundTeam?.name || (teamType === 'home' ? 'Equipo local' : 'Equipo visitante');
  };
  
  // Helper para obtener color del equipo
  const getTeamPrimaryColor = (match: Match, teamType: 'home' | 'away'): string => {
    if (teamType === 'home' && match.homeTeam?.primaryColor) return match.homeTeam.primaryColor;
    if (teamType === 'away' && match.awayTeam?.primaryColor) return match.awayTeam.primaryColor;
    
    const teamId = teamType === 'home' ? match.homeTeamId : match.awayTeamId;
    const foundTeam = teams.find(t => t.id === teamId);
    
    return foundTeam?.primaryColor || (teamType === 'home' ? '#3B82F6' : '#EF4444');
  };
  
  // Filtrar partidos
  const filteredMatches = useMemo(() => {
    return matches.filter(match => {
      // Filtrar por estado
      if (selectedStatus) {
        let matchStatus = '';
        switch (match.status) {
          case 'scheduled': matchStatus = 'programado'; break;
          case 'in_progress': matchStatus = 'en_curso'; break;
          case 'completed': matchStatus = 'finalizado'; break;
          case 'cancelled': matchStatus = 'cancelado'; break;
          case 'postponed': matchStatus = 'suspendido'; break;
          default: matchStatus = '';
        }
        
        if (matchStatus !== selectedStatus) {
          return false;
        }
      }
      
      // Filtrar por búsqueda
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const homeName = getTeamDisplayName(match, 'home').toLowerCase();
        const awayName = getTeamDisplayName(match, 'away').toLowerCase();
        
        return (
          homeName.includes(term) ||
          awayName.includes(term) ||
          match.refereeName?.toLowerCase().includes(term) ||
          match.notes?.toLowerCase().includes(term)
        );
      }
      
      return true;
    });
  }, [matches, selectedStatus, searchTerm, teams]);
  
  // Agrupar partidos por ronda
  const matchesByRound = useMemo(() => {
    const groups: Record<number, Match[]> = {};
    
    filteredMatches.forEach(match => {
      if (!groups[match.round]) {
        groups[match.round] = [];
      }
      groups[match.round].push(match);
    });
    
    // Ordenar rondas
    return Object.entries(groups)
      .sort(([a], [b]) => parseInt(a) - parseInt(b))
      .reduce((acc, [round, matches]) => {
        acc[parseInt(round)] = matches;
        return acc;
      }, {} as Record<number, Match[]>);
  }, [filteredMatches]);
  
  // Manejar generación de calendario
  const handleGenerateCalendar = async () => {
    if (!selectedSeason || !selectedDivision || teams.length < 2) {
      setNotification({
        type: 'error',
        message: 'Se necesitan al menos 2 equipos para generar el calendario'
      });
      return;
    }
    
    try {
      setLoading(true);
      await matchesService.generateSeasonCalendar(selectedSeason, selectedDivision, teams);
      
      setNotification({
        type: 'success',
        message: 'Calendario generado exitosamente'
      });
      
      // Recargar partidos
      loadMatchesByDivision(selectedDivision);
    } catch (error) {
      console.error('Error generating calendar:', error);
      setNotification({
        type: 'error',
        message: 'Error al generar el calendario'
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Manejar eliminación de partido
  const handleDeleteMatch = async (matchId: string) => {
    if (!confirm('¿Estás seguro de eliminar este partido?')) return;
    
    try {
      await matchesService.deleteMatch(matchId);
      
      // Actualizar lista
      setMatches(matches.filter(match => match.id !== matchId));
      
      setNotification({
        type: 'success',
        message: 'Partido eliminado exitosamente'
      });
    } catch (error) {
      console.error('Error deleting match:', error);
      setNotification({
        type: 'error',
        message: 'Error al eliminar el partido'
      });
    }
  };
  
  // Obtener color según estado
  const getStatusColor = (status: Match['status']) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'postponed': return 'bg-orange-100 text-orange-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  
  // Traducir estado al español
  const translateStatus = (status: Match['status']) => {
    switch (status) {
      case 'scheduled': return 'Programado';
      case 'in_progress': return 'En curso';
      case 'completed': return 'Finalizado';
      case 'postponed': return 'Suspendido';
      case 'cancelled': return 'Cancelado';
      default: return status;
    }
  };
  
  // Formatear fecha
  const formatDate = (date: Date | string) => {
    try {
      const dateObj = date instanceof Date ? date : new Date(date);
      if (isNaN(dateObj.getTime())) return 'Fecha inválida';
      return format(dateObj, "dd 'de' MMMM 'de' yyyy", { locale: es });
    } catch {
      return 'Fecha inválida';
    }
  };
  
  if (loading) return <LoadingSpinner />;
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Partidos</h1>
            <p className="text-gray-600">Gestión de partidos y calendario de la liga</p>
          </div>
          
          {/* BOTÓN DE REGRESO AL DASHBOARD - AÑADIDO AQUÍ */}
          <button
            onClick={() => navigate('/dashboard')}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 flex items-center space-x-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span>Volver al Dashboard</span>
          </button>
        </div>
      </div>
      
      {/* Notificación */}
      {notification && (
        <Notification
          type={notification.type}
          message={notification.message}
          onClose={() => setNotification(null)}
        />
      )}
      
      {/* Filtros y controles */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          {/* Selector de temporada */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Temporada
            </label>
            <select
              value={selectedSeason}
              onChange={(e) => setSelectedSeason(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Seleccionar temporada</option>
              {seasons.map(season => (
                <option key={season.id} value={season.id}>
                  {season.name}
                </option>
              ))}
            </select>
          </div>
          
          {/* Selector de división */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              División
            </label>
            <select
              value={selectedDivision}
              onChange={(e) => setSelectedDivision(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={!selectedSeason}
            >
              <option value="">Seleccionar división</option>
              {divisions.map(division => (
                <option key={division.id} value={division.id}>
                  {division.name}
                </option>
              ))}
            </select>
          </div>
          
          {/* Selector de estado */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Estado
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos los estados</option>
              <option value="programado">Programado</option>
              <option value="en_curso">En curso</option>
              <option value="finalizado">Finalizado</option>
              <option value="suspendido">Suspendido</option>
              <option value="cancelado">Cancelado</option>
            </select>
          </div>
          
          {/* Búsqueda */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Buscar
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por equipo o árbitro..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        
        {/* Botones de acción */}
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => navigate('/partidos/nuevo')}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Nuevo Partido
          </button>
          
          <button
            onClick={() => navigate('/partidos/generar-calendario')}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
          >
            Generar Calendario
          </button>
          
          <button
            onClick={handleGenerateCalendar}
            disabled={!selectedDivision || teams.length < 2}
            className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Generar Automático {teams.length > 0 && `(${teams.length} equipos)`}
          </button>
          
          <button
            onClick={() => navigate('/calendario')}
            className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
          >
            Ver Calendario
          </button>
          
          <button
            onClick={() => navigate('/arbitros')}
            className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
          >
            Gestionar Árbitros
          </button>
        </div>
      </div>
      
      {/* Lista de partidos por ronda */}
      {Object.entries(matchesByRound).length > 0 ? (
        <div className="space-y-8">
          {Object.entries(matchesByRound).map(([round, roundMatches]) => (
            <div key={round} className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-blue-800 px-6 py-4">
                <h2 className="text-xl font-bold text-white">
                  Jornada {round} - {roundMatches.length} Partido{roundMatches.length !== 1 ? 's' : ''}
                </h2>
              </div>
              
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {roundMatches.map(match => (
                    <div
                      key={match.id}
                      className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow duration-300"
                    >
                      {/* Encabezado del partido */}
                      <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                        <div className="flex justify-between items-center">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(match.status)}`}>
                            {translateStatus(match.status).toUpperCase()}
                          </span>
                          <span className="text-sm text-gray-600">
                            {formatDate(match.matchDate)} - {match.matchTime}
                          </span>
                        </div>
                        
                        {match.isPlayoff && match.playoffStage && (
                          <div className="mt-2">
                            <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded">
                              PLAYOFF: {match.playoffStage.toUpperCase()}
                            </span>
                          </div>
                        )}
                      </div>
                      
                      {/* Contenido del partido */}
                      <div className="p-4">
                        {/* Equipos y resultado */}
                        <div className="mb-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-3">
                              <div 
                                className="w-6 h-6 rounded-full" 
                                style={{ backgroundColor: getTeamPrimaryColor(match, 'home') }}
                              />
                              <div>
                                <div className="font-medium text-gray-900">
                                  {getTeamDisplayName(match, 'home')}
                                </div>
                                <div className="text-sm text-gray-600">
                                  {match.status === 'completed' ? `Goles: ${match.homeScore || 0}` : 'Local'}
                                </div>
                              </div>
                            </div>
                            
                            <div className="text-2xl font-bold text-gray-900">VS</div>
                            
                            <div className="flex items-center space-x-3">
                              <div>
                                <div className="font-medium text-gray-900 text-right">
                                  {getTeamDisplayName(match, 'away')}
                                </div>
                                <div className="text-sm text-gray-600 text-right">
                                  {match.status === 'completed' ? `Goles: ${match.awayScore || 0}` : 'Visitante'}
                                </div>
                              </div>
                              <div 
                                className="w-6 h-6 rounded-full" 
                                style={{ backgroundColor: getTeamPrimaryColor(match, 'away') }}
                              />
                            </div>
                          </div>
                          
                          {/* Resultado final */}
                          {match.status === 'completed' && (
                            <div className="text-center mt-2">
                              <div className="inline-block bg-gray-100 px-4 py-2 rounded-lg">
                                <span className="text-lg font-bold text-gray-900">
                                  {match.homeScore || 0} - {match.awayScore || 0}
                                </span>
                                {match.winner && match.winner !== 'draw' && (
                                  <div className="text-sm text-gray-600 mt-1">
                                    Ganador: {match.winner === 'home' ? getTeamDisplayName(match, 'home') : getTeamDisplayName(match, 'away')}
                                  </div>
                                )}
                                {match.winner === 'draw' && (
                                  <div className="text-sm text-gray-600 mt-1">
                                    Empate
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                        
                        {/* Información adicional */}
                        <div className="space-y-2 text-sm text-gray-600">
                          {match.refereeName && (
                            <div className="flex items-center">
                              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                              </svg>
                              Árbitro: {match.refereeName}
                            </div>
                          )}
                          
                          {match.notes && (
                            <div className="flex items-start">
                              <svg className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                              </svg>
                              <span className="truncate">{match.notes}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Acciones */}
                      <div className="bg-gray-50 px-4 py-3 border-t border-gray-200">
                        <div className="flex justify-between">
                          <Link
                            to={`/partidos/${match.id}`}
                            className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                          >
                            Ver Detalles
                          </Link>
                          
                          <div className="flex space-x-2">
                            <button
                              onClick={() => navigate(`/partidos/${match.id}/editar`)}
                              className="text-yellow-600 hover:text-yellow-800 text-sm"
                            >
                              Editar
                            </button>
                            
                            {match.status === 'scheduled' && (
                              <button
                                onClick={() => navigate(`/partidos/${match.id}/resultado`)}
                                className="text-green-600 hover:text-green-800 text-sm"
                              >
                                Registrar Resultado
                              </button>
                            )}
                            
                            <button
                              onClick={() => handleDeleteMatch(match.id)}
                              className="text-red-600 hover:text-red-800 text-sm"
                            >
                              Eliminar
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <div className="mx-auto w-24 h-24 text-gray-400 mb-6">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-xl font-medium text-gray-900 mb-2">No hay partidos programados</h3>
          <p className="text-gray-600 mb-6">
            {selectedDivision 
              ? 'Comienza generando el calendario o creando partidos manualmente.'
              : 'Selecciona una temporada y división para ver los partidos.'
            }
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <button
              onClick={() => navigate('/partidos/nuevo')}
              className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Crear Partido Manual
            </button>
            {selectedDivision && teams.length >= 2 && (
              <button
                onClick={handleGenerateCalendar}
                className="px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
              >
                Generar Calendario Automático
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Matches;