import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { divisionsService, seasonsService } from '../services/firestore';
import { Division, Season } from '../types';
import {
  PlusIcon,
  UserGroupIcon,
  PencilIcon,
  TrashIcon,
  ArrowLeftIcon,
  ChevronRightIcon,
  DocumentIcon,
  EyeIcon,
  LinkIcon
} from '@heroicons/react/24/outline';
import Modal from '../components/common/Modal';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Notification from '../components/common/Notification';
import ColorPicker from '../components/common/ColorPicker';

const Divisions: React.FC = () => {
  const navigate = useNavigate();
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSeason, setSelectedSeason] = useState<string>('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingDivision, setEditingDivision] = useState<Division | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [isCreatingDefault, setIsCreatingDefault] = useState(false);

  const [newDivision, setNewDivision] = useState({
    seasonId: '',
    name: '',
    description: '',
    color: '#3b82f6', // Azul por defecto
    order: 1,
    teamLimit: 20,
    playerLimit: 15,
    rulesUrl: '', // URL del PDF de reglamento
    isActive: true,
  });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedSeason) {
      fetchDivisionsBySeason(selectedSeason);
    }
  }, [selectedSeason]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const seasonsData = await seasonsService.getSeasons();
      const activeSeasons = seasonsData.filter((s: Season) => s.isActive && s.status === 'active');
      setSeasons(activeSeasons);
      
      if (activeSeasons.length > 0) {
        setSelectedSeason(activeSeasons[0].id);
        await fetchDivisionsBySeason(activeSeasons[0].id);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setNotification({ type: 'error', message: 'Error al cargar los datos' });
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
      setNotification({ type: 'error', message: 'Error al cargar las divisiones' });
    }
  };

  const handleCreateDivision = async () => {
    try {
      const divisionData = {
        seasonId: newDivision.seasonId,
        name: newDivision.name.trim(),
        description: newDivision.description.trim(),
        color: newDivision.color,
        order: newDivision.order,
        teamLimit: newDivision.teamLimit,
        playerLimit: newDivision.playerLimit,
        rulesUrl: newDivision.rulesUrl.trim(),
        isActive: newDivision.isActive,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await divisionsService.createDivision(divisionData);
      
      setNotification({ type: 'success', message: 'División creada exitosamente' });
      setShowCreateModal(false);
      resetForm();
      fetchDivisionsBySeason(newDivision.seasonId);
    } catch (error) {
      console.error('Error creating division:', error);
      setNotification({ type: 'error', message: 'Error al crear la división' });
    }
  };

  const handleUpdateDivision = async () => {
    if (!editingDivision) return;

    try {
      await divisionsService.updateDivision(editingDivision.id, {
        name: newDivision.name.trim(),
        description: newDivision.description.trim(),
        color: newDivision.color,
        order: newDivision.order,
        teamLimit: newDivision.teamLimit,
        playerLimit: newDivision.playerLimit,
        rulesUrl: newDivision.rulesUrl.trim(),
        isActive: newDivision.isActive,
        updatedAt: new Date().toISOString(),
      });

      setNotification({ type: 'success', message: 'División actualizada exitosamente' });
      setShowEditModal(false);
      setEditingDivision(null);
      fetchDivisionsBySeason(selectedSeason);
    } catch (error) {
      console.error('Error updating division:', error);
      setNotification({ type: 'error', message: 'Error al actualizar la división' });
    }
  };

  const handleCreateDefaultDivisions = async () => {
    if (!selectedSeason) return;

    try {
      setIsCreatingDefault(true);
      await divisionsService.createDefaultDivisions(selectedSeason);
      
      setNotification({ type: 'success', message: 'Divisiones predeterminadas creadas exitosamente' });
      fetchDivisionsBySeason(selectedSeason);
    } catch (error) {
      console.error('Error creating default divisions:', error);
      setNotification({ type: 'error', message: 'Error al crear las divisiones predeterminadas' });
    } finally {
      setIsCreatingDefault(false);
    }
  };

  const handleDeleteDivision = async (divisionId: string, divisionName: string) => {
    if (window.confirm(`¿Estás seguro de que deseas eliminar la división "${divisionName}"? Esto también eliminará todas sus categorías.`)) {
      try {
        await divisionsService.deleteDivision(divisionId);
        setNotification({ type: 'success', message: 'División eliminada exitosamente' });
        fetchDivisionsBySeason(selectedSeason);
      } catch (error) {
        console.error('Error deleting division:', error);
        setNotification({ type: 'error', message: 'Error al eliminar la división' });
      }
    }
  };

  const resetForm = () => {
    setNewDivision({
      seasonId: selectedSeason || '',
      name: '',
      description: '',
      color: '#3b82f6',
      order: divisions.length > 0 ? Math.max(...divisions.map(d => d.order)) + 1 : 1,
      teamLimit: 20,
      playerLimit: 15,
      rulesUrl: '/assets/reglamentoprime.pdf', // URL por defecto del PDF
      isActive: true,
    });
  };

  const editDivision = (division: Division) => {
    setEditingDivision(division);
    setNewDivision({
      seasonId: division.seasonId,
      name: division.name,
      description: division.description || '',
      color: division.color || '#3b82f6',
      order: division.order,
      teamLimit: division.teamLimit || 20,
      playerLimit: division.playerLimit || 15,
      rulesUrl: division.rulesUrl || '/assets/reglamentoprime.pdf',
      isActive: division.isActive,
    });
    setShowEditModal(true);
  };

  const getSelectedSeasonName = () => {
    const season = seasons.find(s => s.id === selectedSeason);
    return season?.name || 'Seleccionar Temporada';
  };

  const getDivisionTypes = () => {
    const types = divisions.map(d => d.name.toLowerCase());
    const availableTypes = ['varonil', 'femenil', 'mixto'].filter(
      type => !types.includes(type)
    );
    return availableTypes;
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div>
          <div className="flex items-center mb-2">
            <button
              onClick={() => navigate('/temporadas')}
              className="mr-4 p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeftIcon className="w-5 h-5" />
            </button>
            <h1 className="text-3xl font-bold text-gray-900">Divisiones</h1>
          </div>
          <p className="text-gray-600">
            Gestiona las divisiones (Varonil, Femenil, Mixto) de cada temporada.
          </p>
        </div>
        
        <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4 mt-4 md:mt-0">
          {/* Season Selector */}
          <div className="relative">
            <select
              value={selectedSeason}
              onChange={(e) => setSelectedSeason(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
              disabled={seasons.length === 0}
            >
              <option value="">Seleccionar Temporada</option>
              {seasons.map(season => (
                <option key={season.id} value={season.id}>
                  {season.name}
                </option>
              ))}
            </select>
          </div>
          
          {selectedSeason && (
            <>
              <button
                onClick={handleCreateDefaultDivisions}
                disabled={isCreatingDefault || getDivisionTypes().length === 0}
                className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <UserGroupIcon className="w-5 h-5 mr-2" />
                {isCreatingDefault ? 'Creando...' : 'Crear Predeterminadas'}
              </button>
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <PlusIcon className="w-5 h-5 mr-2" />
                Nueva División
              </button>
            </>
          )}
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

      {/* Empty State - No seasons */}
      {seasons.length === 0 && (
        <div className="text-center py-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
            <UserGroupIcon className="w-8 h-8 text-blue-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No hay temporadas activas</h3>
          <p className="text-gray-600 mb-6">
            Primero debes crear y activar una temporada para gestionar las divisiones.
          </p>
          <button
            onClick={() => navigate('/temporadas')}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Ir a Temporadas
          </button>
        </div>
      )}

      {/* No season selected */}
      {seasons.length > 0 && !selectedSeason && (
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Selecciona una temporada</h3>
          <p className="text-gray-600">
            Por favor, selecciona una temporada activa para ver sus divisiones.
          </p>
        </div>
      )}

      {/* Divisions Grid */}
      {selectedSeason && (
        <>
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              Divisiones de {getSelectedSeasonName()}
            </h2>
            <p className="text-gray-600 mt-1">
              {divisions.length} {divisions.length === 1 ? 'división' : 'divisiones'} configuradas
            </p>
          </div>

          {divisions.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-xl">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                <UserGroupIcon className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Sin divisiones configuradas</h3>
              <p className="text-gray-600 mb-4">
                Esta temporada aún no tiene divisiones. 
                {getDivisionTypes().length > 0 && (
                  <span className="block mt-1">
                    Puedes crear las divisiones predeterminadas: {getDivisionTypes().map(t => t.charAt(0).toUpperCase() + t.slice(1)).join(', ')}
                  </span>
                )}
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={handleCreateDefaultDivisions}
                  disabled={isCreatingDefault || getDivisionTypes().length === 0}
                  className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <UserGroupIcon className="w-5 h-5 mr-2" />
                  {isCreatingDefault ? 'Creando...' : 'Crear Divisiones Predeterminadas'}
                </button>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <PlusIcon className="w-5 h-5 mr-2" />
                  Crear División Personalizada
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Available division types info */}
              {getDivisionTypes().length > 0 && (
                <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center">
                    <UserGroupIcon className="w-5 h-5 text-blue-600 mr-2" />
                    <p className="text-sm text-blue-800">
                      Puedes agregar: <strong>{getDivisionTypes().map(t => t.charAt(0).toUpperCase() + t.slice(1)).join(', ')}</strong>
                    </p>
                    <button
                      onClick={handleCreateDefaultDivisions}
                      disabled={isCreatingDefault}
                      className="ml-auto text-sm text-blue-700 hover:text-blue-900 font-medium"
                    >
                      {isCreatingDefault ? 'Creando...' : 'Crear ahora'}
                    </button>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {divisions.map((division) => (
                  <div
                    key={division.id}
                    className="bg-white rounded-xl shadow-md border border-gray-200 hover:shadow-lg transition-shadow"
                  >
                    <div className="p-6">
                      {/* Header with color */}
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

                      {/* Description */}
                      <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                        {division.description || 'Sin descripción'}
                      </p>

                      {/* Stats */}
                      <div className="grid grid-cols-3 gap-4 mb-6">
                        <div className="space-y-1">
                          <p className="text-xs font-medium text-gray-500">Orden</p>
                          <p className="text-sm font-semibold text-gray-900">{division.order}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs font-medium text-gray-500">Equipos Máx.</p>
                          <p className="text-sm font-semibold text-gray-900">{division.teamLimit}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs font-medium text-gray-500">Jugadores/Eq.</p>
                          <p className="text-sm font-semibold text-gray-900">{division.playerLimit}</p>
                        </div>
                      </div>

                      {/* Rules PDF Link */}
                      {division.rulesUrl && (
                        <div className="mb-6">
                          <a
                            href={division.rulesUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700"
                          >
                            <DocumentIcon className="w-4 h-4 mr-2" />
                            Ver reglamento PDF
                          </a>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                        <button
                          onClick={() => navigate(`/divisiones/${division.id}/categorias`)}
                          className="flex items-center text-sm text-blue-600 hover:text-blue-700"
                        >
                          Ver categorías
                          <ChevronRightIcon className="w-4 h-4 ml-1" />
                        </button>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => navigate(`/divisiones/${division.id}`)}
                            className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Ver detalles"
                          >
                            <EyeIcon className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => editDivision(division)}
                            className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Editar"
                          >
                            <PencilIcon className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteDivision(division.id, division.name)}
                            className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Eliminar"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}

      {/* Create Division Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          resetForm();
        }}
        title="Crear Nueva División"
        size="lg"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Temporada *
            </label>
            <select
              value={newDivision.seasonId}
              onChange={(e) => setNewDivision({ ...newDivision, seasonId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="">Seleccionar Temporada</option>
              {seasons.map(season => (
                <option key={season.id} value={season.id}>
                  {season.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre de la División *
            </label>
            <input
              type="text"
              value={newDivision.name}
              onChange={(e) => setNewDivision({ ...newDivision, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Ej: Varonil, Femenil, Mixto"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Sugerencias: {getDivisionTypes().map(t => t.charAt(0).toUpperCase() + t.slice(1)).join(', ')}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descripción
            </label>
            <textarea
              value={newDivision.description}
              onChange={(e) => setNewDivision({ ...newDivision, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={2}
              placeholder="Describe esta división..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Color de la División
              </label>
              <ColorPicker
                value={newDivision.color}
                onChange={(color) => setNewDivision({ ...newDivision, color })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Orden *
              </label>
              <input
                type="number"
                value={newDivision.order}
                onChange={(e) => setNewDivision({ ...newDivision, order: parseInt(e.target.value) || 1 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                min="1"
                max="10"
                required
              />
              <p className="text-xs text-gray-500 mt-1">Determina el orden de visualización</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Límite de Equipos
              </label>
              <input
                type="number"
                value={newDivision.teamLimit}
                onChange={(e) => setNewDivision({ ...newDivision, teamLimit: parseInt(e.target.value) || 20 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                min="1"
                max="50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Límite de Jugadores por Equipo
              </label>
              <input
                type="number"
                value={newDivision.playerLimit}
                onChange={(e) => setNewDivision({ ...newDivision, playerLimit: parseInt(e.target.value) || 15 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                min="1"
                max="30"
              />
            </div>
          </div>

          {/* Reglamento PDF */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              URL del Reglamento (PDF)
            </label>
            <div className="flex space-x-2">
              <input
                type="text"
                value={newDivision.rulesUrl}
                onChange={(e) => setNewDivision({ ...newDivision, rulesUrl: e.target.value })}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="/assets/reglamentoprime.pdf"
              />
              <button
                type="button"
                onClick={() => setNewDivision({ ...newDivision, rulesUrl: '/assets/reglamentoprime.pdf' })}
                className="px-3 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Usar predeterminado
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Usa el reglamento oficial o sube uno personalizado
            </p>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="isActive"
              checked={newDivision.isActive}
              onChange={(e) => setNewDivision({ ...newDivision, isActive: e.target.checked })}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="isActive" className="ml-2 text-sm text-gray-700">
              Activar esta división inmediatamente
            </label>
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
              onClick={handleCreateDivision}
              disabled={!newDivision.seasonId || !newDivision.name.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Crear División
            </button>
          </div>
        </div>
      </Modal>

      {/* Edit Division Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingDivision(null);
          resetForm();
        }}
        title="Editar División"
        size="lg"
      >
        {editingDivision && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre de la División *
              </label>
              <input
                type="text"
                value={newDivision.name}
                onChange={(e) => setNewDivision({ ...newDivision, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descripción
              </label>
              <textarea
                value={newDivision.description}
                onChange={(e) => setNewDivision({ ...newDivision, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={2}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Color de la División
                </label>
                <ColorPicker
                  value={newDivision.color}
                  onChange={(color) => setNewDivision({ ...newDivision, color })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Orden *
                </label>
                <input
                  type="number"
                  value={newDivision.order}
                  onChange={(e) => setNewDivision({ ...newDivision, order: parseInt(e.target.value) || 1 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  min="1"
                  max="10"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Límite de Equipos
                </label>
                <input
                  type="number"
                  value={newDivision.teamLimit}
                  onChange={(e) => setNewDivision({ ...newDivision, teamLimit: parseInt(e.target.value) || 20 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  min="1"
                  max="50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Límite de Jugadores por Equipo
                </label>
                <input
                  type="number"
                  value={newDivision.playerLimit}
                  onChange={(e) => setNewDivision({ ...newDivision, playerLimit: parseInt(e.target.value) || 15 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  min="1"
                  max="30"
                />
              </div>
            </div>

            {/* Reglamento PDF */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                URL del Reglamento (PDF)
              </label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={newDivision.rulesUrl}
                  onChange={(e) => setNewDivision({ ...newDivision, rulesUrl: e.target.value })}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <a
                  href={newDivision.rulesUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 inline-flex items-center"
                >
                  <LinkIcon className="w-4 h-4 mr-1" />
                  Ver
                </a>
              </div>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="editIsActive"
                checked={newDivision.isActive}
                onChange={(e) => setNewDivision({ ...newDivision, isActive: e.target.checked })}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="editIsActive" className="ml-2 text-sm text-gray-700">
                División activa
              </label>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingDivision(null);
                  resetForm();
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleUpdateDivision}
                disabled={!newDivision.name.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Actualizar División
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Divisions;