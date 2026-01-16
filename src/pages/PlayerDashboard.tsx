import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  CalendarDays, 
  Trophy, 
  Users, 
  Target, 
  ChevronRight, 
  Bell,
  Clock,
  MapPin,
  UserCircle,
  MoreVertical,
  Filter,
  Download,
  BarChart3,
  Calendar,
  AlertCircle,
  TrendingUp
} from 'lucide-react';
import MatchCard from '../components/cards/MatchCard';
import { 
  Match, 
  Team, 
  Player, 
  MobileDashboardData, 
  MobileStatsCard,
  MatchCardData,
  adaptMatchToCardData,
  MobileNotification,
  User
} from '../types';
import { 
  getPlayerMatches, 
  getPlayerStats, 
  getTeamStandings, 
  getPlayerTeam 
} from '../services/firestore';

// Función helper para convertir MatchCardData a Match (si tu MatchCard necesita Match)
const convertMatchCardDataToMatch = (matchCardData: MatchCardData): Match => {
  return {
    id: matchCardData.id,
    seasonId: '',
    divisionId: matchCardData.division,
    categoryId: matchCardData.category,
    fieldId: '',
    homeTeamId: matchCardData.homeTeam.id,
    awayTeamId: matchCardData.awayTeam.id,
    homeTeam: undefined,
    awayTeam: undefined,
    matchDate: matchCardData.date,
    matchTime: matchCardData.time,
    round: 1,
    isPlayoff: false,
    playoffStage: undefined,
    status: matchCardData.status,
    homeScore: matchCardData.homeTeam.score,
    awayScore: matchCardData.awayTeam.score,
    winner: undefined,
    resultDetails: undefined,
    refereeId: undefined,
    refereeName: undefined,
    notes: undefined,
    videoUrl: undefined,
    spectators: undefined,
    weather: undefined,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: '',
    updatedBy: '',
  };
};

