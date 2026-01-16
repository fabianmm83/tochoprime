import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { 
  teamsService, 
  categoriesService, 
  divisionsService, 
  seasonsService 
} from '../services/firestore';
import { Team, Category, Division, Season } from '../types';
import {
  PlusIcon,
  TrophyIcon,
  UserGroupIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  CheckCircleIcon,
  XCircleIcon,
  CurrencyDollarIcon,
  ArrowLeftIcon,
  ChevronRightIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  UserCircleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import Modal from '../components/common/Modal';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Notification from '../components/common/Notification';
import ColorPicker from '../components/common/ColorPicker';

const Teams: React.FC = () => {
  const { categoryId } = useParams<{ categoryId: string }>();
  const navigate = useNavigate();
  const [teams, setTeams] = useState<Team[]>([]);
  const [category, setCategory] = useState<Category | null>(null);
  const [division, setDivision] = useState<Division | null>(null);
  const [season, setSeason] = useState<Season | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');

  const [newTeam, setNewTeam] = useState({
    name: '',
    shortName: '',
    primaryColor: '#3b82f6',
    secondaryColor: '#f3f4f6',
    categoryId: categoryId || '',
    seasonId: '',
    divisionId: '',
    coach: {
      name: '',
      phone: '',
      email: ''
    },
    status: 'pending' as Team['status'],
    paymentStatus: 'pending' as Team['paymentStatus'],
    notes: '',
  });

  useEffect(() => {
    if (categoryId) {
      fetchData(categoryId);
    } else {
      fetchAllTeams();
    }
  }, [categoryId]);

  const fetchData = async (catId: string) => {
    try {
      setLoading(true);
      
      // Obtener categoría
      const categoryData = await categoriesService.getCategoryById(catId);
      
      if (!categoryData) {
        setNotification({ type: 'error', message: 'Categoría no encontrada' });
        navigate('/categories');
        return;
      }
      
      setCategory(categoryData);
      
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
      
      // Obtener equipos
      const teamsData = await teamsService.getTeamsByCategory(catId);
      setTeams(teamsData);
      
    } catch (error) {
      console.error('Error fetching data:', error);
      setNotification({ type: 'error', message: 'Error al cargar los datos' });
    } finally {
      setLoading(false);
    }
  };

  const fetchAllTeams = async () => {
    try {
      setLoading(true);
      // Obtener todos los equipos
      const teamsData = await teamsService.getAllTeams();
      setTeams(teamsData);
    } catch (error) {
      console.error('Error fetching all teams:', error);
      setNotification({ type: 'error', message: 'Error al cargar los equipos' });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTeam = async () => {
    if (!category) {
      setNotification({ type: 'error', message: 'Selecciona una categoría primero' });
      return;
    }

    try {
      const teamData = {
        ...newTeam,
        categoryId: category.id,
        seasonId: category.seasonId,
        divisionId: category.divisionId,
        playerCount: 0,
        registrationDate: new Date(),
        primaryColor: newTeam.primaryColor,
        secondaryColor: newTeam.secondaryColor,
        logoUrl: '',
        captainId: '',
        viceCaptainId: '',
        phone: newTeam.coach.phone,
        email: newTeam.coach.email,
      };

      await teamsService.createTeam(teamData);
      
      setNotification({ type: 'success', message: 'Equipo creado exitosamente' });
      setShowCreateModal(false);
      resetForm();
      if (categoryId) {
        fetchData(categoryId);
      } else {
        fetchAllTeams();
      }
    } catch (error) {
      console.error('Error creating team:', error);
      setNotification({ type: 'error', message: 'Error al crear el equipo' });
    }
  };

  const handleDeleteTeam = async (teamId: string, teamName: string) => {
    if (window.confirm(`¿Estás seguro de que deseas eliminar el equipo "${teamName}"?`)) {
      try {
        await teamsService.deleteTeam(teamId);
        setNotification({ type: 'success', message: 'Equipo eliminado exitosamente' });
        if (categoryId) {
          fetchData(categoryId);
        } else {
          fetchAllTeams();
        }
      } catch (error) {
        console.error('Error deleting team:', error);
        setNotification({ type: 'error', message: 'Error al eliminar el equipo' });
      }
    }
  };

  const handleUpdateStatus = async (teamId: string, newStatus: Team['status']) => {
    try {
      await teamsService.updateTeamStatus(teamId, newStatus);
      setNotification({ type: 'success', message: 'Estado actualizado exitosamente' });
      if (categoryId) {
        fetchData(categoryId);
      } else {
        fetchAllTeams();
      }
    } catch (error) {
      console.error('Error updating team status:', error);
      setNotification({ type: 'error', message: 'Error al actualizar el estado' });
    }
  };

  const handleUpdatePaymentStatus = async (teamId: string, newStatus: Team['paymentStatus']) => {
    try {
      await teamsService.updatePaymentStatus(teamId, newStatus);
      setNotification({ type: 'success', message: 'Estado de pago actualizado' });
      if (categoryId) {
        fetchData(categoryId);
      } else {
        fetchAllTeams();
      }
    } catch (error) {
      console.error('Error updating payment status:', error);
      setNotification({ type: 'error', message: 'Error al actualizar el estado de pago' });
    }
  };

  const resetForm = () => {
    setNewTeam({
      name: '',
      shortName: '',
      primaryColor: '#3b82f6',
      secondaryColor: '#f3f4f6',
      categoryId: categoryId || '',
      seasonId: '',
      divisionId: '',
      coach: {
        name: '',
        phone: '',
        email: ''
      },
      status: 'pending',
      paymentStatus: 'pending',
      notes: '',
    });
  };

  const getStatusColor = (status: Team['status']) => {
    switch (status) {
      case 'approved':
      case 'active': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'suspended': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentColor = (status: Team['paymentStatus']) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'partial': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredTeams = teams.filter(team => {
    // Search filter
    if (searchTerm && !team.name.toLowerCase().includes(searchTerm.toLowerCase()) && 
        !team.coach?.name?.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    
    // Status filter
    if (statusFilter !== 'all' && team.status !== statusFilter) {
      return false;
    }
    
    // Payment filter
    if (paymentFilter !== 'all' && team.paymentStatus !== paymentFilter) {
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
            {categoryId ? (
              <div className="flex items-center">
                <button
                  onClick={() => navigate(-1)}
                  className="mr-3 p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full"
                >
                  <ArrowLeftIcon className="w-5 h-5" />
                </button>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Equipos</h1>
                  <p className="text-sm text-gray-600 mt-1">
                    {category?.name && division && (
                      <span>
                        {division.name} - Categoría {category.name}
                      </span>
                    )}
                  </p>
                </div>
              </div>
            ) : (
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Todos los Equipos</h1>
                <p className="text-sm text-gray-600 mt-1">
                  {teams.length} equipos registrados
                </p>
              </div>
            )}
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
              placeholder="Buscar equipos..."
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
            
            {searchTerm || statusFilter !== 'all' || paymentFilter !== 'all' ? (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                  setPaymentFilter('all');
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
                Estado del Equipo
              </label>
              <div className="flex flex-wrap gap-2">
                {['all', 'pending', 'approved', 'active', 'suspended', 'rejected'].map((status) => (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    className={`px-3 py-1.5 rounded-full text-sm ${
                      statusFilter === status
                        ? status === 'active' ? 'bg-green-100 text-green-800' :
                          status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          status === 'approved' ? 'bg-blue-100 text-blue-800' :
                          status === 'suspended' ? 'bg-orange-100 text-orange-800' :
                          status === 'rejected' ? 'bg-red-100 text-red-800' :
                          'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {status === 'all' ? 'Todos' :
                     status === 'pending' ? 'Pendiente' :
                     status === 'approved' ? 'Aprobado' :
                     status === 'active' ? 'Activo' :
                     status === 'suspended' ? 'Suspendido' : 'Rechazado'}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Estado de Pago
              </label>
              <div className="flex flex-wrap gap-2">
                {['all', 'pending', 'partial', 'paid', 'overdue'].map((payment) => (
                  <button
                    key={payment}
                    onClick={() => setPaymentFilter(payment)}
                    className={`px-3 py-1.5 rounded-full text-sm ${
                      paymentFilter === payment
                        ? payment === 'paid' ? 'bg-green-100 text-green-800' :
                          payment === 'partial' ? 'bg-blue-100 text-blue-800' :
                          payment === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          payment === 'overdue' ? 'bg-red-100 text-red-800' :
                          'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {payment === 'all' ? 'Todos' :
                     payment === 'pending' ? 'Pendiente' :
                     payment === 'partial' ? 'Parcial' :
                     payment === 'paid' ? 'Pagado' : 'Vencido'}
                  </button>
                ))}
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

      {/* Teams List - Mobile Optimized */}
      <div className="px-4 pt-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Resultados ({filteredTeams.length})
          </h2>
          <div className="text-sm text-gray-600">
            {filteredTeams.length === teams.length ? 'Todos' : 'Filtrados'}
          </div>
        </div>

        {filteredTeams.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-xl">
            <TrophyIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {teams.length === 0 ? 'No hay equipos registrados' : 'No se encontraron equipos'}
            </h3>
            <p className="text-gray-600 mb-6">
              {teams.length === 0 
                ? 'Comienza registrando el primer equipo.'
                : 'Prueba con otros términos de búsqueda o filtros.'}
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <PlusIcon className="w-5 h-5 mr-2" />
              {teams.length === 0 ? 'Registrar Primer Equipo' : 'Agregar Nuevo Equipo'}
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredTeams.map((team) => (
              <div
                key={team.id}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:border-blue-300 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: team.primaryColor || '#3b82f6' }}
                    >
                      <TrophyIcon className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <h3 className="font-semibold text-gray-900 truncate">
                          {team.name}
                        </h3>
                        {team.shortName && (
                          <span className="text-sm text-gray-500">
                            ({team.shortName})
                          </span>
                        )}
                      </div>
                      
                      <div className="flex flex-wrap gap-2 mt-2">
                        <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(team.status)}`}>
                          {team.status === 'pending' ? 'Pendiente' :
                           team.status === 'approved' ? 'Aprobado' :
                           team.status === 'active' ? 'Activo' :
                           team.status === 'suspended' ? 'Suspendido' : 'Rechazado'}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs ${getPaymentColor(team.paymentStatus)}`}>
                          {team.paymentStatus === 'pending' ? 'Pago Pendiente' :
                           team.paymentStatus === 'partial' ? 'Pago Parcial' :
                           team.paymentStatus === 'paid' ? 'Pagado' : 'Vencido'}
                        </span>
                      </div>
                      
                      <div className="mt-2 space-y-1">
                        {team.coach?.name && (
                          <div className="flex items-center text-sm text-gray-600">
                            <UserCircleIcon className="w-4 h-4 mr-2 flex-shrink-0" />
                            <span className="truncate">Entrenador: {team.coach.name}</span>
                          </div>
                        )}
                        <div className="flex items-center text-sm text-gray-600">
                          <UserGroupIcon className="w-4 h-4 mr-2 flex-shrink-0" />
                          <span>Jugadores: {team.playerCount || 0}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-100">
                  <div className="flex space-x-3">
                    <button
                      onClick={() => handleUpdateStatus(team.id, 
                        team.status === 'active' ? 'suspended' : 'active'
                      )}
                      className={`text-sm ${
                        team.status === 'active' 
                          ? 'text-red-600 hover:text-red-800' 
                          : 'text-green-600 hover:text-green-800'
                      }`}
                    >
                      {team.status === 'active' ? 'Suspender' : 'Activar'}
                    </button>
                    <button
                      onClick={() => handleDeleteTeam(team.id, team.name)}
                      className="text-sm text-red-600 hover:text-red-800"
                    >
                      Eliminar
                    </button>
                  </div>
                  
                  <Link
                    to={`/teams/${team.id}`}
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

      {/* Create Team Modal - Mobile Optimized */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          resetForm();
        }}
        title="Registrar Nuevo Equipo"
        size="full"
      >
        <div className="space-y-4 px-4 pb-20">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre del Equipo *
              </label>
              <input
                type="text"
                value={newTeam.name}
                onChange={(e) => setNewTeam({ ...newTeam, name: e.target.value })}
                className="w-full px-4 py-3 bg-gray-100 border-none rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="Ej: Lobos FC"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre Corto
              </label>
              <input
                type="text"
                value={newTeam.shortName}
                onChange={(e) => setNewTeam({ ...newTeam, shortName: e.target.value })}
                className="w-full px-4 py-3 bg-gray-100 border-none rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="Ej: LOB"
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
                  value={newTeam.primaryColor}
                  onChange={(e) => setNewTeam({ ...newTeam, primaryColor: e.target.value })}
                  className="w-12 h-12 cursor-pointer rounded-lg"
                />
                <span className="text-sm text-gray-600">
                  {newTeam.primaryColor}
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
                  value={newTeam.secondaryColor}
                  onChange={(e) => setNewTeam({ ...newTeam, secondaryColor: e.target.value })}
                  className="w-12 h-12 cursor-pointer rounded-lg"
                />
                <span className="text-sm text-gray-600">
                  {newTeam.secondaryColor}
                </span>
              </div>
            </div>
          </div>

          <div className="border-t pt-4">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Información del Entrenador</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre
                </label>
                <input
                  type="text"
                  value={newTeam.coach.name}
                  onChange={(e) => setNewTeam({
                    ...newTeam,
                    coach: { ...newTeam.coach, name: e.target.value }
                  })}
                  className="w-full px-4 py-3 bg-gray-100 border-none rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="Nombre completo"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Teléfono
                </label>
                <input
                  type="tel"
                  value={newTeam.coach.phone}
                  onChange={(e) => setNewTeam({
                    ...newTeam,
                    coach: { ...newTeam.coach, phone: e.target.value }
                  })}
                  className="w-full px-4 py-3 bg-gray-100 border-none rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="10 dígitos"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={newTeam.coach.email}
                  onChange={(e) => setNewTeam({
                    ...newTeam,
                    coach: { ...newTeam.coach, email: e.target.value }
                  })}
                  className="w-full px-4 py-3 bg-gray-100 border-none rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="correo@ejemplo.com"
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
                value={newTeam.status}
                onChange={(e) => setNewTeam({ ...newTeam, status: e.target.value as Team['status'] })}
                className="w-full px-4 py-3 bg-gray-100 border-none rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="pending">Pendiente</option>
                <option value="approved">Aprobado</option>
                <option value="active">Activo</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Estado de Pago
              </label>
              <select
                value={newTeam.paymentStatus}
                onChange={(e) => setNewTeam({ ...newTeam, paymentStatus: e.target.value as Team['paymentStatus'] })}
                className="w-full px-4 py-3 bg-gray-100 border-none rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="pending">Pendiente</option>
                <option value="partial">Parcial</option>
                <option value="paid">Pagado</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notas Adicionales
            </label>
            <textarea
              value={newTeam.notes}
              onChange={(e) => setNewTeam({ ...newTeam, notes: e.target.value })}
              className="w-full px-4 py-3 bg-gray-100 border-none rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
              rows={3}
              placeholder="Observaciones sobre el equipo..."
            />
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
              onClick={handleCreateTeam}
              disabled={!newTeam.name}
              className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Registrar Equipo
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Teams;