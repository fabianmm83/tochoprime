import React, { useState, useEffect, useMemo } from 'react';
import { fieldsService } from '../services/firestore';
import { Field } from '../types';
import {
  PlusIcon,
  MapPinIcon,
  CheckCircleIcon,
  XCircleIcon,
  PencilIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  EyeIcon,
  CalendarIcon,
  UserGroupIcon,
  BuildingOfficeIcon,
  MapIcon,
  ListBulletIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';
import Modal from '../components/common/Modal';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Notification from '../components/common/Notification';

// Helper para crear campos estáticos con las propiedades CORRECTAS según tu interfaz Field
const createStaticField = (
  id: string,
  code: string,
  locationZone: string,
  status: Field['status'],
  priority: number,
  type?: Field['type']
): Field => ({
  id,
  code,
  name: code,
  type: type || (locationZone.includes('Left') ? 'arena' as const : 'césped' as const),
  capacity: locationZone.includes('Left') ? 80 : 100,
  status,
  priority,
  facilities: ['iluminación', 'vestuarios', 'gradas'],
  location: {
    address: `Sede Cuemanco Isla 5, ${locationZone}`,
    city: 'Ciudad de México'
  },
  notes: `${code} de la sede principal`,
  isActive: true,
  createdAt: new Date().toISOString(), // Convertir a string
  updatedAt: new Date().toISOString(), // Convertir a string
});

// Mapa estático de sedes Cuemanco Isla 5 - CORREGIDO: Sin createdBy/updatedBy
const STATIC_FIELDS: Field[] = [
  // Top Row (9, 8, 7)
  createStaticField('field-9', 'CAMPO 9', 'Top Row', 'available', 1),
  createStaticField('field-8', 'CAMPO 8', 'Top Row', 'available', 2),
  createStaticField('field-7', 'CAMPO 7', 'Top Row', 'maintenance', 3),
  
  // Middle Row (4, 5, 6)
  createStaticField('field-4', 'CAMPO 4', 'Middle Row', 'reserved', 4, 'sintético'),
  createStaticField('field-5', 'CAMPO 5', 'Middle Row', 'available', 5, 'sintético'),
  createStaticField('field-6', 'CAMPO 6', 'Middle Row', 'available', 6, 'sintético'),
  
  // Bottom Row (1, 2, 3)
  createStaticField('field-1', 'CAMPO 1', 'Bottom Row', 'available', 7),
  createStaticField('field-2', 'CAMPO 2', 'Bottom Row', 'unavailable', 8),
  createStaticField('field-3', 'CAMPO 3', 'Bottom Row', 'available', 9),
  
  // Left Side (13, 14)
  createStaticField('field-13', 'CAMPO 13', 'Left Side', 'available', 10, 'arena'),
  createStaticField('field-14', 'CAMPO 14', 'Left Side', 'maintenance', 11, 'arena'),
  
  // Right Side (11, 10, 12)
  createStaticField('field-11', 'CAMPO 11', 'Right Side', 'available', 12),
  createStaticField('field-10', 'CAMPO 10', 'Right Side', 'reserved', 13),
  createStaticField('field-12', 'CAMPO 12', 'Right Side', 'available', 14),
  
  // Extra fields for 16 total
  createStaticField('field-15', 'CAMPO 15', 'Bottom Row', 'available', 15, 'sintético'),
  createStaticField('field-16', 'CAMPO 16', 'Bottom Row', 'available', 16, 'sintético'),
];

const Fields: React.FC = () => {
  const [activeView, setActiveView] = useState<'map' | 'list'>('map');
  const [fields, setFields] = useState<Field[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedField, setSelectedField] = useState<Field | null>(null);
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
    facilities: ['iluminación', 'vestuarios'],
    location: {
      address: 'Sede Cuemanco Isla 5',
      city: 'Ciudad de México'
    },
    status: 'available' as Field['status'],
    priority: 1,
    notes: '',
    isActive: true,
  });

  useEffect(() => {
    fetchFields();
  }, []);

  const fetchFields = async () => {
    try {
      setLoading(true);
      const fieldsData = await fieldsService.getFields();
      
      // Si no hay campos en la base de datos, usar los estáticos
      if (fieldsData.length === 0) {
        setFields(STATIC_FIELDS);
      } else {
        setFields(fieldsData);
      }
    } catch (error) {
      console.error('Error fetching fields:', error);
      setNotification({ type: 'error', message: 'Error al cargar los campos' });
    } finally {
      setLoading(false);
    }
  };

  // Filtrar campos según búsqueda y filtros
  const filteredFields = useMemo(() => {
    return fields.filter(field => {
      // Search filter
      if (searchTerm && !field.code.toLowerCase().includes(searchTerm.toLowerCase()) && 
          !field.name.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }
      
      // Status filter
      if (statusFilter !== 'all' && field.status !== statusFilter) {
        return false;
      }
      
      // Type filter
      if (typeFilter !== 'all' && field.type !== typeFilter) {
        return false;
      }
      
      return true;
    });
  }, [fields, searchTerm, statusFilter, typeFilter]);

  const handleCreateField = async () => {
    try {
      const fieldToCreate = {
        ...newField,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      await fieldsService.createField(fieldToCreate);
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
      const fieldToUpdate = {
        ...newField,
        updatedAt: new Date().toISOString(),
      };
      
      await fieldsService.updateField(editingField.id, fieldToUpdate);
      setNotification({ type: 'success', message: 'Campo actualizado exitosamente' });
      setShowCreateModal(false);
      setEditingField(null);
      resetForm();
      fetchFields();
    } catch (error) {
      console.error('Error updating field:', error);
      setNotification({ type: 'error', message: 'Error al actualizar el campo' });
    }
  };

  const handleChangeStatus = async (fieldId: string, newStatus: Field['status']) => {
    try {
      await fieldsService.updateField(fieldId, { 
        status: newStatus,
        updatedAt: new Date().toISOString()
      });
      setNotification({ type: 'success', message: 'Estado actualizado exitosamente' });
      fetchFields();
    } catch (error) {
      console.error('Error updating field status:', error);
      setNotification({ type: 'error', message: 'Error al actualizar el estado' });
    }
  };

  const resetForm = () => {
    setNewField({
      code: '',
      name: '',
      type: 'césped',
      capacity: 100,
      facilities: ['iluminación', 'vestuarios'],
      location: {
        address: 'Sede Cuemanco Isla 5',
        city: 'Ciudad de México'
      },
      status: 'available',
      priority: 1,
      notes: '',
      isActive: true,
    });
    setEditingField(null);
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
    setShowCreateModal(true);
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
      case 'available': return 'bg-green-500 text-white';
      case 'maintenance': return 'bg-yellow-500 text-white';
      case 'reserved': return 'bg-blue-500 text-white';
      case 'unavailable': return 'bg-red-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getStatusText = (status: Field['status']) => {
    switch (status) {
      case 'available': return 'Libre';
      case 'maintenance': return 'Mantenimiento';
      case 'reserved': return 'Reservado';
      case 'unavailable': return 'Ocupado';
      default: return 'Desconocido';
    }
  };

  const getTypeText = (type: Field['type']) => {
    switch (type) {
      case 'césped': return 'Césped';
      case 'sintético': return 'Sintético';
      case 'arena': return 'Arena';
      case 'otros': return 'Otros';
      default: return type;
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white pb-20">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 pt-4 pb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Campos Deportivos</h1>
            <p className="text-sm text-gray-600 mt-1">
              Sede Cuemanco Isla 5 • {fields.length} campos disponibles
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setActiveView(activeView === 'map' ? 'list' : 'map')}
              className="p-3 bg-blue-100 text-blue-700 rounded-xl hover:bg-blue-200 transition-colors"
            >
              {activeView === 'map' ? (
                <ListBulletIcon className="w-5 h-5" />
              ) : (
                <MapIcon className="w-5 h-5" />
              )}
            </button>
            <button
              onClick={() => {
                resetForm();
                setShowCreateModal(true);
              }}
              className="p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
            >
              <PlusIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="space-y-3">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por código o nombre..."
              className="w-full pl-10 pr-4 py-3 bg-gray-100 border-none rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div className="flex overflow-x-auto space-x-3 pb-2">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-4 py-2 rounded-lg whitespace-nowrap ${statusFilter === 'all' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}
            >
              Todos
            </button>
            <button
              onClick={() => setStatusFilter('available')}
              className={`px-4 py-2 rounded-lg whitespace-nowrap ${statusFilter === 'available' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}
            >
              Libre
            </button>
            <button
              onClick={() => setStatusFilter('reserved')}
              className={`px-4 py-2 rounded-lg whitespace-nowrap ${statusFilter === 'reserved' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}
            >
              Reservado
            </button>
            <button
              onClick={() => setStatusFilter('maintenance')}
              className={`px-4 py-2 rounded-lg whitespace-nowrap ${statusFilter === 'maintenance' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-700'}`}
            >
              Mantenimiento
            </button>
            <button
              onClick={() => setStatusFilter('unavailable')}
              className={`px-4 py-2 rounded-lg whitespace-nowrap ${statusFilter === 'unavailable' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}`}
            >
              Ocupado
            </button>
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

      {/* Main Content */}
      <div className="p-4">
        {activeView === 'map' ? (
          // Vista Mapa
          <div className="space-y-6">
            {/* Header del mapa */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Mapa de Sedes</h2>
                  <p className="text-sm text-gray-600">Sede Cuemanco Isla 5</p>
                </div>
                <div className="flex space-x-2">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                    <span className="text-sm">Libre</span>
                  </div>
                  <div className="flex items-center ml-4">
                    <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                    <span className="text-sm">Ocupado</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Vista 3D - Representación de campos */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <h3 className="text-lg font-bold text-gray-900 mb-4">VISTA 3D</h3>
              
              {/* Top Row (9, 8, 7) */}
              <div className="mb-6">
                <div className="text-sm font-medium text-gray-700 mb-3">Top Row (9, 8, 7)</div>
                <div className="grid grid-cols-3 gap-3">
                  {fields.filter(f => ['9', '8', '7'].some(num => f.code.includes(num))).map(field => (
                    <button
                      key={field.id}
                      onClick={() => setSelectedField(field)}
                      className={`p-4 rounded-xl font-bold relative overflow-hidden ${getStatusColor(field.status)} hover:opacity-90 transition-opacity`}
                    >
                      <div className="text-center">
                        <div className="text-xl mb-1">{field.code}</div>
                        <div className="text-sm opacity-90">{getStatusText(field.status)}</div>
                        {field.status === 'reserved' && (
                          <div className="absolute top-2 right-2">
                            <CalendarIcon className="w-4 h-4" />
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Middle Row (4, 5, 6) */}
              <div className="mb-6">
                <div className="text-sm font-medium text-gray-700 mb-3">Middle Row (4, 5, 6)</div>
                <div className="grid grid-cols-3 gap-3">
                  {fields.filter(f => ['4', '5', '6'].some(num => f.code.includes(num))).map(field => (
                    <button
                      key={field.id}
                      onClick={() => setSelectedField(field)}
                      className={`p-4 rounded-xl font-bold ${getStatusColor(field.status)} hover:opacity-90 transition-opacity`}
                    >
                      <div className="text-center">
                        <div className="text-xl mb-1">{field.code}</div>
                        <div className="text-sm opacity-90">{getStatusText(field.status)}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Bottom Row (1, 2, 3) */}
              <div className="mb-6">
                <div className="text-sm font-medium text-gray-700 mb-3">Bottom Row (1, 2, 3)</div>
                <div className="grid grid-cols-3 gap-3">
                  {fields.filter(f => ['1', '2', '3'].some(num => f.code.includes(num))).map(field => (
                    <button
                      key={field.id}
                      onClick={() => setSelectedField(field)}
                      className={`p-4 rounded-xl font-bold ${getStatusColor(field.status)} hover:opacity-90 transition-opacity`}
                    >
                      <div className="text-center">
                        <div className="text-xl mb-1">{field.code}</div>
                        <div className="text-sm opacity-90">{getStatusText(field.status)}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Layout inferior con Left Side y Right Side */}
              <div className="grid grid-cols-3 gap-6">
                {/* Left Side (13, 14) */}
                <div className="col-span-1">
                  <div className="text-sm font-medium text-gray-700 mb-3">Left Side (13, 14)</div>
                  <div className="space-y-3">
                    {fields.filter(f => ['13', '14'].some(num => f.code.includes(num))).map(field => (
                      <button
                        key={field.id}
                        onClick={() => setSelectedField(field)}
                        className={`w-full p-4 rounded-xl font-bold ${getStatusColor(field.status)} hover:opacity-90 transition-opacity`}
                      >
                        <div className="text-center">
                          <div className="text-xl mb-1">{field.code}</div>
                          <div className="text-sm opacity-90">{getStatusText(field.status)}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                  <div className="mt-4 p-3 bg-gray-100 rounded-lg text-center">
                    <span className="font-medium text-gray-900">ENTRADA</span>
                  </div>
                </div>

                {/* Center - Spacer */}
                <div className="col-span-1"></div>

                {/* Right Side (11, 10, 12) */}
                <div className="col-span-1">
                  <div className="text-sm font-medium text-gray-700 mb-3">Right Side (11, 10, 12)</div>
                  <div className="space-y-3">
                    {fields.filter(f => ['11', '10', '12'].some(num => f.code.includes(num))).map(field => (
                      <button
                        key={field.id}
                        onClick={() => setSelectedField(field)}
                        className={`w-full p-4 rounded-xl font-bold ${getStatusColor(field.status)} hover:opacity-90 transition-opacity`}
                      >
                        <div className="text-center">
                          <div className="text-xl mb-1">{field.code}</div>
                          <div className="text-sm opacity-90">{getStatusText(field.status)}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Navigation Bar */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Bottom Navigation Bar</h3>
              <div className="grid grid-cols-4 gap-2">
                {['INICIO', 'MAPAS', 'TORNEOS', 'PERFIL'].map((item, index) => (
                  <button
                    key={index}
                    className="py-3 bg-gray-100 hover:bg-gray-200 rounded-lg text-center font-medium text-gray-900 transition-colors"
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          // Vista Lista
          <div className="space-y-3">
            {filteredFields.map((field) => (
              <div
                key={field.id}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:border-blue-300 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${getStatusColor(field.status)}`}>
                      <span className="font-bold">{field.code.split(' ')[1]}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <h3 className="font-semibold text-gray-900 truncate">
                          {field.code}
                        </h3>
                        <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(field.status)}`}>
                          {getStatusText(field.status)}
                        </span>
                      </div>
                      
                      <p className="text-sm text-gray-600 mt-1">{field.name}</p>
                      
                      <div className="flex items-center space-x-4 mt-2">
                        <div className="flex items-center text-sm text-gray-600">
                          <UserGroupIcon className="w-4 h-4 mr-1" />
                          <span>{field.capacity} pers.</span>
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <BuildingOfficeIcon className="w-4 h-4 mr-1" />
                          <span>{getTypeText(field.type)}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center text-sm text-gray-600 mt-2">
                        <MapPinIcon className="w-4 h-4 mr-1 flex-shrink-0" />
                        <span className="truncate">{field.location.address}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end space-y-2">
                    <button
                      onClick={() => editField(field)}
                      className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <PencilIcon className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => setSelectedField(field)}
                      className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <EyeIcon className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {filteredFields.length === 0 && (
          <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-xl">
            <MapPinIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No se encontraron campos
            </h3>
            <p className="text-gray-600 mb-6">
              Prueba con otros términos de búsqueda o filtros.
            </p>
            <button
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
                setTypeFilter('all');
              }}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <FunnelIcon className="w-5 h-5 mr-2" />
              Limpiar filtros
            </button>
          </div>
        )}
      </div>

      {/* Field Detail Modal */}
      <Modal
        isOpen={!!selectedField}
        onClose={() => setSelectedField(null)}
        title={selectedField?.code || 'Detalles del Campo'}
        size="md"
      >
        {selectedField && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedField.status)}`}>
                {getStatusText(selectedField.status)}
              </div>
              <button
                onClick={() => handleChangeStatus(selectedField.id, 
                  selectedField.status === 'available' ? 'reserved' : 'available'
                )}
                className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
              >
                {selectedField.status === 'available' ? 'Reservar' : 'Liberar'}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-700">Código</p>
                <p className="text-lg font-bold text-gray-900">{selectedField.code}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Tipo</p>
                <p className="text-lg text-gray-900 capitalize">{getTypeText(selectedField.type)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Capacidad</p>
                <p className="text-lg text-gray-900">{selectedField.capacity} personas</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Prioridad</p>
                <p className="text-lg text-gray-900">{selectedField.priority}/10</p>
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-700 mb-1">Ubicación</p>
              <p className="text-gray-900">{selectedField.location.address}</p>
              <p className="text-sm text-gray-600">{selectedField.location.city}</p>
            </div>

            {selectedField.facilities && selectedField.facilities.length > 0 && (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-1">Instalaciones</p>
                <div className="flex flex-wrap gap-2">
                  {selectedField.facilities.map((facility, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-sm"
                    >
                      {facility}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {selectedField.notes && (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-1">Notas</p>
                <p className="text-gray-900 text-sm">{selectedField.notes}</p>
              </div>
            )}

            <div className="flex space-x-3 pt-4">
              <button
                onClick={() => setSelectedField(null)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cerrar
              </button>
              <button
                onClick={() => handleChangeStatus(selectedField.id, 
                  selectedField.status === 'available' ? 'maintenance' : 'available'
                )}
                className="flex-1 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
              >
                {selectedField.status === 'available' ? 'Enviar a Mantenimiento' : 'Activar'}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Create/Edit Field Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          resetForm();
        }}
        title={editingField ? 'Editar Campo' : 'Crear Nuevo Campo'}
        size="full"
      >
        <div className="space-y-4 px-4 pb-20">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Código del Campo *
              </label>
              <input
                type="text"
                value={newField.code}
                onChange={(e) => setNewField({ ...newField, code: e.target.value })}
                className="w-full px-4 py-3 bg-gray-100 border-none rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="Ej: CAMPO 1"
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
                className="w-full px-4 py-3 bg-gray-100 border-none rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="Ej: Campo Principal"
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
                className="w-full px-4 py-3 bg-gray-100 border-none rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
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
                className="w-full px-4 py-3 bg-gray-100 border-none rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
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
              className="w-full px-4 py-3 bg-gray-100 border-none rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="Ej: Sede Cuemanco Isla 5, Top Row"
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
                className="w-full px-4 py-3 bg-gray-100 border-none rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="Ciudad de México"
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
                className="w-full px-4 py-3 bg-gray-100 border-none rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
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
                    className="flex-1 px-4 py-3 bg-gray-100 border-none rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="Ej: iluminación, vestuarios, gradas, etc."
                  />
                  {newField.facilities.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeFacility(index)}
                      className="p-3 text-red-600 hover:bg-red-50 rounded-lg"
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
              className="w-full px-4 py-3 bg-gray-100 border-none rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
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
              className="w-full px-4 py-3 bg-gray-100 border-none rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
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
              onClick={editingField ? handleUpdateField : handleCreateField}
              disabled={!newField.code || !newField.name || !newField.location.address || !newField.location.city}
              className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {editingField ? 'Actualizar Campo' : 'Crear Campo'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Fields;