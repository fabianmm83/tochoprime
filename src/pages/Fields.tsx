import React, { useState, useEffect } from 'react';
import { fieldsService } from '../services/firestore';
import { Field } from '../types';
import {
  PlusIcon,
  MapPinIcon,
  WrenchScrewdriverIcon,
  CheckCircleIcon,
  XCircleIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  MagnifyingGlassIcon,
  FunnelIcon
} from '@heroicons/react/24/outline';
import Modal from '../components/common/Modal';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Notification from '../components/common/Notification';

const Fields: React.FC = () => {
  const [fields, setFields] = useState<Field[]>([]);
  const [filteredFields, setFilteredFields] = useState<Field[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingField, setEditingField] = useState<Field | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const [newField, setNewField] = useState({
    code: '',
    name: '',
    type: 'césped' as Field['type'],
    capacity: 100,
    facilities: ['iluminación'],
    location: {
      address: '',
      city: ''
    },
    status: 'available' as Field['status'],
    priority: 1,
    notes: '',
    isActive: true,
  });

  useEffect(() => {
    fetchFields();
  }, []);

  useEffect(() => {
    filterFields();
  }, [fields, searchTerm, statusFilter, typeFilter]);

  const fetchFields = async () => {
    try {
      setLoading(true);
      const fieldsData = await fieldsService.getFields(); // CAMBIADO: getAllFields() por getFields()
      setFields(fieldsData);
      setFilteredFields(fieldsData);
    } catch (error) {
      console.error('Error fetching fields:', error);
      setNotification({ type: 'error', message: 'Error al cargar los campos' });
    } finally {
      setLoading(false);
    }
  };

  const filterFields = () => {
    let filtered = [...fields];

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(field =>
        field.code.toLowerCase().includes(term) ||
        field.name.toLowerCase().includes(term) ||
        field.location.address.toLowerCase().includes(term)
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(field => field.status === statusFilter);
    }

    // Type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(field => field.type === typeFilter);
    }

    setFilteredFields(filtered);
  };

  const handleCreateField = async () => {
    try {
      await fieldsService.createField(newField);
      setNotification({ type: 'success', message: 'Campo creado exitosamente' });
      setShowCreateModal(false);
      resetForm();
      fetchFields();
    } catch (error) {
      console.error('Error creating field:', error);
      setNotification({ type: 'error', message: 'Error al crear el campo' });
    }
  };

  const handleUpdateField = async () => {
    if (!editingField) return;

    try {
      await fieldsService.updateField(editingField.id, {
        ...newField,
        location: {
          address: newField.location.address,
          city: newField.location.city
        }
      });

      setNotification({ type: 'success', message: 'Campo actualizado exitosamente' });
      setShowEditModal(false);
      setEditingField(null);
      fetchFields();
    } catch (error) {
      console.error('Error updating field:', error);
      setNotification({ type: 'error', message: 'Error al actualizar el campo' });
    }
  };

  const handleCreateDefaultFields = async () => {
    if (window.confirm('¿Deseas crear los 16 campos predeterminados?')) {
      try {
        await fieldsService.createDefaultFields();
        setNotification({ type: 'success', message: '16 campos predeterminados creados exitosamente' });
        fetchFields();
      } catch (error) {
        console.error('Error creating default fields:', error);
        setNotification({ type: 'error', message: 'Error al crear los campos predeterminados' });
      }
    }
  };

  const handleChangeStatus = async (fieldId: string, newStatus: Field['status']) => {
    try {
      await fieldsService.updateField(fieldId, { status: newStatus });
      setNotification({ type: 'success', message: 'Estado actualizado exitosamente' });
      fetchFields();
    } catch (error) {
      console.error('Error updating field status:', error);
      setNotification({ type: 'error', message: 'Error al actualizar el estado' });
    }
  };

  const editField = (field: Field) => {
    setEditingField(field);
    setNewField({
      code: field.code,
      name: field.name,
      type: field.type,
      capacity: field.capacity,
      facilities: [...field.facilities],
      location: {
        address: field.location.address,
        city: field.location.city
      },
      status: field.status,
      priority: field.priority,
      notes: field.notes || '',
      isActive: field.isActive,
    });
    setShowEditModal(true);
  };

  const resetForm = () => {
    setNewField({
      code: '',
      name: '',
      type: 'césped',
      capacity: 100,
      facilities: ['iluminación'],
      location: {
        address: '',
        city: ''
      },
      status: 'available',
      priority: 1,
      notes: '',
      isActive: true,
    });
  };

  const addFacility = () => {
    setNewField({ ...newField, facilities: [...newField.facilities, ''] });
  };

  const removeFacility = (index: number) => {
    const newFacilities = newField.facilities.filter((_, i) => i !== index);
    setNewField({ ...newField, facilities: newFacilities });
  };

  const updateFacility = (index: number, value: string) => {
    const newFacilities = [...newField.facilities];
    newFacilities[index] = value;
    setNewField({ ...newField, facilities: newFacilities });
  };

  const getStatusColor = (status: Field['status']) => {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-800';
      case 'maintenance': return 'bg-yellow-100 text-yellow-800';
      case 'reserved': return 'bg-blue-100 text-blue-800';
      case 'unavailable': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type: Field['type']) => {
    switch (type) {
      case 'césped': return 'bg-emerald-100 text-emerald-800';
      case 'sintético': return 'bg-cyan-100 text-cyan-800';
      case 'arena': return 'bg-amber-100 text-amber-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Campos</h1>
          <p className="text-gray-600 mt-2">
            Administra los {fields.length} campos deportivos disponibles para las temporadas.
          </p>
        </div>
        <div className="flex space-x-3 mt-4 md:mt-0">
          <button
            onClick={handleCreateDefaultFields}
            className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <PlusIcon className="w-5 h-5 mr-2" />
            Campos Predeterminados
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <PlusIcon className="w-5 h-5 mr-2" />
            Nuevo Campo
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

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between space-y-4 md:space-y-0">
          <div className="flex-1">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar campos por código, nombre o dirección..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          
          <div className="flex space-x-4">
            <div className="relative">
              <FunnelIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">Todos los estados</option>
                <option value="available">Disponible</option>
                <option value="reserved">Reservado</option>
                <option value="maintenance">En mantenimiento</option>
                <option value="unavailable">No disponible</option>
              </select>
            </div>
            
            <div className="relative">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">Todos los tipos</option>
                <option value="césped">Césped</option>
                <option value="sintético">Sintético</option>
                <option value="arena">Arena</option>
                <option value="otros">Otros</option>
              </select>
            </div>
          </div>
        </div>
        
        {/* Results summary */}
        <div className="mt-4 flex items-center text-sm text-gray-600">
          <span>
            Mostrando {filteredFields.length} de {fields.length} campos
          </span>
          {(searchTerm || statusFilter !== 'all' || typeFilter !== 'all') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
                setTypeFilter('all');
              }}
              className="ml-4 text-blue-600 hover:text-blue-700"
            >
              Limpiar filtros
            </button>
          )}
        </div>
      </div>

      {/* Fields Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredFields.map((field) => (
          <div
            key={field.id}
            className="bg-white rounded-xl shadow-md border border-gray-200 hover:shadow-lg transition-shadow"
          >
            {/* Field header with status */}
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(field.status)} mb-2`}>
                    {field.status === 'available' ? 'Disponible' :
                     field.status === 'maintenance' ? 'Mantenimiento' :
                     field.status === 'reserved' ? 'Reservado' : 'No disponible'}
                  </span>
                  <h3 className="text-lg font-semibold text-gray-900">{field.code}</h3>
                  <p className="text-gray-600 text-sm">{field.name}</p>
                </div>
                <div className="flex space-x-1">
                  <button
                    onClick={() => editField(field)}
                    className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Editar"
                  >
                    <PencilIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Field details */}
              <div className="space-y-3">
                <div className="flex items-center text-gray-600">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(field.type)} mr-3`}>
                    {field.type}
                  </span>
                  <span className="text-sm">Capacidad: {field.capacity} pers.</span>
                </div>

                <div className="flex items-start text-gray-600">
                  <MapPinIcon className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm line-clamp-1">{field.location.address}</p>
                    <p className="text-xs text-gray-500">{field.location.city}</p>
                  </div>
                </div>

                {/* Facilities */}
                {field.facilities && field.facilities.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-1">Instalaciones:</p>
                    <div className="flex flex-wrap gap-1">
                      {field.facilities.slice(0, 3).map((facility, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs"
                        >
                          {facility}
                        </span>
                      ))}
                      {field.facilities.length > 3 && (
                        <span className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                          +{field.facilities.length - 3}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Priority */}
                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  <span className="text-sm text-gray-600">
                    Prioridad: <span className="font-semibold">{field.priority}/10</span>
                  </span>
                  <div className="flex space-x-1">
                    {field.status === 'available' && (
                      <button
                        onClick={() => handleChangeStatus(field.id, 'reserved')}
                        className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                      >
                        Reservar
                      </button>
                    )}
                    {field.status === 'available' && (
                      <button
                        onClick={() => handleChangeStatus(field.id, 'maintenance')}
                        className="px-2 py-1 text-xs bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200 transition-colors"
                      >
                        Mantenimiento
                      </button>
                    )}
                    {field.status !== 'available' && (
                      <button
                        onClick={() => handleChangeStatus(field.id, 'available')}
                        className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
                      >
                        Disponible
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty state */}
      {filteredFields.length === 0 && (
        <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-xl">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
            <MapPinIcon className="w-8 h-8 text-blue-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {fields.length === 0 ? 'No hay campos configurados' : 'No se encontraron campos'}
          </h3>
          <p className="text-gray-600 mb-6">
            {fields.length === 0 
              ? 'Comienza creando los campos deportivos para las temporadas.'
              : 'Prueba con otros términos de búsqueda o filtros.'}
          </p>
          <button
            onClick={handleCreateDefaultFields}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <PlusIcon className="w-5 h-5 mr-2" />
            Crear Campos Predeterminados
          </button>
        </div>
      )}

      {/* Create Field Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          resetForm();
        }}
        title="Crear Nuevo Campo"
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Código del Campo *
              </label>
              <input
                type="text"
                value={newField.code}
                onChange={(e) => setNewField({ ...newField, code: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Ej: Campo 1, Campo A, etc."
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre del Campo *
              </label>
              <input
                type="text"
                value={newField.name}
                onChange={(e) => setNewField({ ...newField, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Ej: Campo Deportivo Principal"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipo de Superficie *
              </label>
              <select
                value={newField.type}
                onChange={(e) => setNewField({ ...newField, type: e.target.value as Field['type'] })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="césped">Césped natural</option>
                <option value="sintético">Césped sintético</option>
                <option value="arena">Arena</option>
                <option value="otros">Otros</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Capacidad de Espectadores *
              </label>
              <input
                type="number"
                value={newField.capacity}
                onChange={(e) => setNewField({ ...newField, capacity: parseInt(e.target.value) || 100 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                min="1"
                max="10000"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Dirección *
            </label>
            <input
              type="text"
              value={newField.location.address}
              onChange={(e) => setNewField({
                ...newField,
                location: { ...newField.location, address: e.target.value }
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Calle y número"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ciudad *
              </label>
              <input
                type="text"
                value={newField.location.city}
                onChange={(e) => setNewField({
                  ...newField,
                  location: { ...newField.location, city: e.target.value }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Ciudad"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Prioridad (1-10)
              </label>
              <input
                type="number"
                value={newField.priority}
                onChange={(e) => setNewField({ ...newField, priority: parseInt(e.target.value) || 1 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                min="1"
                max="10"
              />
            </div>
          </div>

          {/* Facilities */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Instalaciones y Servicios
              </label>
              <button
                type="button"
                onClick={addFacility}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                + Agregar Instalación
              </button>
            </div>
            <div className="space-y-2">
              {newField.facilities.map((facility, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={facility}
                    onChange={(e) => updateFacility(index, e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Ej: iluminación, vestuarios, gradas, etc."
                  />
                  {newField.facilities.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeFacility(index)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Estado Inicial
            </label>
            <select
              value={newField.status}
              onChange={(e) => setNewField({ ...newField, status: e.target.value as Field['status'] })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="available">Disponible</option>
              <option value="maintenance">En mantenimiento</option>
              <option value="reserved">Reservado</option>
              <option value="unavailable">No disponible</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notas Adicionales
            </label>
            <textarea
              value={newField.notes}
              onChange={(e) => setNewField({ ...newField, notes: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={3}
              placeholder="Observaciones especiales sobre el campo..."
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="isActive"
              checked={newField.isActive}
              onChange={(e) => setNewField({ ...newField, isActive: e.target.checked })}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="isActive" className="ml-2 text-sm text-gray-700">
              Activar este campo inmediatamente
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
              onClick={handleCreateField}
              disabled={!newField.code || !newField.name || !newField.location.address || !newField.location.city}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Crear Campo
            </button>
          </div>
        </div>
      </Modal>

      {/* Edit Field Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingField(null);
          resetForm();
        }}
        title="Editar Campo"
        size="lg"
      >
        {editingField && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Código del Campo *
                </label>
                <input
                  type="text"
                  value={newField.code}
                  onChange={(e) => setNewField({ ...newField, code: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre del Campo *
                </label>
                <input
                  type="text"
                  value={newField.name}
                  onChange={(e) => setNewField({ ...newField, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
            </div>

            {/* Resto del formulario igual al de creación */}
            {/* ... (copiar el resto del formulario del modal de creación) ... */}
            
            <div className="flex justify-end space-x-3 pt-4">
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingField(null);
                  resetForm();
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleUpdateField}
                disabled={!newField.code || !newField.name || !newField.location.address || !newField.location.city}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Actualizar Campo
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Fields;