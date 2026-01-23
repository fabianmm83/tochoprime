// src/pages/MatchDetail.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { 
  matchesService, 
  seasonsService, 
  divisionsService, 
  teamsService,
  refereesService,
  fieldsService 
} from '../services/firestore';
import { Match, Season, Division, Team, Referee, Field } from '../types';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Notification from '../components/common/Notification';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

type MatchDetailMode = 'view' | 'create' | 'edit' | 'result';

const MatchDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const path = location.pathname;
  let mode: MatchDetailMode = 'view';
  
  if (path.includes('/partidos/nuevo') || path === '/partidos/nuevo') {
    mode = 'create';
  } else if (path.includes('/editar')) {
    mode = 'edit';
  } else if (path.includes('/resultado')) {
    mode = 'result';
  }
  
  // Estados
  const [match, setMatch] = useState<Match | null>(null);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [referees, setReferees] = useState<Referee[]>([]);
  const [fields, setFields] = useState<Field[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);
  
  // Formulario - CORREGIDO: Todos los campos requeridos son strings no undefined
  const [formData, setFormData] = useState({
    seasonId: '',
    divisionId: '',
    homeTeamId: '',
    awayTeamId: '',
    refereeId: '',
    fieldId: '',
    matchDate: '',
    matchTime: '',
    notes: '',
    status: 'scheduled' as 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'postponed',
    homeScore: 0,
    awayScore: 0,
    winner: '' as '' | 'home' | 'away' | 'draw',
    isPlayoff: false,
    playoffStage: '' as '' | 'quarterfinals' | 'semifinals' | 'final' | 'third_place',
    round: 1
  });
  
  // Cargar datos iniciales
  useEffect(() => {
    loadData();
  }, []);
  
  useEffect(() => {
    if (id && mode !== 'create') {
      loadMatch(id);
    }
  }, [id, mode]);
  
  const loadData = async () => {
    try {
      setLoading(true);
      const seasonsData = await seasonsService.getSeasons();
      setSeasons(seasonsData);
      
      if (seasonsData.length > 0 && !formData.seasonId) {
        setFormData(prev => ({ ...prev, seasonId: seasonsData[0].id }));
      }
      
      // Cargar todos los campos una vez al inicio
      await loadFields();
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
  
  const loadMatch = async (matchId: string) => {
    try {
      setLoading(true);
      const matchData = id ? await matchesService.getMatchById(matchId) : null;
      
      if (matchData) {
        setMatch(matchData);
        
        const matchDate = matchData.matchDate instanceof Date 
          ? matchData.matchDate 
          : new Date(matchData.matchDate);
        
        setFormData({
          seasonId: matchData.seasonId || '',
          divisionId: matchData.divisionId || '',
          homeTeamId: matchData.homeTeamId || '',
          awayTeamId: matchData.awayTeamId || '',
          refereeId: matchData.refereeId || '',
          fieldId: matchData.fieldId || '',
          matchDate: matchDate.toISOString().split('T')[0],
          matchTime: matchData.matchTime || '',
          notes: matchData.notes || '',
          status: matchData.status || 'scheduled',
          homeScore: matchData.homeScore || 0,
          awayScore: matchData.awayScore || 0,
          winner: matchData.winner || '',
          isPlayoff: matchData.isPlayoff || false,
          playoffStage: matchData.playoffStage || '',
          round: matchData.round || 1
        });
        
        // Cargar datos relacionados
        if (matchData.seasonId) {
          await loadDivisions(matchData.seasonId);
          await loadReferees(matchData.seasonId);
        }
        if (matchData.divisionId) {
          await loadTeams(matchData.divisionId);
        }
      }
    } catch (error) {
      console.error('Error loading match:', error);
      setNotification({
        type: 'error',
        message: 'Error al cargar el partido'
      });
    } finally {
      setLoading(false);
    }
  };
  
  const loadDivisions = async (seasonId: string) => {
    try {
      const divisionsData = await divisionsService.getDivisionsBySeason(seasonId);
      setDivisions(divisionsData);
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
  
  const loadReferees = async (seasonId: string) => {
    try {
      const refereesData = await refereesService.getReferees(seasonId);
      setReferees(refereesData);
    } catch (error) {
      console.error('Error loading referees:', error);
    }
  };
  
  const loadFields = async () => {
    try {
      const fieldsData = await fieldsService.getFields();
      setFields(fieldsData);
    } catch (error) {
      console.error('Error loading fields:', error);
    }
  };
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else if (type === 'number') {
      setFormData(prev => ({ ...prev, [name]: parseInt(value) || 0 }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
      
      // Cargar datos cuando se selecciona temporada
      if (name === 'seasonId' && value) {
        loadDivisions(value);
        loadReferees(value);
      }
      
      // Cargar equipos cuando se selecciona división
      if (name === 'divisionId' && value) {
        loadTeams(value);
      }
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar campos requeridos
    if (!formData.seasonId || !formData.divisionId || !formData.homeTeamId || !formData.awayTeamId || !formData.matchDate || !formData.matchTime) {
      setNotification({
        type: 'error',
        message: 'Por favor complete todos los campos requeridos (*)'
      });
      return;
    }
    
    // Validar que no sean el mismo equipo
    if (formData.homeTeamId === formData.awayTeamId) {
      setNotification({
        type: 'error',
        message: 'El equipo local y visitante no pueden ser el mismo'
      });
      return;
    }
    
    try {
      setSaving(true);
      
      // Preparar datos del partido - SIN campos undefined
      const matchDate = formData.matchDate ? new Date(formData.matchDate) : new Date();
      
      // Crear objeto con solo los campos definidos
      const matchData: Omit<Match, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy'> = {
        seasonId: formData.seasonId,
        divisionId: formData.divisionId,
        categoryId: '', // Añadir si es necesario
        fieldId: formData.fieldId || '',
        homeTeamId: formData.homeTeamId,
        awayTeamId: formData.awayTeamId,
        matchDate,
        matchTime: formData.matchTime,
        round: formData.round,
        isPlayoff: formData.isPlayoff,
        status: formData.status,
        notes: formData.notes || ''
      };
      
      // Añadir campos opcionales solo si tienen valor
      if (formData.refereeId) matchData.refereeId = formData.refereeId;
      if (formData.playoffStage) matchData.playoffStage = formData.playoffStage;
      
      // Si estamos en modo resultado, añadir puntuación
      if (mode === 'result' && id) {
        matchData.homeScore = formData.homeScore;
        matchData.awayScore = formData.awayScore;
        matchData.winner = formData.winner || undefined;
        matchData.status = 'completed';
      }
      
      if (mode === 'create') {
        // CORREGIDO: Asegurar que todos los campos requeridos están presentes
        const completeMatchData = {
          ...matchData,
          createdAt: new Date(),
          createdBy: user?.uid || 'system',
          updatedAt: new Date(),
          updatedBy: user?.uid || 'system'
        } as Omit<Match, 'id'>;
        
        await matchesService.createMatch(completeMatchData);
        setNotification({
          type: 'success',
          message: 'Partido creado exitosamente'
        });
        navigate('/partidos');
        
      } else if (mode === 'edit' && id) {
        const updateData = {
          ...matchData,
          updatedAt: new Date(),
          updatedBy: user?.uid || 'system'
        };
        
        await matchesService.updateMatch(id, updateData);
        setNotification({
          type: 'success',
          message: 'Partido actualizado exitosamente'
        });
        navigate(`/partidos/${id}`);
        
      } else if (mode === 'result' && id) {
        const resultData = {
          homeScore: formData.homeScore,
          awayScore: formData.awayScore,
          winner: formData.winner || undefined,
          status: 'completed' as const,
          notes: formData.notes,
          updatedAt: new Date(),
          updatedBy: user?.uid || 'system'
        };
        
        await matchesService.updateMatch(id, resultData);
        setNotification({
          type: 'success',
          message: 'Resultado registrado exitosamente'
        });
        navigate(`/partidos/${id}`);
      }
    } catch (error) {
      console.error('Error saving match:', error);
      setNotification({
        type: 'error',
        message: 'Error al guardar el partido'
      });
    } finally {
      setSaving(false);
    }
  };
  
  const getTitle = () => {
    switch (mode) {
      case 'create': return 'Crear Nuevo Partido';
      case 'edit': return 'Editar Partido';
      case 'result': return 'Registrar Resultado';
      default: return 'Detalles del Partido';
    }
  };
  
  const formatDate = (date: Date | string) => {
    try {
      const dateObj = date instanceof Date ? date : new Date(date);
      if (isNaN(dateObj.getTime())) return 'Fecha no válida';
      return format(dateObj, "dd 'de' MMMM 'de' yyyy", { locale: es });
    } catch {
      return 'Fecha no válida';
    }
  };
  
  // Función para obtener nombre del campo
  const getFieldName = (fieldId?: string) => {
    if (!fieldId) return 'No asignado';
    const field = fields.find(f => f.id === fieldId);
    return field?.name || 'Campo no encontrado';
  };
  
  // Función para obtener nombre completo del árbitro
  const getRefereeFullName = (refereeId?: string) => {
    if (!refereeId) return 'No asignado';
    const referee = referees.find(r => r.id === refereeId);
    return referee?.fullName || `${referee?.firstName || ''} ${referee?.lastName || ''}`.trim() || 'Árbitro no encontrado';
  };
  
  // Obtener equipo por ID
  const getTeamById = (teamId?: string) => {
    if (!teamId) return null;
    return teams.find(team => team.id === teamId);
  };
  
  // Obtener nombre del equipo
  const getTeamName = (teamId?: string) => {
    const team = getTeamById(teamId);
    return team?.name || 'Equipo no encontrado';
  };
  
  if (loading) return <LoadingSpinner />;
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{getTitle()}</h1>
            <p className="text-gray-600">
              {mode === 'view' ? 'Información detallada del partido' : 
               mode === 'result' ? 'Registra el resultado del partido' :
               'Completa el formulario para gestionar el partido'}
            </p>
          </div>
          
          <button
            onClick={() => navigate('/partidos')}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 flex items-center space-x-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span>Volver a Partidos</span>
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
      
      <div className="bg-white rounded-lg shadow-md p-6">
        {mode === 'view' && match ? (
          // Vista de detalles
          <div className="space-y-6">
            {/* Información básica */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Información del Partido</h3>
                <dl className="space-y-3">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Estado</dt>
                    <dd className="mt-1">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        match.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                        match.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                        match.status === 'completed' ? 'bg-green-100 text-green-800' :
                        match.status === 'postponed' ? 'bg-orange-100 text-orange-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {match.status === 'scheduled' ? 'Programado' :
                         match.status === 'in_progress' ? 'En curso' :
                         match.status === 'completed' ? 'Finalizado' :
                         match.status === 'postponed' ? 'Suspendido' : 'Cancelado'}
                      </span>
                    </dd>
                  </div>
                  
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Fecha y Hora</dt>
                    <dd className="mt-1 text-gray-900">{formatDate(match.matchDate)} - {match.matchTime}</dd>
                  </div>
                  
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Ronda</dt>
                    <dd className="mt-1 text-gray-900">Jornada {match.round}</dd>
                  </div>
                  
                  {match.isPlayoff && match.playoffStage && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Etapa de Playoff</dt>
                      <dd className="mt-1 text-gray-900">
                        {match.playoffStage === 'quarterfinals' ? 'Cuartos de final' :
                         match.playoffStage === 'semifinals' ? 'Semifinal' :
                         match.playoffStage === 'final' ? 'Final' : 'Tercer lugar'}
                      </dd>
                    </div>
                  )}
                  
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Campo</dt>
                    <dd className="mt-1 text-gray-900">{getFieldName(match.fieldId)}</dd>
                  </div>
                </dl>
              </div>
              
              {/* Equipos */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Equipos</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 flex items-center justify-center bg-blue-100 text-blue-800 rounded-full font-bold">
                        {getTeamName(match.homeTeamId)?.charAt(0) || 'L'}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{getTeamName(match.homeTeamId)}</div>
                        <div className="text-sm text-gray-600">Local</div>
                      </div>
                    </div>
                    <div className="text-3xl font-bold text-gray-900">
                      {match.status === 'completed' ? match.homeScore || 0 : '-'}
                    </div>
                  </div>
                  
                  <div className="text-center py-2">
                    <span className="text-gray-500 font-medium">VS</span>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="text-3xl font-bold text-gray-900">
                      {match.status === 'completed' ? match.awayScore || 0 : '-'}
                    </div>
                    <div className="flex items-center space-x-3">
                      <div>
                        <div className="font-medium text-gray-900 text-right">{getTeamName(match.awayTeamId)}</div>
                        <div className="text-sm text-gray-600 text-right">Visitante</div>
                      </div>
                      <div className="w-10 h-10 flex items-center justify-center bg-red-100 text-red-800 rounded-full font-bold">
                        {getTeamName(match.awayTeamId)?.charAt(0) || 'V'}
                      </div>
                    </div>
                  </div>
                  
                  {match.status === 'completed' && match.winner && (
                    <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                      <div className="text-center font-medium text-green-800">
                        Ganador: {match.winner === 'home' ? getTeamName(match.homeTeamId) : getTeamName(match.awayTeamId)}
                      </div>
                      {match.winner === 'draw' && (
                        <div className="text-center text-sm text-green-600 mt-1">Empate</div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Información adicional */}
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Información Adicional</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Árbitro</dt>
                  <dd className="mt-1 text-gray-900">{getRefereeFullName(match.refereeId)}</dd>
                </div>
                
                <div>
                  <dt className="text-sm font-medium text-gray-500">Notas</dt>
                  <dd className="mt-1 text-gray-900">{match.notes || 'Sin notas'}</dd>
                </div>
                
                <div>
                  <dt className="text-sm font-medium text-gray-500">Creado</dt>
                  <dd className="mt-1 text-gray-900">
                    {match.createdAt ? formatDate(match.createdAt) : 'No disponible'}
                  </dd>
                </div>
              </div>
            </div>
            
            {/* Acciones */}
            <div className="border-t border-gray-200 pt-6">
              <div className="flex space-x-3">
                <button
                  onClick={() => navigate(`/partidos/${id}/editar`)}
                  className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 flex items-center space-x-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  <span>Editar</span>
                </button>
                
                {match.status === 'scheduled' && (
                  <button
                    onClick={() => navigate(`/partidos/${id}/resultado`)}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 flex items-center space-x-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Registrar Resultado</span>
                  </button>
                )}
                
                <button
                  onClick={() => navigate('/partidos')}
                  className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 flex items-center space-x-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  <span>Volver</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          // Formulario para crear/editar/resultado
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Temporada */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Temporada *
                </label>
                <select
                  name="seasonId"
                  value={formData.seasonId}
                  onChange={handleChange}
                  required
                  disabled={mode === 'result'}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                >
                  <option value="">Seleccionar temporada</option>
                  {seasons.map(season => (
                    <option key={season.id} value={season.id}>
                      {season.name}
                    </option>
                  ))}
                </select>
              </div>
              
              {/* División */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  División *
                </label>
                <select
                  name="divisionId"
                  value={formData.divisionId}
                  onChange={handleChange}
                  required
                  disabled={mode === 'result' || !formData.seasonId}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                >
                  <option value="">Seleccionar división</option>
                  {divisions.map(division => (
                    <option key={division.id} value={division.id}>
                      {division.name}
                    </option>
                  ))}
                </select>
              </div>
              
              {/* Equipo Local */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Equipo Local *
                </label>
                <select
                  name="homeTeamId"
                  value={formData.homeTeamId}
                  onChange={handleChange}
                  required
                  disabled={mode === 'result' || !formData.divisionId}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                >
                  <option value="">Seleccionar equipo local</option>
                  {teams.map(team => (
                    <option key={team.id} value={team.id}>
                      {team.name}
                    </option>
                  ))}
                </select>
              </div>
              
              {/* Equipo Visitante */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Equipo Visitante *
                </label>
                <select
                  name="awayTeamId"
                  value={formData.awayTeamId}
                  onChange={handleChange}
                  required
                  disabled={mode === 'result' || !formData.divisionId}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                >
                  <option value="">Seleccionar equipo visitante</option>
                  {teams
                    .filter(team => team.id !== formData.homeTeamId)
                    .map(team => (
                      <option key={team.id} value={team.id}>
                        {team.name}
                      </option>
                    ))}
                </select>
              </div>
              
              {/* Fecha y Hora */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha *
                </label>
                <input
                  type="date"
                  name="matchDate"
                  value={formData.matchDate}
                  onChange={handleChange}
                  required
                  disabled={mode === 'result'}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hora *
                </label>
                <input
                  type="time"
                  name="matchTime"
                  value={formData.matchTime}
                  onChange={handleChange}
                  required
                  disabled={mode === 'result'}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                />
              </div>
              
              {/* Árbitro */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Árbitro
                </label>
                <select
                  name="refereeId"
                  value={formData.refereeId}
                  onChange={handleChange}
                  disabled={mode === 'result' || !formData.seasonId}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                >
                  <option value="">Seleccionar árbitro</option>
                  {referees.map(referee => (
                    <option key={referee.id} value={referee.id}>
                      {referee.fullName || `${referee.firstName} ${referee.lastName}`}
                    </option>
                  ))}
                </select>
              </div>
              
              {/* Campo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Campo
                </label>
                <select
                  name="fieldId"
                  value={formData.fieldId}
                  onChange={handleChange}
                  disabled={mode === 'result'}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                >
                  <option value="">Seleccionar campo</option>
                  {fields.map(field => (
                    <option key={field.id} value={field.id}>
                      {field.name} ({field.type})
                    </option>
                  ))}
                </select>
              </div>
              
              {/* Ronda */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ronda
                </label>
                <input
                  type="number"
                  name="round"
                  value={formData.round}
                  onChange={handleChange}
                  min="1"
                  disabled={mode === 'result'}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                />
              </div>
              
              {/* Playoff */}
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  name="isPlayoff"
                  checked={formData.isPlayoff}
                  onChange={handleChange}
                  disabled={mode === 'result'}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded disabled:bg-gray-100"
                />
                <label className="block text-sm text-gray-700">
                  Es partido de playoff
                </label>
              </div>
              
              {formData.isPlayoff && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Etapa de Playoff
                  </label>
                  <select
                    name="playoffStage"
                    value={formData.playoffStage}
                    onChange={handleChange}
                    disabled={mode === 'result'}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                  >
                    <option value="">Seleccionar etapa</option>
                    <option value="quarterfinals">Cuartos de final</option>
                    <option value="semifinals">Semifinal</option>
                    <option value="final">Final</option>
                    <option value="third_place">Tercer lugar</option>
                  </select>
                </div>
              )}
              
              {/* Estado (solo en crear/editar) */}
              {mode !== 'result' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Estado
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="scheduled">Programado</option>
                    <option value="in_progress">En curso</option>
                    <option value="postponed">Suspendido</option>
                    <option value="cancelled">Cancelado</option>
                  </select>
                </div>
              )}
              
              {/* Resultados (solo en resultado) */}
              {mode === 'result' && (
                <>
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <label className="block text-sm font-medium text-blue-700 mb-2">
                      Goles Local
                    </label>
                    <input
                      type="number"
                      name="homeScore"
                      value={formData.homeScore}
                      onChange={handleChange}
                      min="0"
                      className="w-full px-3 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    />
                  </div>
                  
                  <div className="bg-red-50 p-4 rounded-lg">
                    <label className="block text-sm font-medium text-red-700 mb-2">
                      Goles Visitante
                    </label>
                    <input
                      type="number"
                      name="awayScore"
                      value={formData.awayScore}
                      onChange={handleChange}
                      min="0"
                      className="w-full px-3 py-2 border border-red-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
                    />
                  </div>
                  
                  <div className="col-span-2 bg-green-50 p-4 rounded-lg">
                    <label className="block text-sm font-medium text-green-700 mb-2">
                      Ganador
                    </label>
                    <select
                      name="winner"
                      value={formData.winner}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-green-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
                    >
                      <option value="">Sin ganador (empate)</option>
                      <option value="home">Local</option>
                      <option value="away">Visitante</option>
                      <option value="draw">Empate</option>
                    </select>
                  </div>
                </>
              )}
            </div>
            
            {/* Notas */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notas
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Notas adicionales sobre el partido..."
              />
            </div>
            
            {/* Botones de acción */}
            <div className="flex space-x-3 pt-6 border-t border-gray-200">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {saving ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Guardando...</span>
                  </>
                ) : mode === 'create' ? (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    <span>Crear Partido</span>
                  </>
                ) : mode === 'edit' ? (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Actualizar Partido</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Registrar Resultado</span>
                  </>
                )}
              </button>
              
              <button
                type="button"
                onClick={() => navigate('/partidos')}
                className="px-6 py-3 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 flex items-center space-x-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
                <span>Cancelar</span>
              </button>
              
              {mode !== 'create' && id && (
                <button
                  type="button"
                  onClick={() => navigate(`/partidos/${id}`)}
                  className="px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 flex items-center space-x-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  <span>Ver Detalles</span>
                </button>
              )}
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default MatchDetail;