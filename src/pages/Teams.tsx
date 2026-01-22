import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { 
  teamsService, 
  categoriesService, 
  divisionsService, 
  seasonsService,
  storageService 
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
  CameraIcon,
  PhotoIcon,
  CloudArrowUpIcon,
  CalendarIcon
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
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  
  // Para el selector de temporadas y categorías
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [selectedSeasonId, setSelectedSeasonId] = useState<string>('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [seasonsLoading, setSeasonsLoading] = useState(false);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');

  const [newTeam, setNewTeam] = useState({
    name: '',
    primaryColor: '#3b82f6',
    secondaryColor: '#f3f4f6',
    logoUrl: '',
    categoryId: categoryId || '',
    seasonId: '',
    divisionId: '',
    coach: {
      name: '',
      phone: ''
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
    
    // Cargar temporadas para el selector
    if (!categoryId) {
      loadSeasons();
    }
  }, [categoryId]);

  const fetchData = async (catId: string) => {
    try {
      setLoading(true);
      
      // Obtener categoría
      const categoryData = await categoriesService.getCategoryById(catId);
      
      if (!categoryData) {
        setNotification({ type: 'error', message: 'Categoría no encontrada' });
        navigate('/categorias');
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

  const loadSeasons = async () => {
    try {
      setSeasonsLoading(true);
      const seasonsData = await seasonsService.getSeasons();
      setSeasons(seasonsData);
      
      // Seleccionar la temporada activa o la más reciente por defecto
      if (seasonsData.length > 0) {
        const activeSeason = seasonsData.find(s => s.status === 'active') || seasonsData[0];
        setSelectedSeasonId(activeSeason.id);
        loadCategories(activeSeason.id);
      }
    } catch (error) {
      console.error('Error loading seasons:', error);
      setNotification({ type: 'error', message: 'Error al cargar las temporadas' });
    } finally {
      setSeasonsLoading(false);
    }
  };

  const loadCategories = async (seasonId: string) => {
    try {
      setCategoriesLoading(true);
      const categoriesData = await categoriesService.getCategoriesBySeason(seasonId);
      setCategories(categoriesData);
    } catch (error) {
      console.error('Error loading categories:', error);
      setNotification({ type: 'error', message: 'Error al cargar las categorías' });
    } finally {
      setCategoriesLoading(false);
    }
  };

  const handleSeasonChange = async (seasonId: string) => {
    setSelectedSeasonId(seasonId);
    setNewTeam({
      ...newTeam,
      seasonId,
      categoryId: '', // Resetear categoría cuando cambia la temporada
      divisionId: ''
    });
    await loadCategories(seasonId);
  };

  const handleCategoryChange = (categoryId: string) => {
    const selectedCategory = categories.find(c => c.id === categoryId);
    if (selectedCategory) {
      setNewTeam({
        ...newTeam,
        categoryId,
        divisionId: selectedCategory.divisionId,
        seasonId: selectedCategory.seasonId
      });
    }
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar tipo de archivo
    if (!file.type.match('image.*')) {
      setNotification({ type: 'error', message: 'Solo se permiten archivos de imagen' });
      return;
    }

    // Validar tamaño (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setNotification({ type: 'error', message: 'La imagen no debe superar 5MB' });
      return;
    }

    try {
      setUploadingLogo(true);
      
      // Crear preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);

      // Subir a Firebase Storage
      const timestamp = Date.now();
      const fileName = `team-logos/${timestamp}_${file.name}`;
      const downloadUrl = await storageService.uploadFile(file, fileName);
      
      setNewTeam({ ...newTeam, logoUrl: downloadUrl });
      setNotification({ type: 'success', message: 'Logo subido exitosamente' });
      
    } catch (error) {
      console.error('Error uploading logo:', error);
      setNotification({ type: 'error', message: 'Error al subir el logo' });
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleCreateTeam = async () => {
    // Validar que se haya seleccionado una categoría (solo cuando no hay categoryId en URL)
    if (!categoryId && !newTeam.categoryId) {
      setNotification({ type: 'error', message: 'Selecciona una categoría primero' });
      return;
    }

    if (!newTeam.name.trim()) {
      setNotification({ type: 'error', message: 'El nombre del equipo es obligatorio' });
      return;
    }

    try {
      // Determinar la categoría destino
      const targetCategoryId = categoryId || newTeam.categoryId;
      
      if (!targetCategoryId) {
        setNotification({ type: 'error', message: 'No se pudo determinar la categoría' });
        return;
      }

      // Obtener información de la categoría
      let categoryData = category;
      if (!categoryData || categoryData.id !== targetCategoryId) {
        categoryData = await categoriesService.getCategoryById(targetCategoryId);
      }

      if (!categoryData) {
        setNotification({ type: 'error', message: 'Categoría no encontrada' });
        return;
      }

      const teamData = {
        name: newTeam.name.trim(),
        categoryId: targetCategoryId,
        seasonId: categoryData.seasonId,
        divisionId: categoryData.divisionId,
        primaryColor: newTeam.primaryColor,
        secondaryColor: newTeam.secondaryColor,
        logoUrl: newTeam.logoUrl || '',
        coach: newTeam.coach,
        status: newTeam.status,
        paymentStatus: newTeam.paymentStatus,
        notes: newTeam.notes,
        // Campos adicionales requeridos por la interfaz Team
        playerCount: 0,
        registrationDate: new Date().toISOString(),
        stats: {
          matchesPlayed: 0,
          wins: 0,
          draws: 0,
          losses: 0,
          goalsFor: 0,
          goalsAgainst: 0,
          points: 0,
        }
      };

      console.log('Creando equipo con datos:', teamData);
      await teamsService.createTeam(teamData);
      
      setNotification({ type: 'success', message: 'Equipo creado exitosamente' });
      setShowCreateModal(false);
      resetForm();
      
      // Refrescar datos
      if (categoryId) {
        fetchData(categoryId);
      } else {
        fetchAllTeams();
      }
    } catch (error: any) {
      console.error('Error creating team:', error);
      setNotification({ 
        type: 'error', 
        message: error.message || 'Error al crear el equipo' 
      });
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
      primaryColor: '#3b82f6',
      secondaryColor: '#f3f4f6',
      logoUrl: '',
      categoryId: categoryId || '',
      seasonId: '',
      divisionId: '',
      coach: {
        name: '',
        phone: ''
      },
      status: 'pending',
      paymentStatus: 'pending',
      notes: '',
    });
    setLogoPreview(null);
    
    // Resetear selectores si no hay categoryId
    if (!categoryId) {
      const activeSeason = seasons.find(s => s.status === 'active') || seasons[0];
      if (activeSeason) {
        setSelectedSeasonId(activeSeason.id);
        loadCategories(activeSeason.id);
      }
    }
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
                    {category?.name && division && season && (
                      <span>
                        {season.name} - {division.name} - Cat. {category.name}
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
            
            {(searchTerm || statusFilter !== 'all' || paymentFilter !== 'all') && (
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
            )}
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
            Equipos ({filteredTeams.length})
          </h2>
          {filteredTeams.length !== teams.length && (
            <div className="text-sm text-blue-600">
              Filtrados
            </div>
          )}
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
                      style={{ 
                        backgroundColor: team.primaryColor || '#3b82f6',
                        border: `2px solid ${team.secondaryColor || '#f3f4f6'}`
                      }}
                    >
                      {team.logoUrl ? (
                        <img 
                          src={team.logoUrl} 
                          alt={team.name}
                          className="w-10 h-10 object-contain rounded-lg"
                        />
                      ) : (
                        <TrophyIcon className="w-6 h-6 text-white" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate">
                        {team.name}
                      </h3>
                      
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
                            <span className="truncate">{team.coach.name}</span>
                          </div>
                        )}
                        <div className="flex items-center text-sm text-gray-600">
                          <UserGroupIcon className="w-4 h-4 mr-2 flex-shrink-0" />
                          <span>{team.playerCount || 0} jugadores</span>
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
                    to={`/equipos/${team.id}`}
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
          {/* Selector de Temporada (solo mostrar si no hay categoryId en URL) */}
          {!categoryId && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Temporada *
                </label>
                {seasonsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <span className="ml-3 text-gray-600">Cargando temporadas...</span>
                  </div>
                ) : seasons.length === 0 ? (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-center">
                    <p className="text-yellow-700">
                      No hay temporadas disponibles. Primero crea una temporada.
                    </p>
                    <button
                      onClick={() => {
                        setShowCreateModal(false);
                        navigate('/temporadas');
                      }}
                      className="mt-2 text-sm text-blue-600 hover:text-blue-800"
                    >
                      Ir a Temporadas
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <select
                      value={selectedSeasonId}
                      onChange={(e) => handleSeasonChange(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-gray-100 border-none rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none appearance-none"
                      required
                    >
                      {seasons.map((season) => (
                        <option key={season.id} value={season.id}>
                          {season.name} ({season.status === 'active' ? 'Activa' : 
                                          season.status === 'upcoming' ? 'Próxima' : 
                                          season.status === 'completed' ? 'Completada' : 'Archivada'})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  Selecciona la temporada donde competirá el equipo
                </p>
              </div>

              {/* Selector de Categoría */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Categoría *
                </label>
                {categoriesLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <span className="ml-3 text-gray-600">Cargando categorías...</span>
                  </div>
                ) : categories.length === 0 ? (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-center">
                    <p className="text-yellow-700">
                      No hay categorías disponibles para esta temporada.
                    </p>
                    {seasons.length > 0 && (
                      <div className="mt-2">
                        <p className="text-xs text-gray-600 mb-2">
                          Intenta con otra temporada o crea categorías primero.
                        </p>
                        <div className="flex flex-wrap gap-2 justify-center">
                          {seasons.slice(0, 3).map(season => (
                            <button
                              key={season.id}
                              onClick={() => handleSeasonChange(season.id)}
                              className={`px-3 py-1.5 text-xs rounded-full ${
                                selectedSeasonId === season.id 
                                  ? 'bg-blue-100 text-blue-800' 
                                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                              }`}
                            >
                              {season.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="relative">
  <TrophyIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
  <select
    value={newTeam.categoryId}
    onChange={(e) => handleCategoryChange(e.target.value)}
    className="w-full pl-10 pr-4 py-3 bg-gray-100 border-none rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none appearance-none"
    required
  >
    <option value="">Selecciona una categoría</option>
    {categories.map((cat) => (
      <option key={cat.id} value={cat.id}>
        {cat.name}
      </option>
    ))}
  </select>
</div>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  Selecciona la categoría donde competirá el equipo
                </p>
              </div>

              {/* Información de la selección */}
              {newTeam.categoryId && categories.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <div className="flex items-start">
                    <TrophyIcon className="w-5 h-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-blue-900 mb-1">
                        Categoría seleccionada:
                      </p>
                      {(() => {
                        const selectedCat = categories.find(c => c.id === newTeam.categoryId);
                        const selectedSeason = seasons.find(s => s.id === selectedSeasonId);
                        
                        if (selectedCat && selectedSeason) {
                          return (
                            <div className="space-y-1">
                              <p className="text-sm text-blue-700">
                                <span className="font-medium">Temporada:</span> {selectedSeason.name}
                              </p>
                              <p className="text-sm text-blue-700">
                                <span className="font-medium">Categoría:</span> {selectedCat.name}
                              </p>
                              {selectedCat.price && (
                                <p className="text-sm text-blue-700">
                                  <span className="font-medium">Precio de inscripción:</span> ${selectedCat.price.toLocaleString()}
                                </p>
                              )}
                            </div>
                          );
                        }
                        return null;
                      })()}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Nombre del Equipo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre del Equipo *
            </label>
            <input
              type="text"
              value={newTeam.name}
              onChange={(e) => setNewTeam({ ...newTeam, name: e.target.value })}
              className="w-full px-4 py-3 bg-gray-100 border-none rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="Ej: Lobos FC, Águilas Doradas, etc."
              required
            />
          </div>

          {/* Logo del Equipo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Logo del Equipo (Opcional)
            </label>
            
            <div className="flex flex-col items-center">
              {/* Preview del Logo */}
              <div className="mb-4">
                <div className="w-32 h-32 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden"
                  style={{ 
                    backgroundColor: newTeam.primaryColor,
                    borderColor: newTeam.secondaryColor 
                  }}
                >
                  {logoPreview ? (
                    <img 
                      src={logoPreview} 
                      alt="Preview" 
                      className="w-full h-full object-contain p-2"
                    />
                  ) : (
                    <div className="text-center p-4">
                      <CameraIcon className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-xs text-gray-500">Sin logo</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Botón de Subida */}
              <label className="w-full">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                  disabled={uploadingLogo}
                />
                <div className={`w-full px-4 py-3 rounded-xl flex items-center justify-center space-x-2 cursor-pointer transition-colors ${
                  uploadingLogo 
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                    : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                }`}>
                  {uploadingLogo ? (
                    <>
                      <svg className="animate-spin h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Subiendo...</span>
                    </>
                  ) : (
                    <>
                      <CloudArrowUpIcon className="w-5 h-5" />
                      <span>{newTeam.logoUrl ? 'Cambiar Logo' : 'Subir Logo'}</span>
                    </>
                  )}
                </div>
              </label>
              
              <p className="text-xs text-gray-500 mt-2 text-center">
                PNG, JPG o GIF • Máx. 5MB • Recomendado: 200x200px
              </p>
            </div>
          </div>

          {/* Colores del Equipo */}
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
                <div className="flex-1">
                  <span className="text-sm text-gray-600 block">{newTeam.primaryColor}</span>
                  <span className="text-xs text-gray-500">Color principal del equipo</span>
                </div>
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
                <div className="flex-1">
                  <span className="text-sm text-gray-600 block">{newTeam.secondaryColor}</span>
                  <span className="text-xs text-gray-500">Color secundario/accesorios</span>
                </div>
              </div>
            </div>
          </div>

          {/* Información del Entrenador (Opcional) */}
          <div className="border-t pt-4">
            <h4 className="text-sm font-medium text-gray-700 mb-3">
              Entrenador (Opcional)
            </h4>
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
                  placeholder="Nombre del entrenador"
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
            </div>
          </div>

          {/* Estado y Pago */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Estado Inicial *
              </label>
              <select
                value={newTeam.status}
                onChange={(e) => setNewTeam({ ...newTeam, status: e.target.value as Team['status'] })}
                className="w-full px-4 py-3 bg-gray-100 border-none rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                required
              >
                <option value="pending">Pendiente</option>
                <option value="approved">Aprobado</option>
                <option value="active">Activo</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Estado de Pago *
              </label>
              <select
                value={newTeam.paymentStatus}
                onChange={(e) => setNewTeam({ ...newTeam, paymentStatus: e.target.value as Team['paymentStatus'] })}
                className="w-full px-4 py-3 bg-gray-100 border-none rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                required
              >
                <option value="pending">Pendiente</option>
                <option value="partial">Parcial</option>
                <option value="paid">Pagado</option>
              </select>
            </div>
          </div>

          {/* Notas Adicionales (Opcional) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notas Adicionales (Opcional)
            </label>
            <textarea
              value={newTeam.notes}
              onChange={(e) => setNewTeam({ ...newTeam, notes: e.target.value })}
              className="w-full px-4 py-3 bg-gray-100 border-none rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
              rows={3}
              placeholder="Observaciones, requisitos especiales, comentarios..."
            />
          </div>

          {/* Botones de Acción */}
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
              disabled={!newTeam.name.trim() || (!categoryId && !newTeam.categoryId)}
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