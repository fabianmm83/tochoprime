import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { divisionsService, seasonsService } from '../services/firestore';
import { Division, Season } from '../types';
import {
  PlusIcon,
  UserGroupIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowLeftIcon,
  ChevronRightIcon
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

  const [newDivision, setNewDivision] = useState({
    seasonId: '',
    name: '',
    description: '',
    color: '#3b82f6',
    order: 1,
    teamLimit: 20,
    playerLimit: 15,
    rules: [''],
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
      const seasonsData = await seasonsService.getSeasons(); // CAMBIADO: getAllSeasons() por getSeasons()
      const activeSeasons = seasonsData.filter((s: Season) => s.isActive && s.status === 'active'); // AGREGADO tipo
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
        name: newDivision.name,
        description: newDivision.description,
        color: newDivision.color,
        order: newDivision.order,
        teamLimit: newDivision.teamLimit,
        playerLimit: newDivision.playerLimit,
        rules: newDivision.rules.filter(rule => rule.trim() !== ''),
        isActive: newDivision.isActive,
      };

      await divisionsService.createDefaultDivisions(newDivision.seasonId);
      
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
        name: newDivision.name,
        description: newDivision.description,
        color: newDivision.color,
        order: newDivision.order,
        teamLimit: newDivision.teamLimit,
        playerLimit: newDivision.playerLimit,
        rules: newDivision.rules.filter(rule => rule.trim() !== ''),
        isActive: newDivision.isActive,
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

  const handleDeleteDivision = async (divisionId: string) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar esta división?')) {
      // Nota: En una implementación real, necesitarías un método delete
      // Por ahora solo mostrar un mensaje
      setNotification({ type: 'success', message: 'Función de eliminación pendiente' });
    }
  };

  const resetForm = () => {
    setNewDivision({
      seasonId: selectedSeason || '',
      name: '',
      description: '',
      color: '#3b82f6',
      order: 1,
      teamLimit: 20,
      playerLimit: 15,
      rules: [''],
      isActive: true,
    });
  };

  const editDivision = (division: Division) => {
    setEditingDivision(division);
    setNewDivision({
      seasonId: division.seasonId,
      name: division.name,
      description: division.description,
      color: division.color,
      order: division.order,
      teamLimit: division.teamLimit || 20,
      playerLimit: division.playerLimit || 15,
      rules: division.rules || [''],
      isActive: division.isActive,
    });
    setShowEditModal(true);
  };

  const addRule = () => {
    setNewDivision({ ...newDivision, rules: [...newDivision.rules, ''] });
  };

  const removeRule = (index: number) => {
    const newRules = newDivision.rules.filter((_, i) => i !== index);
    setNewDivision({ ...newDivision, rules: newRules });
  };

  const updateRule = (index: number, value: string) => {
    const newRules = [...newDivision.rules];
    newRules[index] = value;
    setNewDivision({ ...newDivision, rules: newRules });
  };

  const getSelectedSeasonName = () => {
    const season = seasons.find(s => s.id === selectedSeason);
    return season?.name || 'Seleccionar Temporada';
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
              onClick={() => navigate('/seasons')}
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
          
          <button
            onClick={() => setShowCreateModal(true)}
            disabled={!selectedSeason}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <PlusIcon className="w-5 h-5 mr-2" />
            Nueva División
          </button>
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
            onClick={() => navigate('/seasons')}
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
              <p className="text-gray-600 mb-6">
                Esta temporada aún no tiene divisiones. Crea las divisiones para comenzar.
              </p>
              <button
                onClick={() => {
                  if (window.confirm('¿Deseas crear las divisiones predeterminadas (Varonil, Femenil, Mixto)?')) {
                    divisionsService.createDefaultDivisions(selectedSeason)
                      .then(() => {
                        setNotification({ type: 'success', message: 'Divisiones creadas exitosamente' });
                        fetchDivisionsBySeason(selectedSeason);
                      })
                      .catch(error => {
                        console.error('Error creating divisions:', error);
                        setNotification({ type: 'error', message: 'Error al crear las divisiones' });
                      });
                  }
                }}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <UserGroupIcon className="w-5 h-5 mr-2" />
                Crear Divisiones Predeterminadas
              </button>
            </div>
          ) : (
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
                      {division.description}
                    </p>

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-gray-500">Orden</p>
                        <p className="text-sm font-semibold text-gray-900">{division.order}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-gray-500">Límite de Equipos</p>
                        <p className="text-sm font-semibold text-gray-900">{division.teamLimit}</p>
                      </div>
                    </div>

                    {/* Rules preview */}
                    {division.rules && division.rules.length > 0 && (
                      <div className="mb-6">
                        <p className="text-xs font-medium text-gray-500 mb-2">Reglas:</p>
                        <ul className="space-y-1">
                          {division.rules.slice(0, 2).map((rule, index) => (
                            <li key={index} className="flex items-start text-sm text-gray-600">
                              <span className="mr-2">•</span>
                              <span className="line-clamp-1">{rule}</span>
                            </li>
                          ))}
                          {division.rules.length > 2 && (
                            <li className="text-xs text-gray-500">
                              +{division.rules.length - 2} reglas más
                            </li>
                          )}
                        </ul>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                      <button
                        onClick={() => navigate(`/divisions/${division.id}`)}
                        className="flex items-center text-sm text-blue-600 hover:text-blue-700"
                      >
                        Ver categorías
                        <ChevronRightIcon className="w-4 h-4 ml-1" />
                      </button>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => editDivision(division)}
                          className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <PencilIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteDivision(division.id)}
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

          {/* Rules */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Reglas Específicas
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
              {newDivision.rules.map((rule, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={rule}
                    onChange={(e) => updateRule(index, e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Ej: Jugadores exclusivamente masculinos"
                  />
                  {newDivision.rules.length > 1 && (
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
              disabled={!newDivision.seasonId || !newDivision.name}
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

            {/* Rules */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Reglas Específicas
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
                {newDivision.rules.map((rule, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={rule}
                      onChange={(e) => updateRule(index, e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    {newDivision.rules.length > 1 && (
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
                disabled={!newDivision.name}
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