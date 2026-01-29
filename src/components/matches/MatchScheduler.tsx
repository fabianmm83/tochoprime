import React, { useState, useEffect } from 'react';
import { 
  seasonsService, 
  divisionsService, 
  categoriesService, 
  teamsService,
  matchesService
} from '../../services/firestore';
import { 
  CalendarIcon, 
  UsersIcon, 
  TrophyIcon, 
  ClockIcon,
  UserGroupIcon,
  AdjustmentsHorizontalIcon,
  CalendarDaysIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import type { Season, Division, Category, Team } from '../../types';

interface MatchSchedulerProps {
  onCalendarGenerated?: (matchesCount: number) => void;
}

const MatchScheduler: React.FC<MatchSchedulerProps> = ({ onCalendarGenerated }) => {
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  
  const [selectedSeason, setSelectedSeason] = useState<string>('');
  const [selectedDivision, setSelectedDivision] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedTeams, setSelectedTeams] = useState<string[]>([]);
  
  // Estados según la firma REAL de generateSeasonCalendar
  const [useGroupSystem, setUseGroupSystem] = useState<boolean>(false);
  const [groupSize, setGroupSize] = useState<number>(9);
  const [generateByRound, setGenerateByRound] = useState<boolean>(false);
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [useAvailableFieldsOnly, setUseAvailableFieldsOnly] = useState<boolean>(true);
  
  const [loading, setLoading] = useState<boolean>(false);
  const [generating, setGenerating] = useState<boolean>(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);
  
  useEffect(() => {
    loadSeasons();
  }, []);
  
  useEffect(() => {
    if (selectedSeason) {
      loadDivisions(selectedSeason);
    }
  }, [selectedSeason]);
  
  useEffect(() => {
    if (selectedDivision) {
      loadCategories(selectedDivision);
    }
  }, [selectedDivision]);
  
  useEffect(() => {
    if (selectedCategory) {
      loadTeams(selectedCategory);
    }
  }, [selectedCategory]);

  const loadSeasons = async () => {
    setLoading(true);
    try {
      const seasonsData = await seasonsService.getSeasons();
      setSeasons(seasonsData);
    } catch (error) {
      showMessage('error', 'Error cargando temporadas');
    } finally {
      setLoading(false);
    }
  };

  const loadDivisions = async (seasonId: string) => {
    try {
      const divisionsData = await divisionsService.getDivisionsBySeason(seasonId);
      setDivisions(divisionsData);
      setSelectedDivision('');
      setSelectedCategory('');
      setSelectedTeams([]);
    } catch (error) {
      showMessage('error', 'Error cargando divisiones');
    }
  };

  const loadCategories = async (divisionId: string) => {
    try {
      const categoriesData = await categoriesService.getCategoriesByDivision(divisionId);
      setCategories(categoriesData);
      setSelectedCategory('');
      setSelectedTeams([]);
    } catch (error) {
      showMessage('error', 'Error cargando categorías');
    }
  };

  const loadTeams = async (categoryId: string) => {
    try {
      const teamsData = await teamsService.getTeamsByCategory(categoryId);
      setTeams(teamsData);
      setSelectedTeams([]);
    } catch (error) {
      showMessage('error', 'Error cargando equipos');
    }
  };

  const toggleTeamSelection = (teamId: string) => {
    setSelectedTeams(prev => {
      if (prev.includes(teamId)) {
        return prev.filter(id => id !== teamId);
      } else {
        // Permitir hasta 16 equipos (según el contexto)
        if (prev.length >= 16) {
          showMessage('error', 'Máximo 16 equipos permitidos');
          return prev;
        }
        return [...prev, teamId];
      }
    });
  };

  const generateCalendar = async () => {
    if (!selectedSeason || !selectedDivision || !selectedCategory) {
      showMessage('error', 'Selecciona temporada, división y categoría');
      return;
    }
    
    if (selectedTeams.length < 2) {
      showMessage('error', 'Selecciona al menos 2 equipos');
      return;
    }
    
    // Validaciones específicas según el contexto
    if (selectedTeams.length === 13 || selectedTeams.length === 15) {
      showMessage('error', `⚠️ ${selectedTeams.length} equipos requiere fórmula especial. Considera agregar/remover 1 equipo.`);
      return;
    }
    
    const selectedTeamsData = teams.filter(team => selectedTeams.includes(team.id));
    
    setGenerating(true);
    setMessage(null);
    
    try {
      // ✅ LLAMADA CORRECTA según la firma REAL de generateSeasonCalendar
      const createdMatches = await matchesService.generateSeasonCalendar(
        selectedSeason,           // seasonId: string
        selectedDivision,         // divisionId: string
        selectedTeamsData,        // teams: Team[]
        startDate,                // startDate: Date (opcional, default: new Date())
        useAvailableFieldsOnly,   // useAvailableFieldsOnly: boolean (opcional, default: true)
        useGroupSystem,           // useGroups: boolean (opcional, default: false)
        groupSize,                // groupSize: number (opcional, default: 9)
        generateByRound           // generateByRound: boolean (opcional, default: false)
      );
      
      showMessage('success', `✅ Calendario generado con ${createdMatches.length} partidos`);
      onCalendarGenerated?.(createdMatches.length);
      setSelectedTeams([]);
      
    } catch (error: any) {
      showMessage('error', error.message || '❌ Error generando calendario');
      console.error('Error en generateCalendar:', error);
    } finally {
      setGenerating(false);
    }
  };

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const calculatePreview = () => {
    if (selectedTeams.length < 2) return null;
    
    const teamsCount = selectedTeams.length;
    const totalMatches = Math.ceil((teamsCount * 8) / 2); // 8 partidos por equipo
    const rounds = 9; // Siempre 9 jornadas
    
    return { teamsCount, totalMatches, rounds };
  };

  const preview = calculatePreview();

  // Info específica según cantidad de equipos
  const getTeamCountInfo = () => {
    const count = selectedTeams.length;
    if (count === 0) return null;
    
    const info = {
      2: "✅ 1 partido único + 7 repeticiones = 8 partidos totales",
      3: "✅ 2 partidos únicos + 6 repeticiones = 8 partidos totales",
      4: "✅ 3 partidos únicos + 5 repeticiones = 8 partidos totales",
      5: "✅ 4 partidos únicos + 4 repeticiones = 8 partidos totales",
      6: "✅ 5 partidos únicos + 3 repeticiones = 8 partidos totales",
      7: "✅ 6 partidos únicos + 2 repeticiones = 8 partidos totales",
      8: "✅ 7 partidos únicos + 1 repetición = 8 partidos totales",
      9: "✅ 8 partidos únicos + BYE = 8 partidos totales",
      13: "⚠️  Requiere fórmula especial (considera 12 o 14 equipos)",
      15: "⚠️  Requiere fórmula especial (considera 14 o 16 equipos)",
    };
    
    return info[count as keyof typeof info] || "✅ 8 partidos únicos por equipo";
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-4 md:p-6">
      <div className="flex items-center mb-6">
        <CalendarIcon className="h-8 w-8 text-blue-600 mr-3" />
        <div>
          <h2 className="text-xl font-bold text-gray-800">Generar Calendario Tocho Prime</h2>
          <p className="text-gray-600 text-sm">Sistema optimizado para ligas de tochito flag</p>
        </div>
      </div>

      {message && (
        <div className={`mb-6 p-4 rounded-lg ${message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
          <div className="flex items-center">
            <InformationCircleIcon className="h-5 w-5 mr-2" />
            {message.text}
          </div>
        </div>
      )}

      <div className="space-y-6">
        {/* Selección básica */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <TrophyIcon className="h-4 w-4 inline mr-1" />
              Temporada
            </label>
            <select
              value={selectedSeason}
              onChange={(e) => setSelectedSeason(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
              disabled={loading}
            >
              <option value="">Seleccionar temporada</option>
              {seasons.map(season => (
                <option key={season.id} value={season.id}>
                  {season.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              División
            </label>
            <select
              value={selectedDivision}
              onChange={(e) => setSelectedDivision(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Categoría
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
              disabled={!selectedDivision}
            >
              <option value="">Seleccionar categoría</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Selección de equipos */}
        {selectedCategory && (
          <div className="border-t pt-6">
            <div className="flex justify-between items-center mb-4">
              <label className="block text-sm font-medium text-gray-700">
                <UsersIcon className="h-5 w-5 inline mr-2" />
                Seleccionar Equipos ({selectedTeams.length}/16 seleccionados)
              </label>
              {selectedTeams.length > 0 && (
                <span className="text-sm text-blue-600">
                  {getTeamCountInfo()}
                </span>
              )}
            </div>
            
            {teams.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No hay equipos registrados en esta categoría
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {teams.map(team => (
                  <button
                    key={team.id}
                    type="button"
                    onClick={() => toggleTeamSelection(team.id)}
                    className={`p-4 rounded-lg border-2 flex flex-col items-center transition-all ${
                      selectedTeams.includes(team.id)
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    } ${
                      (selectedTeams.length === 13 || selectedTeams.length === 15) && selectedTeams.includes(team.id)
                        ? 'border-yellow-500 bg-yellow-50'
                        : ''
                    }`}
                  >
                    {team.logoUrl && (
                      <img
                        src={team.logoUrl}
                        alt={team.name}
                        className="h-10 w-10 object-contain mb-2"
                      />
                    )}
                    <span className="font-medium text-xs text-center">
                      {team.name}
                    </span>
                    <span className="text-xs text-gray-500 mt-1">
                      #{team.id.substring(0, 4)}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Opciones avanzadas */}
        <div className="border-t pt-6">
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center text-sm font-medium text-gray-700 hover:text-blue-600"
          >
            <AdjustmentsHorizontalIcon className="h-5 w-5 mr-2" />
            {showAdvanced ? 'Ocultar opciones avanzadas' : 'Mostrar opciones avanzadas'}
          </button>

          {showAdvanced && selectedTeams.length >= 2 && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg space-y-4">
              <h4 className="font-medium text-gray-800">Configuración avanzada</h4>
              
              {/* Fecha de inicio */}
              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  <CalendarIcon className="h-4 w-4 inline mr-1" />
                  Fecha de inicio (los domingos son ideales)
                </label>
                <input
                  type="date"
                  value={startDate.toISOString().split('T')[0]}
                  onChange={(e) => setStartDate(new Date(e.target.value))}
                  className="px-3 py-2 border rounded-lg"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Se ajustará automáticamente al domingo más cercano: {startDate.toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              </div>
              
              {/* Opción: Generar por jornada */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="generateByRound"
                  checked={generateByRound}
                  onChange={(e) => setGenerateByRound(e.target.checked)}
                  className="h-4 w-4 text-blue-600 rounded"
                />
                <label htmlFor="generateByRound" className="ml-2 flex items-center">
                  <CalendarDaysIcon className="h-4 w-4 mr-1" />
                  Generar solo para una jornada específica
                </label>
              </div>
              
              <p className="text-xs text-gray-500 ml-6">
                {generateByRound 
                  ? "✓ Creará partidos solo para la fecha seleccionada (ideal para reprogramar)"
                  : "✓ Creará todas las 9 jornadas completas"}
              </p>

              {/* Opción: Sistema de grupos */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="useGroupSystem"
                  checked={useGroupSystem}
                  onChange={(e) => setUseGroupSystem(e.target.checked)}
                  className="h-4 w-4 text-blue-600 rounded"
                />
                <label htmlFor="useGroupSystem" className="ml-2 flex items-center">
                  <UserGroupIcon className="h-4 w-4 mr-1" />
                  Usar sistema de grupos
                </label>
              </div>
              
              {useGroupSystem && (
                <div className="ml-6">
                  <label className="block text-sm text-gray-600 mb-1">
                    Tamaño máximo por grupo
                  </label>
                  <select
                    value={groupSize}
                    onChange={(e) => setGroupSize(parseInt(e.target.value))}
                    className="w-32 px-3 py-2 border rounded-lg"
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
                  <p className="text-xs text-gray-500 mt-1">
                    Agrupa automáticamente equipos por categoría
                  </p>
                </div>
              )}
              
              {/* Opción: Usar solo campos disponibles */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="useAvailableFieldsOnly"
                  checked={useAvailableFieldsOnly}
                  onChange={(e) => setUseAvailableFieldsOnly(e.target.checked)}
                  className="h-4 w-4 text-blue-600 rounded"
                />
                <label htmlFor="useAvailableFieldsOnly" className="ml-2 flex items-center">
                  Usar solo campos disponibles (recomendado)
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Vista previa */}
        {selectedTeams.length >= 2 && (
          <div className="border-t pt-6">
            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-800 mb-3 flex items-center">
                <InformationCircleIcon className="h-5 w-5 mr-2" />
                Vista previa del calendario
              </h4>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-white rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{preview?.teamsCount}</div>
                  <div className="text-sm text-blue-800">Equipos</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {selectedTeams.length <= 9 ? 'Con BYE' : 'Sin BYE'}
                  </div>
                </div>
                
                <div className="text-center p-3 bg-white rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{preview?.totalMatches}</div>
                  <div className="text-sm text-blue-800">Partidos totales</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {selectedTeams.length <= 9 ? 'Con repeticiones' : 'Únicos'}
                  </div>
                </div>
                
                <div className="text-center p-3 bg-white rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{preview?.rounds}</div>
                  <div className="text-sm text-blue-800">Jornadas</div>
                  <div className="text-xs text-gray-500 mt-1">
                    Siempre 9 jornadas
                  </div>
                </div>
                
                <div className="text-center p-3 bg-white rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">8</div>
                  <div className="text-sm text-blue-800">Partidos/equipo</div>
                  <div className="text-xs text-gray-500 mt-1">
                    Total por temporada
                  </div>
                </div>
              </div>
              
              {/* Info específica según fórmula */}
              <div className="mt-4 p-3 bg-blue-100 rounded-lg">
                <div className="text-sm font-medium text-blue-800 mb-1">
                  Fórmula aplicada:
                </div>
                <div className="text-xs text-blue-700">
                  {selectedTeams.length} equipos × 8 partidos = {(selectedTeams.length * 8) / 2} partidos totales
                  <br />
                  Distribución: {getTeamCountInfo()?.replace('✅ ', '').replace('⚠️ ', '')}
                  {selectedTeams.length === 13 || selectedTeams.length === 15 ? (
                    <div className="mt-1 text-amber-700 font-medium">
                      ⚠️ Este caso puede generar jornadas dobles
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Botón de generación */}
        <div className="border-t pt-6">
          <button
            onClick={generateCalendar}
            disabled={generating || selectedTeams.length < 2}
            className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium rounded-lg hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-all"
          >
            {generating ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                Generando calendario...
              </>
            ) : (
              <>
                <CalendarIcon className="h-5 w-5 mr-2" />
                {generateByRound ? 'Generar Calendario para la Jornada' : 'Generar Calendario Completo (9 Jornadas)'}
              </>
            )}
          </button>
          
          <div className="text-center text-sm text-gray-500 mt-3 space-y-1">
            <p>✓ {generateByRound ? 'Generará solo los partidos de la fecha seleccionada' : 'Creará todas las 9 jornadas del torneo'}</p>
            <p>✓ Distribuirá automáticamente entre Cuemanco y Zague</p>
            <p className="text-amber-600">⚠️ Esta acción no se puede deshacer. Recomendado: eliminar partidos existentes primero</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MatchScheduler;