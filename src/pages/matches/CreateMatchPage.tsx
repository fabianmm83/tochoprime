// src/pages/matches/CreateMatchPage.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  seasonsService, 
  divisionsService, 
  teamsService,
  refereesService,
  fieldsService,
  matchesService
} from '../../services/firestore';
import { Season, Division, Team, Referee, Field } from '../../types';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Notification from '../../components/common/Notification';

interface CreateMatchPageProps {
  initialData?: any;
  mode?: 'create' | 'edit';
}

const CreateMatchPage: React.FC<CreateMatchPageProps> = ({ 
  initialData, 
  mode = 'create' 
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Estados
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
  
  // Formulario
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
    round: 1,
    isPlayoff: false,
    playoffStage: '' as '' | 'quarterfinals' | 'semifinals' | 'final' | 'third_place',
    status: 'scheduled' as 'scheduled' | 'in_progress' | 'postponed' | 'cancelled'
  });
  
  // Cargar datos iniciales
  useEffect(() => {
    loadData();
  }, []);
  
  useEffect(() => {
    if (initialData && mode === 'edit') {
      // Rellenar formData con initialData
      const matchDate = initialData.matchDate instanceof Date 
        ? initialData.matchDate 
        : new Date(initialData.matchDate);
      
      setFormData({
        seasonId: initialData.seasonId || '',
        divisionId: initialData.divisionId || '',
        homeTeamId: initialData.homeTeamId || '',
        awayTeamId: initialData.awayTeamId || '',
        refereeId: initialData.refereeId || '',
        fieldId: initialData.fieldId || '',
        matchDate: matchDate.toISOString().split('T')[0],
        matchTime: initialData.matchTime || '',
        notes: initialData.notes || '',
        round: initialData.round || 1,
        isPlayoff: initialData.isPlayoff || false,
        playoffStage: initialData.playoffStage || '',
        status: initialData.status || 'scheduled'
      });
    }
  }, [initialData, mode]);
  
  const loadData = async () => {
    try {
      setLoading(true);
      const seasonsData = await seasonsService.getSeasons();
      setSeasons(seasonsData);
      
      const fieldsData = await fieldsService.getFields();
      setFields(fieldsData);
      
      // Si hay datos iniciales, cargar divisiones y equipos relacionados
      if (initialData && mode === 'edit') {
        if (initialData.seasonId) {
          await loadDivisions(initialData.seasonId);
          await loadReferees(initialData.seasonId);
        }
        if (initialData.divisionId) {
          await loadTeams(initialData.divisionId);
        }
      } else {
        // Seleccionar la temporada activa por defecto en modo creación
        const activeSeason = seasonsData.find(season => season.status === 'active');
        if (activeSeason && !formData.seasonId) {
          setFormData(prev => ({ ...prev, seasonId: activeSeason.id }));
          await loadDivisions(activeSeason.id);
        }
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
      
      // Si estamos en modo creación, seleccionar primera división por defecto
      if (mode === 'create' && divisionsData.length > 0 && !formData.divisionId) {
        setFormData(prev => ({ ...prev, divisionId: divisionsData[0].id }));
        await loadTeams(divisionsData[0].id);
        await loadReferees(seasonId);
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
  
  const loadReferees = async (seasonId: string) => {
    try {
      const refereesData = await refereesService.getReferees(seasonId);
      setReferees(refereesData);
    } catch (error) {
      console.error('Error loading referees:', error);
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
        setFormData(prev => ({ 
          ...prev, 
          divisionId: '', 
          homeTeamId: '', 
          awayTeamId: '' 
        }));
      }
      
      // Cargar equipos cuando se selecciona división
      if (name === 'divisionId' && value) {
        loadTeams(value);
        setFormData(prev => ({ ...prev, homeTeamId: '', awayTeamId: '' }));
      }
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validación
    if (!formData.seasonId || !formData.divisionId || !formData.homeTeamId || !formData.awayTeamId) {
      setNotification({
        type: 'error',
        message: 'Por favor complete todos los campos requeridos'
      });
      return;
    }
    
    if (formData.homeTeamId === formData.awayTeamId) {
      setNotification({
        type: 'error',
        message: 'El equipo local y visitante no pueden ser el mismo'
      });
      return;
    }
    
    if (!formData.matchDate || !formData.matchTime) {
      setNotification({
        type: 'error',
        message: 'Por favor ingrese fecha y hora del partido'
      });
      return;
    }
    
    try {
      setSaving(true);
      
      // Obtener la categoría del primer equipo
      const homeTeam = teams.find(t => t.id === formData.homeTeamId);
      if (!homeTeam) {
        throw new Error('Equipo local no encontrado');
      }
      
      const matchDate = new Date(formData.matchDate);
      
      // Preparar datos del partido
      const matchData: any = {
        seasonId: formData.seasonId,
        divisionId: formData.divisionId,
        categoryId: homeTeam.categoryId,
        fieldId: formData.fieldId || '',
        homeTeamId: formData.homeTeamId,
        awayTeamId: formData.awayTeamId,
        matchDate,
        matchTime: formData.matchTime,
        round: formData.round,
        isPlayoff: formData.isPlayoff,
        status: formData.status,
        notes: formData.notes || '',
        createdBy: user?.uid || '',
        updatedBy: user?.uid || ''
      };
      
      // Añadir campos opcionales si existen
      if (formData.refereeId) matchData.refereeId = formData.refereeId;
      if (formData.playoffStage) matchData.playoffStage = formData.playoffStage;
      
      // Verificar conflicto de horario (solo si hay campo seleccionado)
      if (formData.fieldId) {
        const existingMatches = await matchesService.getMatches(formData.seasonId);
        const conflict = existingMatches.some(match => {
          if (match.id === initialData?.id) return false; // Ignorar el mismo partido en edición
          const matchDateObj = new Date(match.matchDate);
          return (
            match.fieldId === formData.fieldId &&
            matchDateObj.getDate() === matchDate.getDate() &&
            matchDateObj.getMonth() === matchDate.getMonth() &&
            matchDateObj.getFullYear() === matchDate.getFullYear() &&
            match.matchTime === formData.matchTime &&
            match.status !== 'cancelled'
          );
        });
        
        if (conflict) {
          setNotification({
            type: 'error',
            message: 'Ya existe un partido programado en este campo a la misma hora'
          });
          setSaving(false);
          return;
        }
      }
      
      if (mode === 'create') {
        // Crear partido
        const matchId = await matchesService.createMatch(matchData);
        
        setNotification({
          type: 'success',
          message: 'Partido creado exitosamente'
        });
        
        // Redirigir al detalle del partido
        setTimeout(() => {
          navigate(`/partidos/${matchId}`);
        }, 1500);
        
      } else if (mode === 'edit' && initialData?.id) {
        // Actualizar partido
        await matchesService.updateMatch(initialData.id, matchData);
        
        setNotification({
          type: 'success',
          message: 'Partido actualizado exitosamente'
        });
        
        // Redirigir al detalle del partido
        setTimeout(() => {
          navigate(`/partidos/${initialData.id}`);
        }, 1500);
      }
      
    } catch (error) {
      console.error('Error saving match:', error);
      setNotification({
        type: 'error',
        message: mode === 'create' ? 'Error al crear el partido' : 'Error al actualizar el partido'
      });
    } finally {
      setSaving(false);
    }
  };
  
  const getTitle = () => {
    return mode === 'edit' ? 'Editar Partido' : 'Crear Nuevo Partido';
  };
  
  if (loading) return <LoadingSpinner />;
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{getTitle()}</h1>
            <p className="text-gray-600">
              {mode === 'edit' ? 'Modifica los datos del partido' : 'Programa un partido manualmente'}
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Seleccionar temporada</option>
                {seasons.map(season => (
                  <option key={season.id} value={season.id}>
                    {season.name} {season.status === 'active' && '(Activa)'}
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
                disabled={!formData.seasonId}
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
                disabled={!formData.divisionId}
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
                disabled={!formData.divisionId || !formData.homeTeamId}
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
            
            {/* Fecha */}
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            {/* Hora */}
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                disabled={!formData.seasonId}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              >
                <option value="">Seleccionar árbitro</option>
                {referees.map(referee => (
                  <option key={referee.id} value={referee.id}>
                    {referee.fullName}
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                Ronda (Jornada)
              </label>
              <input
                type="number"
                name="round"
                value={formData.round}
                onChange={handleChange}
                min="1"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            {/* Estado */}
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
            
            {/* Playoff */}
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                name="isPlayoff"
                checked={formData.isPlayoff}
                onChange={handleChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label className="block text-sm font-medium text-gray-700">
                Es partido de playoff
              </label>
            </div>
            
            {/* Etapa de Playoff (solo si es playoff) */}
            {formData.isPlayoff && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Etapa de Playoff
                </label>
                <select
                  name="playoffStage"
                  value={formData.playoffStage}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Seleccionar etapa</option>
                  <option value="quarterfinals">Cuartos de final</option>
                  <option value="semifinals">Semifinal</option>
                  <option value="final">Final</option>
                  <option value="third_place">Tercer lugar</option>
                </select>
              </div>
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
          
          {/* Botones */}
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
                  <span>{mode === 'edit' ? 'Actualizando...' : 'Creando...'}</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {mode === 'edit' ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    )}
                  </svg>
                  <span>{mode === 'edit' ? 'Actualizar Partido' : 'Crear Partido'}</span>
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
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateMatchPage;