import React, { useState, useEffect } from 'react';
import { 
  seasonsService, 
  divisionsService, 
  categoriesService, 
  teamsService,
  matchesService // Importa el método directamente
} from '../../services/firestore';
import { CalendarIcon, UsersIcon, TrophyIcon, ClockIcon } from '@heroicons/react/24/outline';
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
  
  const [isDoubleRoundRobin, setIsDoubleRoundRobin] = useState<boolean>(false);
  const [startDate, setStartDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  
  const [loading, setLoading] = useState<boolean>(false);
  const [generating, setGenerating] = useState<boolean>(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  
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
        if (prev.length >= 8) {
          showMessage('error', 'Máximo 8 equipos permitidos');
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
  
  const selectedTeamsData = teams.filter(team => selectedTeams.includes(team.id));
  
  setGenerating(true);
  setMessage(null);
  
  try {
    // Usa matchesService.generateSeasonCalendar
    const createdMatches = await matchesService.generateSeasonCalendar(
      selectedSeason,        // seasonId: string
      selectedDivision,      // divisionId: string  
      selectedTeamsData,     // teams: Team[]
      isDoubleRoundRobin     // isDoubleRoundRobin: boolean (false por defecto)
    );
    
    showMessage('success', `Calendario generado con ${createdMatches.length} partidos`);
    onCalendarGenerated?.(createdMatches.length);
    setSelectedTeams([]);
    
  } catch (error: any) {
    showMessage('error', error.message || 'Error generando calendario');
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
    const singleRoundMatches = teamsCount * (teamsCount - 1) / 2;
    const totalMatches = isDoubleRoundRobin ? singleRoundMatches * 2 : singleRoundMatches;
    const rounds = isDoubleRoundRobin ? (teamsCount - 1) * 2 : teamsCount - 1;
    
    return { teamsCount, totalMatches, rounds };
  };

  const preview = calculatePreview();

  return (
    <div className="bg-white rounded-xl shadow-lg p-4 md:p-6">
      <div className="flex items-center mb-6">
        <CalendarIcon className="h-8 w-8 text-blue-600 mr-3" />
        <div>
          <h2 className="text-xl font-bold text-gray-800">Generar Calendario</h2>
          <p className="text-gray-600 text-sm">Round-robin para ligas de tochito</p>
        </div>
      </div>

      {message && (
        <div className={`mb-6 p-4 rounded-lg ${message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
          {message.text}
        </div>
      )}

      <div className="space-y-6">
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

        {selectedCategory && (
          <div className="border-t pt-6">
            <label className="block text-sm font-medium text-gray-700 mb-4">
              <UsersIcon className="h-5 w-5 inline mr-2" />
              Seleccionar Equipos ({selectedTeams.length}/8 seleccionados)
            </label>
            
            {teams.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No hay equipos registrados en esta categoría
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {teams.map(team => (
                  <button
                    key={team.id}
                    type="button"
                    onClick={() => toggleTeamSelection(team.id)}
                    className={`p-4 rounded-lg border-2 flex flex-col items-center transition-all ${
                      selectedTeams.includes(team.id)
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {team.logoUrl && (
                      <img
                        src={team.logoUrl}
                        alt={team.name}
                        className="h-12 w-12 object-contain mb-2"
                      />
                    )}
                    <span className="font-medium text-sm text-center">
                      {team.name}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {selectedTeams.length >= 2 && (
          <div className="border-t pt-6">
            <h3 className="text-lg font-medium text-gray-800 mb-4">Configuración</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha de inicio
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Formato del torneo
                </label>
                <div className="space-y-3">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      checked={!isDoubleRoundRobin}
                      onChange={() => setIsDoubleRoundRobin(false)}
                      className="h-4 w-4 text-blue-600"
                    />
                    <span className="ml-2 text-gray-700">
                      Una vuelta ({selectedTeams.length - 1} jornadas)
                    </span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      checked={isDoubleRoundRobin}
                      onChange={() => setIsDoubleRoundRobin(true)}
                      className="h-4 w-4 text-blue-600"
                    />
                    <span className="ml-2 text-gray-700">
                      Doble vuelta ({(selectedTeams.length - 1) * 2} jornadas)
                    </span>
                  </label>
                </div>
              </div>
            </div>

            {preview && (
              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-800 mb-3">Vista previa del calendario</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{preview.teamsCount}</div>
                    <div className="text-sm text-blue-800">Equipos</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{preview.totalMatches}</div>
                    <div className="text-sm text-blue-800">Partidos totales</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{preview.rounds}</div>
                    <div className="text-sm text-blue-800">Jornadas</div>
                  </div>
                </div>
                <div className="mt-4 text-sm text-blue-700">
                  <ClockIcon className="h-4 w-4 inline mr-1" />
                  Los partidos se programarán los sábados a partir del {new Date(startDate).toLocaleDateString('es-MX')}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="border-t pt-6">
          <button
            onClick={generateCalendar}
            disabled={generating || selectedTeams.length < 2}
            className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium rounded-lg hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {generating ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                Generando calendario...
              </>
            ) : (
              <>
                <CalendarIcon className="h-5 w-5 mr-2" />
                Generar Calendario Completo
              </>
            )}
          </button>
          
          <p className="text-center text-sm text-gray-500 mt-3">
            Esta acción creará todos los partidos del torneo. No se puede deshacer.
          </p>
        </div>
      </div>
    </div>
  );
};

export default MatchScheduler;