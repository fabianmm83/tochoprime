import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Users,
  Trophy,
  Calendar,
  MapPin,
  DollarSign,
  AlertCircle,
  Clock,
  TrendingUp,
  BarChart3,
  FileText,
  Settings,
  ChevronRight,
  Eye,
  CheckCircle,
  XCircle,
  UserPlus,
  PlusCircle,
  RefreshCw,
  Activity,
  Shield
} from 'lucide-react';
import MatchCard from '../components/cards/MatchCard';
import {
  Season,
  Team,
  Match,
  MatchCardData,
  adaptMatchToCardData
} from '../types';
import {
  seasonsService,
  teamsService,
  matchesService,
  playersService,
  refereesService,
  calendarService
} from '../services/firestore';

const AdminDashboard: React.FC = () => {
  const { userData } = useAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    seasons: 0,
    divisions: 0,
    categories: 0,
    teams: 0,
    players: 0,
    matches: 0,
    referees: 0,
    activeMatches: 0
  });
  
  const [upcomingMatches, setUpcomingMatches] = useState<MatchCardData[]>([]);
  const [liveMatches, setLiveMatches] = useState<Match[]>([]);
  const [recentTeams, setRecentTeams] = useState<Team[]>([]);
  const [pendingActions, setPendingActions] = useState<any[]>([]);
  const [systemStatus, setSystemStatus] = useState({
    status: 'operational',
    lastBackup: new Date(Date.now() - 86400000),
    activeUsers: 42,
    serverLoad: 'low'
  });

  useEffect(() => {
    const loadAdminData = async () => {
      setLoading(true);
      try {
        // Cargar todas las estadísticas
        const [
          seasons,
          teams,
          allMatches,
          referees,
          liveMatchesData,
          recentTeamsData
        ] = await Promise.all([
          seasonsService.getSeasons(),
          teamsService.getAllTeams(),
          matchesService.getMatches(),
          refereesService.getReferees(),
          matchesService.getMatches().then(matches => 
            matches.filter(m => m.status === 'in_progress')
          ),
          teamsService.getAllTeams().then(teams => 
            teams.sort((a, b) => 
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            ).slice(0, 5)
          )
        ]);

        // Calcular estadísticas
        const playersCount = teams.reduce((total, team) => total + (team.playerCount || 0), 0);
        const activeSeasons = seasons.filter(s => s.status === 'active').length;
        
        setStats({
          seasons: activeSeasons,
          divisions: 3, // Esto debería venir de una consulta
          categories: 7, // Esto debería venir de una consulta
          teams: teams.length,
          players: playersCount,
          matches: allMatches.length,
          referees: referees.length,
          activeMatches: liveMatchesData.length
        });

        // Obtener partidos próximos
        const futureMatches = allMatches
          .filter(match => new Date(match.matchDate) >= new Date())
          .slice(0, 3);
        
        const matchCards = await Promise.all(
          futureMatches.map(async match => {
            const homeTeam = await teamsService.getTeamById(match.homeTeamId);
            const awayTeam = await teamsService.getTeamById(match.awayTeamId);
            return adaptMatchToCardData(match, homeTeam || undefined, awayTeam || undefined);
          })
        );
        
        setUpcomingMatches(matchCards);
        setLiveMatches(liveMatchesData);
        setRecentTeams(recentTeamsData);
        
        // Simular acciones pendientes
        const mockPendingActions = [
          {
            id: 1,
            type: 'team_registration',
            title: 'Nuevo equipo pendiente',
            description: 'Los Tigres esperan aprobación',
            timestamp: new Date(Date.now() - 3600000),
            priority: 'high'
          },
          {
            id: 2,
            type: 'payment_verification',
            title: 'Pago por verificar',
            description: 'Pago de $2,500 de los Dragones',
            timestamp: new Date(Date.now() - 7200000),
            priority: 'medium'
          },
          {
            id: 3,
            type: 'match_conflict',
            title: 'Conflicto de horario',
            description: 'Campo 3 tiene doble asignación',
            timestamp: new Date(Date.now() - 10800000),
            priority: 'high'
          }
        ];
        
        setPendingActions(mockPendingActions);
        
      } catch (error) {
        console.error('Error cargando datos del administrador:', error);
      } finally {
        setLoading(false);
      }
    };

    loadAdminData();
  }, []);

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'new_season':
        navigate('/seasons/new');
        break;
      case 'new_team':
        navigate('/teams/new');
        break;
      case 'schedule_match':
        navigate('/matches/new');
        break;
      case 'manage_users':
        navigate('/users');
        break;
      default:
        navigate('/admin');
    }
  };

  const handleResolveAction = (actionId: number) => {
    setPendingActions(prev => prev.filter(a => a.id !== actionId));
    alert('Acción resuelta');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 pb-20">
        <div className="p-4">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 pb-20">
      {/* Header del administrador */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Dashboard Administrativo</h1>
            <div className="flex items-center mt-1">
              <Shield className="w-4 h-4 mr-1" />
              <span className="text-sm opacity-90">
                {userData?.displayName || 'Administrador'} • Sistema completo
              </span>
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-sm opacity-90">Estado: 
              <span className="ml-2 bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                ✓ {systemStatus.status}
              </span>
            </div>
            <div className="text-xs opacity-75">{systemStatus.activeUsers} usuarios activos</div>
          </div>
        </div>
      </div>

      {/* Estadísticas generales */}
      <div className="p-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 mb-1">Temporadas</p>
                <p className="text-2xl font-bold text-gray-900">{stats.seasons}</p>
              </div>
              <div className="p-2 bg-purple-100 rounded-full">
                <Trophy className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <div className="text-xs text-gray-600 mt-2">Activas</div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 mb-1">Equipos</p>
                <p className="text-2xl font-bold text-gray-900">{stats.teams}</p>
              </div>
              <div className="p-2 bg-blue-100 rounded-full">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <div className="text-xs text-gray-600 mt-2">{stats.players} jugadores</div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 mb-1">Partidos</p>
                <p className="text-2xl font-bold text-gray-900">{stats.matches}</p>
              </div>
              <div className="p-2 bg-green-100 rounded-full">
                <Calendar className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <div className="text-xs text-gray-600 mt-2">{stats.activeMatches} en vivo</div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 mb-1">Árbitros</p>
                <p className="text-2xl font-bold text-gray-900">{stats.referees}</p>
              </div>
              <div className="p-2 bg-orange-100 rounded-full">
                <Activity className="w-6 h-6 text-orange-600" />
              </div>
            </div>
            <div className="text-xs text-gray-600 mt-2">Disponibles</div>
          </div>
        </div>
      </div>

      {/* Estado del sistema */}
      <div className="p-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-gray-900 flex items-center">
              <Activity className="w-5 h-5 mr-2 text-green-500" />
              Estado del Sistema
            </h2>
            <span className={`px-3 py-1 text-xs font-medium rounded-full ${
              systemStatus.status === 'operational' ? 'bg-green-100 text-green-800' :
              systemStatus.status === 'degraded' ? 'bg-yellow-100 text-yellow-800' :
              'bg-red-100 text-red-800'
            }`}>
              {systemStatus.status === 'operational' ? 'Operativo' :
               systemStatus.status === 'degraded' ? 'Degradado' : 'Crítico'}
            </span>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{systemStatus.activeUsers}</div>
              <div className="text-xs text-gray-600">Usuarios activos</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {new Date(systemStatus.lastBackup).toLocaleDateString()}
              </div>
              <div className="text-xs text-gray-600">Último backup</div>
            </div>
          </div>
          
          <div className="mt-4 flex justify-center">
            <button
              onClick={() => navigate('/admin/system')}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm"
            >
              <RefreshCw className="w-4 h-4 inline mr-2" />
              Ver detalles del sistema
            </button>
          </div>
        </div>
      </div>

      {/* Partidos en vivo */}
      {liveMatches.length > 0 && (
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-gray-900 flex items-center">
              <Clock className="w-5 h-5 mr-2 text-red-500" />
              Partidos en Vivo
              <span className="ml-2 bg-red-100 text-red-800 text-xs font-medium px-2 py-1 rounded-full">
                {liveMatches.length}
              </span>
            </h2>
            <button 
              onClick={() => navigate('/matches/live')}
              className="text-sm text-blue-600 font-medium flex items-center"
            >
              Ver todos
              <ChevronRight className="w-4 h-4 ml-1" />
            </button>
          </div>
          
          <div className="space-y-3">
            {liveMatches.slice(0, 2).map((match, index) => (
              <div 
                key={index}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-4"
                onClick={() => navigate(`/matches/${match.id}`)}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse mr-2"></div>
                    <span className="text-sm font-medium text-red-600">EN VIVO</span>
                  </div>
                  <div className="text-xs text-gray-600">
                    Minuto: {Math.floor(Math.random() * 90)}'
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="text-center flex-1">
                    <div className="font-bold text-lg">{match.homeTeam?.name || 'Local'}</div>
                    <div className="text-xs text-gray-500">Local</div>
                  </div>
                  
                  <div className="mx-4 text-center">
                    <div className="text-3xl font-bold">
                      {match.homeScore || 0} - {match.awayScore || 0}
                    </div>
                    <div className="text-xs text-gray-500">Marcador</div>
                  </div>
                  
                  <div className="text-center flex-1">
                    <div className="font-bold text-lg">{match.awayTeam?.name || 'Visitante'}</div>
                    <div className="text-xs text-gray-500">Visitante</div>
                  </div>
                </div>
                
                <div className="mt-3 pt-3 border-t border-gray-100 text-center">
                  <div className="text-sm text-gray-600">{match.fieldId} • {match.refereeName}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Próximos partidos */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-gray-900 flex items-center">
            <Calendar className="w-5 h-5 mr-2 text-blue-500" />
            Próximos Partidos
          </h2>
          <button 
            onClick={() => navigate('/matches')}
            className="text-sm text-blue-600 font-medium flex items-center"
          >
            Ver todos
            <ChevronRight className="w-4 h-4 ml-1" />
          </button>
        </div>
        
        {upcomingMatches.length > 0 ? (
          <div className="space-y-3">
            {upcomingMatches.map((match, index) => (
              <MatchCard 
                key={index}
                match={match}
                variant="compact"
                onClick={() => navigate(`/matches/${match.id}`)}
              />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
            <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-600">No hay partidos programados</p>
            <button 
              onClick={() => navigate('/matches/new')}
              className="mt-2 text-blue-600 text-sm font-medium"
            >
              Programar nuevo partido
            </button>
          </div>
        )}
      </div>

      {/* Acciones pendientes */}
      {pendingActions.length > 0 && (
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-gray-900 flex items-center">
              <AlertCircle className="w-5 h-5 mr-2 text-yellow-500" />
              Acciones Pendientes
              <span className="ml-2 bg-yellow-100 text-yellow-800 text-xs font-medium px-2 py-1 rounded-full">
                {pendingActions.length}
              </span>
            </h2>
          </div>
          
          <div className="space-y-3">
            {pendingActions.map((action, index) => (
              <div 
                key={index}
                className={`bg-white rounded-xl shadow-sm border ${
                  action.priority === 'high' 
                    ? 'border-red-200' 
                    : 'border-yellow-200'
                } p-4`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h3 className="font-semibold text-gray-900">{action.title}</h3>
                    <p className="text-sm text-gray-600">{action.description}</p>
                  </div>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    action.priority === 'high' 
                      ? 'bg-red-100 text-red-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {action.priority === 'high' ? 'ALTA' : 'MEDIA'}
                  </span>
                </div>
                
                <div className="flex items-center justify-between mt-3">
                  <div className="text-xs text-gray-500">
                    {new Date(action.timestamp).toLocaleString()}
                  </div>
                  
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleResolveAction(action.id)}
                      className="px-3 py-1 bg-green-100 text-green-700 text-sm rounded-lg hover:bg-green-200 flex items-center"
                    >
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Resolver
                    </button>
                    <button
                      onClick={() => navigate('/admin/actions')}
                      className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200 flex items-center"
                    >
                      <Eye className="w-3 h-3 mr-1" />
                      Ver
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Equipos recientes */}
      {recentTeams.length > 0 && (
        <div className="p-4">
          <h2 className="text-lg font-bold text-gray-900 mb-3">Equipos Recientes</h2>
          <div className="space-y-2">
            {recentTeams.map((team, index) => (
              <div
                key={index}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 hover:bg-gray-50"
                onClick={() => navigate(`/teams/${team.id}`)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center mr-3">
                      <span className="font-bold text-gray-700">{team.name.charAt(0)}</span>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">{team.name}</h4>
                      <div className="text-xs text-gray-600">
                        {team.playerCount} jugadores • {team.categoryId}
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className={`text-xs px-2 py-1 rounded-full ${
                      team.status === 'active' ? 'bg-green-100 text-green-800' :
                      team.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {team.status === 'active' ? 'Activo' :
                       team.status === 'pending' ? 'Pendiente' : 'Suspendido'}
                    </div>
                    <div className="text-xs text-gray-600 mt-1">
                      {new Date(team.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Acciones rápidas */}
      <div className="p-4">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Acciones Rápidas</h2>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => handleQuickAction('new_season')}
            className="bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl p-4 text-center hover:from-purple-600 hover:to-purple-700 transition-all active:scale-[0.98]"
          >
            <PlusCircle className="w-6 h-6 mx-auto mb-2" />
            <span className="font-medium">Nueva Temporada</span>
          </button>
          
          <button
            onClick={() => handleQuickAction('new_team')}
            className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl p-4 text-center hover:from-blue-600 hover:to-blue-700 transition-all active:scale-[0.98]"
          >
            <UserPlus className="w-6 h-6 mx-auto mb-2" />
            <span className="font-medium">Nuevo Equipo</span>
          </button>
          
          <button
            onClick={() => handleQuickAction('schedule_match')}
            className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl p-4 text-center hover:from-green-600 hover:to-green-700 transition-all active:scale-[0.98]"
          >
            <Calendar className="w-6 h-6 mx-auto mb-2" />
            <span className="font-medium">Programar Partido</span>
          </button>
          
          <button
            onClick={() => handleQuickAction('manage_users')}
            className="bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl p-4 text-center hover:from-orange-600 hover:to-orange-700 transition-all active:scale-[0.98]"
          >
            <Settings className="w-6 h-6 mx-auto mb-2" />
            <span className="font-medium">Gestionar Usuarios</span>
          </button>
        </div>
      </div>

      {/* Informes rápidos */}
      <div className="p-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <h3 className="font-bold text-gray-900 mb-3">Informes Rápidos</h3>
          <div className="space-y-2">
            <button
              onClick={() => navigate('/reports/financial')}
              className="w-full p-3 bg-gray-50 hover:bg-gray-100 rounded-lg flex items-center justify-between"
            >
              <div className="flex items-center">
                <DollarSign className="w-5 h-5 text-green-600 mr-3" />
                <div>
                  <div className="font-medium text-gray-900">Reporte Financiero</div>
                  <div className="text-xs text-gray-600">Ingresos y pagos del mes</div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </button>
            
            <button
              onClick={() => navigate('/reports/attendance')}
              className="w-full p-3 bg-gray-50 hover:bg-gray-100 rounded-lg flex items-center justify-between"
            >
              <div className="flex items-center">
                <Users className="w-5 h-5 text-blue-600 mr-3" />
                <div>
                  <div className="font-medium text-gray-900">Reporte de Asistencia</div>
                  <div className="text-xs text-gray-600">Jugadores y equipos activos</div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </button>
            
            <button
              onClick={() => navigate('/reports/performance')}
              className="w-full p-3 bg-gray-50 hover:bg-gray-100 rounded-lg flex items-center justify-between"
            >
              <div className="flex items-center">
                <BarChart3 className="w-5 h-5 text-purple-600 mr-3" />
                <div>
                  <div className="font-medium text-gray-900">Reporte de Rendimiento</div>
                  <div className="text-xs text-gray-600">Estadísticas de partidos</div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;