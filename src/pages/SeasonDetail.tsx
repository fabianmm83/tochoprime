import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { 
  seasonsService, 
  divisionsService, 
  categoriesService 
} from '../services/firestore';
import { Season, Division, Category } from '../types';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Notification from '../components/common/Notification';
import Modal from '../components/common/Modal';
import { 
  ArrowLeftIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  UserGroupIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  ChevronRightIcon,
  TagIcon,
  BuildingLibraryIcon,
  ArrowTopRightOnSquareIcon,
  PencilIcon,
  DocumentDuplicateIcon,
  ArchiveBoxIcon,
  TrashIcon,
  PlusIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline';

const SeasonDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [season, setSeason] = useState<Season | null>(null);
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'divisions' | 'categories' | 'settings'>('overview');
  const [expandedDivision, setExpandedDivision] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [showActionsDropdown, setShowActionsDropdown] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    basePrice: 2000,
    rules: [] as string[],
  });

  useEffect(() => {
    if (id) {
      fetchSeasonData(id);
      
      // Check if edit mode is requested
      if (searchParams.get('edit') === 'true') {
        setShowEditModal(true);
      }
    } else {
      navigate('/temporadas');
    }
  }, [id, navigate, searchParams]);

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = () => {
      if (showActionsDropdown) {
        setShowActionsDropdown(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [showActionsDropdown]);

  const fetchSeasonData = async (seasonId: string) => {
    try {
      setLoading(true);
      
      // Fetch season
      const seasonData = await seasonsService.getSeasonById(seasonId);
      if (!seasonData) {
        navigate('/temporadas');
        return;
      }
      setSeason(seasonData);
      
      // Initialize edit form
      setEditForm({
        name: seasonData.name,
        description: seasonData.description || '',
        basePrice: seasonData.priceConfiguration?.basePrice || 2000,
        rules: seasonData.rules || [],
      });

      // Fetch divisions for this season
      const divisionsData = await divisionsService.getDivisionsBySeason(seasonId);
      setDivisions(divisionsData);

      // Fetch categories for all divisions
      const allCategories: Category[] = [];
      for (const division of divisionsData) {
        const divisionCategories = await categoriesService.getCategoriesByDivision(division.id);
        // Añadimos información de la división a cada categoría
        allCategories.push(...divisionCategories.map(cat => ({
          ...cat,
          divisionName: division.name,
          divisionColor: division.color
        })));
      }
      setCategories(allCategories);

    } catch (error) {
      console.error('Error fetching season data:', error);
      setNotification({ type: 'error', message: 'Error al cargar los datos de la temporada' });
    } finally {
      setLoading(false);
    }
  };

  const handleActivateSeason = async () => {
    if (!season) return;

    try {
      await seasonsService.updateSeason(season.id, { 
        status: 'active',
        isActive: true 
      });
      setNotification({ type: 'success', message: 'Temporada activada exitosamente' });
      fetchSeasonData(season.id);
    } catch (error) {
      console.error('Error activating season:', error);
      setNotification({ type: 'error', message: 'Error al activar la temporada' });
    }
  };

  const handleUpdateSeason = async () => {
    if (!season) return;

    try {
      await seasonsService.updateSeason(season.id, {
        name: editForm.name,
        description: editForm.description,
        priceConfiguration: {
          ...season.priceConfiguration,
          basePrice: editForm.basePrice,
          // Sin descuentos por ahora
          earlyBirdDiscount: 0,
          teamDiscounts: [],
        },
        rules: editForm.rules.filter(rule => rule.trim() !== ''),
        updatedAt: new Date(),
      });

      setNotification({ type: 'success', message: 'Temporada actualizada exitosamente' });
      setShowEditModal(false);
      fetchSeasonData(season.id);
    } catch (error) {
      console.error('Error updating season:', error);
      setNotification({ type: 'error', message: 'Error al actualizar la temporada' });
    }
  };

  const handleDuplicateSeason = async () => {
    if (!season) return;

    try {
      const newName = `${season.name} - Copia`;
      const newSeasonId = await seasonsService.duplicateSeason(season.id, newName);
      
      setNotification({ type: 'success', message: 'Temporada duplicada exitosamente' });
      setShowDuplicateModal(false);
      
      // Navegar a la nueva temporada
      navigate(`/temporadas/${newSeasonId}`);
    } catch (error) {
      console.error('Error duplicating season:', error);
      setNotification({ type: 'error', message: 'Error al duplicar la temporada' });
    }
  };

  const handleArchiveSeason = async () => {
    if (!season) return;

    try {
      await seasonsService.archiveSeason(season.id);
      setNotification({ type: 'success', message: 'Temporada archivada exitosamente' });
      setShowArchiveModal(false);
      fetchSeasonData(season.id);
    } catch (error) {
      console.error('Error archiving season:', error);
      setNotification({ type: 'error', message: 'Error al archivar la temporada' });
    }
  };

  const handleDeleteSeason = async () => {
    if (!season) return;

    try {
      await seasonsService.deleteSeason(season.id);
      
      setNotification({ type: 'success', message: 'Temporada eliminada exitosamente' });
      setShowDeleteModal(false);
      navigate('/temporadas');
      
    } catch (error) {
      console.error('Error deleting season:', error);
      setNotification({ type: 'error', message: 'Error al eliminar la temporada' });
    }
  };

  const handleCreateDefaultDivisions = async () => {
    if (!season) return;

    try {
      await divisionsService.createDefaultDivisions(season.id);
      setNotification({ type: 'success', message: 'Divisiones predeterminadas creadas exitosamente' });
      fetchSeasonData(season.id);
    } catch (error) {
      console.error('Error creating default divisions:', error);
      setNotification({ type: 'error', message: 'Error al crear divisiones predeterminadas' });
    }
  };

  const toggleDivision = (divisionId: string) => {
    setExpandedDivision(expandedDivision === divisionId ? null : divisionId);
  };

  const getCategoriesByDivision = (divisionId: string) => {
    return categories.filter(cat => cat.divisionId === divisionId);
  };

  const getCategoryColor = (level: number) => {
    const colors = [
      'bg-red-100 text-red-800',
      'bg-orange-100 text-orange-800',
      'bg-yellow-100 text-yellow-800',
      'bg-green-100 text-green-800',
      'bg-blue-100 text-blue-800',
      'bg-indigo-100 text-indigo-800',
      'bg-purple-100 text-purple-800',
    ];
    return colors[level - 1] || 'bg-gray-100 text-gray-800';
  };

  const formatDate = (date: Date | string) => {
    if (!date) return 'No definida';
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('es-MX', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!season) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Temporada no encontrada</h2>
          <button
            onClick={() => navigate('/temporadas')}
            className="mt-4 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <ArrowLeftIcon className="w-5 h-5 mr-2" />
            Volver a Temporadas
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div className="flex items-center">
          <button
            onClick={() => navigate('/temporadas')}
            className="mr-4 p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeftIcon className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center space-x-3">
              <h1 className="text-3xl font-bold text-gray-900">{season.name}</h1>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                season.status === 'active' ? 'bg-green-100 text-green-800' :
                season.status === 'upcoming' ? 'bg-blue-100 text-blue-800' :
                season.status === 'completed' ? 'bg-gray-100 text-gray-800' :
                'bg-purple-100 text-purple-800'
              }`}>
                {season.status === 'active' ? 'Activa' :
                 season.status === 'upcoming' ? 'Próxima' :
                 season.status === 'completed' ? 'Completada' : 'Archivada'}
              </span>
            </div>
            <p className="text-gray-600 mt-2">{season.description}</p>
          </div>
        </div>

        <div className="flex items-center space-x-2 mt-4 md:mt-0">
          {season.status === 'upcoming' && (
            <button
              onClick={handleActivateSeason}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <CheckCircleIcon className="w-5 h-5 mr-2" />
              Activar Temporada
            </button>
          )}

          {/* Actions Dropdown */}
          <div className="relative">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setShowActionsDropdown(!showActionsDropdown);
              }}
              className="flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Acciones
              <svg 
                className={`w-5 h-5 ml-2 transition-transform ${showActionsDropdown ? 'rotate-180' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {showActionsDropdown && (
              <div 
                className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="py-1">
                  <button
                    onClick={() => {
                      setShowEditModal(true);
                      setShowActionsDropdown(false);
                    }}
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    <PencilIcon className="w-4 h-4 mr-3" />
                    Editar Temporada
                  </button>
                  
                  <button
                    onClick={() => {
                      setShowDuplicateModal(true);
                      setShowActionsDropdown(false);
                    }}
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    <DocumentDuplicateIcon className="w-4 h-4 mr-3" />
                    Duplicar
                  </button>
                  
                  {season.status !== 'archived' && (
                    <button
                      onClick={() => {
                        setShowArchiveModal(true);
                        setShowActionsDropdown(false);
                      }}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      <ArchiveBoxIcon className="w-4 h-4 mr-3" />
                      Archivar
                    </button>
                  )}
                  
                  <div className="border-t border-gray-200 my-1"></div>
                  
                  <button
                    onClick={() => {
                      setShowDeleteModal(true);
                      setShowActionsDropdown(false);
                    }}
                    className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <TrashIcon className="w-4 h-4 mr-3" />
                    Eliminar
                  </button>
                </div>
              </div>
            )}
          </div>
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

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-8">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'overview'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Resumen
          </button>
          <button
            onClick={() => setActiveTab('divisions')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'divisions'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Divisiones ({divisions.length})
          </button>
          <button
            onClick={() => setActiveTab('categories')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'categories'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Categorías ({categories.length})
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'settings'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Configuración
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <CalendarIcon className="w-6 h-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Duración</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {Math.ceil((new Date(season.endDate).getTime() - new Date(season.startDate).getTime()) / (1000 * 3600 * 24))} días
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <UserGroupIcon className="w-6 h-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Divisiones</p>
                  <p className="text-2xl font-semibold text-gray-900">{divisions.length}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="p-3 bg-green-100 rounded-lg">
                  <TagIcon className="w-6 h-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Categorías</p>
                  <p className="text-2xl font-semibold text-gray-900">{categories.length}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="p-3 bg-yellow-100 rounded-lg">
                  <CurrencyDollarIcon className="w-6 h-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Precio Base</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    ${season.priceConfiguration?.basePrice || 0}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Season Details */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column: Basic Info */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Información General</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Fechas</p>
                  <div className="mt-1 space-y-1">
                    <p className="text-sm">
                      <span className="font-medium">Inicio:</span> {formatDate(season.startDate)}
                    </p>
                    <p className="text-sm">
                      <span className="font-medium">Fin:</span> {formatDate(season.endDate)}
                    </p>
                    {season.registrationDeadline && (
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Límite registro:</span> {formatDate(season.registrationDeadline)}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-500">Estado</p>
                  <div className="mt-1 flex items-center">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      season.status === 'active' ? 'bg-green-100 text-green-800' :
                      season.status === 'upcoming' ? 'bg-blue-100 text-blue-800' :
                      season.status === 'completed' ? 'bg-gray-100 text-gray-800' :
                      'bg-purple-100 text-purple-800'
                    }`}>
                      {season.status === 'active' ? 'Activa' :
                       season.status === 'upcoming' ? 'Próxima' :
                       season.status === 'completed' ? 'Completada' : 'Archivada'}
                    </span>
                    <span className="ml-2 text-sm text-gray-600">
                      {season.isActive ? 'Actualmente activa' : 'No activa'}
                    </span>
                  </div>
                </div>

                {season.description && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Descripción</p>
                    <p className="mt-1 text-sm text-gray-900">{season.description}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Financial Info */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Configuración Financiera</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Precio por Equipo</p>
                  <div className="mt-1">
                    <p className="text-3xl font-bold text-gray-900">
                      ${season.priceConfiguration?.basePrice || 0}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">Precio único para todos los equipos</p>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <p className="text-sm font-medium text-gray-500 mb-2">Descuentos</p>
                  <div className="text-center py-6 border border-dashed border-gray-300 rounded-lg">
                    <CurrencyDollarIcon className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600 font-medium">No hay descuentos configurados</p>
                    <p className="text-sm text-gray-500 mt-1">
                      Todos los equipos pagan el mismo precio
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Structure Visualization */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Estructura de la Temporada</h3>
            </div>
            <div className="p-6">
              <div className="space-y-6">
                {/* Season */}
                <div className="flex items-center p-4 bg-blue-50 rounded-lg">
                  <div className="p-3 bg-blue-600 rounded-lg">
                    <CalendarIcon className="w-6 h-6 text-white" />
                  </div>
                  <div className="ml-4">
                    <h4 className="font-semibold text-blue-900">{season.name}</h4>
                    <p className="text-sm text-blue-700">{season.description}</p>
                  </div>
                  <div className="ml-auto">
                    <span className="text-sm text-blue-600">{divisions.length} divisiones</span>
                  </div>
                </div>

                {/* Arrow */}
                <div className="flex justify-center">
                  <div className="w-0.5 h-8 bg-gray-300"></div>
                </div>

                {/* Divisions */}
                <div className="space-y-4">
                  {divisions.map((division) => (
                    <div key={division.id} className="space-y-2">
                      <div className="flex items-center p-4 bg-gray-50 rounded-lg">
                        <div
                          className="w-4 h-4 rounded-full mr-3"
                          style={{ backgroundColor: division.color }}
                        />
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900">{division.name}</h4>
                          <p className="text-sm text-gray-600">{division.description}</p>
                        </div>
                        <button
                          onClick={() => toggleDivision(division.id)}
                          className="ml-4 p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded-lg transition-colors"
                        >
                          <ChevronRightIcon className={`w-5 h-5 transition-transform ${
                            expandedDivision === division.id ? 'rotate-90' : ''
                          }`} />
                        </button>
                      </div>

                      {/* Categories of this division */}
                      {expandedDivision === division.id && (
                        <div className="ml-8 space-y-2">
                          {getCategoriesByDivision(division.id).map(category => (
                            <div key={category.id} className="flex items-center p-3 bg-white border border-gray-200 rounded-lg">
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${getCategoryColor(category.level)} mr-3`}>
                                Categoría {category.name}
                              </span>
                              <span className="text-sm text-gray-600">
                                ${category.price} • {category.teamLimit} equipos máx.
                              </span>
                              <button
                                onClick={() => navigate(`/divisiones/${division.id}/categorias`)}
                                className="ml-auto p-1 text-gray-400 hover:text-blue-600"
                                title="Gestionar categoría"
                              >
                                <ArrowTopRightOnSquareIcon className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                          
                          {getCategoriesByDivision(division.id).length === 0 && (
                            <div className="text-center py-4 border border-dashed border-gray-300 rounded-lg">
                              <p className="text-gray-500 text-sm">Sin categorías configuradas</p>
                              <button
                                onClick={() => navigate(`/divisiones/${division.id}/categorias`)}
                                className="mt-2 text-sm text-blue-600 hover:text-blue-700"
                              >
                                + Crear categorías
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'divisions' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">Divisiones de {season.name}</h2>
            <div className="flex space-x-2">
              <button
                onClick={handleCreateDefaultDivisions}
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <PlusIcon className="w-5 h-5 mr-2" />
                Crear Divisiones Predeterminadas
              </button>
              <button
                onClick={() => navigate(`/temporadas/${season.id}/divisiones/nueva`)}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <PlusIcon className="w-5 h-5 mr-2" />
                Nueva División
              </button>
            </div>
          </div>

          {divisions.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-xl">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                <UserGroupIcon className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No hay divisiones</h3>
              <p className="text-gray-600 mb-6">
                Crea divisiones para organizar los equipos por género o nivel de competencia.
              </p>
              <div className="space-x-3">
                <button
                  onClick={handleCreateDefaultDivisions}
                  className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <PlusIcon className="w-5 h-5 mr-2" />
                  Crear Divisiones Predeterminadas
                </button>
                <button
                  onClick={() => navigate(`/temporadas/${season.id}/divisiones/nueva`)}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Crear División Personalizada
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {divisions.map((division) => (
                <div
                  key={division.id}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
                >
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center">
                        <div
                          className="w-4 h-4 rounded-full mr-3"
                          style={{ backgroundColor: division.color }}
                        />
                        <h3 className="text-lg font-semibold text-gray-900">{division.name}</h3>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        division.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {division.isActive ? 'Activa' : 'Inactiva'}
                      </span>
                    </div>

                    <p className="text-gray-600 text-sm mb-4">{division.description}</p>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-gray-500">Equipos Máx.</p>
                        <p className="text-sm font-semibold text-gray-900">{division.teamLimit || 'Sin límite'}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-gray-500">Categorías</p>
                        <p className="text-sm font-semibold text-gray-900">
                          {getCategoriesByDivision(division.id).length}
                        </p>
                      </div>
                    </div>

                    {division.rules && division.rules.length > 0 && (
                      <div className="mb-4">
                        <p className="text-xs font-medium text-gray-500 mb-1">Reglas</p>
                        <ul className="text-sm text-gray-600 space-y-1">
                          {division.rules.slice(0, 2).map((rule, index) => (
                            <li key={index} className="truncate">• {rule}</li>
                          ))}
                          {division.rules.length > 2 && (
                            <li className="text-blue-600">+{division.rules.length - 2} más</li>
                          )}
                        </ul>
                      </div>
                    )}

                    <div className="flex space-x-3 pt-4 border-t border-gray-100">
                      <button
                        onClick={() => navigate(`/divisiones/${division.id}/categorias`)}
                        className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                      >
                        Gestionar Categorías
                      </button>
                      <button
                        onClick={() => navigate(`/divisiones/${division.id}`)}
                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                      >
                        Detalles
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'categories' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">
              Todas las Categorías ({categories.length})
            </h2>
            <button
              onClick={() => navigate('/categorias')}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <PlusIcon className="w-5 h-5 mr-2" />
              Nueva Categoría
            </button>
          </div>

          {categories.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-xl">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                <TagIcon className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No hay categorías</h3>
              <p className="text-gray-600 mb-6">
                Las categorías se organizan por nivel dentro de cada división.
              </p>
              <button
                onClick={() => {
                  setActiveTab('divisions');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Ir a Divisiones
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Categoría
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        División
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Nivel
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Precio
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Equipos Máx.
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Estado
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {categories.map((category) => (
                      <tr key={category.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <span className={`inline-flex items-center justify-center w-8 h-8 rounded-md ${getCategoryColor(category.level)} font-bold`}>
                              {category.name}
                            </span>
                            <div className="ml-3">
                              <div className="text-sm font-medium text-gray-900">
                                Categoría {category.name}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div
                              className="w-3 h-3 rounded-full mr-2"
                              style={{ backgroundColor: (category as any).divisionColor || '#6b7280' }}
                            />
                            <span className="text-sm text-gray-900">{(category as any).divisionName}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-900">{category.level}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-semibold text-green-600">${category.price}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-900">{category.teamLimit}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            category.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {category.isActive ? 'Activa' : 'Inactiva'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <button
                            onClick={() => navigate(`/categorias/${category.id}`)}
                            className="text-blue-600 hover:text-blue-900 mr-3"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => navigate(`/divisiones/${category.divisionId}/categorias`)}
                            className="text-gray-600 hover:text-gray-900"
                          >
                            Ver División
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="space-y-6">
          {/* Financial Configuration */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">Configuración Financiera</h3>
                <button
                  onClick={() => setShowEditModal(true)}
                  className="flex items-center px-3 py-1 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <PencilIcon className="w-4 h-4 mr-1" />
                  Editar Precio
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Precio Base por Equipo ($)
                    </label>
                    <div className="text-3xl font-bold text-gray-900">
                      ${season.priceConfiguration?.basePrice || 0}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      Precio único para todos los equipos registrados
                    </p>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Política de Descuentos
                  </label>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">Sin descuentos aplicados</p>
                        <p className="text-sm text-gray-600">Precio uniforme para todos</p>
                      </div>
                      <span className="text-lg font-semibold text-gray-400">-</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Season Rules */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">Reglas de la Temporada</h3>
                <button
                  onClick={() => setShowEditModal(true)}
                  className="flex items-center px-3 py-1 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <PencilIcon className="w-4 h-4 mr-1" />
                  Editar Reglas
                </button>
              </div>
            </div>
            <div className="p-6">
              {season.rules && season.rules.length > 0 ? (
                <ul className="space-y-3">
                  {season.rules.map((rule, index) => (
                    <li key={index} className="flex items-start">
                      <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full bg-blue-100 text-blue-600 mt-0.5">
                        {index + 1}
                      </div>
                      <p className="ml-3 text-gray-900">{rule}</p>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-center py-8">
                  <DocumentTextIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500">No hay reglas definidas para esta temporada</p>
                  <button
                    onClick={() => setShowEditModal(true)}
                    className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
                  >
                    + Agregar reglas
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Season Status */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Estado de la Temporada</h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-500">Estado Actual</p>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                    season.status === 'active' ? 'bg-green-100 text-green-800' :
                    season.status === 'upcoming' ? 'bg-blue-100 text-blue-800' :
                    season.status === 'completed' ? 'bg-gray-100 text-gray-800' :
                    'bg-purple-100 text-purple-800'
                  }`}>
                    {season.status === 'active' ? 'Activa' :
                     season.status === 'upcoming' ? 'Próxima' :
                     season.status === 'completed' ? 'Completada' : 'Archivada'}
                  </span>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-500">Activa</p>
                  <div className="flex items-center">
                    {season.isActive ? (
                      <>
                        <CheckCircleIcon className="w-5 h-5 text-green-500 mr-2" />
                        <span className="text-green-700">Sí</span>
                      </>
                    ) : (
                      <>
                        <ExclamationCircleIcon className="w-5 h-5 text-yellow-500 mr-2" />
                        <span className="text-yellow-700">No</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-500">Creada</p>
                  <p className="text-sm text-gray-900">{formatDate(season.createdAt)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="bg-white rounded-xl shadow-sm border border-red-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-red-200 bg-red-50">
              <h3 className="text-lg font-semibold text-red-900">Zona de Peligro</h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-red-800 mb-2">Archivar Temporada</h4>
                  <p className="text-sm text-gray-600 mb-3">
                    Archivará la temporada y la moverá a la sección de archivadas. Los datos se mantendrán pero no se podrán modificar.
                  </p>
                  <button
                    onClick={() => setShowArchiveModal(true)}
                    className="flex items-center px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition-colors"
                  >
                    <ArchiveBoxIcon className="w-5 h-5 mr-2" />
                    Archivar Temporada
                  </button>
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <h4 className="font-medium text-red-800 mb-2">Eliminar Permanentemente</h4>
                  <p className="text-sm text-gray-600 mb-3">
                    Eliminará la temporada y todos los datos asociados (divisiones, categorías, equipos, etc.). Esta acción no se puede deshacer.
                  </p>
                  <button
                    onClick={() => setShowDeleteModal(true)}
                    className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    <TrashIcon className="w-5 h-5 mr-2" />
                    Eliminar Temporada
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Editar Temporada"
        size="lg"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre de la Temporada *
            </label>
            <input
              type="text"
              value={editForm.name}
              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descripción
            </label>
            <textarea
              value={editForm.description}
              onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Precio Base por Equipo ($)
            </label>
            <input
              type="number"
              value={editForm.basePrice}
              onChange={(e) => setEditForm({ ...editForm, basePrice: Number(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              min="0"
              step="50"
            />
            <p className="text-xs text-gray-500 mt-1">
              Precio que pagará cada equipo para participar en la temporada
            </p>
          </div>

          {/* Rules */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Reglas de la Temporada (Opcional)
              </label>
              <button
                type="button"
                onClick={() => setEditForm({ ...editForm, rules: [...editForm.rules, ''] })}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                + Agregar Regla
              </button>
            </div>
            <div className="space-y-2">
              {editForm.rules.map((rule, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={rule}
                    onChange={(e) => {
                      const newRules = [...editForm.rules];
                      newRules[index] = e.target.value;
                      setEditForm({ ...editForm, rules: newRules });
                    }}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Ej: Todos los jugadores deben estar registrados"
                  />
                  {editForm.rules.length > 1 && (
                    <button
                      type="button"
                      onClick={() => {
                        const newRules = editForm.rules.filter((_, i) => i !== index);
                        setEditForm({ ...editForm, rules: newRules });
                      }}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              onClick={() => setShowEditModal(false)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleUpdateSeason}
              disabled={!editForm.name}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Guardar Cambios
            </button>
          </div>
        </div>
      </Modal>

      {/* Duplicate Modal */}
      <Modal
        isOpen={showDuplicateModal}
        onClose={() => setShowDuplicateModal(false)}
        title="Duplicar Temporada"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            ¿Deseas duplicar la temporada <span className="font-semibold">{season?.name}</span>?
            Se crearán copias de todas las configuraciones excepto los datos específicos de equipos y partidos.
          </p>
          <p className="text-sm text-gray-500">
            La nueva temporada se creará con estado "Próxima" y deberás activarla manualmente.
          </p>
          <div className="flex justify-end space-x-3 pt-4">
            <button
              onClick={() => setShowDuplicateModal(false)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleDuplicateSeason}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              Duplicar Temporada
            </button>
          </div>
        </div>
      </Modal>

      {/* Archive Modal */}
      <Modal
        isOpen={showArchiveModal}
        onClose={() => setShowArchiveModal(false)}
        title="Archivar Temporada"
        size="md"
      >
        <div className="space-y-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex">
              <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">¿Archivar temporada?</h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>
                    La temporada "{season?.name}" será archivada. Esto significa que:
                  </p>
                  <ul className="list-disc pl-5 mt-2 space-y-1">
                    <li>No aparecerá en la lista principal de temporadas</li>
                    <li>No se podrán hacer modificaciones</li>
                    <li>Los datos se mantendrán para consultas históricas</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              onClick={() => setShowArchiveModal(false)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleArchiveSeason}
              className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
            >
              Archivar Temporada
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Eliminar Temporada"
        size="md"
      >
        <div className="space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">¡Atención! Esta acción no se puede deshacer</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>
                    Estás a punto de eliminar permanentemente la temporada "{season?.name}".
                    Todos los datos asociados también serán eliminados.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="text-sm text-gray-600">
            <p className="font-medium">Información que será eliminada:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Datos de la temporada</li>
              <li>{divisions.length} divisiones</li>
              <li>{categories.length} categorías</li>
              <li>Equipos registrados</li>
              <li>Partidos programados</li>
              <li>Estadísticas y resultados</li>
            </ul>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              onClick={() => setShowDeleteModal(false)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleDeleteSeason}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Eliminar Permanentemente
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default SeasonDetail;