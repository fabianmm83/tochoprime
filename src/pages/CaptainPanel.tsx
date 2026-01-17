import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Users,
  Trophy,
  CreditCard,
  Calendar,
  UserPlus,
  Settings,
  ChevronRight,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  DollarSign,
  FileText,
  Shield,
  BarChart3,
  MessageSquare,
  Bell,
  UserCheck,
  Mail,
  Phone,
  MapPin
} from 'lucide-react';
import MatchCard from '../components/cards/MatchCard';
import {
  Team,
  Player,
  Match,
  MobileTeamMember,
  MobilePayment,
  MatchCardData,
  adaptMatchToCardData,
  adaptPlayerToMobileMember
} from '../types';
import {
  getPlayerTeam,
  playersService,
  teamsService,
  getPlayerMatches,
  matchesService
} from '../services/firestore';

const CaptainPanel: React.FC = () => {
  const { userData } = useAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [team, setTeam] = useState<Team | null>(null);
  const [teamMembers, setTeamMembers] = useState<MobileTeamMember[]>([]);
  const [upcomingMatches, setUpcomingMatches] = useState<MatchCardData[]>([]);
  const [pendingPayments, setPendingPayments] = useState<MobilePayment[]>([]);
  const [pendingApplications, setPendingApplications] = useState<Player[]>([]);
  const [teamStats, setTeamStats] = useState({
    matchesPlayed: 0,
    wins: 0,
    losses: 0,
    draws: 0,
    points: 0,
    position: 0
  });

  useEffect(() => {
    const loadCaptainData = async () => {
      if (!userData?.uid) return;
      
      setLoading(true);
      try {
        // Obtener equipo del capitán
        const captainTeam = await getPlayerTeam(userData.uid);
        setTeam(captainTeam);
        
        if (captainTeam) {
          // Obtener jugadores del equipo
          const players = await playersService.getPlayersByTeam(captainTeam.id);
          const members = players.map(player => adaptPlayerToMobileMember(player));
          setTeamMembers(members);
          
          // Obtener partidos del equipo
          const teamMatches = await matchesService.getMatchesByTeam(captainTeam.id);
          const futureMatches = teamMatches
            .filter(match => new Date(match.matchDate) >= new Date())
            .slice(0, 3);
          
          const matchCards = futureMatches.map(match => 
            adaptMatchToCardData(match, captainTeam, undefined)
          );
          setUpcomingMatches(matchCards);
          
          // Actualizar estadísticas del equipo
          if (captainTeam.stats) {
            setTeamStats({
              matchesPlayed: captainTeam.stats.matchesPlayed || 0,
              wins: captainTeam.stats.wins || 0,
              losses: captainTeam.stats.losses || 0,
              draws: captainTeam.stats.draws || 0,
              points: captainTeam.stats.points || 0,
              position: 0 // Esto vendría de una consulta de clasificación
            });
          }
          
          // Simular pagos pendientes
          const mockPayments: MobilePayment[] = [
            {
              id: '1',
              teamName: captainTeam.name,
              amount: 2500,
              dueDate: new Date(Date.now() + 7 * 86400000),
              status: 'pending',
              invoiceNumber: 'INV-2024-001',
              isOverdue: false
            },
            {
              id: '2',
              teamName: captainTeam.name,
              amount: 1200,
              dueDate: new Date(Date.now() - 3 * 86400000),
              status: 'overdue',
              invoiceNumber: 'INV-2024-002',
              isOverdue: true
            }
          ];
          setPendingPayments(mockPayments);
          
          // Simular solicitudes pendientes
          const pendingPlayers = players.filter(p => p.status === 'pending');
          setPendingApplications(pendingPlayers.slice(0, 3));
        }
        
      } catch (error) {
        console.error('Error cargando datos del capitán:', error);
      } finally {
        setLoading(false);
      }
    };

    loadCaptainData();
  }, [userData?.uid]);

  const handleAcceptPlayer = async (playerId: string) => {
    try {
      await playersService.updatePlayerStatus(playerId, 'active');
      setPendingApplications(prev => prev.filter(p => p.id !== playerId));
      alert('Jugador aceptado exitosamente');
    } catch (error) {
      console.error('Error aceptando jugador:', error);
      alert('Error al aceptar jugador');
    }
  };

  const handleRejectPlayer = async (playerId: string) => {
    try {
      await playersService.updatePlayerStatus(playerId, 'inactive');
      setPendingApplications(prev => prev.filter(p => p.id !== playerId));
      alert('Jugador rechazado');
    } catch (error) {
      console.error('Error rechazando jugador:', error);
      alert('Error al rechazar jugador');
    }
  };

  const handleMakePayment = (paymentId: string) => {
    // Aquí iría la integración con el sistema de pagos
    alert(`Procesando pago ${paymentId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white pb-20">
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
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white pb-20">
      {/* Header del capitán */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Panel del Capitán</h1>
            <div className="flex items-center mt-1">
              <Shield className="w-4 h-4 mr-1" />
              <span className="text-sm opacity-90">
                {team?.name || 'Sin equipo'} • Capitán
              </span>
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-sm opacity-90">{team?.playerCount || 0} jugadores</div>
            <div className="text-xs opacity-75">Categoría {team?.categoryId || 'N/A'}</div>
          </div>
        </div>
      </div>

      {/* Estadísticas del equipo */}
      <div className="p-4">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 mb-1">Partidos</p>
                <p className="text-2xl font-bold text-gray-900">{teamStats.matchesPlayed}</p>
              </div>
              <div className="p-2 bg-blue-100 rounded-full">
                <Trophy className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <div className="text-xs text-gray-600 mt-2">
              {teamStats.wins}W {teamStats.draws}D {teamStats.losses}L
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 mb-1">Puntos</p>
                <p className="text-2xl font-bold text-gray-900">{teamStats.points}</p>
              </div>
              <div className="p-2 bg-green-100 rounded-full">
                <BarChart3 className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <div className="text-xs text-gray-600 mt-2">Posición: #{teamStats.position || 'N/A'}</div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 mb-1">Jugadores</p>
                <p className="text-2xl font-bold text-gray-900">{teamMembers.length}</p>
              </div>
              <div className="p-2 bg-purple-100 rounded-full">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <div className="text-xs text-gray-600 mt-2">
              {teamMembers.filter(m => m.status === 'active').length} activos
            </div>
          </div>
        </div>
      </div>

      {/* Pagos pendientes */}
      {pendingPayments.length > 0 && (
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-gray-900 flex items-center">
              <CreditCard className="w-5 h-5 mr-2 text-red-500" />
              Pagos Pendientes
            </h2>
            <button 
              onClick={() => navigate('/payments')}
              className="text-sm text-blue-600 font-medium flex items-center"
            >
              Ver todos
              <ChevronRight className="w-4 h-4 ml-1" />
            </button>
          </div>
          
          <div className="space-y-3">
            {pendingPayments.map((payment, index) => (
              <div 
                key={index}
                className={`bg-white rounded-xl shadow-sm border ${
                  payment.isOverdue 
                    ? 'border-red-200 bg-red-50' 
                    : 'border-yellow-200 bg-yellow-50'
                } p-4`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h3 className="font-semibold text-gray-900">{payment.teamName}</h3>
                    <p className="text-sm text-gray-600">Factura: {payment.invoiceNumber}</p>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                    payment.status === 'overdue' 
                      ? 'bg-red-100 text-red-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {payment.status === 'overdue' ? 'VENCIDO' : 'PENDIENTE'}
                  </div>
                </div>
                
                <div className="flex items-center justify-between mt-3">
                  <div>
                    <p className="text-2xl font-bold text-gray-900">
                      ${payment.amount.toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-600">
                      Vence: {new Date(payment.dueDate).toLocaleDateString()}
                    </p>
                  </div>
                  
                  <button
                    onClick={() => handleMakePayment(payment.id)}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center"
                  >
                    <DollarSign className="w-4 h-4 mr-2" />
                    Pagar
                  </button>
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
          <div className="bg-gray-50 rounded-xl p-6 text-center">
            <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-600">No hay partidos próximos</p>
          </div>
        )}
      </div>

      {/* Jugadores del equipo */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-gray-900 flex items-center">
            <Users className="w-5 h-5 mr-2 text-purple-500" />
            Jugadores del Equipo
            <span className="ml-2 bg-gray-100 text-gray-800 text-xs font-medium px-2 py-1 rounded-full">
              {teamMembers.length}
            </span>
          </h2>
          <button 
            onClick={() => navigate(`/team/${team?.id}/players`)}
            className="text-sm text-blue-600 font-medium flex items-center"
          >
            Gestionar
            <ChevronRight className="w-4 h-4 ml-1" />
          </button>
        </div>
        
        <div className="space-y-2">
          {teamMembers.slice(0, 5).map((member, index) => (
            <div 
              key={index}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 flex items-center justify-between hover:bg-gray-50"
            >
              <div className="flex items-center">
                <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center mr-3">
                  <span className="font-bold text-gray-700">
                    {member.name.split(' ').map(n => n[0]).join('')}
                  </span>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">{member.name}</h4>
                  <div className="flex items-center text-xs text-gray-600 mt-1">
                    <span className="bg-gray-100 px-2 py-1 rounded mr-2">#{member.number}</span>
                    <span>{member.position}</span>
                    {member.isCaptain && (
                      <span className="ml-2 bg-yellow-100 text-yellow-800 px-2 py-1 rounded">C</span>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="text-right">
                <span className={`text-xs px-2 py-1 rounded-full ${
                  member.status === 'active' ? 'bg-green-100 text-green-800' :
                  member.status === 'injured' ? 'bg-red-100 text-red-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {member.status === 'active' ? 'Activo' :
                   member.status === 'injured' ? 'Lesionado' : 'Inactivo'}
                </span>
                <div className="text-xs text-gray-600 mt-1">
                  {member.stats?.touchdowns || 0} touchdowns
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Solicitudes de inscripción pendientes */}
      {pendingApplications.length > 0 && (
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-gray-900 flex items-center">
              <UserPlus className="w-5 h-5 mr-2 text-orange-500" />
              Solicitudes Pendientes
              <span className="ml-2 bg-orange-100 text-orange-800 text-xs font-medium px-2 py-1 rounded-full">
                {pendingApplications.length}
              </span>
            </h2>
          </div>
          
          <div className="space-y-3">
            {pendingApplications.map((player, index) => (
              <div 
                key={index}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-4"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mr-3">
                      <span className="font-bold text-gray-700">
                        {player.name.charAt(0)}{player.lastName?.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {player.name} {player.lastName}
                      </h3>
                      <div className="flex items-center text-sm text-gray-600 mt-1">
                        <Mail className="w-3 h-3 mr-1" />
                        <span>{player.email}</span>
                      </div>
                      {player.phone && (
                        <div className="flex items-center text-sm text-gray-600 mt-1">
                          <Phone className="w-3 h-3 mr-1" />
                          <span>{player.phone}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="bg-gray-100 px-2 py-1 rounded text-sm font-medium">
                      #{player.number} • {player.position}
                    </div>
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleAcceptPlayer(player.id)}
                    className="flex-1 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Aceptar
                  </button>
                  <button
                    onClick={() => handleRejectPlayer(player.id)}
                    className="flex-1 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center justify-center"
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Rechazar
                  </button>
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
            onClick={() => navigate(`/team/${team?.id}/edit`)}
            className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl p-4 text-center hover:from-blue-600 hover:to-blue-700 transition-all active:scale-[0.98]"
          >
            <Settings className="w-6 h-6 mx-auto mb-2" />
            <span className="font-medium">Gestionar Equipo</span>
          </button>
          
          <button
            onClick={() => navigate('/team/players/new')}
            className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl p-4 text-center hover:from-green-600 hover:to-green-700 transition-all active:scale-[0.98]"
          >
            <UserPlus className="w-6 h-6 mx-auto mb-2" />
            <span className="font-medium">Agregar Jugador</span>
          </button>
          
          <button
            onClick={() => navigate('/payments')}
            className="bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl p-4 text-center hover:from-purple-600 hover:to-purple-700 transition-all active:scale-[0.98]"
          >
            <CreditCard className="w-6 h-6 mx-auto mb-2" />
            <span className="font-medium">Pagos</span>
          </button>
          
          <button
            onClick={() => navigate('/team/schedule')}
            className="bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl p-4 text-center hover:from-orange-600 hover:to-orange-700 transition-all active:scale-[0.98]"
          >
            <Calendar className="w-6 h-6 mx-auto mb-2" />
            <span className="font-medium">Calendario</span>
          </button>
        </div>
      </div>

      {/* Información del equipo */}
      {team && (
        <div className="p-4">
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 rounded-xl p-4">
            <h3 className="font-bold text-gray-900 mb-2">Información del Equipo</h3>
            <div className="space-y-2">
              <div className="flex items-center text-sm text-gray-700">
                <Shield className="w-4 h-4 text-gray-500 mr-2" />
                <span>Estado: </span>
                <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                  team.status === 'active' ? 'bg-green-100 text-green-800' :
                  team.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {team.status === 'active' ? 'Activo' :
                   team.status === 'pending' ? 'Pendiente' : 'Suspendido'}
                </span>
              </div>
              
              <div className="flex items-center text-sm text-gray-700">
                <CreditCard className="w-4 h-4 text-gray-500 mr-2" />
                <span>Pago: </span>
                <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                  team.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' :
                  team.paymentStatus === 'partial' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {team.paymentStatus === 'paid' ? 'Pagado' :
                   team.paymentStatus === 'partial' ? 'Parcial' : 'Pendiente'}
                </span>
              </div>
              
              <div className="flex items-center text-sm text-gray-700">
                <Calendar className="w-4 h-4 text-gray-500 mr-2" />
                <span>Registro: {new Date(team.registrationDate).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CaptainPanel;

