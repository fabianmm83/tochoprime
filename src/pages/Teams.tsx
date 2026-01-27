import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams, Link, useSearchParams } from 'react-router-dom';
import { 
  teamsService, 
  categoriesService, 
  divisionsService, 
  seasonsService,
  storageService,
  paymentsService
} from '../services/firestore';
import { Team, Category, Division, Season, Payment } from '../types';
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
  CalendarIcon,
  BuildingLibraryIcon,
  TagIcon,
  HomeIcon,
  ArrowPathIcon,
  BanknotesIcon,
  DocumentPlusIcon,
  ReceiptPercentIcon,
  CreditCardIcon,
  ArrowUpTrayIcon,
  TableCellsIcon,
  ChevronLeftIcon,
  ChevronDoubleLeftIcon,
  ChevronRightIcon as ChevronRight,
  ChevronDoubleRightIcon
} from '@heroicons/react/24/outline';
import Modal from '../components/common/Modal';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Notification from '../components/common/Notification';

const Teams: React.FC = () => {
  const { categoryId } = useParams<{ categoryId: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [teams, setTeams] = useState<Team[]>([]);
  const [category, setCategory] = useState<Category | null>(null);
  const [division, setDivision] = useState<Division | null>(null);
  const [season, setSeason] = useState<Season | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showPaymentHistory, setShowPaymentHistory] = useState(false);
  const [showAddPaymentModal, setShowAddPaymentModal] = useState(false);
  const [selectedTeamForPayment, setSelectedTeamForPayment] = useState<Team | null>(null);
  const [paymentHistory, setPaymentHistory] = useState<Payment[]>([]);
  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  
  // Para selectores
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [selectedSeasonId, setSelectedSeasonId] = useState<string>('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [filteredCategories, setFilteredCategories] = useState<Category[]>([]);
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [seasonsLoading, setSeasonsLoading] = useState(false);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');
  const [divisionFilter, setDivisionFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(25);

  // New payment
  const [newPayment, setNewPayment] = useState({
    amount: 0,
    date: new Date().toISOString().split('T')[0],
    method: 'cash' as Payment['method'],
    reference: '',
    notes: '',
    status: 'paid' as Payment['status']
  });

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
      phone: '',
      email: ''
    },
    notes: '',
  });

  useEffect(() => {
    // Leer parámetros de URL
    const page = searchParams.get('page');
    const search = searchParams.get('search');
    const status = searchParams.get('status');
    const payment = searchParams.get('payment');
    const division = searchParams.get('division');
    const category = searchParams.get('category');
    
    if (page) setCurrentPage(parseInt(page));
    if (search) setSearchTerm(search);
    if (status) setStatusFilter(status);
    if (payment) setPaymentFilter(payment);
    if (division) setDivisionFilter(division);
    if (category) setCategoryFilter(category);
    
    if (categoryId) {
      fetchData(categoryId);
    } else {
      fetchAllTeams();
    }
    
    if (!categoryId) {
      loadSeasons();
    }
  }, [categoryId]);

  useEffect(() => {
    updateURLParams();
  }, [searchTerm, statusFilter, paymentFilter, divisionFilter, categoryFilter, currentPage]);

  const updateURLParams = () => {
    const params = new URLSearchParams();
    
    if (searchTerm) params.set('search', searchTerm);
    if (statusFilter !== 'all') params.set('status', statusFilter);
    if (paymentFilter !== 'all') params.set('payment', paymentFilter);
    if (divisionFilter !== 'all') params.set('division', divisionFilter);
    if (categoryFilter !== 'all') params.set('category', categoryFilter);
    if (currentPage > 1) params.set('page', currentPage.toString());
    
    setSearchParams(params);
  };

  const fetchData = async (catId: string) => {
    try {
      setLoading(true);
      
      const categoryData = await categoriesService.getCategoryById(catId);
      if (!categoryData) {
        setNotification({ type: 'error', message: 'Categoría no encontrada' });
        navigate('/categorias');
        return;
      }
      
      setCategory(categoryData);
      
      if (categoryData.divisionId) {
        const divisionData = await divisionsService.getDivisionById(categoryData.divisionId);
        setDivision(divisionData);
      }
      
      if (categoryData.seasonId) {
        const seasonData = await seasonsService.getSeasonById(categoryData.seasonId);
        setSeason(seasonData);
      }
      
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
      setSeasons(seasonsData.filter(s => s.status !== 'archived'));
      
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
      
      // Al cargar categorías, también obtenemos las divisiones únicas
      const uniqueDivisions = getUniqueDivisions(categoriesData);
      setDivisions(uniqueDivisions);
      
      // Si hay un filtro de división, aplicarlo para filtrar categorías
      if (divisionFilter !== 'all') {
        const filtered = categoriesData.filter(cat => cat.divisionId === divisionFilter);
        setFilteredCategories(filtered);
      } else {
        setFilteredCategories(categoriesData);
      }
      
    } catch (error) {
      console.error('Error loading categories:', error);
      setNotification({ type: 'error', message: 'Error al cargar las categorías' });
    } finally {
      setCategoriesLoading(false);
    }
  };

  // Función para obtener divisiones únicas de las categorías
  const getUniqueDivisions = (categories: Category[]): Division[] => {
    const divisionMap = new Map<string, Division>();
    
    // Divisiones predefinidas
    const predefinedDivisions: Division[] = [
      {
        id: 'varonil',
        name: 'Varonil',
        description: 'División exclusiva para equipos masculinos',
        color: '#3b82f6',
        seasonId: '',
        order: 1,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'femenil',
        name: 'Femenil',
        description: 'División exclusiva para equipos femeninos',
        color: '#ec4899',
        seasonId: '',
        order: 2,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'mixto',
        name: 'Mixto',
        description: 'División para equipos mixtos',
        color: '#8b5cf6',
        seasonId: '',
        order: 3,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
    
    // Mapear divisiones reales desde las categorías
    categories.forEach(category => {
      if (category.divisionId && !divisionMap.has(category.divisionId)) {
        // Intentar determinar el nombre de la división basado en el ID
        let divisionName = category.divisionId;
        let divisionColor = '#6b7280';
        
        // Mapear IDs comunes a nombres más legibles
        if (category.divisionId.toLowerCase().includes('varonil') || category.divisionId.toLowerCase().includes('masculino')) {
          divisionName = 'Varonil';
          divisionColor = '#3b82f6';
        } else if (category.divisionId.toLowerCase().includes('femenil') || category.divisionId.toLowerCase().includes('femenino')) {
          divisionName = 'Femenil';
          divisionColor = '#ec4899';
        } else if (category.divisionId.toLowerCase().includes('mixto') || category.divisionId.toLowerCase().includes('mixta')) {
          divisionName = 'Mixto';
          divisionColor = '#8b5cf6';
        }
        
        divisionMap.set(category.divisionId, {
          id: category.divisionId,
          name: divisionName,
          description: '',
          color: divisionColor,
          seasonId: category.seasonId,
          order: divisionMap.size + 1,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
    });
    
    // Si no encontramos divisiones en las categorías, usar las predefinidas
    if (divisionMap.size === 0) {
      return predefinedDivisions;
    }
    
    // Convertir el mapa a array y ordenar
    return Array.from(divisionMap.values())
      .sort((a, b) => {
        // Ordenar: Varonil, Femenil, Mixto, luego otras
        const order = { 'varonil': 1, 'femenil': 2, 'mixto': 3 };
        const aOrder = order[a.name.toLowerCase() as keyof typeof order] || 4;
        const bOrder = order[b.name.toLowerCase() as keyof typeof order] || 4;
        return aOrder - bOrder;
      });
  };

  const handleSeasonChange = async (seasonId: string) => {
    setSelectedSeasonId(seasonId);
    setNewTeam({
      ...newTeam,
      seasonId,
      categoryId: '',
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

  const handleDivisionFilterChange = (divisionId: string) => {
    setDivisionFilter(divisionId);
    setCategoryFilter('all'); // Resetear filtro de categoría
    
    if (divisionId === 'all') {
      setFilteredCategories(categories);
    } else {
      const filtered = categories.filter(cat => cat.divisionId === divisionId);
      setFilteredCategories(filtered);
    }
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.match('image.*')) {
      setNotification({ type: 'error', message: 'Solo se permiten archivos de imagen' });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setNotification({ type: 'error', message: 'La imagen no debe superar 5MB' });
      return;
    }

    try {
      setUploadingLogo(true);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);

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
    if (!categoryId && !newTeam.categoryId) {
      setNotification({ type: 'error', message: 'Selecciona una categoría primero' });
      return;
    }

    if (!newTeam.name.trim()) {
      setNotification({ type: 'error', message: 'El nombre del equipo es obligatorio' });
      return;
    }

    try {
      const targetCategoryId = categoryId || newTeam.categoryId;
      
      if (!targetCategoryId) {
        setNotification({ type: 'error', message: 'No se pudo determinar la categoría' });
        return;
      }

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
        notes: newTeam.notes,
        playerCount: 0,
        registrationDate: new Date().toISOString(),
        status: 'pending' as const,
        paymentStatus: 'pending' as const,
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

      await teamsService.createTeam(teamData);
      
      setNotification({ type: 'success', message: 'Equipo creado exitosamente' });
      setShowCreateModal(false);
      resetForm();
      
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

  const handleAddPayment = async () => {
    if (!selectedTeamForPayment) return;

    try {
      const paymentData: Omit<Payment, 'id' | 'createdAt' | 'updatedAt'> = {
        teamId: selectedTeamForPayment.id,
        seasonId: selectedTeamForPayment.seasonId,
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
      const categoryPrice = await getCategoryPrice(selectedTeamForPayment.categoryId);
      const totalPayments = paymentHistory.reduce((sum, p) => sum + p.amount, 0) + newPayment.amount;
      
      if (totalPayments >= categoryPrice) {
        newPaymentStatus = 'paid';
      } else if (totalPayments > 0) {
        newPaymentStatus = 'partial';
      }
      
      await teamsService.updatePaymentStatus(selectedTeamForPayment.id, newPaymentStatus);
      
      setNotification({ type: 'success', message: 'Pago registrado exitosamente' });
      setShowAddPaymentModal(false);
      resetPaymentForm();
      
      // Refrescar historial
      if (selectedTeamForPayment) {
        fetchPaymentHistory(selectedTeamForPayment.id);
      }
    } catch (error) {
      console.error('Error adding payment:', error);
      setNotification({ type: 'error', message: 'Error al registrar el pago' });
    }
  };

  const fetchPaymentHistory = async (teamId: string) => {
    try {
      const payments = await paymentsService.getPaymentsByTeam(teamId);
      setPaymentHistory(payments);
    } catch (error) {
      console.error('Error fetching payment history:', error);
      setNotification({ type: 'error', message: 'Error al cargar el historial de pagos' });
    }
  };

  const getCategoryPrice = async (categoryId: string): Promise<number> => {
    try {
      const categoryData = await categoriesService.getCategoryById(categoryId);
      return categoryData?.price || 0;
    } catch {
      return 0;
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
        phone: '',
        email: ''
      },
      notes: '',
    });
    setLogoPreview(null);
    
    if (!categoryId) {
      const activeSeason = seasons.find(s => s.status === 'active') || seasons[0];
      if (activeSeason) {
        setSelectedSeasonId(activeSeason.id);
        loadCategories(activeSeason.id);
      }
    }
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

  // Filtrar equipos
  const filteredTeams = useMemo(() => {
    return teams.filter(team => {
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
      
      // Division filter
      if (divisionFilter !== 'all') {
        // Necesitamos obtener la división del equipo
        const teamDivision = divisions.find(d => d.id === team.divisionId);
        if (!teamDivision || teamDivision.id !== divisionFilter) {
          return false;
        }
      }
      
      // Category filter
      if (categoryFilter !== 'all' && team.categoryId !== categoryFilter) {
        return false;
      }
      
      return true;
    });
  }, [teams, searchTerm, statusFilter, paymentFilter, divisionFilter, categoryFilter, divisions]);

  // Pagination
  const totalPages = Math.ceil(filteredTeams.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedTeams = filteredTeams.slice(startIndex, startIndex + itemsPerPage);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setPaymentFilter('all');
    setDivisionFilter('all');
    setCategoryFilter('all');
    setFilteredCategories(categories);
    setCurrentPage(1);
    setSearchParams({});
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header con Jerarquía */}
      <div className="bg-white border-b border-gray-200 px-4 pt-4 pb-6">
        {/* Breadcrumbs */}
        <div className="flex items-center text-sm text-gray-600 mb-4 flex-wrap">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center hover:text-blue-600 transition-colors"
          >
            <HomeIcon className="w-4 h-4 mr-1" />
            Dashboard
          </button>
          <ChevronRightIcon className="w-4 h-4 mx-2" />
          <button
            onClick={() => navigate('/categorias')}
            className="flex items-center hover:text-blue-600 transition-colors"
          >
            <TagIcon className="w-4 h-4 mr-1" />
            Categorías
          </button>
          {categoryId && category && (
            <>
              <ChevronRightIcon className="w-4 h-4 mx-2" />
              <span className="font-medium text-blue-600 flex items-center">
                <TrophyIcon className="w-4 h-4 mr-1" />
                Equipos - Cat. {category.name}
              </span>
            </>
          )}
          {!categoryId && (
            <>
              <ChevronRightIcon className="w-4 h-4 mx-2" />
              <span className="font-medium text-blue-600 flex items-center">
                <TrophyIcon className="w-4 h-4 mr-1" />
                Todos los Equipos
              </span>
            </>
          )}
        </div>

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
                  
                  {/* Jerarquía */}
                  <div className="flex items-center mt-2 space-x-4">
                    {season && (
                      <div className="flex items-center bg-white border border-gray-200 rounded-lg px-3 py-1.5">
                        <CalendarIcon className="w-4 h-4 text-gray-500 mr-2" />
                        <span className="text-sm font-medium text-gray-900">{season.name}</span>
                      </div>
                    )}
                    
                    {division && (
                      <>
                        <ChevronRightIcon className="w-4 h-4 text-gray-400" />
                        <div className="flex items-center bg-white border border-gray-200 rounded-lg px-3 py-1.5">
                          <div
                            className="w-3 h-3 rounded-full mr-2"
                            style={{ backgroundColor: division.color }}
                          />
                          <span className="text-sm font-medium text-gray-900">{division.name}</span>
                        </div>
                      </>
                    )}
                    
                    {category && (
                      <>
                        <ChevronRightIcon className="w-4 h-4 text-gray-400" />
                        <div className="flex items-center bg-blue-50 border border-blue-200 rounded-lg px-3 py-1.5">
                          <TagIcon className="w-4 h-4 text-blue-600 mr-2" />
                          <span className="text-sm font-medium text-blue-700">Cat. {category.name}</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Todos los Equipos</h1>
                <div className="flex items-center space-x-2 mt-2">
                  <span className="text-sm text-gray-600">{teams.length} equipos registrados</span>
                  {filteredTeams.length !== teams.length && (
                    <span className="text-sm text-blue-600">
                      ({filteredTeams.length} filtrados)
                    </span>
                  )}
                </div>
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

        {/* Search and Filters */}
        <div className="space-y-3">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar equipos por nombre o entrenador..."
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

          <div className="flex items-center justify-between">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center px-4 py-2 rounded-lg ${
                showFilters ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-700'
              }`}
            >
              <FunnelIcon className="w-4 h-4 mr-2" />
              Filtros Avanzados
            </button>
            
            {(searchTerm || statusFilter !== 'all' || paymentFilter !== 'all' || 
              divisionFilter !== 'all' || categoryFilter !== 'all') && (
              <button
                onClick={clearFilters}
                className="flex items-center px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowPathIcon className="w-4 h-4 mr-1" />
                Limpiar Filtros
              </button>
            )}
          </div>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="mt-4 space-y-3 bg-gray-50 rounded-xl p-4">
            {/* Division Filter */}
            {!categoryId && divisions.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Filtrar por División
                </label>
                <select
                  value={divisionFilter}
                  onChange={(e) => handleDivisionFilterChange(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="all">Todas las divisiones</option>
                  {divisions.map((div) => (
                    <option key={div.id} value={div.id}>
                      {div.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Category Filter */}
            {!categoryId && filteredCategories.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Filtrar por Categoría
                </label>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  disabled={divisionFilter === 'all' || filteredCategories.length === 0}
                >
                  <option value="all">
                    {divisionFilter === 'all' 
                      ? 'Selecciona una división primero' 
                      : `Todas las categorías (${filteredCategories.length})`}
                  </option>
                  {filteredCategories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      Cat. {cat.name} (Nivel {cat.level})
                    </option>
                  ))}
                </select>
                {divisionFilter !== 'all' && filteredCategories.length === 0 && (
                  <p className="text-xs text-gray-500 mt-1">
                    No hay categorías en esta división para la temporada seleccionada
                  </p>
                )}
              </div>
            )}

            {/* Status and Payment Filters */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Estado del Equipo
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="all">Todos los estados</option>
                  <option value="pending">Pendiente</option>
                  <option value="approved">Aprobado</option>
                  <option value="active">Activo</option>
                  <option value="suspended">Suspendido</option>
                  <option value="rejected">Rechazado</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Estado de Pago
                </label>
                <select
                  value={paymentFilter}
                  onChange={(e) => setPaymentFilter(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="all">Todos los estados</option>
                  <option value="pending">Pendiente</option>
                  <option value="partial">Parcial</option>
                  <option value="paid">Pagado</option>
                  <option value="overdue">Vencido</option>
                </select>
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

      {/* Teams List */}
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
          <>
            <div className="space-y-3">
              {paginatedTeams.map((team) => (
                <div
                  key={team.id}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:border-blue-300 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 border-2"
                        style={{ 
                          backgroundColor: team.primaryColor || '#3b82f6',
                          borderColor: team.secondaryColor || '#f3f4f6'
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
                        onClick={() => {
                          setSelectedTeamForPayment(team);
                          fetchPaymentHistory(team.id);
                          setShowPaymentHistory(true);
                        }}
                        className="text-sm text-blue-600 hover:text-blue-800"
                      >
                        <div className="flex items-center">
                          <BanknotesIcon className="w-4 h-4 mr-1" />
                          Pagos
                        </div>
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

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-6 flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Mostrando {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredTeams.length)} de {filteredTeams.length} equipos
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handlePageChange(1)}
                    disabled={currentPage === 1}
                    className="p-2 text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronDoubleLeftIcon className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="p-2 text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeftIcon className="w-5 h-5" />
                  </button>
                  
                  <div className="flex items-center space-x-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      
                      return (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          className={`w-10 h-10 rounded-lg ${
                            currentPage === pageNum
                              ? 'bg-blue-600 text-white'
                              : 'text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>
                  
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="p-2 text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handlePageChange(totalPages)}
                    disabled={currentPage === totalPages}
                    className="p-2 text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronDoubleRightIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Create Team Modal */}
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
          {/* Selector de Temporada */}
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
                          {cat.name} (Nivel {cat.level}) - ${cat.price.toLocaleString()}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  Selecciona la categoría donde competirá el equipo
                </p>
              </div>

              {/* Info de categoría seleccionada */}
              {newTeam.categoryId && categories.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <div className="flex items-start">
                    <TrophyIcon className="w-5 h-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-blue-900 mb-1">
                        Información de la categoría:
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
                                <span className="font-medium">Categoría:</span> {selectedCat.name} (Nivel {selectedCat.level})
                              </p>
                              {selectedCat.price && (
                                <p className="text-sm text-blue-700">
                                  <span className="font-medium">Precio de inscripción:</span> ${selectedCat.price.toLocaleString()}
                                </p>
                              )}
                              <p className="text-sm text-blue-700">
                                <span className="font-medium">Límite de equipos:</span> {selectedCat.teamLimit}
                              </p>
                              <p className="text-sm text-blue-700">
                                <span className="font-medium">Jugadores por equipo:</span> {selectedCat.playerLimit}
                              </p>
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

          {/* Información del Entrenador */}
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
                  placeholder="email@ejemplo.com"
                />
              </div>
            </div>
          </div>

          {/* Notas Adicionales */}
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

      {/* Payment History Modal */}
      <Modal
        isOpen={showPaymentHistory}
        onClose={() => {
          setShowPaymentHistory(false);
          setSelectedTeamForPayment(null);
          setPaymentHistory([]);
        }}
        title="Historial de Pagos"
        size="lg"
      >
        {selectedTeamForPayment && (
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">{selectedTeamForPayment.name}</h3>
                  <p className="text-sm text-gray-600">
                    Estado de pago: <span className={`font-medium ${getPaymentColor(selectedTeamForPayment.paymentStatus)} px-2 py-1 rounded-full`}>
                      {selectedTeamForPayment.paymentStatus === 'paid' ? 'Pagado' :
                       selectedTeamForPayment.paymentStatus === 'partial' ? 'Parcial' :
                       selectedTeamForPayment.paymentStatus === 'pending' ? 'Pendiente' : 'Vencido'}
                    </span>
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowAddPaymentModal(true);
                    setShowPaymentHistory(false);
                  }}
                  className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <DocumentPlusIcon className="w-5 h-5 mr-2" />
                  Registrar Pago
                </button>
              </div>
            </div>

            {paymentHistory.length === 0 ? (
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
                    Total: ${paymentHistory.reduce((sum, p) => sum + p.amount, 0).toLocaleString()}
                  </span>
                </div>
                
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {paymentHistory.map((payment) => (
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
        title="Registrar Nuevo Pago"
        size="md"
      >
        {selectedTeamForPayment && (
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">{selectedTeamForPayment.name}</h3>
                  <p className="text-sm text-gray-600">Equipo seleccionado</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Total pagado:</p>
                  <p className="text-lg font-bold text-green-600">
                    ${paymentHistory.reduce((sum, p) => sum + p.amount, 0).toLocaleString()}
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
    </div>
  );
};

export default Teams;