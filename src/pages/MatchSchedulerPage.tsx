import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  seasonsService, 
  divisionsService,
  categoriesService,
  teamsService,
  matchesService
} from '../services/firestore';
import { Season, Division, Category, Team } from '../types';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Notification from '../components/common/Notification';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const MatchSchedulerPage: React.FC = () => {
  const { userData } = useAuth();
  const navigate = useNavigate();
  
  // Estados
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);
  
  // Selecciones
  const [selectedSeason, setSelectedSeason] = useState<string>('');
  const [selectedDivision, setSelectedDivision] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [useAvailableFieldsOnly, setUseAvailableFieldsOnly] = useState(true);
  const [useGroups, setUseGroups] = useState(false);
  const [groupSize, setGroupSize] = useState<number>(9);
  const [generateByRound, setGenerateByRound] = useState(false); // Nueva opción
  
  // Fecha de inicio (siempre domingo)
  const [startDate, setStartDate] = useState<Date>(() => {
    // Por defecto, próximo domingo
    const nextSunday = new Date();
    const dayOfWeek = nextSunday.getDay(); // 0 = Domingo, 1 = Lunes, ..., 6 = Sábado
    const daysUntilSunday = (0 - dayOfWeek + 7) % 7 || 7;
    nextSunday.setDate(nextSunday.getDate() + daysUntilSunday);
    nextSunday.setHours(0, 0, 0, 0);
    return nextSunday;
  });
  
  // Estadísticas
  const [divisionStats, setDivisionStats] = useState<{[key: string]: {
    categoryCount: number;
    teamCount: number;
  }}>({});
  
  // Cargar datos iniciales
  useEffect(() => {
    loadSeasons();
  }, []);
  
  // Cargar divisiones cuando se selecciona temporada
  useEffect(() => {
    if (selectedSeason) {
      loadDivisions(selectedSeason);
      setSelectedDivision('');
      setSelectedCategory('');
      setCategories([]);
      setTeams([]);
    }
  }, [selectedSeason]);
  
  // Cargar categorías cuando se selecciona división
  useEffect(() => {
    if (selectedDivision) {
      loadCategories(selectedDivision);
      loadTeams(selectedDivision);
      setSelectedCategory('');
    }
  }, [selectedDivision]);
  
  // Función para formatear fechas
  const formatDate = (date: Date | string): string => {
    if (!date) return 'No disponible';
    
    try {
      const dateObj = date instanceof Date ? date : new Date(date);
      return format(dateObj, 'dd/MM/yyyy', { locale: es });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Fecha inválida';
    }
  };
  
  // Función para formatear fecha completa
  const formatDateFull = (date: Date): string => {
    return format(date, "EEEE dd 'de' MMMM 'de' yyyy", { locale: es });
  };
  
  // Función para formatear fecha para input
  const formatDateForInput = (date: Date): string => {
    return format(date, 'yyyy-MM-dd');
  };
  
  // Función para ajustar al próximo domingo
  const setToNextSunday = () => {
    const nextSunday = new Date();
    const dayOfWeek = nextSunday.getDay();
    const daysUntilSunday = (0 - dayOfWeek + 7) % 7 || 7;
    nextSunday.setDate(nextSunday.getDate() + daysUntilSunday);
    nextSunday.setHours(0, 0, 0, 0);
    setStartDate(nextSunday);
  };
  
  // Manejar cambio de fecha (ajustar automáticamente a domingo)
  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedDate = new Date(e.target.value);
    // Ajustar automáticamente al domingo más cercano
    const dayOfWeek = selectedDate.getDay();
    const daysUntilSunday = (0 - dayOfWeek + 7) % 7;
    selectedDate.setDate(selectedDate.getDate() + daysUntilSunday);
    selectedDate.setHours(0, 0, 0, 0);
    setStartDate(selectedDate);
  };
  
  const loadSeasons = async () => {
    try {
      setLoading(true);
      const seasonsData = await seasonsService.getSeasons();
      setSeasons(seasonsData);
      
      // Seleccionar la temporada activa por defecto
      const activeSeason = seasonsData.find(season => season.status === 'active');
      if (activeSeason) {
        setSelectedSeason(activeSeason.id);
      } else if (seasonsData.length > 0) {
        setSelectedSeason(seasonsData[0].id);
      }
    } catch (error) {
      console.error('Error loading seasons:', error);
      setNotification({
        type: 'error',
        message: 'Error al cargar las temporadas'
      });
    } finally {
      setLoading(false);
    }
  };
  
  const loadDivisions = async (seasonId: string) => {
    try {
      const divisionsData = await divisionsService.getDivisionsBySeason(seasonId);
      setDivisions(divisionsData);
      
      // Cargar estadísticas para cada división
      const stats: {[key: string]: {categoryCount: number; teamCount: number}} = {};
      
      for (const division of divisionsData) {
        const categoriesData = await categoriesService.getCategoriesByDivision(division.id);
        let totalTeams = 0;
        
        for (const category of categoriesData) {
          const teamsData = await teamsService.getTeamsByCategory(category.id);
          totalTeams += teamsData.length;
        }
        
        stats[division.id] = {
          categoryCount: categoriesData.length,
          teamCount: totalTeams
        };
      }
      
      setDivisionStats(stats);
    } catch (error) {
      console.error('Error loading divisions:', error);
    }
  };
  
  const loadCategories = async (divisionId: string) => {
    try {
      const categoriesData = await categoriesService.getCategoriesByDivision(divisionId);
      setCategories(categoriesData);
    } catch (error) {
      console.error('Error loading categories:', error);
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
  
  // Filtrar equipos por categoría seleccionada
  const filteredTeams = selectedCategory 
    ? teams.filter(team => team.categoryId === selectedCategory)
    : teams;
  
  const handleGenerateCalendar = async () => {
    if (!selectedSeason || !selectedDivision || filteredTeams.length < 2) {
      setNotification({
        type: 'error',
        message: 'Se necesitan al menos 2 equipos para generar el calendario'
      });
      return;
    }
    
    try {
      setGenerating(true);
      
      // Usar la NUEVA función con todos los parámetros
      await matchesService.generateSeasonCalendar(
        selectedSeason,
        selectedDivision,
        filteredTeams,
        startDate,
        useAvailableFieldsOnly,
        useGroups,
        groupSize,
        generateByRound
      );
      
      const message = generateByRound 
        ? `Partidos generados exitosamente para la jornada del ${formatDateFull(startDate)}`
        : `Calendario generado exitosamente para ${filteredTeams.length} equipos (9 domingos consecutivos)`;
      
      setNotification({
        type: 'success',
        message
      });
      
      // Redirigir a la lista de partidos después de 2 segundos
      setTimeout(() => {
        navigate('/partidos');
      }, 2000);
      
    } catch (error: any) {
      console.error('Error generating calendar:', error);
      setNotification({
        type: 'error',
        message: error.message || 'Error al generar el calendario'
      });
    } finally {
      setGenerating(false);
    }
  };
  
  // Obtener temporada seleccionada
  const selectedSeasonData = seasons.find(season => season.id === selectedSeason);
  
  // Obtener división seleccionada
  const selectedDivisionData = divisions.find(division => division.id === selectedDivision);
  
  // Obtener estadísticas de la división seleccionada
  const currentDivisionStats = selectedDivision ? divisionStats[selectedDivision] : null;
  
  // Traducir estado al español
  const translateStatus = (status: Season['status']): string => {
    switch (status) {
      case 'active': return 'Activa';
      case 'upcoming': return 'Próxima';
      case 'completed': return 'Completada';
      case 'archived': return 'Archivada';
      default: return status;
    }
  };
  
  // Calcular información del calendario
  const calculateCalendarInfo = () => {
    const teamCount = filteredTeams.length;
    const TOTAL_JORNADAS = 9;
    const PARTIDOS_POR_EQUIPO = 8;
    
    if (teamCount < 2) return null;
    
    let formulaInfo = '';
    if (teamCount >= 9) {
      formulaInfo = `Fórmula especial para ${teamCount} equipos: 8 partidos por equipo`;
    } else {
      formulaInfo = `Round-robin adaptado para ${teamCount} equipos`;
    }
    
    return {
      teamCount,
      jornadas: TOTAL_JORNADAS,
      partidosPorEquipo: PARTIDOS_POR_EQUIPO,
      formulaInfo,
      totalPartidos: Math.floor(TOTAL_JORNADAS * teamCount / 2),
      startDateFormatted: formatDateFull(startDate)
    };
  };
  
  const calendarInfo = calculateCalendarInfo();
  
  if (loading) return <LoadingSpinner />;
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Generar Calendario</h1>
            <p className="text-gray-600">Genera automáticamente el calendario de partidos para la temporada</p>
          </div>
          
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
      
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Panel de configuración */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Configuración del Calendario</h2>
            
            {/* Temporada */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Temporada *
              </label>
              <select
                value={selectedSeason}
                onChange={(e) => setSelectedSeason(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Seleccionar temporada</option>
                {seasons.map(season => (
                  <option key={season.id} value={season.id}>
                    {season.name} {season.status === 'active' && '(Activa)'}
                  </option>
                ))}
              </select>
              {selectedSeasonData && (
                <div className="mt-2 text-sm text-gray-600 space-y-1">
                  <p><span className="font-medium">Estado:</span> {translateStatus(selectedSeasonData.status)}</p>
                  <p><span className="font-medium">Inicio:</span> {formatDate(selectedSeasonData.startDate)}</p>
                  <p><span className="font-medium">Fin:</span> {formatDate(selectedSeasonData.endDate)}</p>
                </div>
              )}
            </div>
            
            {/* División */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                División *
              </label>
              <select
                value={selectedDivision}
                onChange={(e) => setSelectedDivision(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={!selectedSeason}
              >
                <option value="">Seleccionar división</option>
                {divisions.map(division => {
                  const stats = divisionStats[division.id];
                  return (
                    <option key={division.id} value={division.id}>
                      {division.name}
                      {stats && ` (${stats.categoryCount} cat, ${stats.teamCount} eq)`}
                    </option>
                  );
                })}
              </select>
              {selectedDivisionData && currentDivisionStats && (
                <div className="mt-2 text-sm text-gray-600 space-y-1">
                  <p><span className="font-medium">Categorías:</span> {currentDivisionStats.categoryCount}</p>
                  <p><span className="font-medium">Equipos totales:</span> {currentDivisionStats.teamCount}</p>
                  <p>
                    <span className="font-medium">Límite de equipos:</span> {
                      selectedDivisionData.teamLimit 
                        ? `${selectedDivisionData.teamLimit} equipos` 
                        : 'Sin límite'
                    }
                  </p>
                  {selectedDivisionData.playerLimit && (
                    <p><span className="font-medium">Límite de jugadores:</span> {selectedDivisionData.playerLimit}</p>
                  )}
                </div>
              )}
            </div>
            
            {/* Categoría (opcional) */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Categoría (Opcional)
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={!selectedDivision}
              >
                <option value="">Todas las categorías</option>
                {categories.map(category => {
                  const categoryTeams = teams.filter(team => team.categoryId === category.id);
                  return (
                    <option key={category.id} value={category.id}>
                      {category.name} ({categoryTeams.length} equipos)
                    </option>
                  );
                })}
              </select>
              <p className="mt-1 text-sm text-gray-500">
                Si seleccionas una categoría específica, solo se generará calendario para esos equipos.
              </p>
            </div>
            
            {/* Fecha de inicio */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fecha de inicio (Siempre Domingo) *
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="date"
                  value={formatDateForInput(startDate)}
                  onChange={handleStartDateChange}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                />
                <button
                  onClick={setToNextSunday}
                  className="px-3 py-2 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium"
                >
                  Próximo Domingo
                </button>
              </div>
              <p className="mt-2 text-sm text-gray-600">
                <span className="font-medium">Fecha ajustada:</span> {formatDateFull(startDate)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {generateByRound 
                  ? 'Se generarán partidos solo para esta fecha específica'
                  : 'El calendario se generará para 9 domingos consecutivos empezando esta fecha'
                }
              </p>
            </div>
            
            {/* Opciones avanzadas */}
            <div className="mb-6 bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Opciones Avanzadas</h3>
              
              {/* Generar por jornada */}
              <div className="flex items-center mb-4">
                <input
                  type="checkbox"
                  id="generateByRound"
                  checked={generateByRound}
                  onChange={(e) => setGenerateByRound(e.target.checked)}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="generateByRound" className="ml-2 text-sm font-medium text-gray-700">
                  Generar solo para esta jornada (fecha seleccionada)
                </label>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Si se marca, solo se generarán partidos para la fecha seleccionada, no para 9 domingos consecutivos.
                Útil para reprogramar o generar jornadas específicas.
              </p>
              
              {/* Usar sistema de grupos */}
              <div className="flex items-center mb-4">
                <input
                  type="checkbox"
                  id="useGroups"
                  checked={useGroups}
                  onChange={(e) => setUseGroups(e.target.checked)}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  disabled={generateByRound}
                />
                <label htmlFor="useGroups" className="ml-2 text-sm font-medium text-gray-700">
                  Usar sistema de grupos
                </label>
              </div>
              
              {useGroups && !generateByRound && (
                <div className="mb-4 ml-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tamaño máximo por grupo
                  </label>
                  <select
                    value={groupSize}
                    onChange={(e) => setGroupSize(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="6">6 equipos</option>
                    <option value="7">7 equipos</option>
                    <option value="8">8 equipos</option>
                    <option value="9">9 equipos</option>
                    <option value="10">10 equipos</option>
                    <option value="12">12 equipos</option>
                    <option value="14">14 equipos</option>
                    <option value="16">16 equipos</option>
                  </select>
                  <p className="mt-1 text-sm text-gray-500">
                    Se crearán grupos automáticamente cuando haya más equipos que este tamaño.
                  </p>
                </div>
              )}
              
              {/* Usar campos disponibles */}
              <div className="flex items-center mb-4">
                <input
                  type="checkbox"
                  id="useAvailableFieldsOnly"
                  checked={useAvailableFieldsOnly}
                  onChange={(e) => setUseAvailableFieldsOnly(e.target.checked)}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="useAvailableFieldsOnly" className="ml-2 text-sm font-medium text-gray-700">
                  Usar solo campos disponibles (status = available)
                </label>
              </div>
              <p className="text-sm text-gray-600">
                Si se desmarca, se usarán todos los campos sin importar su estado.
              </p>
            </div>
            
            {/* Botón de generación */}
            <button
              onClick={handleGenerateCalendar}
              disabled={generating || !selectedDivision || filteredTeams.length < 2}
              className="w-full px-6 py-3 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {generating ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Generando calendario...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <span>
                    {generateByRound ? 'Generar Jornada' : 'Generar Calendario Completo'}
                  </span>
                </>
              )}
            </button>
            
            {/* Información adicional */}
            <div className="mt-4 text-sm text-gray-600">
              <p className="font-medium mb-1">Notas:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Todos los partidos se generarán para domingos</li>
                <li>Horarios: 7:00 AM - 4:00 PM</li>
                <li>8 partidos por equipo (excepto grupos de 9 con BYE)</li>
                <li>Distribución automática entre Cuemanco y Zague</li>
                <li>Los partidos existentes no serán eliminados</li>
              </ul>
            </div>
          </div>
          
          {/* Panel de información */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Información del Calendario</h2>
            
            <div className="bg-gray-50 rounded-lg p-6">
              {!selectedSeason ? (
                <div className="text-center py-12">
                  <div className="mx-auto w-16 h-16 text-gray-400 mb-4">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Selecciona una temporada</h3>
                  <p className="text-gray-600">Elige una temporada para ver las divisiones disponibles</p>
                </div>
              ) : !selectedDivision ? (
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h3 className="font-medium text-blue-900 mb-2">Temporada seleccionada</h3>
                    <div className="space-y-1">
                      <p className="text-blue-800"><span className="font-medium">Nombre:</span> {selectedSeasonData?.name}</p>
                      <p className="text-blue-800"><span className="font-medium">Estado:</span> {translateStatus(selectedSeasonData?.status || 'active')}</p>
                      <p className="text-blue-800">
                        <span className="font-medium">Período:</span> {formatDate(selectedSeasonData?.startDate || '')} - {formatDate(selectedSeasonData?.endDate || '')}
                      </p>
                    </div>
                  </div>
                  <div className="text-center py-8">
                    <div className="mx-auto w-16 h-16 text-gray-400 mb-4">
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Selecciona una división</h3>
                    <p className="text-gray-600">Elige una división para ver sus categorías y equipos</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Resumen */}
                  <div className="p-4 bg-emerald-50 rounded-lg">
                    <h3 className="font-medium text-emerald-900 mb-2">Resumen del Calendario</h3>
                    <div className="space-y-2">
                      <p className="text-emerald-800">
                        <span className="font-medium">División:</span> {selectedDivisionData?.name}
                      </p>
                      {selectedCategory ? (
                        <>
                          <p className="text-emerald-800">
                            <span className="font-medium">Categoría:</span> {
                              categories.find(c => c.id === selectedCategory)?.name
                            }
                          </p>
                          <p className="text-emerald-800">
                            <span className="font-medium">Equipos:</span> {filteredTeams.length}
                          </p>
                        </>
                      ) : (
                        <p className="text-emerald-800">
                          <span className="font-medium">Equipos totales:</span> {teams.length} en {categories.length} categorías
                        </p>
                      )}
                      <p className="text-emerald-800">
                        <span className="font-medium">Fecha de inicio:</span> {formatDateFull(startDate)}
                      </p>
                      <p className="text-emerald-800">
                        <span className="font-medium">Modo:</span> {generateByRound ? 'Jornada única' : 'Calendario completo (9 jornadas)'}
                      </p>
                      <p className="text-emerald-800">
                        <span className="font-medium">Sistema:</span> {useGroups ? `Grupos (máx ${groupSize} eq)` : 'Todos contra todos'}
                      </p>
                    </div>
                  </div>
                  
                  {/* Información de fórmula */}
                  {calendarInfo && (
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <h3 className="font-medium text-blue-900 mb-2">Fórmula de calendario</h3>
                      <div className="space-y-1">
                        <p className="text-blue-800">{calendarInfo.formulaInfo}</p>
                        <p className="text-blue-800">
                          <span className="font-medium">Partidos por equipo:</span> {calendarInfo.partidosPorEquipo}
                        </p>
                        <p className="text-blue-800">
                          <span className="font-medium">Total de partidos estimados:</span> {calendarInfo.totalPartidos}
                        </p>
                        <p className="text-blue-800">
                          <span className="font-medium">Duración total:</span> {generateByRound ? '1 jornada' : `${calendarInfo.jornadas} jornadas`}
                        </p>
                        <p className="text-blue-800">
                          <span className="font-medium">Campos:</span> Distribuidos entre Cuemanco y Zague
                        </p>
                        <p className="text-blue-800">
                          <span className="font-medium">Árbitros:</span> {useAvailableFieldsOnly ? 'Asignados si disponibles' : 'Opcionales'}
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {/* Equipos */}
                  <div>
                    <h3 className="font-medium text-gray-900 mb-3">Equipos ({filteredTeams.length})</h3>
                    <div className="max-h-60 overflow-y-auto">
                      {filteredTeams.length > 0 ? (
                        <div className="grid grid-cols-1 gap-2">
                          {filteredTeams.map(team => {
                            const teamCategory = categories.find(c => c.id === team.categoryId);
                            return (
                              <div key={team.id} className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg">
                                <div className="flex items-center space-x-3">
                                  {team.primaryColor && (
                                    <div 
                                      className="w-4 h-4 rounded-full" 
                                      style={{ backgroundColor: team.primaryColor }}
                                    />
                                  )}
                                  <div>
                                    <span className="font-medium text-gray-900">{team.name}</span>
                                    {team.shortName && (
                                      <p className="text-xs text-gray-500">{team.shortName}</p>
                                    )}
                                  </div>
                                </div>
                                <div className="text-sm text-gray-600">
                                  {teamCategory?.name || 'Sin categoría'}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="text-center py-4">
                          <p className="text-gray-500">No hay equipos en esta selección</p>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Calendario de fechas estimado */}
                  {calendarInfo && !generateByRound && (
                    <div className="p-4 bg-purple-50 rounded-lg">
                      <h3 className="font-medium text-purple-900 mb-2">Calendario estimado (9 jornadas)</h3>
                      <div className="space-y-2">
                        <p className="text-purple-800">
                          <span className="font-medium">Jornada 1:</span> {formatDateFull(startDate)}
                        </p>
                        <p className="text-purple-800">
                          <span className="font-medium">Jornada 2:</span> {formatDateFull(new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000))}
                        </p>
                        <p className="text-purple-800">
                          <span className="font-medium">Jornada 3:</span> {formatDateFull(new Date(startDate.getTime() + 14 * 24 * 60 * 60 * 1000))}
                        </p>
                        <p className="text-purple-800">
                          <span className="font-medium">Jornada 4:</span> {formatDateFull(new Date(startDate.getTime() + 21 * 24 * 60 * 60 * 1000))}
                        </p>
                        <p className="text-purple-800">
                          <span className="font-medium">Jornada 5:</span> {formatDateFull(new Date(startDate.getTime() + 28 * 24 * 60 * 60 * 1000))}
                        </p>
                        <p className="text-purple-800">
                          <span className="font-medium">Jornada 9:</span> {formatDateFull(new Date(startDate.getTime() + 56 * 24 * 60 * 60 * 1000))}
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {/* Información de jornada única */}
                  {generateByRound && (
                    <div className="p-4 bg-orange-50 rounded-lg">
                      <h3 className="font-medium text-orange-900 mb-2">Jornada única</h3>
                      <div className="space-y-2">
                        <p className="text-orange-800">
                          <span className="font-medium">Fecha:</span> {formatDateFull(startDate)}
                        </p>
                        <p className="text-orange-800">
                          <span className="font-medium">Horarios:</span> 7:00 AM - 4:00 PM
                        </p>
                        <p className="text-orange-800">
                          <span className="font-medium">Campos:</span> Distribución automática
                        </p>
                        <p className="text-orange-800">
                          <span className="font-medium">Nota:</span> Solo se generarán partidos para esta fecha específica
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {/* Advertencia */}
            <div className="mt-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.998-.833-2.732 0L4.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">Información importante</h3>
                  <div className="mt-2 text-sm text-yellow-700 space-y-1">
                    <p>• <strong>Siempre se generarán partidos para domingos</strong></p>
                    <p>• Horarios: <strong>7:00 AM - 4:00 PM</strong> (partidos de 1 hora)</p>
                    <p>• Campos distribuidos entre <strong>Cuemanco y Zague</strong></p>
                    <p>• <strong>8 partidos por equipo</strong> (excepto grupos de 9 con BYE)</p>
                    <p>• Los partidos existentes <strong>no serán eliminados</strong></p>
                    <p>• Si hay muchos equipos, considera usar <strong>sistema de grupos</strong></p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MatchSchedulerPage;