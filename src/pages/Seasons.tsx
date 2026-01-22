import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { seasonsService } from '../services/firestore';
import { Season } from '../types';
import { 
  PlusIcon, 
  CalendarIcon, 
  DocumentDuplicateIcon, 
  ArchiveBoxIcon,
  ArrowUturnLeftIcon,
  EyeIcon,
  TrashIcon,
  CheckCircleIcon,
  ClockIcon,
  PencilIcon,
  ExclamationTriangleIcon,
  HomeIcon
} from '@heroicons/react/24/outline';
import Modal from '../components/common/Modal';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Notification from '../components/common/Notification';

const Seasons: React.FC = () => {
  const navigate = useNavigate();
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedSeason, setSelectedSeason] = useState<Season | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState<string | null>(null);

  // Form state
  const [newSeason, setNewSeason] = useState({
    name: '',
    startDate: '',
    endDate: '',
    registrationDeadline: '',
    description: '',
    basePrice: 2000,
    rules: [''],
  });

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = () => {
      if (dropdownOpen) {
        setDropdownOpen(null);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [dropdownOpen]);

  // Fetch seasons on component mount
  useEffect(() => {
    fetchSeasons();
  }, []);

  const fetchSeasons = async () => {
    try {
      setLoading(true);
      const data = await seasonsService.getSeasons();
      setSeasons(data);
    } catch (error) {
      console.error('Error fetching seasons:', error);
      setNotification({ type: 'error', message: 'Error al cargar las temporadas' });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSeason = async () => {
    try {
      const seasonData = {
        name: newSeason.name,
        startDate: new Date(newSeason.startDate),
        endDate: new Date(newSeason.endDate),
        registrationDeadline: new Date(newSeason.registrationDeadline),
        description: newSeason.description,
        status: 'upcoming' as const,
        priceConfiguration: {
          basePrice: newSeason.basePrice,
          earlyBirdDiscount: 0,
          teamDiscounts: [],
        },
        rules: newSeason.rules.filter(rule => rule.trim() !== ''),
        isActive: false,
      };

      const seasonId = await seasonsService.createSeason(seasonData);
      
      setNotification({ type: 'success', message: 'Temporada creada exitosamente' });
      setShowCreateModal(false);
      resetForm();
      fetchSeasons();
      
      navigate(`/temporadas/${seasonId}`);
    } catch (error) {
      console.error('Error creating season:', error);
      setNotification({ type: 'error', message: 'Error al crear la temporada' });
    }
  };

  const handleDuplicateSeason = async () => {
    if (!selectedSeason) return;

    try {
      const newName = `${selectedSeason.name} - Copia`;
      const newSeasonId = await seasonsService.duplicateSeason(selectedSeason.id, newName);
      
      setNotification({ type: 'success', message: 'Temporada duplicada exitosamente' });
      setShowDuplicateModal(false);
      setSelectedSeason(null);
      fetchSeasons();
      
      navigate(`/temporadas/${newSeasonId}`);
    } catch (error) {
      console.error('Error duplicating season:', error);
      setNotification({ type: 'error', message: 'Error al duplicar la temporada' });
    }
  };

  const handleArchiveSeason = async (seasonId: string) => {
    try {
      await seasonsService.archiveSeason(seasonId);
      setNotification({ type: 'success', message: 'Temporada archivada exitosamente' });
      setDropdownOpen(null);
      fetchSeasons();
    } catch (error) {
      console.error('Error archiving season:', error);
      setNotification({ type: 'error', message: 'Error al archivar la temporada' });
    }
  };

  const handleUnarchiveSeason = async (seasonId: string) => {
    try {
      await seasonsService.updateSeason(seasonId, {
        status: 'completed',
        updatedAt: new Date(),
      });
      setNotification({ type: 'success', message: 'Temporada desarchivada exitosamente' });
      setDropdownOpen(null);
      fetchSeasons();
    } catch (error) {
      console.error('Error unarchiving season:', error);
      setNotification({ type: 'error', message: 'Error al desarchivar la temporada' });
    }
  };

  const handleDeleteSeason = async () => {
    if (!selectedSeason) return;

    try {
      await seasonsService.deleteSeason(selectedSeason.id);
      
      setNotification({ type: 'success', message: 'Temporada eliminada exitosamente' });
      setShowDeleteModal(false);
      setSelectedSeason(null);
      fetchSeasons();
      
    } catch (error) {
      console.error('Error deleting season:', error);
      setNotification({ type: 'error', message: 'Error al eliminar la temporada' });
    }
  };

  const handleNavigateToDashboard = () => {
    navigate('/dashboard');
  };

  const resetForm = () => {
    setNewSeason({
      name: '',
      startDate: '',
      endDate: '',
      registrationDeadline: '',
      description: '',
      basePrice: 2000,
      rules: [''],
    });
  };

  const addRule = () => {
    setNewSeason({ ...newSeason, rules: [...newSeason.rules, ''] });
  };

  const removeRule = (index: number) => {
    const newRules = newSeason.rules.filter((_, i) => i !== index);
    setNewSeason({ ...newSeason, rules: newRules });
  };

  const updateRule = (index: number, value: string) => {
    const newRules = [...newSeason.rules];
    newRules[index] = value;
    setNewSeason({ ...newSeason, rules: newRules });
  };

  const getStatusColor = (status: Season['status']) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'upcoming': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      case 'archived': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: Season['status']) => {
    switch (status) {
      case 'active': return <CheckCircleIcon className="w-5 h-5 text-green-600" />;
      case 'upcoming': return <ClockIcon className="w-5 h-5 text-blue-600" />;
      case 'completed': return <CalendarIcon className="w-5 h-5 text-gray-600" />;
      case 'archived': return <ArchiveBoxIcon className="w-5 h-5 text-purple-600" />;
      default: return null;
    }
  };

  const formatDate = (date: Date | string) => {
    if (!date) return 'No definida';
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('es-MX', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const toggleDropdown = (seasonId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDropdownOpen(dropdownOpen === seasonId ? null : seasonId);
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div className="flex items-center">
          <button
            onClick={handleNavigateToDashboard}
            className="mr-4 p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            title="Volver al panel principal"
          >
            <HomeIcon className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Temporadas</h1>
            <p className="text-gray-600 mt-2">
              Gestiona las temporadas de Tocho Prime. Cada temporada contiene divisiones, categorías y equipos.
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="mt-4 md:mt-0 flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <PlusIcon className="w-5 h-5 mr-2" />
          Nueva Temporada
        </button>
      </div>

      {/* Notification */}
      {notification && (
        <Notification
          type={notification.type}
          message={notification.message}
          onClose={() => setNotification(null)}
        />
      )}

      {/* Seasons Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {seasons.map((season) => (
          <div
            key={season.id}
            className="bg-white rounded-xl shadow-md border border-gray-200 hover:shadow-lg transition-shadow relative"
          >
            {/* Actions Dropdown */}
            <div className="absolute top-4 right-4">
              <div className="relative">
                <button
                  onClick={(e) => toggleDropdown(season.id, e)}
                  className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <svg 
                    className={`w-5 h-5 transition-transform ${dropdownOpen === season.id ? 'rotate-180' : ''}`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {dropdownOpen === season.id && (
                  <div 
                    className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="py-1">
                      <button
                        onClick={() => {
                          navigate(`/temporadas/${season.id}`);
                          setDropdownOpen(null);
                        }}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                      >
                        <EyeIcon className="w-4 h-4 mr-3" />
                        Ver Detalles
                      </button>
                      
                      <button
                        onClick={() => {
                          navigate(`/temporadas/${season.id}?edit=true`);
                          setDropdownOpen(null);
                        }}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                      >
                        <PencilIcon className="w-4 h-4 mr-3" />
                        Editar
                      </button>
                      
                      <button
                        onClick={() => {
                          setSelectedSeason(season);
                          setShowDuplicateModal(true);
                          setDropdownOpen(null);
                        }}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                      >
                        <DocumentDuplicateIcon className="w-4 h-4 mr-3" />
                        Duplicar
                      </button>
                      
                      {season.status === 'archived' ? (
                        <button
                          onClick={() => {
                            handleUnarchiveSeason(season.id);
                          }}
                          className="flex items-center w-full px-4 py-2 text-sm text-green-600 hover:bg-green-50 transition-colors"
                        >
                          <ArrowUturnLeftIcon className="w-4 h-4 mr-3" />
                          Desarchivar
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            if (window.confirm('¿Estás seguro de que deseas archivar esta temporada?')) {
                              handleArchiveSeason(season.id);
                            }
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
                          setSelectedSeason(season);
                          setShowDeleteModal(true);
                          setDropdownOpen(null);
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

            <div className="p-6">
              {/* Header */}
              <div className="flex justify-between items-start mb-4">
                <div>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(season.status)}`}>
                    {getStatusIcon(season.status)}
                    <span className="ml-1.5 capitalize">
                      {season.status === 'upcoming' ? 'Próxima' : 
                       season.status === 'active' ? 'Activa' : 
                       season.status === 'completed' ? 'Completada' : 'Archivada'}
                    </span>
                  </span>
                  <h3 className="text-xl font-semibold text-gray-900 mt-2">{season.name}</h3>
                </div>
              </div>

              {/* Dates */}
              <div className="space-y-3 mb-6">
                <div className="flex items-start text-gray-600">
                  <CalendarIcon className="w-5 h-5 mr-2 mt-0.5" />
                  <div className="text-sm">
                    <div className="font-medium">Inicio: {formatDate(season.startDate)}</div>
                    <div className="font-medium">Fin: {formatDate(season.endDate)}</div>
                    {season.registrationDeadline && (
                      <div className="text-gray-500 mt-1">
                        Límite registro: {formatDate(season.registrationDeadline)}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Description */}
              {season.description && (
                <p className="text-gray-600 text-sm mb-6 line-clamp-2">
                  {season.description}
                </p>
              )}

              {/* Footer */}
              <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                <div className="text-sm text-gray-500">
                  Precio: <span className="font-semibold">${season.priceConfiguration?.basePrice || 0}</span>
                </div>
                <button
                  onClick={() => navigate(`/temporadas/${season.id}`)}
                  className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Gestionar
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {seasons.length === 0 && !loading && (
        <div className="text-center py-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
            <CalendarIcon className="w-8 h-8 text-blue-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No hay temporadas</h3>
          <p className="text-gray-600 mb-6">Comienza creando tu primera temporada</p>
          <div className="space-x-3">
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <PlusIcon className="w-5 h-5 mr-2" />
              Crear Primera Temporada
            </button>
            <button
              onClick={handleNavigateToDashboard}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <HomeIcon className="w-5 h-5 mr-2" />
              Volver al Panel
            </button>
          </div>
        </div>
      )}

      {/* Create Season Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          resetForm();
        }}
        title="Crear Nueva Temporada"
        size="lg"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre de la Temporada *
            </label>
            <input
              type="text"
              value={newSeason.name}
              onChange={(e) => setNewSeason({ ...newSeason, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Ej: Otoño 2024"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha de Inicio *
              </label>
              <input
                type="date"
                value={newSeason.startDate}
                onChange={(e) => setNewSeason({ ...newSeason, startDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha de Fin *
              </label>
              <input
                type="date"
                value={newSeason.endDate}
                onChange={(e) => setNewSeason({ ...newSeason, endDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fecha Límite de Registro *
            </label>
            <input
              type="date"
              value={newSeason.registrationDeadline}
              onChange={(e) => setNewSeason({ ...newSeason, registrationDeadline: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descripción
            </label>
            <textarea
              value={newSeason.description}
              onChange={(e) => setNewSeason({ ...newSeason, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={3}
              placeholder="Describe los detalles de esta temporada..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Precio por Equipo ($)
            </label>
            <input
              type="number"
              value={newSeason.basePrice}
              onChange={(e) => setNewSeason({ ...newSeason, basePrice: Number(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              min="0"
              step="50"
            />
            <p className="text-xs text-gray-500 mt-1">
              Precio único por equipo para participar en la temporada
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
                onClick={addRule}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                + Agregar Regla
              </button>
            </div>
            <div className="space-y-2">
              {newSeason.rules.map((rule, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={rule}
                    onChange={(e) => updateRule(index, e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Ej: Todos los jugadores deben estar registrados"
                  />
                  {newSeason.rules.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeRule(index)}
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
              onClick={() => {
                setShowCreateModal(false);
                resetForm();
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleCreateSeason}
              disabled={!newSeason.name || !newSeason.startDate || !newSeason.endDate || !newSeason.registrationDeadline}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Crear Temporada
            </button>
          </div>
        </div>
      </Modal>

      {/* Duplicate Season Modal */}
      <Modal
        isOpen={showDuplicateModal}
        onClose={() => {
          setShowDuplicateModal(false);
          setSelectedSeason(null);
        }}
        title="Duplicar Temporada"
        size="md"
      >
        {selectedSeason && (
          <div className="space-y-4">
            <p className="text-gray-600">
              ¿Deseas duplicar la temporada <span className="font-semibold">{selectedSeason.name}</span>?
              Se crearán copias de todas las configuraciones excepto los datos específicos de equipos y partidos.
            </p>
            <p className="text-sm text-gray-500">
              La nueva temporada se creará con estado "Próxima" y deberás activarla manualmente.
            </p>
            <div className="flex justify-end space-x-3 pt-4">
              <button
                onClick={() => {
                  setShowDuplicateModal(false);
                  setSelectedSeason(null);
                }}
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
        )}
      </Modal>

      {/* Delete Season Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedSeason(null);
        }}
        title="Eliminar Temporada"
        size="md"
      >
        {selectedSeason && (
          <div className="space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex">
                <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">¡Atención! Esta acción no se puede deshacer</h3>
                  <div className="mt-2 text-sm text-red-700">
                    <p>
                      Estás a punto de eliminar permanentemente la temporada "{selectedSeason.name}".
                      Todos los datos asociados (divisiones, categorías, equipos, etc.) también serán eliminados.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-sm text-gray-600">
              <p className="font-medium">Información que será eliminada:</p>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>Datos de la temporada</li>
                <li>Divisiones y categorías asociadas</li>
                <li>Equipos registrados en esta temporada</li>
                <li>Partidos programados</li>
              </ul>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedSeason(null);
                }}
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
        )}
      </Modal>
    </div>
  );
};

export default Seasons;