const PlayerDashboard: React.FC = () => {
  const { userData } = useAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<MobileDashboardData | null>(null);
  const [upcomingMatches, setUpcomingMatches] = useState<MatchCardData[]>([]);
  const [playerStats, setPlayerStats] = useState<MobileStatsCard[]>([]);
  const [teamStandings, setTeamStandings] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<MobileNotification[]>([]);
  const [playerTeam, setPlayerTeam] = useState<Team | null>(null);

  useEffect(() => {
    const loadPlayerData = async () => {
      if (!userData?.uid) return;
      
      setLoading(true);
      try {
        // Cargar datos del jugador
        const [
          matchesData,
          statsData,
          standingsData,
          teamData
        ] = await Promise.all([
          getPlayerMatches(userData.uid),
          getPlayerStats(userData.uid),
          getTeamStandings(userData.uid),
          getPlayerTeam(userData.uid)
        ]);

        setPlayerTeam(teamData);
        
        // Transformar partidos a formato de tarjeta
        const matchCards = matchesData.map(match => 
          adaptMatchToCardData(match, teamData || undefined, match.awayTeam as Team)
        );
        setUpcomingMatches(matchCards.slice(0, 3));
        
        // Configurar estadísticas del jugador
        const statsCards: MobileStatsCard[] = [
          {
            title: 'Partidos Jugados',
            value: statsData?.matchesPlayed || 0,
            icon: 'CalendarDays',
            color: 'bg-blue-500',
            change: statsData?.matchesPlayed ? 2 : 0
          },
          {
            title: 'Goles',
            value: statsData?.goals || 0,
            icon: 'Target',
            color: 'bg-green-500',
            change: statsData?.goals ? 1 : 0
          },
          {
            title: 'Asistencias',
            value: statsData?.assists || 0,
            icon: 'Users',
            color: 'bg-purple-500',
            change: statsData?.assists ? 3 : 0
          },
          {
            title: 'Tarjetas',
            value: (statsData?.yellowCards || 0) + (statsData?.redCards || 0),
            icon: 'AlertCircle',
            color: 'bg-yellow-500',
            change: -1
          }
        ];
        setPlayerStats(statsCards);
        
        // Configurar tabla de posiciones
        setTeamStandings(standingsData || []);
        
        // Notificaciones de ejemplo
        const mockNotifications: MobileNotification[] = [
          {
            id: '1',
            type: 'match',
            title: 'Próximo Partido',
            message: 'Dragones vs Halcones - Sábado 18:00 hrs',
            timestamp: new Date(),
            read: false,
            action: {
              label: 'Ver detalles',
              url: '/matches/123'
            },
            priority: 'high'
          },
          {
            id: '2',
            type: 'team',
            title: 'Recordatorio de Pago',
            message: 'Pago de temporada vence en 3 días',
            timestamp: new Date(Date.now() - 86400000),
            read: true,
            priority: 'medium'
          }
        ];
        setNotifications(mockNotifications);
        
        // Configurar datos del dashboard
        const dashboard: MobileDashboardData = {
          user: {
            id: userData.uid,
            name: userData.displayName || 'Jugador',
            role: userData.role === 'arbitro' ? 'árbitro' : 
                  userData.role === 'capitan' ? 'capitán' : 
                  userData.role as any,
            team: teamData ? {
              id: teamData.id,
              name: teamData.name,
              position: 'Delantero',
              number: 10
            } : undefined,
            stats: statsData ? {
              matches: statsData.matchesPlayed,
              goals: statsData.goals,
              assists: statsData.assists,
              yellowCards: statsData.yellowCards,
              redCards: statsData.redCards,
            } : undefined,
            upcomingMatches: matchCards.slice(0, 2),
            recentActivity: [
              {
                type: 'match_participation',
                description: 'Partido completado: Dragones 24 - 18 Halcones',
                date: new Date(Date.now() - 86400000)
              },
              {
                type: 'goal_scored',
                description: 'Anotaste 2 goles en el último partido',
                date: new Date(Date.now() - 172800000)
              }
            ]
          },
          stats: statsCards,
          upcomingMatches: matchCards.slice(0, 3),
          recentActivities: [],
          quickActions: [
            {
              id: 'calendar',
              label: 'Calendario',
              icon: 'Calendar',
              action: () => navigate('/calendar'),
              color: 'bg-blue-500'
            },
            {
              id: 'team',
              label: 'Mi Equipo',
              icon: 'Users',
              action: () => navigate('/team'),
              color: 'bg-green-500'
            },
            {
              id: 'stats',
              label: 'Estadísticas',
              icon: 'BarChart3',
              action: () => navigate('/stats'),
              color: 'bg-purple-500'
            },
            {
              id: 'notifications',
              label: 'Notificaciones',
              icon: 'Bell',
              action: () => navigate('/notifications'),
              color: 'bg-yellow-500'
            }
          ],
          notifications: {
            unread: mockNotifications.filter(n => !n.read).length,
            items: mockNotifications
          }
        };
        
        setDashboardData(dashboard);
        
      } catch (error) {
        console.error('Error cargando datos del jugador:', error);
      } finally {
        setLoading(false);
      }
    };

    loadPlayerData();
  }, [userData?.uid, navigate]);

  const handleNotificationClick = (notification: MobileNotification) => {
    if (notification.action) {
      navigate(notification.action.url);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white pb-20">
        <div className="p-4">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
          
          <div className="grid grid-cols-2 gap-3 mt-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="animate-pulse">
                <div className="h-24 bg-gray-200 rounded-xl"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white pb-20">
      {/* Header con información del jugador */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">¡Hola, {dashboardData?.user.name}!</h1>
            <div className="flex items-center mt-1">
              <UserCircle className="w-4 h-4 mr-1" />
              <span className="text-sm opacity-90">
                {playerTeam?.name ? `${playerTeam.name} • ` : ''}
                {dashboardData?.user.role === 'jugador' ? 'Jugador' : 
                 dashboardData?.user.role === 'árbitro' ? 'Árbitro' :
                 dashboardData?.user.role === 'capitán' ? 'Capitán' :
                 dashboardData?.user.role}
              </span>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <button 
              onClick={() => navigate('/notifications')}
              className="relative p-2"
            >
              <Bell className="w-6 h-6" />
              {notifications.filter(n => !n.read).length > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              )}
            </button>
            
            <button className="p-2">
              <MoreVertical className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>

      {/* Sección 1: Próximo Partido */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-gray-900 flex items-center">
            <Clock className="w-5 h-5 mr-2 text-blue-500" />
            Próximo Partido
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
            {/* Si tu MatchCard solo acepta Match, convierte MatchCardData a Match */}
            {(() => {
              const firstMatch = convertMatchCardDataToMatch(upcomingMatches[0]);
              return (
                <MatchCard 
                  match={firstMatch}
                  variant="compact"
                  onClick={() => navigate(`/matches/${upcomingMatches[0].id}`)}
                />
              );
            })()}
          </div>
        ) : (
          <div className="bg-gray-50 rounded-xl p-6 text-center">
            <CalendarDays className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-600">No hay partidos próximos</p>
            <button 
              onClick={() => navigate('/calendar')}
              className="mt-2 text-blue-600 text-sm font-medium"
            >
              Ver calendario completo
            </button>
          </div>
        )}
      </div>

      {/* Sección 2: Estadísticas Personales */}
      <div className="px-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-gray-900 flex items-center">
            <BarChart3 className="w-5 h-5 mr-2 text-green-500" />
            Mis Estadísticas
          </h2>
          <button 
            onClick={() => navigate('/stats')}
            className="text-sm text-blue-600 font-medium flex items-center"
          >
            Detalles
            <ChevronRight className="w-4 h-4 ml-1" />
          </button>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          {playerStats.map((stat, index) => (
            <div 
              key={index}
              className="bg-white rounded-xl shadow-sm p-4 border border-gray-100"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 mb-1">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
                <div className={`${stat.color} p-3 rounded-full`}>
                  {stat.icon === 'CalendarDays' && <CalendarDays className="w-6 h-6 text-white" />}
                  {stat.icon === 'Target' && <Target className="w-6 h-6 text-white" />}
                  {stat.icon === 'Users' && <Users className="w-6 h-6 text-white" />}
                  {stat.icon === 'AlertCircle' && <AlertCircle className="w-6 h-6 text-white" />}
                </div>
              </div>
              
              {stat.change !== undefined && (
                <div className="flex items-center mt-2">
                  {stat.change > 0 ? (
                    <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                  ) : stat.change < 0 ? (
                    <TrendingUp className="w-4 h-4 text-red-500 mr-1 rotate-180" />
                  ) : null}
                  <span className={`text-xs font-medium ${
                    stat.change > 0 ? 'text-green-600' : 
                    stat.change < 0 ? 'text-red-600' : 'text-gray-600'
                  }`}>
                    {stat.change > 0 ? '+' : ''}{stat.change} vs última semana
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Resto del componente igual... */}
      {/* (Las secciones 3, 4, 5, 6 se mantienen igual que en el código anterior) */}
      
      {/* Sección 3: Calendario de Partidos */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-gray-900 flex items-center">
            <Calendar className="w-5 h-5 mr-2 text-purple-500" />
            Próximos Partidos
          </h2>
          <button 
            onClick={() => navigate('/calendar')}
            className="text-sm text-blue-600 font-medium flex items-center"
          >
            Calendario completo
            <ChevronRight className="w-4 h-4 ml-1" />
          </button>
        </div>
        
        <div className="space-y-3">
          {upcomingMatches.slice(1, 4).map((match, index) => (
            <div 
              key={index}
              className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 active:scale-[0.99] transition-transform"
              onClick={() => navigate(`/matches/${match.id}`)}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center">
                  <Clock className="w-4 h-4 text-gray-400 mr-2" />
                  <span className="text-sm text-gray-600">
                    {match.time} • {match.fieldName}
                  </span>
                </div>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  match.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                  match.status === 'in_progress' ? 'bg-green-100 text-green-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {match.status === 'scheduled' ? 'Programado' :
                   match.status === 'in_progress' ? 'En vivo' :
                   'Completado'}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center mr-3">
                    <span className="font-bold text-sm">
                      {match.homeTeam.name.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{match.homeTeam.name}</p>
                    <p className="text-xs text-gray-500">Local</p>
                  </div>
                </div>
                
                <div className="text-center">
                  <div className="flex items-center space-x-2">
                    <span className="text-xl font-bold">{match.homeTeam.score || 0}</span>
                    <span className="text-gray-400">-</span>
                    <span className="text-xl font-bold">{match.awayTeam.score || 0}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">VS</p>
                </div>
                
                <div className="flex items-center text-right">
                  <div className="mr-3">
                    <p className="font-medium text-gray-900">{match.awayTeam.name}</p>
                    <p className="text-xs text-gray-500">Visitante</p>
                  </div>
                  <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                    <span className="font-bold text-sm">
                      {match.awayTeam.name.charAt(0)}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="mt-3 pt-3 border-t border-gray-100 flex items-center">
                <MapPin className="w-4 h-4 text-gray-400 mr-2" />
                <span className="text-sm text-gray-600">{match.division} • {match.category}</span>
              </div>
            </div>
          ))}
          
          {upcomingMatches.length === 0 && (
            <div className="text-center py-6">
              <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-600">No hay partidos programados</p>
            </div>
          )}
        </div>
      </div>

      {/* Sección 4: Tabla de Posiciones */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-gray-900 flex items-center">
            <Trophy className="w-5 h-5 mr-2 text-yellow-500" />
            Tabla de Posiciones
          </h2>
          <div className="flex items-center space-x-2">
            <button className="p-2">
              <Filter className="w-4 h-4 text-gray-500" />
            </button>
            <button className="p-2">
              <Download className="w-4 h-4 text-gray-500" />
            </button>
          </div>
        </div>
        
        {teamStandings.length > 0 ? (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Pos
                    </th>
                    <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Equipo
                    </th>
                    <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      PJ
                    </th>
                    <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      PTS
                    </th>
                    <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      GF
                    </th>
                    <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      GC
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {teamStandings.slice(0, 5).map((team, index) => (
                    <tr 
                      key={team.id}
                      className={`hover:bg-gray-50 ${team.id === playerTeam?.id ? 'bg-blue-50' : ''}`}
                    >
                      <td className="py-3 px-4">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          index === 0 ? 'bg-yellow-100 text-yellow-800' :
                          index === 1 ? 'bg-gray-100 text-gray-800' :
                          index === 2 ? 'bg-orange-100 text-orange-800' :
                          'bg-gray-50 text-gray-700'
                        }`}>
                          <span className="font-bold">{index + 1}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center mr-3">
                            <span className="font-bold text-sm">{team.name.charAt(0)}</span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{team.name}</p>
                            <p className="text-xs text-gray-500">{team.wins}W - {team.losses}L</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-gray-900 font-medium">
                        {team.matchesPlayed || 0}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-bold text-gray-900">{team.points || 0}</span>
                      </td>
                      <td className="py-3 px-4 text-green-600 font-medium">
                        {team.goalsFor || 0}
                      </td>
                      <td className="py-3 px-4 text-red-600 font-medium">
                        {team.goalsAgainst || 0}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="p-4 border-t border-gray-100">
              <button 
                onClick={() => navigate('/standings')}
                className="w-full py-2 text-center text-blue-600 font-medium hover:bg-blue-50 rounded-lg transition-colors"
              >
                Ver tabla completa
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-gray-50 rounded-xl p-6 text-center">
            <Trophy className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-600">No hay datos de clasificación disponibles</p>
          </div>
        )}
      </div>

      {/* Sección 5: Acciones Rápidas */}
      <div className="p-4">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Acciones Rápidas</h2>
        <div className="grid grid-cols-2 gap-3">
          <button 
            onClick={() => navigate('/team')}
            className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl p-4 text-center hover:from-blue-600 hover:to-blue-700 transition-all active:scale-[0.98]"
          >
            <Users className="w-6 h-6 mx-auto mb-2" />
            <span className="font-medium">Mi Equipo</span>
          </button>
          
          <button 
            onClick={() => navigate('/calendar')}
            className="bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl p-4 text-center hover:from-purple-600 hover:to-purple-700 transition-all active:scale-[0.98]"
          >
            <Calendar className="w-6 h-6 mx-auto mb-2" />
            <span className="font-medium">Calendario</span>
          </button>
          
          <button 
            onClick={() => navigate('/stats')}
            className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl p-4 text-center hover:from-green-600 hover:to-green-700 transition-all active:scale-[0.98]"
          >
            <BarChart3 className="w-6 h-6 mx-auto mb-2" />
            <span className="font-medium">Estadísticas</span>
          </button>
          
          <button 
            onClick={() => navigate('/payments')}
            className="bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl p-4 text-center hover:from-orange-600 hover:to-orange-700 transition-all active:scale-[0.98]"
          >
            <Target className="w-6 h-6 mx-auto mb-2" />
            <span className="font-medium">Pagos</span>
          </button>
        </div>
      </div>

      {/* Sección 6: Notificaciones recientes */}
      {notifications.filter(n => !n.read).length > 0 && (
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-gray-900 flex items-center">
              <Bell className="w-5 h-5 mr-2 text-red-500" />
              Notificaciones
              <span className="ml-2 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {notifications.filter(n => !n.read).length}
              </span>
            </h2>
            <button 
              onClick={() => navigate('/notifications')}
              className="text-sm text-blue-600 font-medium"
            >
              Marcar todas como leídas
            </button>
          </div>
          
          <div className="space-y-2">
            {notifications.slice(0, 2).map(notification => (
              <div 
                key={notification.id}
                className={`p-3 rounded-lg border ${notification.read ? 'bg-gray-50 border-gray-200' : 'bg-blue-50 border-blue-200'}`}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="flex items-start">
                  <div className={`p-2 rounded-full mr-3 ${
                    notification.type === 'match' ? 'bg-green-100' :
                    notification.type === 'payment' ? 'bg-yellow-100' :
                    notification.type === 'team' ? 'bg-blue-100' :
                    'bg-gray-100'
                  }`}>
                    {notification.type === 'match' && <Clock className="w-4 h-4 text-green-600" />}
                    {notification.type === 'payment' && <Target className="w-4 h-4 text-yellow-600" />}
                    {notification.type === 'team' && <Users className="w-4 h-4 text-blue-600" />}
                    {notification.type === 'system' && <Bell className="w-4 h-4 text-gray-600" />}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-gray-900">{notification.title}</h4>
                      {!notification.read && (
                        <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(notification.timestamp).toLocaleDateString('es-ES', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
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

export default PlayerDashboard;