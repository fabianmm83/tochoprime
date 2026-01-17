import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  teamsService, 
  playersService,
  categoriesService,
  divisionsService,
  seasonsService 
} from '../services/firestore';
import { Team, Player, Category, Division, Season } from '../types';
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
  const [loading, setLoading] = useState(true);
  const [showAddPlayerModal, setShowAddPlayerModal] = useState(false);
  const [showEditTeamModal, setShowEditTeamModal] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  const [newPlayer, setNewPlayer] = useState({
    name: '',
    lastName: '',
    number: 1,
    position: 'wide_receiver' as Player['position'],
    email: '',
    phone: '',
    dateOfBirth: '',
    emergencyContact: {
      name: '',
      phone: '',
      relationship: ''
    },
    status: 'pending' as Player['status'],
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
        lastName: newPlayer.lastName,
        number: newPlayer.number,
        position: newPlayer.position,
        email: newPlayer.email,
        phone: newPlayer.phone,
        teamId: team.id,
        dateOfBirth: newPlayer.dateOfBirth ? new Date(newPlayer.dateOfBirth).toISOString() : undefined,
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
      lastName: '',
      number: 1,
      position: 'wide_receiver',
      email: '',
      phone: '',
      dateOfBirth: '',
      emergencyContact: {
        name: '',
        phone: '',
        relationship: ''
      },
      status: 'pending',
    });
  };

  const getPositionColor = (position: Player['position']) => {
    switch (position) {
      case 'quarterback': return 'bg-red-100 text-red-800';
      case 'runningback': return 'bg-orange-100 text-orange-800';
      case 'wide_receiver': return 'bg-blue-100 text-blue-800';
      case 'tight_end': return 'bg-green-100 text-green-800';
      case 'offensive_line': return 'bg-yellow-100 text-yellow-800';
      case 'defensive_line': return 'bg-indigo-100 text-indigo-800';
      case 'linebacker': return 'bg-purple-100 text-purple-800';
      case 'cornerback': return 'bg-pink-100 text-pink-800';
      case 'safety': return 'bg-teal-100 text-teal-800';
      case 'kicker': return 'bg-cyan-100 text-cyan-800';
      case 'punter': return 'bg-rose-100 text-rose-800';
      case 'utility': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPositionLabel = (position: Player['position']) => {
    switch (position) {
      case 'quarterback': return 'QB';
      case 'runningback': return 'RB';
      case 'wide_receiver': return 'WR';
      case 'tight_end': return 'TE';
      case 'offensive_line': return 'OL';
      case 'defensive_line': return 'DL';
      case 'linebacker': return 'LB';
      case 'cornerback': return 'CB';
      case 'safety': return 'S';
      case 'kicker': return 'K';
      case 'punter': return 'P';
      case 'utility': return 'UTL';
      default: return position;
    }
  };

  // Función para estado de JUGADORES
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

  // Función para estado de EQUIPOS
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

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header - Mobile Optimized */}
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
        {/* Team Information */}
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

        {/* Team Statistics - Mobile Grid */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Estadísticas del Equipo</h2>
            <ChartBarIcon className="w-5 h-5 text-gray-400" />
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <p className="text-2xl font-bold text-blue-600">{team.stats?.wins || 0}</p>
              <p className="text-xs text-gray-600">Victorias</p>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <p className="text-2xl font-bold text-green-600">{team.stats?.draws || 0}</p>
              <p className="text-xs text-gray-600">Empates</p>
            </div>
            <div className="text-center p-3 bg-red-50 rounded-lg">
              <p className="text-2xl font-bold text-red-600">{team.stats?.losses || 0}</p>
              <p className="text-xs text-gray-600">Derrotas</p>
            </div>
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <p className="text-2xl font-bold text-purple-600">{team.stats?.points || 0}</p>
              <p className="text-xs text-gray-600">Puntos</p>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg col-span-2">
              <div className="flex justify-center space-x-4">
                <div>
                  <p className="text-lg font-bold text-gray-800">{team.stats?.touchdowns || team.stats?.goalsFor || 0}</p>
<p className="text-xs text-gray-600">TD</p>
</div>
<div>
  <p className="text-lg font-bold text-gray-800">{team.stats?.penalties || team.stats?.goalsAgainst || 0}</p>
  <p className="text-xs text-gray-600">Penal</p>
</div>
              </div>
            </div>
          </div>
        </div>

        {/* Players Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <UserGroupIcon className="w-5 h-5 text-gray-400" />
              <h2 className="text-lg font-semibold text-gray-900">Jugadores ({players.length})</h2>
            </div>
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
                        {player.name} {player.lastName}
                      </p>
                      {player.isCaptain && (
                        <ShieldCheckIcon className="w-4 h-4 text-yellow-600" title="Capitán" />
                      )}
                    </div>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className={`px-2 py-0.5 rounded-full text-xs ${getPositionColor(player.position)}`}>
                        {getPositionLabel(player.position)}
                      </span>
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
                    onClick={() => handleDeletePlayer(player.id, `${player.name} ${player.lastName}`)}
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
          
          <button
            onClick={() => setShowAddPlayerModal(true)}
            className="w-full mt-4 flex items-center justify-center px-4 py-3 border-2 border-dashed border-gray-300 text-gray-600 rounded-lg hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
          >
            <PlusIcon className="w-5 h-5 mr-2" />
            Agregar Nuevo Jugador
          </button>
        </div>

        {/* Quick Contact */}
        {players.length > 0 && (
          <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Contacto Rápido</h2>
            <div className="space-y-3">
              {players.slice(0, 3).map((player) => (
                <div key={player.id} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">
                      {player.name} {player.lastName.charAt(0)}.
                    </p>
                    <p className="text-sm text-gray-600">
                      {getPositionLabel(player.position)}
                    </p>
                  </div>
                  {player.phone && (
                    <a
                      href={`tel:${player.phone}`}
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                      {player.phone}
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Add Player Modal - Mobile Optimized */}
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
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre *
              </label>
              <input
                type="text"
                value={newPlayer.name}
                onChange={(e) => setNewPlayer({ ...newPlayer, name: e.target.value })}
                className="w-full px-4 py-3 bg-gray-100 border-none rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Apellido *
              </label>
              <input
                type="text"
                value={newPlayer.lastName}
                onChange={(e) => setNewPlayer({ ...newPlayer, lastName: e.target.value })}
                className="w-full px-4 py-3 bg-gray-100 border-none rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                required
              />
            </div>
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
                Posición *
              </label>
              <select
                value={newPlayer.position}
                onChange={(e) => setNewPlayer({ ...newPlayer, position: e.target.value as Player['position'] })}
                className="w-full px-4 py-3 bg-gray-100 border-none rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                required
              >
                <option value="quarterback">Quarterback</option>
                <option value="runningback">Running Back</option>
                <option value="wide_receiver">Wide Receiver</option>
                <option value="tight_end">Tight End</option>
                <option value="offensive_line">Offensive Line</option>
                <option value="defensive_line">Defensive Line</option>
                <option value="linebacker">Linebacker</option>
                <option value="cornerback">Cornerback</option>
                <option value="safety">Safety</option>
                <option value="kicker">Kicker</option>
                <option value="punter">Punter</option>
                <option value="utility">Utility</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Teléfono *
              </label>
              <input
                type="tel"
                value={newPlayer.phone}
                onChange={(e) => setNewPlayer({ ...newPlayer, phone: e.target.value })}
                className="w-full px-4 py-3 bg-gray-100 border-none rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                required
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
              />
            </div>
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
            <h4 className="text-sm font-medium text-gray-700 mb-3">Contacto de Emergencia</h4>
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
              disabled={!newPlayer.name || !newPlayer.lastName || !newPlayer.phone}
              className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Agregar Jugador
            </button>
          </div>
        </div>
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