import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  teamsService, 
  playersService,
  categoriesService,
  divisionsService,
  seasonsService,
  paymentsService,
  matchesService
} from '../services/firestore';
import { Team, Player, Category, Division, Season, Payment, Match } from '../types';
import {
  ArrowLeftIcon,
  TrophyIcon,
  UserGroupIcon,
  PencilIcon,
  TrashIcon,
  PlusIcon,
  UserCircleIcon,
  PhoneIcon,
  EnvelopeIcon,
  CalendarIcon,
  ShieldCheckIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  IdentificationIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ChevronRightIcon,
  BanknotesIcon,
  DocumentPlusIcon,
  EyeIcon,
  FunnelIcon,
} from '@heroicons/react/24/outline';
import Modal from '../components/common/Modal';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Notification from '../components/common/Notification';

const TeamDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [team, setTeam] = useState<Team | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [category, setCategory] = useState<Category | null>(null);
  const [division, setDivision] = useState<Division | null>(null);
  const [season, setSeason] = useState<Season | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddPlayerModal, setShowAddPlayerModal] = useState(false);
  const [showEditTeamModal, setShowEditTeamModal] = useState(false);
  const [showPaymentHistoryModal, setShowPaymentHistoryModal] = useState(false);
  const [showAddPaymentModal, setShowAddPaymentModal] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  const [newPlayer, setNewPlayer] = useState({
    name: '',
    number: 1,
    position: 'quarterback' as Player['position'],
    phone: '',
    email: '',
    dateOfBirth: '',
    emergencyContact: {
      name: '',
      phone: '',
      relationship: ''
    },
    status: 'pending' as Player['status'],
  });

  const [newPayment, setNewPayment] = useState({
    amount: 0,
    date: new Date().toISOString().split('T')[0],
    method: 'cash' as Payment['method'],
    reference: '',
    notes: '',
    status: 'paid' as Payment['status']
  });

  const [editTeamData, setEditTeamData] = useState({
    name: '',
    shortName: '',
    primaryColor: '#3b82f6',
    secondaryColor: '#f3f4f6',
    coach: {
      name: '',
      phone: '',
      email: ''
    },
    notes: '',
  });

  useEffect(() => {
    if (id) {
      fetchData(id);
    } else {
      navigate('/teams');
    }
  }, [id, navigate]);

  const fetchData = async (teamId: string) => {
    try {
      setLoading(true);
      
      // Obtener equipo
      const teamData = await teamsService.getTeamById(teamId);
      if (!teamData) {
        navigate('/teams');
        return;
      }
      setTeam(teamData);
      
      // Inicializar datos de edición
      setEditTeamData({
        name: teamData.name,
        shortName: teamData.shortName || '',
        primaryColor: teamData.primaryColor || '#3b82f6',
        secondaryColor: teamData.secondaryColor || '#f3f4f6',
        coach: {
          name: teamData.coach?.name || '',
          phone: teamData.coach?.phone || '',
          email: teamData.coach?.email || ''
        },
        notes: teamData.notes || '',
      });
      
      // Obtener jugadores
      const playersData = await playersService.getPlayersByTeam(teamId);
      setPlayers(playersData.sort((a, b) => a.number - b.number));
      
      // Obtener pagos
      const paymentsData = await paymentsService.getPaymentsByTeam(teamId);
      setPayments(paymentsData);
      
      // Obtener partidos
      const matchesData = await matchesService.getMatchesByTeam(teamId);
      // Filtrar solo partidos completados
      const completedMatches = matchesData.filter(match => match.status === 'completed');
      setMatches(completedMatches.slice(0, 5)); // Últimos 5 partidos
      
      // Obtener categoría
      if (teamData.categoryId) {
        const categoryData = await categoriesService.getCategoryById(teamData.categoryId);
        setCategory(categoryData);
        
        if (categoryData) {
          // Obtener división
          if (categoryData.divisionId) {
            const divisionData = await divisionsService.getDivisionById(categoryData.divisionId);
            setDivision(divisionData);
          }
          
          // Obtener temporada
          if (categoryData.seasonId) {
            const seasonData = await seasonsService.getSeasonById(categoryData.seasonId);
            setSeason(seasonData);
          }
        }
      }
      
    } catch (error) {
      console.error('Error fetching team data:', error);
      setNotification({ type: 'error', message: 'Error al cargar los datos del equipo' });
    } finally {
      setLoading(false);
    }
  };

  const handleAddPlayer = async () => {
    if (!team) return;

    try {
      // Preparar datos del jugador
      const playerData = {
        name: newPlayer.name,
        lastName: '', // Ya no se usa apellido
        number: newPlayer.number,
        position: newPlayer.position,
        email: newPlayer.email,
        phone: newPlayer.phone,
        teamId: team.id,
        dateOfBirth: newPlayer.dateOfBirth ? new Date(newPlayer.dateOfBirth).toISOString() : null,
        registrationDate: new Date().toISOString(),
        emergencyContact: newPlayer.emergencyContact,
        status: newPlayer.status,
        isCaptain: false,
        isViceCaptain: false,
      };

      await playersService.createPlayer(playerData);
      
      setNotification({ type: 'success', message: 'Jugador agregado exitosamente' });
      setShowAddPlayerModal(false);
      resetNewPlayerForm();
      fetchData(team.id);
    } catch (error) {
      console.error('Error adding player:', error);
      setNotification({ type: 'error', message: 'Error al agregar el jugador' });
    }
  };

  const handleAddPayment = async () => {
    if (!team) return;

    try {
      const paymentData: Omit<Payment, 'id' | 'createdAt' | 'updatedAt'> = {
        teamId: team.id,
        seasonId: team.seasonId,
        amount: newPayment.amount,
        date: new Date(newPayment.date),
        method: newPayment.method || 'cash',
        reference: newPayment.reference || '',
        notes: newPayment.notes || '',
        status: newPayment.status,
        ...(newPayment.status === 'paid' && { paidDate: new Date() }),
        invoiceNumber: '',
        createdBy: 'admin'
      };

      await paymentsService.createPayment(paymentData);
      
      // Actualizar estado de pago del equipo
      let newPaymentStatus: Team['paymentStatus'] = 'pending';
      const categoryPrice = category?.price || 0;
      const totalPayments = payments.reduce((sum, p) => sum + p.amount, 0) + newPayment.amount;
      
      if (totalPayments >= categoryPrice) {
        newPaymentStatus = 'paid';
      } else if (totalPayments > 0) {
        newPaymentStatus = 'partial';
      }
      
      await teamsService.updatePaymentStatus(team.id, newPaymentStatus);
      
      setNotification({ type: 'success', message: 'Pago registrado exitosamente' });
      setShowAddPaymentModal(false);
      resetPaymentForm();
      fetchData(team.id);
    } catch (error) {
      console.error('Error adding payment:', error);
      setNotification({ type: 'error', message: 'Error al registrar el pago' });
    }
  };

  const handleUpdateTeam = async () => {
    if (!team) return;

    try {
      await teamsService.updateTeam(team.id, {
        name: editTeamData.name,
        shortName: editTeamData.shortName,
        primaryColor: editTeamData.primaryColor,
        secondaryColor: editTeamData.secondaryColor,
        coach: editTeamData.coach,
        notes: editTeamData.notes,
      });
      
      setNotification({ type: 'success', message: 'Equipo actualizado exitosamente' });
      setShowEditTeamModal(false);
      fetchData(team.id);
    } catch (error) {
      console.error('Error updating team:', error);
      setNotification({ type: 'error', message: 'Error al actualizar el equipo' });
    }
  };

  const handleDeletePlayer = async (playerId: string, playerName: string) => {
    if (window.confirm(`¿Estás seguro de que deseas eliminar a ${playerName}?`)) {
      try {
        await playersService.deletePlayer(playerId);
        setNotification({ type: 'success', message: 'Jugador eliminado exitosamente' });
        if (team) fetchData(team.id);
      } catch (error) {
        console.error('Error deleting player:', error);
        setNotification({ type: 'error', message: 'Error al eliminar el jugador' });
      }
    }
  };

  const handleSetCaptain = async (playerId: string) => {
    if (!team) return;

    try {
      await playersService.setTeamCaptain(team.id, playerId);
      setNotification({ type: 'success', message: 'Capitán designado exitosamente' });
      fetchData(team.id);
    } catch (error) {
      console.error('Error setting captain:', error);
      setNotification({ type: 'error', message: 'Error al designar capitán' });
    }
  };

  const resetNewPlayerForm = () => {
    setNewPlayer({
      name: '',
      number: 1,
       position: 'quarterback' as Player['position'],
      phone: '',
      email: '',
      dateOfBirth: '',
      emergencyContact: {
        name: '',
        phone: '',
        relationship: ''
      },
      status: 'pending',
    });
  };

  const resetPaymentForm = () => {
    setNewPayment({
      amount: 0,
      date: new Date().toISOString().split('T')[0],
      method: 'cash',
      reference: '',
      notes: '',
      status: 'paid'
    });
  };

  const getPositionColor = (position: Player['position']) => {
    switch (position) {
      case 'quarterback': return 'bg-red-100 text-red-800';
      case 'runningback': return 'bg-orange-100 text-orange-800';
      case 'wide_receiver': return 'bg-blue-100 text-blue-800';
      case 'cornerback': return 'bg-indigo-100 text-indigo-800';
      case 'safety': return 'bg-teal-100 text-teal-800';
      case 'linebacker': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPositionLabel = (position: Player['position']) => {
    switch (position) {
      case 'quarterback': return 'QB';
      case 'runningback': return 'RB';
      case 'wide_receiver': return 'WR';
      case 'cornerback': return 'CB';
      case 'safety': return 'SF';
      case 'linebacker': return 'LB';
      default: return position;
    }
  };

  const getPlayerStatusColor = (status: Player['status']) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'suspended': return 'bg-red-100 text-red-800';
      case 'injured': return 'bg-orange-100 text-orange-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTeamStatusColor = (status: Team['status']) => {
    switch (status) {
      case 'approved':
      case 'active': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'suspended': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const calculateTeamRecord = () => {
    if (!team?.stats) return { wins: 0, draws: 0, losses: 0 };
    
    return {
      wins: team.stats.wins || 0,
      draws: team.stats.draws || 0,
      losses: team.stats.losses || 0
    };
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!team) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Equipo no encontrado</h2>
          <button
            onClick={() => navigate('/teams')}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <ArrowLeftIcon className="w-5 h-5 mr-2" />
            Volver a Equipos
          </button>
        </div>
      </div>
    );
  }

  const record = calculateTeamRecord();
  const totalGames = record.wins + record.draws + record.losses;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 pt-4 pb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <button
              onClick={() => navigate('/teams')}
              className="mr-3 p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full"
            >
              <ArrowLeftIcon className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center space-x-2">
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: team.primaryColor || '#3b82f6' }}
                />
                <h1 className="text-xl font-bold text-gray-900">{team.name}</h1>
              </div>
              <div className="flex items-center space-x-3 mt-1">
                {season && (
                  <span className="text-sm text-gray-600">{season.name}</span>
                )}
                {division && (
                  <div className="flex items-center">
                    <div
                      className="w-2 h-2 rounded-full mr-1"
                      style={{ backgroundColor: division.color || '#3b82f6' }}
                    />
                    <span className="text-sm text-gray-600">{division.name}</span>
                  </div>
                )}
                {category && (
                  <span className="text-sm text-gray-600">Cat. {category.name}</span>
                )}
              </div>
            </div>
          </div>

          <div className="flex space-x-2">
            <button
              onClick={() => setShowEditTeamModal(true)}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full"
            >
              <PencilIcon className="w-5 h-5" />
            </button>
            <button
              onClick={() => setShowAddPlayerModal(true)}
              className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700"
            >
              <PlusIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Team Status Badges */}
        <div className="flex flex-wrap gap-2 mt-4">
          <span className={`px-3 py-1.5 rounded-full text-sm font-medium ${getTeamStatusColor(team.status)}`}>
            {team.status === 'pending' ? 'Pendiente' :
             team.status === 'approved' ? 'Aprobado' :
             team.status === 'active' ? 'Activo' :
             team.status === 'suspended' ? 'Suspendido' : 'Rechazado'}
          </span>
          <span className={`px-3 py-1.5 rounded-full text-sm font-medium ${
            team.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' :
            team.paymentStatus === 'partial' ? 'bg-blue-100 text-blue-800' :
            team.paymentStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' :
            'bg-red-100 text-red-800'
          }`}>
            {team.paymentStatus === 'paid' ? 'Pagado' :
             team.paymentStatus === 'partial' ? 'Pago Parcial' :
             team.paymentStatus === 'pending' ? 'Pendiente' : 'Vencido'}
          </span>
        </div>
      </div>

      {/* Notification */}
      {notification && (
        <Notification
          type={notification.type}
          message={notification.message}
          onClose={() => setNotification(null)}
        />
      )}

      {/* Main Content */}
      <div className="px-4 pt-6">
        {/* Estadísticas del Equipo */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Record del Equipo</h2>
            <ChartBarIcon className="w-5 h-5 text-gray-400" />
          </div>
          
          <div className="space-y-4">
            {/* Record Principal */}
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <p className="text-2xl font-bold text-green-600">{record.wins}</p>
                <p className="text-xs text-gray-600">Victorias</p>
              </div>
              <div className="text-center p-3 bg-yellow-50 rounded-lg">
                <p className="text-2xl font-bold text-yellow-600">{record.draws}</p>
                <p className="text-xs text-gray-600">Empates</p>
              </div>
              <div className="text-center p-3 bg-red-50 rounded-lg">
                <p className="text-2xl font-bold text-red-600">{record.losses}</p>
                <p className="text-xs text-gray-600">Derrotas</p>
              </div>
            </div>

            {/* Puntos */}
            <div className="grid grid-cols-2 gap-3">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <p className="text-2xl font-bold text-blue-600">{team.stats?.touchdowns || team.stats?.goalsFor || 0}</p>
                <p className="text-xs text-gray-600">Puntos Anotados</p>
              </div>
              <div className="text-center p-3 bg-orange-50 rounded-lg">
                <p className="text-2xl font-bold text-orange-600">{team.stats?.penalties || team.stats?.goalsAgainst || 0}</p>
                <p className="text-xs text-gray-600">Puntos en Contra</p>
              </div>
            </div>

            {/* Totales */}
            <div className="grid grid-cols-2 gap-3">
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-lg font-bold text-gray-800">{totalGames}</p>
                <p className="text-xs text-gray-600">Total Partidos</p>
              </div>
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <p className="text-lg font-bold text-purple-600">{team.stats?.points || 0}</p>
                <p className="text-xs text-gray-600">Puntos Liga</p>
              </div>
            </div>
          </div>
        </div>

        {/* Botones de Acción Rápidos */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <button
            onClick={() => setShowPaymentHistoryModal(true)}
            className="bg-blue-50 border border-blue-200 text-blue-700 rounded-lg p-4 flex flex-col items-center justify-center hover:bg-blue-100 transition-colors"
          >
            <BanknotesIcon className="w-6 h-6 mb-2" />
            <span className="text-sm font-medium">Historial de Pagos</span>
          </button>
          <button
            onClick={() => setShowAddPaymentModal(true)}
            className="bg-green-50 border border-green-200 text-green-700 rounded-lg p-4 flex flex-col items-center justify-center hover:bg-green-100 transition-colors"
          >
            <DocumentPlusIcon className="w-6 h-6 mb-2" />
            <span className="text-sm font-medium">Agregar Pago</span>
          </button>
        </div>

        {/* Información del Equipo */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Información del Equipo</h2>
          
          <div className="space-y-4">
            {team.coach && (
              <div className="flex items-start space-x-3">
                <UserCircleIcon className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900">{team.coach.name || 'Sin entrenador'}</p>
                  <div className="space-y-1 mt-1">
                    {team.coach.phone && (
                      <div className="flex items-center text-sm text-gray-600">
                        <PhoneIcon className="w-4 h-4 mr-2" />
                        {team.coach.phone}
                      </div>
                    )}
                    {team.coach.email && (
                      <div className="flex items-center text-sm text-gray-600">
                        <EnvelopeIcon className="w-4 h-4 mr-2" />
                        {team.coach.email}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
            
            {team.notes && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-1">Notas</h3>
                <p className="text-sm text-gray-600">{team.notes}</p>
              </div>
            )}
            
            {team.registrationDate && (
              <div className="flex items-center text-sm text-gray-600">
                <CalendarIcon className="w-4 h-4 mr-2" />
                Registrado el {new Date(team.registrationDate).toLocaleDateString()}
              </div>
            )}
          </div>
        </div>

        {/* Últimos Partidos */}
        {matches.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Últimos Partidos</h2>
            <div className="space-y-3">
              {matches.map((match) => (
                <div key={match.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {match.homeTeamId === team.id ? 'vs' : '@'} {match.homeTeamId === team.id ? '?' : '?'}
                    </p>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="text-xs text-gray-600">
                        {new Date(match.matchDate).toLocaleDateString()}
                      </span>
                      {match.homeScore !== undefined && match.awayScore !== undefined && (
                        <span className="text-xs font-medium">
                          {match.homeTeamId === team.id ? match.homeScore : match.awayScore} - 
                          {match.homeTeamId === team.id ? match.awayScore : match.homeScore}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    {match.winner === (match.homeTeamId === team.id ? 'home' : 'away') ? (
                      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                        Victoria
                      </span>
                    ) : match.winner === 'draw' ? (
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                        Empate
                      </span>
                    ) : (
                      <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
                        Derrota
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Roster - Lista de Jugadores */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <UserGroupIcon className="w-5 h-5 text-gray-400" />
              <h2 className="text-lg font-semibold text-gray-900">Roster ({players.length})</h2>
            </div>
            <button
              onClick={() => setShowAddPlayerModal(true)}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              + Agregar
            </button>
          </div>
          
          <div className="space-y-3">
            {players.map((player) => (
              <div
                key={player.id}
                className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <span className="font-bold text-blue-600">{player.number}</span>
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <p className="font-medium text-gray-900">
                        {player.name}
                      </p>
                      {player.isCaptain && (
                        <ShieldCheckIcon className="w-4 h-4 text-yellow-600" title="Capitán" />
                      )}
                    </div>
                    <div className="flex items-center space-x-2 mt-1">
                      {player.position && (
                        <span className={`px-2 py-0.5 rounded-full text-xs ${getPositionColor(player.position)}`}>
                          {getPositionLabel(player.position)}
                        </span>
                      )}
                      <span className={`px-2 py-0.5 rounded-full text-xs ${getPlayerStatusColor(player.status)}`}>
                        {player.status === 'active' ? 'Activo' :
                         player.status === 'pending' ? 'Pendiente' :
                         player.status === 'suspended' ? 'Suspendido' :
                         player.status === 'injured' ? 'Lesionado' : 'Inactivo'}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  {!player.isCaptain && (
                    <button
                      onClick={() => handleSetCaptain(player.id)}
                      className="p-1.5 text-gray-400 hover:text-yellow-600 bg-gray-100 rounded-lg"
                      title="Designar capitán"
                    >
                      <ShieldCheckIcon className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => handleDeletePlayer(player.id, player.name)}
                    className="p-1.5 text-gray-400 hover:text-red-600 bg-gray-100 rounded-lg"
                    title="Eliminar"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
            
            {players.length === 0 && (
              <div className="text-center py-8">
                <UserGroupIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 mb-4">No hay jugadores registrados</p>
                <button
                  onClick={() => setShowAddPlayerModal(true)}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  + Agregar primer jugador
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Contacto Rápido */}
        {players.filter(p => p.phone).length > 0 && (
          <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Contacto Rápido</h2>
            <div className="space-y-3">
              {players
                .filter(p => p.phone)
                .slice(0, 3)
                .map((player) => (
                  <div key={player.id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">
                        {player.name}
                      </p>
                      {player.position && (
                        <p className="text-sm text-gray-600">
                          {getPositionLabel(player.position)}
                        </p>
                      )}
                    </div>
                    <a
                      href={`tel:${player.phone}`}
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                      {player.phone}
                    </a>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>

      {/* Add Player Modal - SIMPLIFICADO */}
      <Modal
        isOpen={showAddPlayerModal}
        onClose={() => {
          setShowAddPlayerModal(false);
          resetNewPlayerForm();
        }}
        title="Agregar Nuevo Jugador"
        size="full"
      >
        <div className="space-y-4 px-4 pb-20">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre *
            </label>
            <input
              type="text"
              value={newPlayer.name}
              onChange={(e) => setNewPlayer({ ...newPlayer, name: e.target.value })}
              className="w-full px-4 py-3 bg-gray-100 border-none rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="Ej: Juan"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Número *
              </label>
              <input
                type="number"
                value={newPlayer.number}
                onChange={(e) => setNewPlayer({ ...newPlayer, number: parseInt(e.target.value) || 1 })}
                className="w-full px-4 py-3 bg-gray-100 border-none rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                min="1"
                max="99"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Posición
              </label>
              <select
                value={newPlayer.position}
                onChange={(e) => setNewPlayer({ ...newPlayer, position: e.target.value as Player['position'] })}
                className="w-full px-4 py-3 bg-gray-100 border-none rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="">Seleccionar...</option>
                <option value="quarterback">QB - Quarterback</option>
                <option value="runningback">RB - Running Back</option>
                <option value="wide_receiver">WR - Wide Receiver</option>
                <option value="cornerback">CB - Cornerback</option>
                <option value="safety">SF - Safety</option>
                <option value="linebacker">LB - Linebacker</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Teléfono
            </label>
            <input
              type="tel"
              value={newPlayer.phone}
              onChange={(e) => setNewPlayer({ ...newPlayer, phone: e.target.value })}
              className="w-full px-4 py-3 bg-gray-100 border-none rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="Opcional"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={newPlayer.email}
              onChange={(e) => setNewPlayer({ ...newPlayer, email: e.target.value })}
              className="w-full px-4 py-3 bg-gray-100 border-none rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="Opcional"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fecha de Nacimiento
            </label>
            <input
              type="date"
              value={newPlayer.dateOfBirth}
              onChange={(e) => setNewPlayer({ ...newPlayer, dateOfBirth: e.target.value })}
              className="w-full px-4 py-3 bg-gray-100 border-none rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div className="border-t pt-4">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Contacto de Emergencia (Opcional)</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre
                </label>
                <input
                  type="text"
                  value={newPlayer.emergencyContact.name}
                  onChange={(e) => setNewPlayer({
                    ...newPlayer,
                    emergencyContact: { ...newPlayer.emergencyContact, name: e.target.value }
                  })}
                  className="w-full px-4 py-3 bg-gray-100 border-none rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Teléfono
                </label>
                <input
                  type="tel"
                  value={newPlayer.emergencyContact.phone}
                  onChange={(e) => setNewPlayer({
                    ...newPlayer,
                    emergencyContact: { ...newPlayer.emergencyContact, phone: e.target.value }
                  })}
                  className="w-full px-4 py-3 bg-gray-100 border-none rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Parentesco
                </label>
                <input
                  type="text"
                  value={newPlayer.emergencyContact.relationship}
                  onChange={(e) => setNewPlayer({
                    ...newPlayer,
                    emergencyContact: { ...newPlayer.emergencyContact, relationship: e.target.value }
                  })}
                  className="w-full px-4 py-3 bg-gray-100 border-none rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="Ej: Padre, Madre, Esposo/a"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Estado Inicial
            </label>
            <select
              value={newPlayer.status}
              onChange={(e) => setNewPlayer({ ...newPlayer, status: e.target.value as Player['status'] })}
              className="w-full px-4 py-3 bg-gray-100 border-none rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="pending">Pendiente</option>
              <option value="active">Activo</option>
              <option value="injured">Lesionado</option>
            </select>
          </div>

          <div className="flex space-x-3 pt-6 pb-4">
            <button
              onClick={() => {
                setShowAddPlayerModal(false);
                resetNewPlayerForm();
              }}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors font-medium"
            >
              Cancelar
            </button>
            <button
              onClick={handleAddPlayer}
              disabled={!newPlayer.name}
              className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Agregar Jugador
            </button>
          </div>
        </div>
      </Modal>

      {/* Payment History Modal */}
      <Modal
        isOpen={showPaymentHistoryModal}
        onClose={() => setShowPaymentHistoryModal(false)}
        title="Historial de Pagos"
        size="lg"
      >
        {team && (
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">{team.name}</h3>
                  <p className="text-sm text-gray-600">
                    Total pagado: <span className="font-bold text-green-600">
                      ${payments.reduce((sum, p) => sum + p.amount, 0).toLocaleString()}
                    </span>
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowPaymentHistoryModal(false);
                    setShowAddPaymentModal(true);
                  }}
                  className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <DocumentPlusIcon className="w-5 h-5 mr-2" />
                  Agregar Pago
                </button>
              </div>
            </div>

            {payments.length === 0 ? (
              <div className="text-center py-8">
                <BanknotesIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-600 mb-2">No hay pagos registrados</p>
                <p className="text-sm text-gray-500">Registra el primer pago para este equipo</p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="font-medium text-gray-900">Pagos realizados</h4>
                  <span className="text-sm text-gray-600">
                    Total: ${payments.reduce((sum, p) => sum + p.amount, 0).toLocaleString()}
                  </span>
                </div>
                
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {payments.map((payment) => (
                    <div key={payment.id} className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-gray-900">
                            ${payment.amount.toLocaleString()}
                          </p>
                          <div className="flex items-center space-x-2 mt-1">
                            <span className="text-xs text-gray-600">
                              {new Date(payment.date).toLocaleDateString()}
                            </span>
                            <span className={`px-2 py-0.5 rounded-full text-xs ${
                              payment.status === 'paid' ? 'bg-green-100 text-green-800' :
                              payment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {payment.status === 'paid' ? 'Pagado' :
                               payment.status === 'pending' ? 'Pendiente' : 'Cancelado'}
                            </span>
                          </div>
                          {payment.method && (
                            <p className="text-xs text-gray-600 mt-1">
                              Método: {payment.method === 'cash' ? 'Efectivo' :
                                       payment.method === 'transfer' ? 'Transferencia' :
                                       payment.method === 'card' ? 'Tarjeta' : 'Cheque'}
                            </p>
                          )}
                          {payment.reference && (
                            <p className="text-xs text-gray-500 mt-1">
                              Ref: {payment.reference}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          {payment.notes && (
                            <p className="text-xs text-gray-600 max-w-xs text-right">
                              {payment.notes}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Add Payment Modal */}
      <Modal
        isOpen={showAddPaymentModal}
        onClose={() => {
          setShowAddPaymentModal(false);
          resetPaymentForm();
        }}
        title="Agregar Pago"
        size="md"
      >
        {team && (
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">{team.name}</h3>
                  <p className="text-sm text-gray-600">Registrar nuevo pago</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Total pagado:</p>
                  <p className="text-lg font-bold text-green-600">
                    ${payments.reduce((sum, p) => sum + p.amount, 0).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Monto *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                <input
                  type="number"
                  value={newPayment.amount}
                  onChange={(e) => setNewPayment({ ...newPayment, amount: parseFloat(e.target.value) || 0 })}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  min="0"
                  step="0.01"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha *
                </label>
                <input
                  type="date"
                  value={newPayment.date}
                  onChange={(e) => setNewPayment({ ...newPayment, date: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Método *
                </label>
                <select
                  value={newPayment.method}
                  onChange={(e) => setNewPayment({ ...newPayment, method: e.target.value as Payment['method'] })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="cash">Efectivo</option>
                  <option value="transfer">Transferencia</option>
                  <option value="card">Tarjeta</option>
                  <option value="check">Cheque</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Referencia (Opcional)
              </label>
              <input
                type="text"
                value={newPayment.reference}
                onChange={(e) => setNewPayment({ ...newPayment, reference: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Número de transacción, cheque, etc."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notas (Opcional)
              </label>
              <textarea
                value={newPayment.notes}
                onChange={(e) => setNewPayment({ ...newPayment, notes: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={2}
                placeholder="Observaciones sobre el pago..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Estado del Pago *
              </label>
              <select
                value={newPayment.status}
                onChange={(e) => setNewPayment({ ...newPayment, status: e.target.value as Payment['status'] })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="pending">Pendiente</option>
                <option value="paid">Pagado</option>
                <option value="cancelled">Cancelado</option>
                <option value="refunded">Reembolsado</option>
                <option value="overdue">Vencido</option>
              </select>
            </div>

            <div className="flex space-x-3 pt-4">
              <button
                onClick={() => {
                  setShowAddPaymentModal(false);
                  resetPaymentForm();
                }}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleAddPayment}
                disabled={newPayment.amount <= 0}
                className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Registrar Pago
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Edit Team Modal */}
      <Modal
        isOpen={showEditTeamModal}
        onClose={() => setShowEditTeamModal(false)}
        title="Editar Equipo"
        size="full"
      >
        {team && (
          <div className="space-y-4 px-4 pb-20">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre del Equipo *
                </label>
                <input
                  type="text"
                  value={editTeamData.name}
                  onChange={(e) => setEditTeamData({ ...editTeamData, name: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-100 border-none rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre Corto
                </label>
                <input
                  type="text"
                  value={editTeamData.shortName}
                  onChange={(e) => setEditTeamData({ ...editTeamData, shortName: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-100 border-none rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  maxLength={10}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Color Primario
                </label>
                <div className="flex items-center space-x-3">
                  <input
                    type="color"
                    value={editTeamData.primaryColor}
                    onChange={(e) => setEditTeamData({ ...editTeamData, primaryColor: e.target.value })}
                    className="w-12 h-12 cursor-pointer rounded-lg"
                  />
                  <span className="text-sm text-gray-600">
                    {editTeamData.primaryColor}
                  </span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Color Secundario
                </label>
                <div className="flex items-center space-x-3">
                  <input
                    type="color"
                    value={editTeamData.secondaryColor}
                    onChange={(e) => setEditTeamData({ ...editTeamData, secondaryColor: e.target.value })}
                    className="w-12 h-12 cursor-pointer rounded-lg"
                  />
                  <span className="text-sm text-gray-600">
                    {editTeamData.secondaryColor}
                  </span>
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Entrenador</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre
                  </label>
                  <input
                    type="text"
                    value={editTeamData.coach.name}
                    onChange={(e) => setEditTeamData({
                      ...editTeamData,
                      coach: { ...editTeamData.coach, name: e.target.value }
                    })}
                    className="w-full px-4 py-3 bg-gray-100 border-none rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Teléfono
                  </label>
                  <input
                    type="tel"
                    value={editTeamData.coach.phone}
                    onChange={(e) => setEditTeamData({
                      ...editTeamData,
                      coach: { ...editTeamData.coach, phone: e.target.value }
                    })}
                    className="w-full px-4 py-3 bg-gray-100 border-none rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={editTeamData.coach.email}
                    onChange={(e) => setEditTeamData({
                      ...editTeamData,
                      coach: { ...editTeamData.coach, email: e.target.value }
                    })}
                    className="w-full px-4 py-3 bg-gray-100 border-none rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notas
              </label>
              <textarea
                value={editTeamData.notes}
                onChange={(e) => setEditTeamData({ ...editTeamData, notes: e.target.value })}
                className="w-full px-4 py-3 bg-gray-100 border-none rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                rows={3}
              />
            </div>

            <div className="flex space-x-3 pt-6 pb-4">
              <button
                onClick={() => setShowEditTeamModal(false)}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={handleUpdateTeam}
                disabled={!editTeamData.name}
                className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Actualizar Equipo
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default TeamDetail;