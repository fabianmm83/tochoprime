import React, { useState, useEffect } from 'react';
import { FieldDetail, BookingSlot } from '../../types';
import { refereeService } from '../../services/refereeService';
import {
  MapPin,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Info,
  Maximize2,
  Navigation,
  Phone,
  Wifi,
  WifiOff,
  Download,
  Upload
} from 'lucide-react';

interface FieldManagementProps {
  refereeId: string;
  onFieldSelect?: (field: FieldDetail) => void;
}

const FieldManagement: React.FC<FieldManagementProps> = ({ refereeId, onFieldSelect }) => {
  const [fields, setFields] = useState<FieldDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedField, setSelectedField] = useState<FieldDetail | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [offlineMode, setOfflineMode] = useState(!navigator.onLine);

  useEffect(() => {
    loadFields();
    
    // Detectar cambios en la conectividad
    window.addEventListener('online', () => setOfflineMode(false));
    window.addEventListener('offline', () => setOfflineMode(true));
    
    return () => {
      window.removeEventListener('online', () => setOfflineMode(false));
      window.removeEventListener('offline', () => setOfflineMode(true));
    };
  }, []);

  const loadFields = async () => {
    setLoading(true);
    try {
      const fieldsData = await refereeService.getFieldsWithDetails();
      setFields(fieldsData);
      
      // Intentar sincronizar datos pendientes si está online
      if (navigator.onLine) {
        await refereeService.syncPendingOfflineData(refereeId);
      }
    } catch (error) {
      console.error('Error cargando campos:', error);
    } finally {
      setLoading(false);
    }
  };

  const getFieldStatus = (field: FieldDetail): {
    status: 'available' | 'busy' | 'maintenance' | 'closed';
    color: string;
    icon: React.ReactNode;
  } => {
    const now = new Date();
    const currentHour = now.getHours();
    const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    
    // Verificar horario
    const schedule = field.schedule?.find(s => 
      s.day.toLowerCase() === currentDay
    );
    
    if (!schedule || !schedule.availableForMatches) {
      return {
        status: 'closed',
        color: 'bg-gray-100 text-gray-800',
        icon: <XCircle className="w-4 h-4" />
      };
    }
    
    // Verificar mantenimiento
    if (field.lastMaintenance && 
        new Date(field.lastMaintenance).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000) {
      return {
        status: 'maintenance',
        color: 'bg-yellow-100 text-yellow-800',
        icon: <AlertCircle className="w-4 h-4" />
      };
    }
    
    // Verificar disponibilidad actual
    const currentBookings = field.currentBookings?.filter(booking => {
      const bookingHour = parseInt(booking.startTime.split(':')[0]);
      return bookingHour === currentHour && booking.status === 'booked';
    });
    
    if (currentBookings && currentBookings.length > 0) {
      return {
        status: 'busy',
        color: 'bg-red-100 text-red-800',
        icon: <Clock className="w-4 h-4" />
      };
    }
    
    return {
      status: 'available',
      color: 'bg-green-100 text-green-800',
      icon: <CheckCircle className="w-4 h-4" />
    };
  };

  const downloadFieldData = async (field: FieldDetail) => {
    try {
      await refereeService.saveOfflineData(refereeId, {
        dataType: 'field',
        data: field,
        syncStatus: 'pending'
      });
      alert('Datos del campo descargados para uso offline');
    } catch (error) {
      console.error('Error descargando datos:', error);
      alert('Error al descargar datos');
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="animate-pulse bg-gray-200 rounded-xl h-32"></div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Banner de modo offline */}
      {offlineMode && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <div className="flex items-center">
            <WifiOff className="w-5 h-5 text-yellow-600 mr-2" />
            <span className="font-medium text-yellow-800">Modo Offline Activado</span>
          </div>
          <p className="text-sm text-yellow-700 mt-1">
            Estás viendo información almacenada localmente. Algunas funciones pueden estar limitadas.
          </p>
        </div>
      )}

      {/* Lista de campos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {fields.map((field) => {
          const status = getFieldStatus(field);
          const facilities = field.facilities || [];
          
          return (
            <div
              key={field.id}
              className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => {
                setSelectedField(field);
                onFieldSelect?.(field);
              }}
            >
              {/* Header con estado */}
              <div className={`p-4 ${status.color}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <MapPin className="w-5 h-5 mr-2" />
                    <h3 className="font-bold text-lg">{field.name}</h3>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${status.color}`}>
                      <div className="flex items-center">
                        {status.icon}
                        <span className="ml-1">
                          {status.status === 'available' ? 'Disponible' :
                           status.status === 'busy' ? 'Ocupado' :
                           status.status === 'maintenance' ? 'Mantenimiento' : 'Cerrado'}
                        </span>
                      </div>
                    </span>
                    {offlineMode && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          downloadFieldData(field);
                        }}
                        className="p-1 text-gray-600 hover:text-blue-600"
                        title="Descargar para offline"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
                <p className="text-sm text-gray-600 mt-1">{field.code}</p>
              </div>

              {/* Información del campo */}
              <div className="p-4">
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div className="flex items-center">
                    <span className="text-sm text-gray-500">Tipo:</span>
                    <span className="ml-2 text-sm font-medium">
                      {field.type === 'sintético' ? 'Sintético' : 'Césped'}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-sm text-gray-500">Capacidad:</span>
                    <span className="ml-2 text-sm font-medium">{field.capacity} personas</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-sm text-gray-500">Prioridad:</span>
                    <span className="ml-2 text-sm font-medium">{field.priority || 'N/A'}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-sm text-gray-500">Aforo:</span>
                    <span className="ml-2 text-sm font-medium">
                      {field.currentBookings?.filter(b => b.status === 'booked').length || 0} / {field.schedule?.[0]?.maxMatchesPerDay || 6}
                    </span>
                  </div>
                </div>

                {/* Instalaciones */}
                <div className="mb-3">
                  <h4 className="text-sm font-medium text-gray-700 mb-1">Instalaciones</h4>
                  <div className="flex flex-wrap gap-1">
                    {facilities.slice(0, 4).map((facility, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                      >
                        {facility}
                      </span>
                    ))}
                    {facilities.length > 4 && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                        +{facilities.length - 4} más
                      </span>
                    )}
                  </div>
                </div>

                {/* Horario de hoy */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Horario Hoy</h4>
                  <div className="flex overflow-x-auto space-x-2 pb-2">
                    {field.currentBookings?.slice(0, 6).map((slot, idx) => (
                      <div
                        key={idx}
                        className={`flex-shrink-0 w-16 text-center p-2 rounded-lg border ${
                          slot.status === 'booked'
                            ? 'bg-red-50 border-red-200 text-red-700'
                            : slot.status === 'maintenance'
                            ? 'bg-yellow-50 border-yellow-200 text-yellow-700'
                            : 'bg-green-50 border-green-200 text-green-700'
                        }`}
                      >
                        <div className="text-xs font-medium">{slot.startTime}</div>
                        <div className="text-xs mt-1">
                          {slot.status === 'booked' ? 'Ocupado' :
                           slot.status === 'maintenance' ? 'Mantenimiento' : 'Libre'}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Equipamiento disponible */}
                {field.equipmentAvailable && field.equipmentAvailable.length > 0 && (
                  <div className="mt-3">
                    <div className="flex items-center text-sm text-gray-600">
                      <Info className="w-4 h-4 mr-1" />
                      <span>Equipamiento: {field.equipmentAvailable.slice(0, 3).join(', ')}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Acciones */}
              <div className="border-t border-gray-200 p-4">
                <div className="flex justify-between">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      // Navegar a mapa
                    }}
                    className="flex items-center text-blue-600 hover:text-blue-700 text-sm font-medium"
                  >
                    <Navigation className="w-4 h-4 mr-1" />
                    Ver en mapa
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      // Ver detalles completos
                      setSelectedField(field);
                    }}
                    className="flex items-center text-gray-600 hover:text-gray-700 text-sm font-medium"
                  >
                    <Maximize2 className="w-4 h-4 mr-1" />
                    Detalles
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal de detalles del campo */}
      {selectedField && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold">{selectedField.name}</h2>
                <button
                  onClick={() => setSelectedField(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>

              {/* Información completa */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-medium text-gray-700 mb-2">Información General</h3>
                    <ul className="space-y-2">
                      <li className="flex justify-between">
                        <span className="text-gray-600">Código:</span>
                        <span className="font-medium">{selectedField.code}</span>
                      </li>
                      <li className="flex justify-between">
                        <span className="text-gray-600">Tipo:</span>
                        <span className="font-medium">{selectedField.type}</span>
                      </li>
                      <li className="flex justify-between">
                        <span className="text-gray-600">Capacidad:</span>
                        <span className="font-medium">{selectedField.capacity} personas</span>
                      </li>
                      <li className="flex justify-between">
                        <span className="text-gray-600">Prioridad:</span>
                        <span className="font-medium">{selectedField.priority || 'N/A'}</span>
                      </li>
                    </ul>
                  </div>
                  
                  <div>
                    <h3 className="font-medium text-gray-700 mb-2">Ubicación</h3>
                    <ul className="space-y-2">
                      <li className="flex items-start">
                        <MapPin className="w-4 h-4 text-gray-400 mr-2 mt-0.5" />
                        <span className="text-gray-600">{selectedField.location?.address}</span>
                      </li>
                      <li className="flex items-center">
                        <span className="text-gray-600 mr-2">Ciudad:</span>
                        <span className="font-medium">{selectedField.location?.city}</span>
                      </li>
                    </ul>
                  </div>
                </div>

                {/* Horario semanal */}
                <div>
                  <h3 className="font-medium text-gray-700 mb-3">Horario Semanal</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {selectedField.schedule?.map((schedule, idx) => (
                      <div
                        key={idx}
                        className={`p-3 rounded-lg border ${
                          schedule.availableForMatches
                            ? 'bg-green-50 border-green-200'
                            : 'bg-gray-50 border-gray-200'
                        }`}
                      >
                        <div className="font-medium">{schedule.day}</div>
                        <div className="text-sm text-gray-600">
                          {schedule.availableForMatches
                            ? `${schedule.openingTime} - ${schedule.closingTime}`
                            : 'Cerrado'}
                        </div>
                        {schedule.availableForMatches && (
                          <div className="text-xs text-gray-500 mt-1">
                            Máx: {schedule.maxMatchesPerDay} partidos
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Equipamiento y restricciones */}
                <div className="grid grid-cols-2 gap-4">
                  {selectedField.equipmentAvailable && selectedField.equipmentAvailable.length > 0 && (
                    <div>
                      <h3 className="font-medium text-gray-700 mb-2">Equipamiento</h3>
                      <ul className="space-y-1">
                        {selectedField.equipmentAvailable.map((item, idx) => (
                          <li key={idx} className="flex items-center">
                            <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                            <span className="text-gray-600">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {selectedField.restrictions && selectedField.restrictions.length > 0 && (
                    <div>
                      <h3 className="font-medium text-gray-700 mb-2">Restricciones</h3>
                      <ul className="space-y-1">
                        {selectedField.restrictions.map((restriction, idx) => (
                          <li key={idx} className="flex items-center">
                            <AlertCircle className="w-4 h-4 text-yellow-500 mr-2" />
                            <span className="text-gray-600">{restriction}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Último mantenimiento */}
                {selectedField.lastMaintenance && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <h3 className="font-medium text-blue-800 mb-1">Mantenimiento</h3>
                    <div className="text-sm text-blue-700">
                      Último: {new Date(selectedField.lastMaintenance).toLocaleDateString()}
                    </div>
                    {selectedField.nextMaintenance && (
                      <div className="text-sm text-blue-700 mt-1">
                        Próximo: {new Date(selectedField.nextMaintenance).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Botones de acción */}
              <div className="flex justify-end space-x-3 mt-6 pt-4 border-t">
                <button
                  onClick={() => setSelectedField(null)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cerrar
                </button>
                <button
                  onClick={() => {
                    // Acción de navegación
                    window.open(`https://maps.google.com/?q=${encodeURIComponent(selectedField.location?.address || '')}`, '_blank');
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Navigation className="w-4 h-4 inline mr-2" />
                  Ir al campo
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FieldManagement;