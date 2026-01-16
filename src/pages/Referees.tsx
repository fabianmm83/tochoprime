import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  refereeService, 
  seasonService, 
  matchService 
} from '../services/firestore';
import { Referee, Season, Match } from '../types';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Notification from '../components/common/Notification';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const Referees: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Estados
  const [referees, setReferees] = useState<Referee[]>([]);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReferee, setSelectedReferee] = useState<Referee | null>(null);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);
  
  // Filtros
  const [selectedSeason, setSelectedSeason] = useState<string>('');
  const [selectedLevel, setSelectedLevel] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Cargar datos iniciales
  useEffect(() => {
    loadData();
  }, []);
  
  // Cargar árbitros cuando cambia la temporada
  useEffect(() => {
    if (selectedSeason) {
      loadReferees(selectedSeason);
      loadMatches(selectedSeason);
    }
  }, [selectedSeason]);
  
  const loadData = async () => {
    try {
      setLoading(true);
      const seasonsData = await seasonService.getSeasons();
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
  
  const loadReferees = async (seasonId: string) => {
    try {
      const refereesData = await refereeService.getReferees(seasonId);
      setReferees(refereesData);
    } catch (error) {
      console.error('Error loading referees:', error);
    }
  };
  
  const loadMatches = async (seasonId: string) => {
    try {
      const matchesData = await matchService.getMatches(seasonId);
      setMatches(matchesData);
    } catch (error) {
      console.error('Error loading matches:', error);
    }
  };
  
  // Filtrar árbitros
  const filteredReferees = useMemo(() => {
    return referees.filter(referee => {
      // Filtrar por nivel - traducir opciones del select al inglés
      if (selectedLevel) {
        let refereeLevel = referee.level;
        let selectedLevelTranslated = '';
        
        // Traducir opción del select al inglés
        switch (selectedLevel) {
          case 'principiante': selectedLevelTranslated = 'beginner'; break;
          case 'intermedio': selectedLevelTranslated = 'intermediate'; break;
          case 'avanzado': selectedLevelTranslated = 'advanced'; break;
          case 'fifa': selectedLevelTranslated = 'fifa'; break;
          default: selectedLevelTranslated = selectedLevel;
        }
        
        if (refereeLevel !== selectedLevelTranslated) {
          return false;
        }
      }
      
      // Filtrar por búsqueda
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        return (
          referee.fullName.toLowerCase().includes(term) ||
          referee.email.toLowerCase().includes(term) ||
          referee.phone.toLowerCase().includes(term) ||
          referee.licenseNumber.toLowerCase().includes(term)
        );
      }
      
      return true;
    });
  }, [referees, selectedLevel, searchTerm]);
  
  // Obtener partidos asignados a un árbitro
  const getAssignedMatches = (refereeId: string) => {
    return matches.filter(match => match.refereeId === refereeId);
  };
  
  // Calcular estadísticas de árbitros
  const getRefereeStats = (referee: Referee) => {
    const assignedMatches = getAssignedMatches(referee.id);
    const completedMatches = assignedMatches.filter(m => m.status === 'completed');
    
    return {
      assigned: assignedMatches.length,
      completed: completedMatches.length,
      pending: assignedMatches.filter(m => m.status === 'scheduled').length,
      rating: referee.rating || 0
    };
  };
  
  // Manejar eliminación de árbitro
  const handleDeleteReferee = async (refereeId: string) => {
    if (!confirm('¿Estás seguro de eliminar este árbitro?')) return;
    
    try {
      await refereeService.deleteReferee(refereeId);
      
      // Actualizar lista
      setReferees(referees.filter(referee => referee.id !== refereeId));
      
      setNotification({
        type: 'success',
        message: 'Árbitro eliminado exitosamente'
      });
    } catch (error) {
      console.error('Error deleting referee:', error);
      setNotification({
        type: 'error',
        message: 'Error al eliminar el árbitro'
      });
    }
  };
  
  // Manejar activar/desactivar árbitro
  const handleToggleStatus = async (refereeId: string, isActive: boolean) => {
    try {
      await refereeService.updateReferee(refereeId, { isActive: !isActive });
      
      // Actualizar lista
      setReferees(referees.map(referee => 
        referee.id === refereeId 
          ? { ...referee, isActive: !isActive }
          : referee
      ));
      
      setNotification({
        type: 'success',
        message: `Árbitro ${!isActive ? 'activado' : 'desactivado'} exitosamente`
      });
    } catch (error) {
      console.error('Error toggling referee status:', error);
      setNotification({
        type: 'error',
        message: 'Error al cambiar el estado del árbitro'
      });
    }
  };
  
  // Obtener color según nivel
  const getLevelColor = (level: Referee['level']) => {
    switch (level) {
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-blue-100 text-blue-800';
      case 'advanced': return 'bg-purple-100 text-purple-800';
      case 'fifa': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  
  // Traducir nivel al español para mostrar
  const translateLevel = (level: Referee['level']): string => {
    switch (level) {
      case 'beginner': return 'Principiante';
      case 'intermediate': return 'Intermedio';
      case 'advanced': return 'Avanzado';
      case 'fifa': return 'FIFA';
      default: return level;
    }
  };
  
  // Traducir especialización
  const translateSpecialization = (specialization: Referee['specialization']): string => {
    switch (specialization) {
      case 'main': return 'Principal';
      case 'assistant': return 'Asistente';
      case 'fourth_official': return 'Cuarto oficial';
      case 'var': return 'VAR';
      default: return specialization;
    }
  };
  
  // Formatear fecha
  const formatDate = (date: Date | string) => {
    const dateObj = date instanceof Date ? date : new Date(date);
    return format(dateObj, "dd/MM/yyyy", { locale: es });
  };
  
  if (loading) return <LoadingSpinner />;
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Árbitros</h1>
        <p className="text-gray-600">Gestión de árbitros y asignación de partidos</p>
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
          
          {/* Selector de nivel */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nivel
            </label>
            <select
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos los niveles</option>
              <option value="beginner">Principiante</option>
              <option value="intermediate">Intermedio</option>
              <option value="advanced">Avanzado</option>
              <option value="fifa">FIFA</option>
            </select>
          </div>
          
          {/* Búsqueda */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Buscar árbitro
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nombre, email o licencia..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        
        {/* Botones de acción */}
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => navigate('/referees/new')}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Nuevo Árbitro
          </button>
          
          <button
            onClick={() => navigate('/matches')}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
          >
            Ver Partidos
          </button>
          
          <button
            onClick={() => navigate('/calendar')}
            className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
          >
            Ver Calendario
          </button>
        </div>
      </div>
      
      {/* Lista de árbitros */}
      {filteredReferees.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredReferees.map(referee => {
            const stats = getRefereeStats(referee);
            
            return (
              <div
                key={referee.id}
                className={`bg-white rounded-lg shadow-md overflow-hidden border-l-4 ${
                  referee.isActive 
                    ? 'border-l-green-500' 
                    : 'border-l-gray-300 opacity-75'
                }`}
              >
                {/* Encabezado del árbitro */}
                <div className="px-6 py-4 border-b border-gray-200">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-4">
                      {referee.photoUrl ? (
                        <img
                          src={referee.photoUrl}
                          alt={referee.fullName}
                          className="w-16 h-16 rounded-full object-cover border-2 border-gray-200"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center border-2 border-gray-200">
                          <span className="text-white text-xl font-bold">
                            {referee.firstName.charAt(0)}{referee.lastName.charAt(0)}
                          </span>
                        </div>
                      )}
                      
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">
                          {referee.fullName}
                          {!referee.isActive && (
                            <span className="ml-2 text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded">
                              INACTIVO
                            </span>
                          )}
                        </h3>
                        <p className="text-sm text-gray-600">{translateSpecialization(referee.specialization)}</p>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium mt-1 inline-block ${getLevelColor(referee.level)}`}>
                          {translateLevel(referee.level).toUpperCase()}
                        </span>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-2xl font-bold text-blue-600">{stats.rating.toFixed(1)}</div>
                      <div className="text-xs text-gray-600">Rating</div>
                    </div>
                  </div>
                </div>
                
                {/* Información del árbitro */}
                <div className="px-6 py-4">
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <div className="text-sm font-medium text-gray-500">Contacto</div>
                      <div className="text-sm text-gray-900">{referee.phone}</div>
                      <div className="text-sm text-gray-900">{referee.email}</div>
                    </div>
                    
                    <div>
                      <div className="text-sm font-medium text-gray-500">Licencia</div>
                      <div className="text-sm text-gray-900">{referee.licenseNumber}</div>
                      <div className="text-sm text-gray-600">
                        Vence: {formatDate(referee.licenseExpiry)}
                      </div>
                    </div>
                  </div>
                  
                  {/* Estadísticas */}
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900">{stats.assigned}</div>
                      <div className="text-xs text-gray-600">Asignados</div>
                    </div>
                    
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900">{stats.completed}</div>
                      <div className="text-xs text-gray-600">Completados</div>
                    </div>
                    
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900">{stats.pending}</div>
                      <div className="text-xs text-gray-600">Pendientes</div>
                    </div>
                  </div>
                  
                  {/* Disponibilidad */}
                  <div className="mb-4">
                    <div className="text-sm font-medium text-gray-500 mb-2">Disponibilidad</div>
                    <div className="flex flex-wrap gap-1">
                      {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((day, index) => {
                        const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
                        const isAvailable = referee.availability[days[index] as keyof typeof referee.availability];
                        
                        return (
                          <div
                            key={day}
                            className={`w-8 h-8 flex items-center justify-center rounded text-sm ${
                              isAvailable 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-gray-100 text-gray-400'
                            }`}
                          >
                            {day}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  
                  {/* Contacto de emergencia */}
                  {referee.emergencyContact && (
                    <div className="bg-gray-50 rounded-lg p-3 mb-4">
                      <div className="text-sm font-medium text-gray-500 mb-1">Contacto de emergencia</div>
                      <div className="text-sm text-gray-900">{referee.emergencyContact.name}</div>
                      <div className="text-sm text-gray-600">{referee.emergencyContact.phone}</div>
                    </div>
                  )}
                </div>
                
                {/* Acciones */}
                <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
                  <div className="flex justify-between items-center">
                    <div className="flex space-x-3">
                      <Link
                        to={`/referees/${referee.id}`}
                        className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                      >
                        Ver Detalles
                      </Link>
                      
                      <button
                        onClick={() => navigate(`/referees/${referee.id}/edit`)}
                        className="text-yellow-600 hover:text-yellow-800 text-sm"
                      >
                        Editar
                      </button>
                      
                      <button
                        onClick={() => handleToggleStatus(referee.id, referee.isActive)}
                        className={`text-sm ${
                          referee.isActive 
                            ? 'text-red-600 hover:text-red-800' 
                            : 'text-green-600 hover:text-green-800'
                        }`}
                      >
                        {referee.isActive ? 'Desactivar' : 'Activar'}
                      </button>
                    </div>
                    
                    <button
                      onClick={() => handleDeleteReferee(referee.id)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <div className="mx-auto w-24 h-24 text-gray-400 mb-6">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-1.205a21.47 21.47 0 00-2.388-5.944 21.473 21.473 0 00-5.944-2.388m0 0A21.498 21.498 0 0012 6.5c-3.315 0-6 2.685-6 6s2.685 6 6 6 6-2.685 6-6-2.685-6-6-6z" />
            </svg>
          </div>
          <h3 className="text-xl font-medium text-gray-900 mb-2">No hay árbitros registrados</h3>
          <p className="text-gray-600 mb-6">
            {selectedSeason 
              ? 'Comienza agregando árbitros para esta temporada.'
              : 'Selecciona una temporada para ver los árbitros.'
            }
          </p>
          <button
            onClick={() => navigate('/referees/new')}
            className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Agregar Primer Árbitro
          </button>
        </div>
      )}
    </div>
  );
};

export default Referees;