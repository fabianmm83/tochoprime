import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  matchService, 
  seasonService, 
  divisionService,
  categoryService,
  fieldService,
  teamService,
  refereeService 
} from '../services/firestore';
import { Match, Season, Division, Category, Field, Team, Referee } from '../types';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Notification from '../components/common/Notification';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

// Esquema de validación para crear/editar partido
const matchSchema = z.object({
  seasonId: z.string().min(1, 'La temporada es requerida'),
  divisionId: z.string().min(1, 'La división es requerida'),
  categoryId: z.string().min(1, 'La categoría es requerida'),
  fieldId: z.string().min(1, 'El campo es requerido'),
  homeTeamId: z.string().min(1, 'El equipo local es requerido'),
  awayTeamId: z.string().min(1, 'El equipo visitante es requerido'),
  matchDate: z.string().min(1, 'La fecha es requerida'),
  matchTime: z.string().min(1, 'La hora es requerida'),
  round: z.number().min(1, 'La jornada debe ser mayor a 0'),
  status: z.enum(['scheduled', 'in_progress', 'completed', 'cancelled', 'postponed']),
  isPlayoff: z.boolean(),
  playoffStage: z.enum(['quarterfinals', 'semifinals', 'final', 'third_place']).optional(),
  refereeId: z.string().optional(),
  notes: z.string().optional(),
  weather: z.enum(['sunny', 'cloudy', 'rainy', 'stormy']).optional(),
  spectators: z.number().min(0).optional()
});

type MatchFormData = z.infer<typeof matchSchema>;

// Esquema de validación para resultado
const resultSchema = z.object({
  homeScore: z.number().min(0, 'Los goles no pueden ser negativos'),
  awayScore: z.number().min(0, 'Los goles no pueden ser negativos'),
  notes: z.string().optional()
});

type ResultFormData = z.infer<typeof resultSchema>;

interface MatchDetailProps {
  mode: 'create' | 'edit' | 'view' | 'result';
}

