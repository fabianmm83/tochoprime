import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// Importaciones
import { useAuth } from '../context/AuthContext';
import { Match, Referee } from '../types';

// ✅ IMPORTAR CORRECTAMENTE:
// 1. matchesService del firestore.ts (CRUD básico)
import { matchesService } from '../services/firestore';

// 2. refereeService del archivo singleton que creamos (con métodos avanzados)
// Este debería estar en: src/services/refereeService.ts
import { refereeService } from '../services/refereeService';

// Importar componentes
import FieldManagement from '../components/referee/FieldManagement';
import EvidenceManager from '../components/referee/EvidenceManager';
import MatchStatsManager from '../components/referee/MatchStatsManager';

import {
  Wifi,
  WifiOff,
  Cloud,
  CloudOff,
  Image,
  BarChart3,
  Map,
  Flag,
  Trophy,
  Settings
} from 'lucide-react';

const RefereePanel: React.FC = () => {
  const { userData } = useAuth();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState<'dashboard' | 'matches' | 'fields' | 'evidence' | 'stats' | 'settings'>('dashboard');
  const [refereeData, setRefereeData] = useState<Referee | null>(null);
  const [assignedMatches, setAssignedMatches] = useState<{
    upcoming: Match[];
    inProgress: Match[];
    completed: Match[];
    cancelled: Match[];
  }>({ upcoming: [], inProgress: [], completed: [], cancelled: [] });
  const [loading, setLoading] = useState(true);
  const [offlineMode, setOfflineMode] = useState(!navigator.onLine);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'synced' | 'error'>('idle');
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);

  useEffect(() => {
    loadRefereeData();
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [userData?.uid]);

  const loadRefereeData = async () => {
    if (!userData?.uid) return;
    
    setLoading(true);
    try {
      // ✅ CORREGIDO: Crear datos básicos del árbitro con TODOS los campos requeridos
      const basicRefereeData: Referee = {
        id: userData.uid,
        seasonId: '',
        firstName: userData.displayName?.split(' ')[0] || 'Árbitro',
        lastName: userData.displayName?.split(' ').slice(1).join(' ') || '',
        fullName: userData.displayName || 'Árbitro',
        email: userData.email || '',
        phone: '',
        // ✅ Añadir campos faltantes
        idNumber: userData.uid, // Usar UID como número de identificación temporal
        birthDate: new Date().toISOString(),
        licenseNumber: 'TEMP-001',
        licenseExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 año desde ahora
        level: 'intermediate',
        specialization: 'main',
        availability: {
          monday: true, tuesday: true, wednesday: true, thursday: true,
          friday: true, saturday: true, sunday: true,
          preferredTimes: []
        },
        matchesAssigned: 0,
        matchesCompleted: 0,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: ''
      };
      
      setRefereeData(basicRefereeData);
      
      // ✅ Usar refereeService (singleton) que sí tiene estos métodos
      // Este viene de src/services/refereeService.ts
      const matches = await refereeService.getAssignedMatchesWithDetails(userData.uid);
      setAssignedMatches(matches);
      
      // Sincronizar datos pendientes si está online
      if (navigator.onLine) {
        await syncPendingData();
      }
      
    } catch (error) {
      console.error('Error cargando datos del árbitro:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOnline = () => {
    setOfflineMode(false);
    syncPendingData();
  };

  const handleOffline = () => {
    setOfflineMode(true);
  };

  const syncPendingData = async () => {
    if (!userData?.uid) return;
    
    setSyncStatus('syncing');
    try {
      // ✅ Usar refereeService (singleton) que sí tiene este método
      const result = await refereeService.syncPendingOfflineData(userData.uid);
      
      if (result.synced > 0) {
        setSyncStatus('synced');
        setTimeout(() => setSyncStatus('idle'), 3000);
      }
      
      if (result.failed > 0) {
        console.error('Errores en sincronización:', result.errors);
        setSyncStatus('error');
      }
      
    } catch (error) {
      console.error('Error sincronizando datos:', error);
      setSyncStatus('error');
    }
  };

  const startMatch = async (match: Match) => {
    try {
      await matchesService.updateMatch(match.id, { status: 'in_progress' });
      setSelectedMatch(match);
      setActiveTab('evidence'); // Cambiar a pestaña de evidencia
      loadRefereeData(); // Recargar datos
    } catch (error) {
      console.error('Error iniciando partido:', error);
      alert('Error al iniciar partido');
    }
  };

  const finishMatch = async (match: Match) => {
    if (window.confirm('¿Finalizar partido? Esto registrará el resultado final.')) {
      try {
        await matchesService.updateMatch(match.id, { status: 'completed' });
        loadRefereeData();
        alert('Partido finalizado');
      } catch (error) {
        console.error('Error finalizando partido:', error);
        alert('Error al finalizar partido');
      }
    }
  };

  // Manejar selección de campo
  const handleFieldSelect = (field: any) => {
    console.log('Campo seleccionado:', field);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-600 to-red-600 text-white p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Panel del Árbitro</h1>
            <div className="flex items-center space-x-2 mt-1">
              <span className="text-sm opacity-90">{refereeData?.fullName}</span>
              <span className="text-xs opacity-75 bg-white bg-opacity-20 px-2 py-0.5 rounded-full">
                Nivel {refereeData?.level}
              </span>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            {/* Indicador de conexión */}
            <div className={`flex items-center px-3 py-1 rounded-full ${offlineMode ? 'bg-yellow-500' : 'bg-green-500'}`}>
              {offlineMode ? (
                <>
                  <WifiOff className="w-4 h-4 mr-1" />
                  <span className="text-xs">Offline</span>
                </>
              ) : (
                <>
                  <Wifi className="w-4 h-4 mr-1" />
                  <span className="text-xs">Online</span>
                </>
              )}
            </div>
            
            {/* Botón de sincronización */}
            {offlineMode && (
              <button
                onClick={syncPendingData}
                disabled={syncStatus === 'syncing'}
                className="px-3 py-1 bg-white text-orange-600 text-sm rounded-full hover:bg-gray-100 disabled:opacity-50 flex items-center"
              >
                {syncStatus === 'syncing' ? (
                  <>
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-orange-600 mr-2"></div>
                    Sincronizando...
                  </>
                ) : syncStatus === 'synced' ? (
                  <>
                    <Cloud className="w-3 h-3 mr-1" />
                    Sincronizado
                  </>
                ) : (
                  <>
                    <CloudOff className="w-3 h-3 mr-1" />
                    Sincronizar
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tabs de navegación */}
      <div className="bg-white border-b border-gray-200">
        <div className="flex overflow-x-auto px-4">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: Trophy },
            { id: 'matches', label: 'Partidos', icon: Flag },
            { id: 'fields', label: 'Campos', icon: Map },
            { id: 'evidence', label: 'Evidencia', icon: Image },
            { id: 'stats', label: 'Estadísticas', icon: BarChart3 },
            { id: 'settings', label: 'Configuración', icon: Settings }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-shrink-0 px-4 py-3 border-b-2 font-medium text-sm flex items-center ${
                  activeTab === tab.id
                    ? 'border-orange-600 text-orange-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                <Icon className="w-4 h-4 mr-2" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Contenido principal */}
      <div className="p-4">
        {activeTab === 'dashboard' && (
          <DashboardContent 
            refereeData={refereeData}
            assignedMatches={assignedMatches}
            onStartMatch={startMatch}
            onFinishMatch={finishMatch}
            onViewMatch={(match) => {
              setSelectedMatch(match);
              setActiveTab('evidence');
            }}
          />
        )}

        {activeTab === 'matches' && (
          <MatchesContent 
            assignedMatches={assignedMatches}
            onStartMatch={startMatch}
            onFinishMatch={finishMatch}
            onSelectMatch={(match) => setSelectedMatch(match)}
          />
        )}

        {activeTab === 'fields' && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Gestión de Campos</h2>
            <FieldManagement 
              refereeId={userData?.uid || ''}
              onFieldSelect={handleFieldSelect}
            />
          </div>
        )}

        {activeTab === 'evidence' && selectedMatch && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Evidencia del Partido</h2>
                <p className="text-gray-600">
                  {selectedMatch.homeTeam?.name || 'Equipo Local'} vs {selectedMatch.awayTeam?.name || 'Equipo Visitante'}
                </p>
              </div>
              <button
                onClick={() => setActiveTab('matches')}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                ← Volver a partidos
              </button>
            </div>
            
            <EvidenceManager
              matchId={selectedMatch.id}
              refereeId={userData?.uid || ''}
            />
          </div>
        )}

        {activeTab === 'stats' && selectedMatch && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Estadísticas del Partido</h2>
                <p className="text-gray-600">
                  {selectedMatch.homeTeam?.name || 'Equipo Local'} vs {selectedMatch.awayTeam?.name || 'Equipo Visitante'}
                </p>
              </div>
              <button
                onClick={() => setActiveTab('matches')}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                ← Volver a partidos
              </button>
            </div>
            
            <MatchStatsManager
              matchId={selectedMatch.id}
              refereeId={userData?.uid || ''}
            />
          </div>
        )}

        {activeTab === 'settings' && (
          <RefereeSettings 
            refereeData={refereeData}
            onUpdate={() => loadRefereeData()}
          />
        )}

        {/* Mostrar si no hay partido seleccionado para stats o evidence */}
        {(activeTab === 'evidence' || activeTab === 'stats') && !selectedMatch && (
          <div className="text-center py-12">
            <Image className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {activeTab === 'evidence' ? 'No hay partido seleccionado' : 'Selecciona un partido'}
            </h3>
            <p className="text-gray-600 mb-4">
              {activeTab === 'evidence' 
                ? 'Selecciona un partido de la pestaña "Partidos" para subir evidencia'
                : 'Selecciona un partido de la pestaña "Partidos" para registrar estadísticas'
              }
            </p>
            <button
              onClick={() => setActiveTab('matches')}
              className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
            >
              Ir a Partidos
            </button>
          </div>
        )}
      </div>

      {/* Barra inferior de navegación */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-2">
        <div className="flex justify-around">
          {[
            { id: 'dashboard', icon: Trophy, label: 'Inicio' },
            { id: 'matches', icon: Flag, label: 'Partidos' },
            { id: 'fields', icon: Map, label: 'Campos' },
            { id: 'evidence', icon: Image, label: 'Evidencia' },
            { id: 'stats', icon: BarChart3, label: 'Stats' }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex flex-col items-center p-2 ${
                  activeTab === tab.id ? 'text-orange-600' : 'text-gray-600'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs mt-1">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// Componentes auxiliares implementados
const DashboardContent: React.FC<{
  refereeData: Referee | null;
  assignedMatches: {
    upcoming: Match[];
    inProgress: Match[];
    completed: Match[];
    cancelled: Match[];
  };
  onStartMatch: (match: Match) => void;
  onFinishMatch: (match: Match) => void;
  onViewMatch: (match: Match) => void;
}> = ({ refereeData, assignedMatches, onStartMatch, onFinishMatch, onViewMatch }) => {
  return (
    <div className="space-y-6">
      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="text-2xl font-bold text-blue-600">{assignedMatches.upcoming.length}</div>
          <div className="text-sm text-gray-600">Próximos</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="text-2xl font-bold text-yellow-600">{assignedMatches.inProgress.length}</div>
          <div className="text-sm text-gray-600">En curso</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="text-2xl font-bold text-green-600">{assignedMatches.completed.length}</div>
          <div className="text-sm text-gray-600">Completados</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="text-2xl font-bold text-red-600">{assignedMatches.cancelled.length}</div>
          <div className="text-sm text-gray-600">Cancelados</div>
        </div>
      </div>

      {/* Próximos partidos */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <h3 className="font-medium text-gray-900 mb-4">Próximos Partidos</h3>
        {assignedMatches.upcoming.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No hay partidos próximos</p>
        ) : (
          <div className="space-y-3">
            {assignedMatches.upcoming.slice(0, 3).map((match) => (
              <div key={match.id} className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-medium">{match.homeTeam?.name || 'Local'} vs {match.awayTeam?.name || 'Visitante'}</div>
                    <div className="text-sm text-gray-600">
                      {new Date(match.matchDate).toLocaleDateString()} - {match.matchTime}
                    </div>
                    <div className="text-xs text-gray-500">{match.fieldId}</div>
                  </div>
                  <button
                    onClick={() => onStartMatch(match)}
                    className="px-3 py-1 bg-orange-600 text-white text-sm rounded hover:bg-orange-700"
                  >
                    Iniciar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Partidos en curso */}
      {assignedMatches.inProgress.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-yellow-500">
          <h3 className="font-medium text-gray-900 mb-4">Partidos en Curso</h3>
          <div className="space-y-3">
            {assignedMatches.inProgress.map((match) => (
              <div key={match.id} className="border border-yellow-200 rounded-lg p-3 bg-yellow-50">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-medium">{match.homeTeam?.name || 'Local'} vs {match.awayTeam?.name || 'Visitante'}</div>
                    <div className="text-sm text-gray-600">
                      En curso • Iniciado hoy
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => onViewMatch(match)}
                      className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                    >
                      Ver
                    </button>
                    <button
                      onClick={() => onFinishMatch(match)}
                      className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                    >
                      Finalizar
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const MatchesContent: React.FC<{
  assignedMatches: {
    upcoming: Match[];
    inProgress: Match[];
    completed: Match[];
    cancelled: Match[];
  };
  onStartMatch: (match: Match) => void;
  onFinishMatch: (match: Match) => void;
  onSelectMatch: (match: Match) => void;
}> = ({ assignedMatches, onStartMatch, onFinishMatch, onSelectMatch }) => {
  const [selectedStatus, setSelectedStatus] = useState<'upcoming' | 'inProgress' | 'completed' | 'cancelled'>('upcoming');

  const matchesToShow = assignedMatches[selectedStatus];

  return (
    <div className="space-y-6">
      {/* Filtros por estado */}
      <div className="flex space-x-2 overflow-x-auto pb-2">
        {[
          { key: 'upcoming', label: 'Próximos', count: assignedMatches.upcoming.length, color: 'blue' },
          { key: 'inProgress', label: 'En curso', count: assignedMatches.inProgress.length, color: 'yellow' },
          { key: 'completed', label: 'Completados', count: assignedMatches.completed.length, color: 'green' },
          { key: 'cancelled', label: 'Cancelados', count: assignedMatches.cancelled.length, color: 'red' }
        ].map((status) => (
          <button
            key={status.key}
            onClick={() => setSelectedStatus(status.key as any)}
            className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium ${
              selectedStatus === status.key
                ? `bg-${status.color}-100 text-${status.color}-800 border border-${status.color}-300`
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {status.label} ({status.count})
          </button>
        ))}
      </div>

      {/* Lista de partidos */}
      <div className="bg-white rounded-lg shadow-sm">
        {matchesToShow.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No hay partidos en esta categoría</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {matchesToShow.map((match) => (
              <div key={match.id} className="p-4 hover:bg-gray-50">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      <div className="font-medium text-gray-900">
                        {match.homeTeam?.name || 'Equipo Local'}
                      </div>
                      <div className="mx-2 text-gray-400">vs</div>
                      <div className="font-medium text-gray-900">
                        {match.awayTeam?.name || 'Equipo Visitante'}
                      </div>
                    </div>
                    
                    <div className="text-sm text-gray-600 mb-1">
                      {new Date(match.matchDate).toLocaleDateString('es-ES', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })} • {match.matchTime}
                    </div>
                    
                    <div className="text-xs text-gray-500">
                      Campo: {match.fieldId} • {match.divisionId}
                    </div>
                    
                    {match.status === 'completed' && match.homeScore !== undefined && match.awayScore !== undefined && (
                      <div className="mt-2">
                        <span className="inline-block px-2 py-1 bg-gray-100 text-gray-800 text-sm rounded">
                          Resultado: {match.homeScore} - {match.awayScore}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <div className="ml-4 flex flex-col space-y-2">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => onSelectMatch(match)}
                        className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                      >
                        Ver
                      </button>
                      
                      {match.status === 'scheduled' && (
                        <button
                          onClick={() => onStartMatch(match)}
                          className="px-3 py-1 bg-orange-600 text-white text-sm rounded hover:bg-orange-700"
                        >
                          Iniciar
                        </button>
                      )}
                      
                      {match.status === 'in_progress' && (
                        <button
                          onClick={() => onFinishMatch(match)}
                          className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                        >
                          Finalizar
                        </button>
                      )}
                    </div>
                    
                    <span className={`text-xs px-2 py-1 rounded-full text-center ${
                      match.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                      match.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                      match.status === 'completed' ? 'bg-green-100 text-green-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {match.status === 'scheduled' ? 'Programado' :
                       match.status === 'in_progress' ? 'En curso' :
                       match.status === 'completed' ? 'Completado' : 'Cancelado'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const RefereeSettings: React.FC<{
  refereeData: Referee | null;
  onUpdate: () => void;
}> = ({ refereeData, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-medium text-gray-900">Configuración del Árbitro</h3>
        <button
          onClick={() => setIsEditing(!isEditing)}
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
        >
          {isEditing ? 'Cancelar' : 'Editar'}
        </button>
      </div>

      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nivel
            </label>
            <select
              defaultValue={refereeData?.level || 'intermediate'}
              disabled={!isEditing}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg disabled:bg-gray-100"
            >
              <option value="beginner">Principiante</option>
              <option value="intermediate">Intermedio</option>
              <option value="advanced">Avanzado</option>
              <option value="fifa">FIFA</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Especialización
            </label>
            <select
              defaultValue={refereeData?.specialization || 'main'}
              disabled={!isEditing}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg disabled:bg-gray-100"
            >
              <option value="main">Árbitro Principal</option>
              <option value="assistant">Árbitro Asistente</option>
              <option value="fourth_official">Cuarto Oficial</option>
              <option value="var">VAR</option>
            </select>
          </div>
        </div>

        <div>
          <h4 className="font-medium text-gray-900 mb-3">Preferencias</h4>
          <div className="space-y-3">
            <label className="flex items-center">
              <input
                type="checkbox"
                defaultChecked={refereeData?.preferences?.receiveNotifications || true}
                disabled={!isEditing}
                className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
              />
              <span className="ml-2 text-gray-700">Recibir notificaciones</span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                defaultChecked={refereeData?.preferences?.offlineModeEnabled || true}
                disabled={!isEditing}
                className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
              />
              <span className="ml-2 text-gray-700">Modo offline habilitado</span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                defaultChecked={refereeData?.preferences?.autoSyncData || true}
                disabled={!isEditing}
                className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
              />
              <span className="ml-2 text-gray-700">Sincronización automática</span>
            </label>
          </div>
        </div>

        {isEditing && (
          <div className="pt-4 border-t border-gray-200">
            <button
              onClick={() => {
                setIsEditing(false);
                onUpdate();
              }}
              className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
            >
              Guardar Cambios
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default RefereePanel;