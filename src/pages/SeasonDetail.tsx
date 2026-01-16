import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  seasonsService, 
  divisionsService, 
  categoriesService 
} from '../services/firestore';
import { Season, Division, Category } from '../types';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Notification from '../components/common/Notification';
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
  ArrowTopRightOnSquareIcon
} from '@heroicons/react/24/outline';

const SeasonDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [season, setSeason] = useState<Season | null>(null);
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'divisions' | 'categories' | 'settings'>('overview');
  const [expandedDivision, setExpandedDivision] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchSeasonData(id);
    } else {
      navigate('/seasons');
    }
  }, [id, navigate]);

  const fetchSeasonData = async (seasonId: string) => {
    try {
      setLoading(true);
      
      // Fetch season
      const seasonData = await seasonsService.getSeasonById(seasonId);
      if (!seasonData) {
        navigate('/seasons');
        return;
      }
      setSeason(seasonData);

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

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!season) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Temporada no encontrada</h2>
          <button
            onClick={() => navigate('/seasons')}
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
            onClick={() => navigate('/seasons')}
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

        {season.status === 'upcoming' && (
          <button
            onClick={handleActivateSeason}
            className="mt-4 md:mt-0 flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <CheckCircleIcon className="w-5 h-5 mr-2" />
            Activar Temporada
          </button>
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
                    ${season.priceConfiguration.basePrice}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Jerarquía Visual */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Estructura de la Temporada</h3>
            </div>
            <div className="p-6">
              <div className="space-y-6">
                {/* Temporada */}
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

                {/* Flecha */}
                <div className="flex justify-center">
                  <div className="w-0.5 h-8 bg-gray-300"></div>
                </div>

                {/* Divisiones */}
                <div className="space-y-4">
                  {divisions.map((division, index) => (
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

                      {/* Categorías de esta división */}
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
                                onClick={() => navigate(`/divisions/${division.id}/categories`)}
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
                                onClick={() => navigate(`/divisions/${division.id}/categories`)}
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
            <button
              onClick={() => {
                if (window.confirm('¿Crear divisiones predeterminadas (Varonil, Femenil, Mixto)?')) {
                  // Lógica para crear divisiones predeterminadas
                }
              }}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <UserGroupIcon className="w-5 h-5 mr-2" />
              Crear Divisiones
            </button>
          </div>

          {/* Contenido de divisiones similar al Divisions.tsx */}
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

                  <div className="flex space-x-3 pt-4 border-t border-gray-100">
                    <button
                      onClick={() => navigate(`/divisions/${division.id}/categories`)}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                    >
                      Gestionar Categorías
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'categories' && (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-gray-900">
            Todas las Categorías ({categories.length})
          </h2>

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
                          onClick={() => navigate(`/divisions/${category.divisionId}/categories`)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Gestionar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="space-y-6">
          {/* Configuración financiera y reglas - igual que antes */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Configuración Financiera</h3>
            </div>
            <div className="p-6">
              {/* ... contenido de configuración financiera ... */}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SeasonDetail;