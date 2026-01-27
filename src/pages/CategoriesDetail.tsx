import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { categoriesService, seasonsService, divisionsService } from '../services/firestore';
import { Category, Season, Division } from '../types';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Notification from '../components/common/Notification';
import { 
  ArrowLeftIcon, 
  TagIcon, 
  PlusIcon,
  ChevronRightIcon,
  CurrencyDollarIcon,
  UserGroupIcon,
  CalendarIcon,
  EyeIcon,
  HomeIcon,
  BuildingLibraryIcon,
  PencilIcon,
  TrashIcon,
  ExclamationTriangleIcon,
  ArrowUpTrayIcon,
  FunnelIcon,
  ArrowsUpDownIcon,
  MagnifyingGlassIcon,
  ChevronUpDownIcon,
  CheckCircleIcon,
  XCircleIcon,
  TableCellsIcon,
  Squares2X2Icon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

const CategoriesDetail: React.FC = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [filteredCategories, setFilteredCategories] = useState<Category[]>([]);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [selectedSeasonId, setSelectedSeasonId] = useState<string>('');
  const [selectedDivisionId, setSelectedDivisionId] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: keyof Category; direction: 'asc' | 'desc' } | null>(null);

  useEffect(() => {
    fetchSeasons();
  }, []);

  useEffect(() => {
    if (selectedSeasonId) {
      fetchDivisionsBySeason(selectedSeasonId);
      fetchCategories(selectedSeasonId);
    } else if (seasons.length > 0) {
      const activeSeason = seasons.find(s => s.status === 'active') || seasons[0];
      if (activeSeason) {
        setSelectedSeasonId(activeSeason.id);
      }
    }
  }, [selectedSeasonId, seasons]);

  useEffect(() => {
    applyFilters();
  }, [searchTerm, selectedDivisionId, categories, sortConfig]);

  const fetchSeasons = async () => {
    try {
      setLoading(true);
      const seasonsData = await seasonsService.getSeasons();
      setSeasons(seasonsData.filter(s => s.status !== 'archived'));
    } catch (error) {
      console.error('Error fetching seasons:', error);
      setNotification({ type: 'error', message: 'Error al cargar las temporadas' });
    } finally {
      setLoading(false);
    }
  };

  const fetchDivisionsBySeason = async (seasonId: string) => {
    try {
      const divisionsData = await divisionsService.getDivisionsBySeason(seasonId);
      setDivisions(divisionsData);
    } catch (error) {
      console.error('Error fetching divisions:', error);
    }
  };

  const fetchCategories = async (seasonId: string) => {
    try {
      setLoading(true);
      const categoriesData = await categoriesService.getCategoriesBySeason(seasonId);
      setCategories(categoriesData.sort((a, b) => a.level - b.level));
      setFilteredCategories(categoriesData.sort((a, b) => a.level - b.level));
    } catch (error) {
      console.error('Error fetching categories:', error);
      setNotification({ type: 'error', message: 'Error al cargar las categorías' });
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let result = [...categories];

    // Filtrar por división
    if (selectedDivisionId && selectedDivisionId !== 'all') {
      result = result.filter(cat => cat.divisionId === selectedDivisionId);
    }

    // Filtrar por búsqueda
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(cat => 
        cat.name.toLowerCase().includes(term) ||
        getDivisionInfo(cat.divisionId).name.toLowerCase().includes(term)
      );
    }

    // Ordenar
    if (sortConfig !== null) {
      result.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];

        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }

    setFilteredCategories(result);
  };

  const handleSort = (key: keyof Category) => {
    let direction: 'asc' | 'desc' = 'asc';
    
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key: keyof Category) => {
    if (!sortConfig || sortConfig.key !== key) {
      return <ChevronUpDownIcon className="w-4 h-4 ml-1 opacity-50" />;
    }
    
    return sortConfig.direction === 'asc' 
      ? <ChevronUpDownIcon className="w-4 h-4 ml-1 rotate-180" />
      : <ChevronUpDownIcon className="w-4 h-4 ml-1" />;
  };

  const getCategoryColor = (level: number) => {
    const colors = [
      'bg-red-500 text-white',
      'bg-orange-500 text-white',
      'bg-yellow-500 text-white',
      'bg-green-500 text-white',
      'bg-blue-500 text-white',
      'bg-indigo-500 text-white',
      'bg-purple-500 text-white',
    ];
    return colors[level - 1] || 'bg-gray-500 text-white';
  };

  const getCategoryBadgeColor = (level: number) => {
    const colors = [
      'bg-red-100 text-red-800 border-red-200',
      'bg-orange-100 text-orange-800 border-orange-200',
      'bg-yellow-100 text-yellow-800 border-yellow-200',
      'bg-green-100 text-green-800 border-green-200',
      'bg-blue-100 text-blue-800 border-blue-200',
      'bg-indigo-100 text-indigo-800 border-indigo-200',
      'bg-purple-100 text-purple-800 border-purple-200',
    ];
    return colors[level - 1] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getDivisionInfo = (divisionId: string) => {
    const division = divisions.find(d => d.id === divisionId);
    return division || { name: 'Sin división', color: '#6b7280' };
  };

  const handleViewByDivision = (divisionId: string) => {
    navigate(`/divisiones/${divisionId}/categorias`);
  };

  const handleViewTeams = (categoryId: string) => {
    navigate(`/equipos?category=${categoryId}`);
  };

  const getStats = () => {
    if (filteredCategories.length === 0) return null;
    
    const totalCategories = filteredCategories.length;
    const uniqueDivisions = Array.from(new Set(filteredCategories.map(c => c.divisionId))).length;
    const averagePrice = filteredCategories.reduce((sum, cat) => sum + cat.price, 0) / totalCategories;
    const activeCategories = filteredCategories.filter(c => c.isActive).length;
    const totalTeamCapacity = filteredCategories.reduce((sum, cat) => sum + cat.teamLimit, 0);
    const totalPlayerCapacity = filteredCategories.reduce((sum, cat) => sum + (cat.teamLimit * cat.playerLimit), 0);
    
    return {
      totalCategories,
      uniqueDivisions,
      averagePrice,
      activeCategories,
      totalTeamCapacity,
      totalPlayerCapacity
    };
  };

  const clearFilters = () => {
    setSelectedDivisionId('all');
    setSearchTerm('');
    setSortConfig(null);
  };

  const stats = getStats();

  if (loading && categories.length === 0) {
    return <LoadingSpinner />;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div className="flex items-center mb-4 md:mb-0">
          <button
            onClick={() => navigate('/dashboard')}
            className="mr-4 p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeftIcon className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Todas las Categorías</h1>
            <p className="text-gray-600 mt-2">
              Vista global de todas las categorías organizadas por temporada y división
            </p>
          </div>
        </div>
        
        <div className="mt-4 md:mt-0 flex space-x-2">
          <button
            onClick={() => navigate('/divisiones')}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <UserGroupIcon className="w-5 h-5 mr-2" />
            Ir a Divisiones
          </button>
        </div>
      </div>

      {/* Breadcrumb */}
      <div className="flex items-center text-sm text-gray-600 mb-6">
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center hover:text-blue-600 transition-colors"
        >
          <HomeIcon className="w-4 h-4 mr-1" />
          Dashboard
        </button>
        <ChevronRightIcon className="w-4 h-4 mx-2" />
        <span className="font-medium text-blue-600 flex items-center">
          <TagIcon className="w-4 h-4 mr-1" />
          Todas las Categorías
        </span>
      </div>

      {/* Notification */}
      {notification && (
        <Notification
          type={notification.type}
          message={notification.message}
          onClose={() => setNotification(null)}
        />
      )}

      {/* Filters Section */}
      <div className="mb-8 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Season Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <div className="flex items-center">
                <CalendarIcon className="w-4 h-4 mr-2" />
                Temporada
              </div>
            </label>
            <select
              value={selectedSeasonId}
              onChange={(e) => setSelectedSeasonId(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
            >
              <option value="">Seleccionar temporada...</option>
              {seasons.map((season) => (
                <option key={season.id} value={season.id}>
                  {season.name} (
                    {season.status === 'active' ? 'Activa' : 
                     season.status === 'upcoming' ? 'Próxima' : 
                     season.status === 'completed' ? 'Completada' : 
                     'Archivada'}
                  )
                </option>
              ))}
            </select>
          </div>

          {/* Division Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <div className="flex items-center">
                <FunnelIcon className="w-4 h-4 mr-2" />
                Filtrar por División
              </div>
            </label>
            <select
              value={selectedDivisionId}
              onChange={(e) => setSelectedDivisionId(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
              disabled={!selectedSeasonId || divisions.length === 0}
            >
              <option value="all">Todas las divisiones</option>
              {divisions.map((division) => (
                <option key={division.id} value={division.id}>
                  {division.name}
                </option>
              ))}
            </select>
          </div>

          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <div className="flex items-center">
                <MagnifyingGlassIcon className="w-4 h-4 mr-2" />
                Buscar categoría
              </div>
            </label>
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por nombre o división..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 absolute left-3 top-3.5" />
            </div>
          </div>
        </div>

        {/* View Mode & Clear Filters */}
        <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
          <div className="inline-flex rounded-lg border border-gray-300 p-1">
            <button
              onClick={() => setViewMode('cards')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors flex items-center ${
                viewMode === 'cards' 
                  ? 'bg-blue-600 text-white' 
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Squares2X2Icon className="w-4 h-4 mr-2" />
              Tarjetas
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors flex items-center ${
                viewMode === 'table' 
                  ? 'bg-blue-600 text-white' 
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <TableCellsIcon className="w-4 h-4 mr-2" />
              Tabla
            </button>
          </div>

          {/* Filter Stats & Clear */}
          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-600">
              {filteredCategories.length} de {categories.length} categorías
              {(selectedDivisionId !== 'all' || searchTerm) && (
                <span className="text-blue-600 ml-2">
                  (filtradas)
                </span>
              )}
            </div>
            
            {(selectedDivisionId !== 'all' || searchTerm || sortConfig) && (
              <button
                onClick={clearFilters}
                className="flex items-center px-3 py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowPathIcon className="w-4 h-4 mr-1" />
                Limpiar filtros
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      {!selectedSeasonId ? (
        <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
            <CalendarIcon className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Selecciona una temporada</h3>
          <p className="text-gray-600 mb-6">
            Por favor, selecciona una temporada para ver las categorías disponibles.
          </p>
        </div>
      ) : filteredCategories.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
            <TagIcon className="w-8 h-8 text-blue-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchTerm || selectedDivisionId !== 'all' ? 'No hay resultados' : 'No hay categorías'}
          </h3>
          <p className="text-gray-600 mb-6">
            {searchTerm || selectedDivisionId !== 'all' 
              ? 'No se encontraron categorías con los filtros aplicados.'
              : 'La temporada seleccionada no tiene categorías configuradas.'}
          </p>
          {(searchTerm || selectedDivisionId !== 'all') && (
            <button
              onClick={clearFilters}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <ArrowPathIcon className="w-5 h-5 mr-2" />
              Limpiar filtros
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Stats Summary */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <TagIcon className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-600">Categorías</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalCategories}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <UserGroupIcon className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-600">Divisiones</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.uniqueDivisions}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                <div className="flex items-center">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <CurrencyDollarIcon className="w-5 h-5 text-yellow-600" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-600">Precio Prom.</p>
                    <p className="text-2xl font-bold text-gray-900">${stats.averagePrice.toFixed(0)}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                <div className="flex items-center">
                  <div className="p-2 bg-emerald-100 rounded-lg">
                    <CheckCircleIcon className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-600">Activas</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.activeCategories}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                <div className="flex items-center">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <BuildingLibraryIcon className="w-5 h-5 text-purple-600" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-600">Equipos Máx.</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalTeamCapacity}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                <div className="flex items-center">
                  <div className="p-2 bg-indigo-100 rounded-lg">
                    <UserGroupIcon className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-600">Jugadores Máx.</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {stats.totalPlayerCapacity.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Categories Display */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Categorías {filteredCategories.length !== categories.length && `(${filteredCategories.length} de ${categories.length})`}
                {selectedDivisionId !== 'all' && divisions.length > 0 && (
                  <span className="ml-2 text-blue-600">
                    - {divisions.find(d => d.id === selectedDivisionId)?.name}
                  </span>
                )}
              </h3>
              <div className="text-sm text-gray-600">
                {sortConfig && (
                  <span className="inline-flex items-center">
                    Ordenado por: {sortConfig.key} ({sortConfig.direction})
                  </span>
                )}
              </div>
            </div>
            
            {viewMode === 'cards' ? (
              // Cards View
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredCategories.map((category) => {
                  const division = getDivisionInfo(category.divisionId);
                  
                  return (
                    <div
                      key={category.id}
                      className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200 hover:-translate-y-1"
                    >
                      <div className="p-5">
                        {/* Header */}
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center">
                            <div className={`w-12 h-12 ${getCategoryColor(category.level)} rounded-xl flex items-center justify-center mr-3`}>
                              <span className="font-bold text-xl">
                                {category.name}
                              </span>
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-900">
                                Categoría {category.name}
                              </h3>
                              <p className="text-xs text-gray-600">
                                Nivel {category.level}
                              </p>
                            </div>
                          </div>
                          <div className="flex flex-col items-end">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium mb-1 ${
                              category.isActive 
                                ? 'bg-green-100 text-green-800 border border-green-200' 
                                : 'bg-gray-100 text-gray-800 border border-gray-200'
                            }`}>
                              {category.isActive ? 'Activa' : 'Inactiva'}
                            </span>
                            <span className="text-xs text-gray-500">
                              ${category.price.toLocaleString()}
                            </span>
                          </div>
                        </div>

                        {/* Division Info */}
                        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center">
                            <div
                              className="w-3 h-3 rounded-full mr-2"
                              style={{ backgroundColor: division.color }}
                            />
                            <span className="text-sm font-medium text-gray-900">
                              {division.name}
                            </span>
                          </div>
                        </div>

                        {/* Details */}
                        <div className="space-y-3 mb-4">
                          <div className="grid grid-cols-2 gap-3">
                            <div className="bg-gray-50 rounded-lg p-3">
                              <p className="text-xs font-medium text-gray-500 mb-1">Equipos Máx.</p>
                              <p className="text-lg font-bold text-gray-900">{category.teamLimit}</p>
                            </div>
                            <div className="bg-gray-50 rounded-lg p-3">
                              <p className="text-xs font-medium text-gray-500 mb-1">Jugadores/Eq.</p>
                              <p className="text-lg font-bold text-gray-900">{category.playerLimit}</p>
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                          <button
                            onClick={() => handleViewByDivision(category.divisionId)}
                            className="flex items-center text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
                          >
                            <EyeIcon className="w-4 h-4 mr-1" />
                            Ver división
                          </button>
                          <button
                            onClick={() => handleViewTeams(category.id)}
                            className="text-sm font-medium text-green-600 hover:text-green-700 transition-colors"
                          >
                            Ver equipos
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              // Table View - Optimizada
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th 
                          className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                          onClick={() => handleSort('name')}
                        >
                          <div className="flex items-center">
                            Categoría
                            {getSortIcon('name')}
                          </div>
                        </th>
                        <th 
                          className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                          onClick={() => handleSort('level')}
                        >
                          <div className="flex items-center">
                            Nivel
                            {getSortIcon('level')}
                          </div>
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          División
                        </th>
                        <th 
                          className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                          onClick={() => handleSort('price')}
                        >
                          <div className="flex items-center">
                            Precio
                            {getSortIcon('price')}
                          </div>
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Capacidad
                        </th>
                        <th 
                          className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                          onClick={() => handleSort('isActive')}
                        >
                          <div className="flex items-center">
                            Estado
                            {getSortIcon('isActive')}
                          </div>
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Acciones
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredCategories.map((category) => {
                        const division = getDivisionInfo(category.divisionId);
                        
                        return (
                          <tr key={category.id} className="hover:bg-gray-50 transition-colors">
                            {/* Categoría */}
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className={`w-10 h-10 ${getCategoryBadgeColor(category.level)} rounded-lg flex items-center justify-center mr-3`}>
                                  <span className="font-bold">
                                    {category.name}
                                  </span>
                                </div>
                                <div>
                                  <div className="text-sm font-semibold text-gray-900">
                                    Categoría {category.name}
                                  </div>
                                </div>
                              </div>
                            </td>
                            
                            {/* Nivel */}
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <span className="text-sm font-medium text-gray-900">
                                  {category.level}
                                </span>
                              </div>
                            </td>
                            
                            {/* División */}
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div
                                  className="w-3 h-3 rounded-full mr-2"
                                  style={{ backgroundColor: division.color }}
                                />
                                <span className="text-sm text-gray-900">{division.name}</span>
                              </div>
                            </td>
                            
                            {/* Precio */}
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-semibold text-green-600">
                                ${category.price.toLocaleString()}
                              </div>
                            </td>
                            
                            {/* Capacidad */}
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="space-y-1">
                                <div className="text-sm text-gray-900">
                                  <span className="font-semibold">{category.teamLimit}</span> equipos
                                </div>
                                <div className="text-xs text-gray-500">
                                  {category.teamLimit * category.playerLimit} jugadores máx.
                                </div>
                              </div>
                            </td>
                            
                            {/* Estado */}
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                {category.isActive ? (
                                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                    <CheckCircleIcon className="w-4 h-4 mr-1" />
                                    Activa
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                    <XCircleIcon className="w-4 h-4 mr-1" />
                                    Inactiva
                                  </span>
                                )}
                              </div>
                            </td>
                            
                            {/* Acciones */}
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => handleViewByDivision(category.divisionId)}
                                  className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                                >
                                  <EyeIcon className="w-3 h-3 mr-1" />
                                  División
                                </button>
                                <button
                                  onClick={() => handleViewTeams(category.id)}
                                  className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-green-600 hover:text-green-800 hover:bg-green-50 rounded-lg transition-colors"
                                >
                                  Equipos
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                
                {/* Table Footer */}
                {filteredCategories.length > 0 && (
                  <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                    <div className="flex justify-between items-center">
                      <div className="text-sm text-gray-600">
                        Mostrando <span className="font-semibold">{filteredCategories.length}</span> categorías
                      </div>
                      <div className="text-sm text-gray-600">
                        {sortConfig && (
                          <span className="inline-flex items-center">
                            Ordenado por: <span className="font-medium ml-1">{sortConfig.key}</span>
                            <span className={`ml-1 ${sortConfig.direction === 'asc' ? 'rotate-180' : ''}`}>
                              <ChevronUpDownIcon className="w-4 h-4" />
                            </span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Bottom Action */}
      <div className="mt-8 flex justify-center">
        <button
          onClick={() => navigate('/divisiones')}
          className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-colors shadow-md hover:shadow-lg"
        >
          <UserGroupIcon className="w-5 h-5 mr-2" />
          Gestionar Categorías por División
        </button>
      </div>
    </div>
  );
};

export default CategoriesDetail;