const MatchDetail: React.FC<MatchDetailProps> = ({ mode }) => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Estados
  const [match, setMatch] = useState<Match | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);
  
  // Estados para datos relacionados
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [fields, setFields] = useState<Field[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [referees, setReferees] = useState<Referee[]>([]);
  
  // Formularios
  const { 
    control: matchControl,
    handleSubmit: handleMatchSubmit,
    formState: { errors: matchErrors },
    reset: resetMatchForm,
    watch: watchMatch
  } = useForm<MatchFormData>({
    resolver: zodResolver(matchSchema),
    defaultValues: {
      seasonId: '',
      divisionId: '',
      categoryId: '',
      fieldId: '',
      homeTeamId: '',
      awayTeamId: '',
      matchDate: format(new Date(), 'yyyy-MM-dd'),
      matchTime: '18:00',
      round: 1,
      status: 'scheduled',
      isPlayoff: false,
      playoffStage: undefined,
      refereeId: '',
      notes: '',
      weather: 'sunny',
      spectators: 0
    }
  });
  
  const {
    control: resultControl,
    handleSubmit: handleResultSubmit,
    formState: { errors: resultErrors },
    reset: resetResultForm
  } = useForm<ResultFormData>({
    resolver: zodResolver(resultSchema),
    defaultValues: {
      homeScore: 0,
      awayScore: 0,
      notes: ''
    }
  });
  
  // Observar cambios en los campos del formulario
  const watchSeasonId = watchMatch('seasonId');
  const watchDivisionId = watchMatch('divisionId');
  const watchIsPlayoff = watchMatch('isPlayoff');
  
  // Cargar datos iniciales
  useEffect(() => {
    loadRelatedData();
    
    if (id && mode !== 'create') {
      loadMatch(id);
    }
  }, [id, mode]);
  
  // Cargar datos relacionados cuando cambian las selecciones
  useEffect(() => {
    if (watchSeasonId) {
      loadDivisions(watchSeasonId);
      loadReferees(watchSeasonId);
    }
  }, [watchSeasonId]);
  
  useEffect(() => {
    if (watchDivisionId) {
      loadCategories(watchDivisionId);
      loadTeams(watchDivisionId);
    }
  }, [watchDivisionId]);
  
  const loadRelatedData = async () => {
    try {
      const [
        seasonsData,
        fieldsData
      ] = await Promise.all([
        seasonService.getSeasons(),
        fieldService.getFields()
      ]);
      
      setSeasons(seasonsData);
      setFields(fieldsData);
      
      if (seasonsData.length > 0 && !id) {
        resetMatchForm({
          ...matchControl._defaultValues,
          seasonId: seasonsData[0].id
        });
      }
    } catch (error) {
      console.error('Error loading related data:', error);
      setNotification({
        type: 'error',
        message: 'Error al cargar los datos relacionados'
      });
    }
  };
  
  const loadMatch = async (matchId: string) => {
    try {
      setLoading(true);
      const matchData = await matchService.getMatchById(matchId);
      
      if (!matchData) {
        setNotification({
          type: 'error',
          message: 'Partido no encontrado'
        });
        navigate('/matches');
        return;
      }
      
      setMatch(matchData);
      
      if (mode === 'edit' || mode === 'view') {
        // Convertir estado del partido para el formulario
        const matchDate = matchData.matchDate instanceof Date 
          ? matchData.matchDate 
          : new Date(matchData.matchDate);
        
        resetMatchForm({
          seasonId: matchData.seasonId,
          divisionId: matchData.divisionId,
          categoryId: matchData.categoryId,
          fieldId: matchData.fieldId,
          homeTeamId: matchData.homeTeamId,
          awayTeamId: matchData.awayTeamId,
          matchDate: format(matchDate, 'yyyy-MM-dd'),
          matchTime: matchData.matchTime,
          round: matchData.round,
          status: matchData.status,
          isPlayoff: matchData.isPlayoff,
          playoffStage: matchData.playoffStage,
          refereeId: matchData.refereeId || '',
          notes: matchData.notes || '',
          weather: matchData.weather || 'sunny',
          spectators: matchData.spectators || 0
        });
      }
      
      if (mode === 'result') {
        resetResultForm({
          homeScore: matchData.homeScore || 0,
          awayScore: matchData.awayScore || 0,
          notes: matchData.notes || ''
        });
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
      const divisionsData = await divisionService.getDivisionsBySeason(seasonId);
      setDivisions(divisionsData);
    } catch (error) {
      console.error('Error loading divisions:', error);
    }
  };
  
  const loadCategories = async (divisionId: string) => {
    try {
      const categoriesData = await categoryService.getCategoriesByDivision(divisionId);
      setCategories(categoriesData);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };
  
  const loadTeams = async (divisionId: string) => {
    try {
      const teamsData = await teamService.getTeamsByDivision(divisionId);
      setTeams(teamsData);
    } catch (error) {
      console.error('Error loading teams:', error);
    }
  };
  
  const loadReferees = async (seasonId: string) => {
    try {
      const refereesData = await refereeService.getReferees(seasonId);
      setReferees(refereesData);
    } catch (error) {
      console.error('Error loading referees:', error);
    }
  };
  
  // Obtener información del equipo
  const getTeamInfo = (teamId: string) => {
    return teams.find(team => team.id === teamId);
  };
  
  // Traducir estado al español para mostrar
  const translateStatus = (status: Match['status']): string => {
    switch (status) {
      case 'scheduled': return 'Programado';
      case 'in_progress': return 'En curso';
      case 'completed': return 'Finalizado';
      case 'postponed': return 'Suspendido';
      case 'cancelled': return 'Cancelado';
      default: return status;
    }
  };
  
  // Traducir estado del español al inglés
  const translateStatusToEnglish = (status: string): Match['status'] => {
    switch (status) {
      case 'programado': return 'scheduled';
      case 'en_curso': return 'in_progress';
      case 'finalizado': return 'completed';
      case 'suspendido': return 'postponed';
      case 'cancelado': return 'cancelled';
      default: return 'scheduled';
    }
  };
  
  // Manejar guardar partido
  const onSaveMatch = async (data: MatchFormData) => {
    try {
      setSaving(true);
      
      // Obtener información de los equipos
      const homeTeam = getTeamInfo(data.homeTeamId);
      const awayTeam = getTeamInfo(data.awayTeamId);
      
      if (!homeTeam || !awayTeam) {
        throw new Error('Equipo no encontrado');
      }
      
      // Crear objeto de partido
      const matchData: Omit<Match, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy'> = {
        seasonId: data.seasonId,
        divisionId: data.divisionId,
        categoryId: data.categoryId,
        fieldId: data.fieldId,
        homeTeamId: data.homeTeamId,
        awayTeamId: data.awayTeamId,
        matchDate: new Date(`${data.matchDate}T${data.matchTime}:00`),
        matchTime: data.matchTime,
        round: data.round,
        status: data.status,
        isPlayoff: data.isPlayoff,
        playoffStage: data.isPlayoff ? data.playoffStage : undefined,
        refereeId: data.refereeId || undefined,
        refereeName: data.refereeId ? referees.find(r => r.id === data.refereeId)?.fullName : undefined,
        notes: data.notes || undefined,
        weather: data.weather || undefined,
        spectators: data.spectators || undefined,
        homeScore: undefined,
        awayScore: undefined,
        winner: undefined,
        resultDetails: undefined
      };
      
      if (mode === 'create') {
        const matchId = await matchService.createMatch(matchData);
        setNotification({
          type: 'success',
          message: 'Partido creado exitosamente'
        });
        navigate(`/matches/${matchId}`);
      } else if (mode === 'edit' && id) {
        await matchService.updateMatch(id, matchData);
        setNotification({
          type: 'success',
          message: 'Partido actualizado exitosamente'
        });
        navigate(`/matches/${id}`);
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
  
  // Manejar guardar resultado
  const onSaveResult = async (data: ResultFormData) => {
    if (!id) return;
    
    try {
      setSaving(true);
      await matchService.updateMatchResult(
        id,
        data.homeScore,
        data.awayScore,
        data.notes
      );
      
      setNotification({
        type: 'success',
        message: 'Resultado registrado exitosamente'
      });
      
      navigate(`/matches/${id}`);
    } catch (error) {
      console.error('Error saving result:', error);
      setNotification({
        type: 'error',
        message: 'Error al registrar el resultado'
      });
    } finally {
      setSaving(false);
    }
  };
  
  // Manejar eliminar
  const handleDelete = async () => {
    if (!id || !confirm('¿Estás seguro de eliminar este partido?')) return;
    
    try {
      await matchService.deleteMatch(id);
      setNotification({
        type: 'success',
        message: 'Partido eliminado exitosamente'
      });
      navigate('/matches');
    } catch (error) {
      console.error('Error deleting match:', error);
      setNotification({
        type: 'error',
        message: 'Error al eliminar el partido'
      });
    }
  };
  
  // Renderizar formulario según el modo
  const renderForm = () => {
    if (mode === 'result') {
      return (
        <form onSubmit={handleResultSubmit(onSaveResult)} className="space-y-6">
          {/* Equipos y resultado */}
          <div className="bg-gray-50 rounded-lg p-6">
            <div className="flex items-center justify-between mb-8">
              {/* Equipo local */}
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900 mb-2">
                  {match?.homeTeam?.name || 'Equipo local'}
                </div>
                <Controller
                  name="homeScore"
                  control={resultControl}
                  render={({ field }) => (
                    <input
                      {...field}
                      type="number"
                      min="0"
                      className="w-24 h-24 text-4xl text-center border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                    />
                  )}
                />
                {resultErrors.homeScore && (
                  <p className="mt-2 text-sm text-red-600">{resultErrors.homeScore.message}</p>
                )}
              </div>
              
              {/* Separador */}
              <div className="text-4xl font-bold text-gray-700 mx-8">VS</div>
              
              {/* Equipo visitante */}
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900 mb-2">
                  {match?.awayTeam?.name || 'Equipo visitante'}
                </div>
                <Controller
                  name="awayScore"
                  control={resultControl}
                  render={({ field }) => (
                    <input
                      {...field}
                      type="number"
                      min="0"
                      className="w-24 h-24 text-4xl text-center border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                    />
                  )}
                />
                {resultErrors.awayScore && (
                  <p className="mt-2 text-sm text-red-600">{resultErrors.awayScore.message}</p>
                )}
              </div>
            </div>
            
            {/* Notas */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notas del partido
              </label>
              <Controller
                name="notes"
                control={resultControl}
                render={({ field }) => (
                  <textarea
                    {...field}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Detalles del partido, incidencias, etc."
                  />
                )}
              />
            </div>
          </div>
          
          {/* Botones */}
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => navigate(`/matches/${id}`)}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Guardando...' : 'Registrar Resultado'}
            </button>
          </div>
        </form>
      );
    }
    
    return (
      <form onSubmit={handleMatchSubmit(onSaveMatch)} className="space-y-6">
        {/* Información básica */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Temporada */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Temporada *
            </label>
            <Controller
              name="seasonId"
              control={matchControl}
              render={({ field }) => (
                <select
                  {...field}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={mode === 'view'}
                >
                  <option value="">Seleccionar temporada</option>
                  {seasons.map(season => (
                    <option key={season.id} value={season.id}>
                      {season.name}
                    </option>
                  ))}
                </select>
              )}
            />
            {matchErrors.seasonId && (
              <p className="mt-2 text-sm text-red-600">{matchErrors.seasonId.message}</p>
            )}
          </div>
          
          {/* División */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              División *
            </label>
            <Controller
              name="divisionId"
              control={matchControl}
              render={({ field }) => (
                <select
                  {...field}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={mode === 'view' || !watchSeasonId}
                >
                  <option value="">Seleccionar división</option>
                  {divisions.map(division => (
                    <option key={division.id} value={division.id}>
                      {division.name}
                    </option>
                  ))}
                </select>
              )}
            />
            {matchErrors.divisionId && (
              <p className="mt-2 text-sm text-red-600">{matchErrors.divisionId.message}</p>
            )}
          </div>
        </div>
        
        {/* Equipos */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Equipo local */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Equipo Local *
            </label>
            <Controller
              name="homeTeamId"
              control={matchControl}
              render={({ field }) => (
                <select
                  {...field}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={mode === 'view' || !watchDivisionId}
                >
                  <option value="">Seleccionar equipo local</option>
                  {teams.map(team => (
                    <option key={team.id} value={team.id}>
                      {team.name}
                    </option>
                  ))}
                </select>
              )}
            />
            {matchErrors.homeTeamId && (
              <p className="mt-2 text-sm text-red-600">{matchErrors.homeTeamId.message}</p>
            )}
          </div>
          
          {/* Equipo visitante */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Equipo Visitante *
            </label>
            <Controller
              name="awayTeamId"
              control={matchControl}
              render={({ field }) => (
                <select
                  {...field}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={mode === 'view' || !watchDivisionId}
                >
                  <option value="">Seleccionar equipo visitante</option>
                  {teams.map(team => (
                    <option key={team.id} value={team.id}>
                      {team.name}
                    </option>
                  ))}
                </select>
              )}
            />
            {matchErrors.awayTeamId && (
              <p className="mt-2 text-sm text-red-600">{matchErrors.awayTeamId.message}</p>
            )}
          </div>
        </div>
        
        {/* Fecha, hora y campo */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Fecha */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fecha *
            </label>
            <Controller
              name="matchDate"
              control={matchControl}
              render={({ field }) => (
                <input
                  {...field}
                  type="date"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={mode === 'view'}
                />
              )}
            />
            {matchErrors.matchDate && (
              <p className="mt-2 text-sm text-red-600">{matchErrors.matchDate.message}</p>
            )}
          </div>
          
          {/* Hora */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Hora *
            </label>
            <Controller
              name="matchTime"
              control={matchControl}
              render={({ field }) => (
                <input
                  {...field}
                  type="time"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={mode === 'view'}
                />
              )}
            />
            {matchErrors.matchTime && (
              <p className="mt-2 text-sm text-red-600">{matchErrors.matchTime.message}</p>
            )}
          </div>
          
          {/* Campo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Campo *
            </label>
            <Controller
              name="fieldId"
              control={matchControl}
              render={({ field }) => (
                <select
                  {...field}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={mode === 'view'}
                >
                  <option value="">Seleccionar campo</option>
                  {fields.map(field => (
                    <option key={field.id} value={field.id}>
                      {field.name}
                    </option>
                  ))}
                </select>
              )}
            />
            {matchErrors.fieldId && (
              <p className="mt-2 text-sm text-red-600">{matchErrors.fieldId.message}</p>
            )}
          </div>
        </div>
        
        {/* Detalles del partido */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Categoría */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Categoría *
            </label>
            <Controller
              name="categoryId"
              control={matchControl}
              render={({ field }) => (
                <select
                  {...field}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={mode === 'view' || !watchDivisionId}
                >
                  <option value="">Seleccionar categoría</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              )}
            />
            {matchErrors.categoryId && (
              <p className="mt-2 text-sm text-red-600">{matchErrors.categoryId.message}</p>
            )}
          </div>
          
          {/* Jornada */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Jornada *
            </label>
            <Controller
              name="round"
              control={matchControl}
              render={({ field }) => (
                <input
                  {...field}
                  type="number"
                  min="1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={mode === 'view'}
                  onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                />
              )}
            />
            {matchErrors.round && (
              <p className="mt-2 text-sm text-red-600">{matchErrors.round.message}</p>
            )}
          </div>
        </div>
        
        {/* Playoff */}
<div className="flex items-center space-x-3">
  <Controller
    name="isPlayoff"
    control={matchControl}
    render={({ field }) => (
      <input
        type="checkbox"
        id="isPlayoff"
        className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
        disabled={mode === 'view'}
        checked={field.value}
        onChange={(e) => field.onChange(e.target.checked)}
        onBlur={field.onBlur}
        ref={field.ref}
        name={field.name}
        // Eliminar value prop o convertirlo a string
      />
    )}
  />
  <label htmlFor="isPlayoff" className="text-sm font-medium text-gray-700">
    Partido de Playoff
  </label>
</div>
        
        {watchIsPlayoff && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fase de Playoff
            </label>
            <Controller
              name="playoffStage"
              control={matchControl}
              render={({ field }) => (
                <select
                  {...field}
                  className="w-full md:w-64 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={mode === 'view'}
                >
                  <option value="">Seleccionar fase</option>
                  <option value="quarterfinals">Cuartos de final</option>
                  <option value="semifinals">Semifinal</option>
                  <option value="final">Final</option>
                  <option value="third_place">Tercer lugar</option>
                </select>
              )}
            />
          </div>
        )}
        
        {/* Árbitro y estado */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Árbitro */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Árbitro
            </label>
            <Controller
              name="refereeId"
              control={matchControl}
              render={({ field }) => (
                <select
                  {...field}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={mode === 'view' || !watchSeasonId}
                >
                  <option value="">Sin árbitro asignado</option>
                  {referees.map(referee => (
                    <option key={referee.id} value={referee.id}>
                      {referee.fullName} ({referee.level})
                    </option>
                  ))}
                </select>
              )}
            />
          </div>
          
          {/* Estado */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Estado *
            </label>
            <Controller
              name="status"
              control={matchControl}
              render={({ field }) => (
                <select
                  {...field}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={mode === 'view'}
                >
                  <option value="scheduled">Programado</option>
                  <option value="in_progress">En curso</option>
                  <option value="completed">Finalizado</option>
                  <option value="postponed">Suspendido</option>
                  <option value="cancelled">Cancelado</option>
                </select>
              )}
            />
          </div>
        </div>
        
        {/* Notas y clima */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Notas */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notas
            </label>
            <Controller
              name="notes"
              control={matchControl}
              render={({ field }) => (
                <textarea
                  {...field}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Detalles del partido, incidencias, etc."
                  disabled={mode === 'view'}
                />
              )}
            />
          </div>
          
          {/* Clima y espectadores */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Clima
              </label>
              <Controller
                name="weather"
                control={matchControl}
                render={({ field }) => (
                  <select
                    {...field}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={mode === 'view'}
                  >
                    <option value="sunny">Soleado</option>
                    <option value="cloudy">Nublado</option>
                    <option value="rainy">Lluvia</option>
                    <option value="stormy">Tormenta</option>
                  </select>
                )}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Espectadores
              </label>
              <Controller
                name="spectators"
                control={matchControl}
                render={({ field }) => (
                  <input
                    {...field}
                    type="number"
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={mode === 'view'}
                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                  />
                )}
              />
            </div>
          </div>
        </div>
        
        {/* Botones (solo para crear/editar) */}
        {mode !== 'view' && (
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => navigate('/matches')}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Guardando...' : mode === 'create' ? 'Crear Partido' : 'Actualizar Partido'}
            </button>
          </div>
        )}
      </form>
    );
  };
  
  if (loading) return <LoadingSpinner />;
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {mode === 'create' ? 'Nuevo Partido' : 
               mode === 'edit' ? 'Editar Partido' :
               mode === 'result' ? 'Registrar Resultado' : 'Detalles del Partido'}
            </h1>
            <p className="text-gray-600">
              {mode === 'create' ? 'Crea un nuevo partido para la liga' :
               mode === 'edit' ? 'Modifica la información del partido' :
               mode === 'result' ? 'Registra el resultado final del partido' :
               'Información completa del partido'}
            </p>
          </div>
          
          {mode === 'view' && match && (
            <div className="flex space-x-3">
              <button
                onClick={() => navigate(`/matches/${match.id}/result`)}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                Registrar Resultado
              </button>
              <button
                onClick={() => navigate(`/matches/${match.id}/edit`)}
                className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-yellow-500"
              >
                Editar
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                Eliminar
              </button>
            </div>
          )}
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
      
      {/* Vista de solo lectura para modo 'view' */}
      {mode === 'view' && match ? (
        <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
          {/* Información principal */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Equipos</h3>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-6 h-6 rounded-full" 
                      style={{ backgroundColor: match.homeTeam?.primaryColor || '#3B82F6' }}
                    />
                    <span className="font-medium">{match.homeTeam?.name || 'Equipo local'}</span>
                  </div>
                  <span className="text-2xl font-bold">VS</span>
                  <div className="flex items-center space-x-3">
                    <span className="font-medium">{match.awayTeam?.name || 'Equipo visitante'}</span>
                    <div 
                      className="w-6 h-6 rounded-full" 
                      style={{ backgroundColor: match.awayTeam?.primaryColor || '#EF4444' }}
                    />
                  </div>
                </div>
                
                {match.status === 'completed' && (
                  <div className="text-center mt-4">
                    <div className="inline-block bg-gray-100 px-6 py-3 rounded-lg">
                      <span className="text-3xl font-bold text-gray-900">
                        {match.homeScore || 0} - {match.awayScore || 0}
                      </span>
                      {match.winner && (
                        <div className="text-sm text-gray-600 mt-1">
                          Ganador: {match.winner === 'home' ? match.homeTeam?.name : match.awayTeam?.name}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Información del Partido</h3>
                <dl className="space-y-2">
                  <div className="flex justify-between">
                    <dt className="text-gray-600">Fecha y Hora:</dt>
                    <dd className="font-medium">
                      {format(new Date(match.matchDate), "dd 'de' MMMM 'de' yyyy", { locale: es })} - {match.matchTime}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-600">Jornada:</dt>
                    <dd className="font-medium">{match.round}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-600">Estado:</dt>
                    <dd>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        match.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                        match.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                        match.status === 'completed' ? 'bg-green-100 text-green-800' :
                        match.status === 'postponed' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {translateStatus(match.status).toUpperCase()}
                      </span>
                    </dd>
                  </div>
                  {match.isPlayoff && match.playoffStage && (
                    <div className="flex justify-between">
                      <dt className="text-gray-600">Fase de Playoff:</dt>
                      <dd className="font-medium text-red-600">
                        {match.playoffStage === 'quarterfinals' ? 'Cuartos de final' :
                         match.playoffStage === 'semifinals' ? 'Semifinal' :
                         match.playoffStage === 'final' ? 'Final' : 'Tercer lugar'}
                      </dd>
                    </div>
                  )}
                </dl>
              </div>
            </div>
          </div>
          
          {/* Información adicional */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Detalles Adicionales</h3>
              <dl className="space-y-2">
                {match.refereeName && (
                  <div className="flex justify-between">
                    <dt className="text-gray-600">Árbitro:</dt>
                    <dd className="font-medium">{match.refereeName}</dd>
                  </div>
                )}
                {match.weather && (
                  <div className="flex justify-between">
                    <dt className="text-gray-600">Clima:</dt>
                    <dd className="font-medium capitalize">
                      {match.weather === 'sunny' ? 'Soleado' :
                       match.weather === 'cloudy' ? 'Nublado' :
                       match.weather === 'rainy' ? 'Lluvia' :
                       match.weather === 'stormy' ? 'Tormenta' : match.weather}
                    </dd>
                  </div>
                )}
                {match.spectators && (
                  <div className="flex justify-between">
                    <dt className="text-gray-600">Espectadores:</dt>
                    <dd className="font-medium">{match.spectators}</dd>
                  </div>
                )}
              </dl>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Notas</h3>
              {match.notes ? (
                <p className="text-gray-700 bg-gray-50 p-4 rounded-lg">{match.notes}</p>
              ) : (
                <p className="text-gray-500 italic">Sin notas</p>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md p-6">
          {renderForm()}
        </div>
      )}
    </div>
  );
};

export default MatchDetail;