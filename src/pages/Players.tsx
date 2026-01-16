import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { playersService, teamsService } from '../services/firestore';
import { Player, Team } from '../types';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  UserGroupIcon,
  UserCircleIcon,
  PhoneIcon,
  EnvelopeIcon,
  ShieldCheckIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  PlusIcon,
  TrophyIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  CalendarIcon,
  ExclamationTriangleIcon,
  ChevronRightIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import Modal from '../components/common/Modal';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Notification from '../components/common/Notification';

const Players: React.FC = () => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [positionFilter, setPositionFilter] = useState<string>('all');
  const [teamFilter, setTeamFilter] = useState<string>('all');

  const [newPlayer, setNewPlayer] = useState({
    name: '',
    lastName: '',
    number: 1,
    position: 'mediocampista' as Player['position'],
    email: '',
    phone: '',
    dateOfBirth: '',
    teamId: '',
    emergencyContact: {
      name: '',
      phone: '',
      relationship: ''
    },
    status: 'pending' as Player['status'],
    isCaptain: false,
    isViceCaptain: false,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Obtener todos los jugadores
      const playersData = await playersService.getAllPlayers();
      setPlayers(playersData);
      
      // Obtener equipos para el filtro
      const teamsData = await teamsService.getAllTeams();
      setTeams(teamsData);
      
    } catch (error) {
      console.error('Error fetching data:', error);
      setNotification({ type: 'error', message: 'Error al cargar los datos' });
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePlayer = async () => {
    try {
      if (!newPlayer.teamId) {
        setNotification({ type: 'error', message: 'Selecciona un equipo para el jugador' });
        return;
      }

      await playersService.createPlayer({
        ...newPlayer,
        dateOfBirth: newPlayer.dateOfBirth ? new Date(newPlayer.dateOfBirth) : undefined,
        registrationDate: new Date(),
      });
      
      setNotification({ type: 'success', message: 'Jugador creado exitosamente' });
      setShowCreateModal(false);
      resetForm();
      fetchData();
    } catch (error) {
      console.error('Error creating player:', error);
      setNotification({ type: 'error', message: 'Error al crear el jugador' });
    }
  };

  const handleDeletePlayer = async (playerId: string, playerName: string) => {
    if (window.confirm(`¿Estás seguro de que deseas eliminar a ${playerName}?`)) {
      try {
        await playersService.deletePlayer(playerId);
        setNotification({ type: 'success', message: 'Jugador eliminado exitosamente' });
        fetchData();
      } catch (error) {
        console.error('Error deleting player:', error);
        setNotification({ type: 'error', message: 'Error al eliminar el jugador' });
      }
    }
  };

  const handleUpdateStatus = async (playerId: string, newStatus: Player['status']) => {
    try {
      await playersService.updatePlayerStatus(playerId, newStatus);
      setNotification({ type: 'success', message: 'Estado actualizado exitosamente' });
      fetchData();
    } catch (error) {
      console.error('Error updating player status:', error);
      setNotification({ type: 'error', message: 'Error al actualizar el estado' });
    }
  };

  const resetForm = () => {
    setNewPlayer({
      name: '',
      lastName: '',
      number: 1,
      position: 'mediocampista',
      email: '',
      phone: '',
      dateOfBirth: '',
      teamId: '',
      emergencyContact: {
        name: '',
        phone: '',
        relationship: ''
      },
      status: 'pending',
      isCaptain: false,
      isViceCaptain: false,
    });
  };

  const getPositionColor = (position: Player['position']) => {
    switch (position) {
      case 'portero': return 'bg-red-100 text-red-800';
      case 'defensa': return 'bg-blue-100 text-blue-800';
      case 'mediocampista': return 'bg-green-100 text-green-800';
      case 'delantero': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: Player['status']) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'suspended': return 'bg-red-100 text-red-800';
      case 'injured': return 'bg-orange-100 text-orange-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTeamName = (teamId: string) => {
    const team = teams.find(t => t.id === teamId);
    return team ? team.name : 'Sin equipo';
  };

  const filteredPlayers = players.filter(player => {
    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      if (!player.name.toLowerCase().includes(searchLower) && 
          !player.lastName.toLowerCase().includes(searchLower) &&
          !player.email?.toLowerCase().includes(searchLower) &&
          !player.phone?.includes(searchTerm)) {
        return false;
      }
    }
    
    // Status filter
    if (statusFilter !== 'all' && player.status !== statusFilter) {
      return false;
    }
    
    // Position filter
    if (positionFilter !== 'all' && player.position !== positionFilter) {
      return false;
    }
    
    // Team filter
    if (teamFilter !== 'all' && player.teamId !== teamFilter) {
      return false;
    }
    
    return true;
  });

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header - Mobile Optimized */}
      <div className="bg-white border-b border-gray-200 px-4 pt-4 pb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Jugadores</h1>
            <p className="text-sm text-gray-600 mt-1">
              {players.length} jugadores registrados
            </p>
          </div>
          
          <button
            onClick={() => setShowCreateModal(true)}
            className="p-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 active:scale-95 transition-all"
          >
            <PlusIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Search and Filters - Mobile First */}
        <div className="space-y-3">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar jugadores..."
              className="w-full pl-10 pr-4 py-3 bg-gray-100 border-none rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2"
              >
                <XMarkIcon className="w-5 h-5 text-gray-400" />
              </button>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center px-4 py-2 rounded-lg ${
                showFilters ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-700'
              }`}
            >
              <FunnelIcon className="w-4 h-4 mr-2" />
              Filtros
            </button>
            
            {searchTerm || statusFilter !== 'all' || positionFilter !== 'all' || teamFilter !== 'all' ? (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                  setPositionFilter('all');
                  setTeamFilter('all');
                }}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900"
              >
                Limpiar
              </button>
            ) : null}
          </div>
        </div>

        {/* Filter Options */}
        {showFilters && (
          <div className="mt-4 space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Estado
              </label>
              <div className="flex flex-wrap gap-2">
                {['all', 'active', 'pending', 'suspended', 'injured', 'inactive'].map((status) => (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    className={`px-3 py-1.5 rounded-full text-sm ${
                      statusFilter === status
                        ? status === 'active' ? 'bg-green-100 text-green-800' :
                          status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          status === 'suspended' ? 'bg-red-100 text-red-800' :
                          status === 'injured' ? 'bg-orange-100 text-orange-800' :
                          status === 'inactive' ? 'bg-gray-100 text-gray-800' :
                          'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {status === 'all' ? 'Todos' :
                     status === 'active' ? 'Activo' :
                     status === 'pending' ? 'Pendiente' :
                     status === 'suspended' ? 'Suspendido' :
                     status === 'injured' ? 'Lesionado' : 'Inactivo'}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Posición
              </label>
              <div className="flex flex-wrap gap-2">
                {['all', 'portero', 'defensa', 'mediocampista', 'delantero', 'utility'].map((position) => (
                  <button
                    key={position}
                    onClick={() => setPositionFilter(position)}
                    className={`px-3 py-1.5 rounded-full text-sm ${
                      positionFilter === position
                        ? position === 'portero' ? 'bg-red-100 text-red-800' :
                          position === 'defensa' ? 'bg-blue-100 text-blue-800' :
                          position === 'mediocampista' ? 'bg-green-100 text-green-800' :
                          position === 'delantero' ? 'bg-yellow-100 text-yellow-800' :
                          position === 'utility' ? 'bg-purple-100 text-purple-800' :
                          'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {position === 'all' ? 'Todas' :
                     position === 'portero' ? 'Portero' :
                     position === 'defensa' ? 'Defensa' :
                     position === 'mediocampista' ? 'Mediocampista' :
                     position === 'delantero' ? 'Delantero' : 'Utility'}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Equipo
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setTeamFilter('all')}
                  className={`px-3 py-1.5 rounded-full text-sm ${
                    teamFilter === 'all' 
                      ? 'bg-blue-100 text-blue-800' 
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  Todos
                </button>
                {teams.slice(0, 4).map(team => (
                  <button
                    key={team.id}
                    onClick={() => setTeamFilter(team.id)}
                    className={`px-3 py-1.5 rounded-full text-sm ${
                      teamFilter === team.id 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {team.shortName || team.name}
                  </button>
                ))}
                {teams.length > 4 && (
                  <select
                    value={teamFilter}
                    onChange={(e) => setTeamFilter(e.target.value)}
                    className="px-3 py-1.5 rounded-full text-sm bg-gray-100 text-gray-700 border-none focus:ring-0"
                  >
                    <option value="all">Otros...</option>
                    {teams.slice(4).map(team => (
                      <option key={team.id} value={team.id}>
                        {team.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Notification */}
      {notification && (
        <Notification
          type={notification.type}
          message={notification.message}
          onClose={() => setNotification(null)}
        />
      )}

      {/* Players List - Mobile Optimized */}
      <div className="px-4 pt-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Resultados ({filteredPlayers.length})
          </h2>
          <div className="text-sm text-gray-600">
            {filteredPlayers.length === players.length ? 'Todos' : 'Filtrados'}
          </div>
        </div>

        {filteredPlayers.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-xl">
            <UserGroupIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {players.length === 0 ? 'No hay jugadores registrados' : 'No se encontraron jugadores'}
            </h3>
            <p className="text-gray-600 mb-6">
              {players.length === 0 
                ? 'Comienza registrando el primer jugador.'
                : 'Prueba con otros términos de búsqueda o filtros.'}
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <PlusIcon className="w-5 h-5 mr-2" />
              {players.length === 0 ? 'Registrar Primer Jugador' : 'Agregar Nuevo Jugador'}
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredPlayers.map((player) => (
              <div
                key={player.id}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:border-blue-300 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <span className="font-bold text-blue-600 text-lg">{player.number}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <h3 className="font-semibold text-gray-900 truncate">
                          {player.name} {player.lastName}
                        </h3>
                        {player.isCaptain && (
                          <ShieldCheckIcon className="w-4 h-4 text-yellow-600 flex-shrink-0" title="Capitán" />
                        )}
                      </div>
                      
                      <div className="flex flex-wrap gap-2 mt-2">
                        <span className={`px-2 py-1 rounded-full text-xs ${getPositionColor(player.position)}`}>
                          {player.position === 'portero' ? 'Portero' :
                           player.position === 'defensa' ? 'Defensa' :
                           player.position === 'mediocampista' ? 'Mediocampista' :
                           player.position === 'delantero' ? 'Delantero' : 'Utility'}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(player.status)}`}>
                          {player.status === 'active' ? 'Activo' :
                           player.status === 'pending' ? 'Pendiente' :
                           player.status === 'suspended' ? 'Suspendido' :
                           player.status === 'injured' ? 'Lesionado' : 'Inactivo'}
                        </span>
                      </div>
                      
                      <div className="mt-2 space-y-1">
                        {player.phone && (
                          <div className="flex items-center text-sm text-gray-600">
                            <PhoneIcon className="w-4 h-4 mr-2 flex-shrink-0" />
                            <span className="truncate">{player.phone}</span>
                          </div>
                        )}
                        {player.teamId && (
                          <div className="text-sm text-gray-600 truncate">
                            Equipo: {getTeamName(player.teamId)}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-100">
                  <div className="flex space-x-3">
                    <button
                      onClick={() => handleUpdateStatus(player.id, 
                        player.status === 'active' ? 'suspended' : 'active'
                      )}
                      className={`text-sm ${
                        player.status === 'active' 
                          ? 'text-red-600 hover:text-red-800' 
                          : 'text-green-600 hover:text-green-800'
                      }`}
                    >
                      {player.status === 'active' ? 'Suspender' : 'Activar'}
                    </button>
                    <button
                      onClick={() => handleDeletePlayer(player.id, `${player.name} ${player.lastName}`)}
                      className="text-sm text-red-600 hover:text-red-800"
                    >
                      Eliminar
                    </button>
                  </div>
                  
                  <Link
                    to={`/teams/${player.teamId}`}
                    className="flex items-center text-sm text-blue-600 hover:text-blue-800"
                  >
                    Ver equipo
                    <ChevronRightIcon className="w-4 h-4 ml-1" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Player Modal - Mobile Optimized */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          resetForm();
        }}
        title="Registrar Nuevo Jugador"
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
                <option value="portero">Portero</option>
                <option value="defensa">Defensa</option>
                <option value="mediocampista">Mediocampista</option>
                <option value="delantero">Delantero</option>
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Equipo *
            </label>
            <select
              value={newPlayer.teamId}
              onChange={(e) => setNewPlayer({ ...newPlayer, teamId: e.target.value })}
              className="w-full px-4 py-3 bg-gray-100 border-none rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
              required
            >
              <option value="">Selecciona un equipo</option>
              {teams.map(team => (
                <option key={team.id} value={team.id}>{team.name}</option>
              ))}
            </select>
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

          <div className="grid grid-cols-2 gap-4">
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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Rol en el equipo
              </label>
              <select
                value={newPlayer.isCaptain ? 'captain' : newPlayer.isViceCaptain ? 'vice' : 'player'}
                onChange={(e) => {
                  const value = e.target.value;
                  setNewPlayer({
                    ...newPlayer,
                    isCaptain: value === 'captain',
                    isViceCaptain: value === 'vice'
                  });
                }}
                className="w-full px-4 py-3 bg-gray-100 border-none rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="player">Jugador regular</option>
                <option value="captain">Capitán</option>
                <option value="vice">Vice-capitán</option>
              </select>
            </div>
          </div>

          <div className="flex space-x-3 pt-6 pb-4">
            <button
              onClick={() => {
                setShowCreateModal(false);
                resetForm();
              }}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors font-medium"
            >
              Cancelar
            </button>
            <button
              onClick={handleCreatePlayer}
              disabled={!newPlayer.name || !newPlayer.lastName || !newPlayer.phone || !newPlayer.teamId}
              className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Registrar Jugador
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Players;