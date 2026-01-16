import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Share2, 
  MapPin, 
  Trophy,
  User,
  Home,
  Coffee,
  Waves,
  Wifi,
  Anchor,
  Calendar,
  Clock,
  Users,
  CheckCircle,
  XCircle,
  AlertCircle,
  Maximize2
} from 'lucide-react';
import { fieldService } from '../services/firestore';
import { Field } from '../types';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Notification from '../components/common/Notification';

// INTERFAZ LOCAL para el tipo de notificación
interface NotificationType {
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
}

// Datos predeterminados de los campos en Cuemanco Isla 5 - CORREGIDO para usar tipos válidos
const DEFAULT_FIELDS: Omit<Field, 'id' | 'createdAt' | 'updatedAt'>[] = [
  { 
    code: 'Campo 1', 
    name: 'Campo Deportivo 1', 
    type: 'césped', 
    capacity: 14, 
    facilities: ['iluminación', 'vestuarios'], 
    location: { address: 'Isla 5 - Zona Central', city: 'Ciudad Deportiva' }, 
    status: 'available', 
    priority: 1, 
    isActive: true 
  },
  { 
    code: 'Campo 2', 
    name: 'Campo Deportivo 2', 
    type: 'césped', 
    capacity: 14, 
    facilities: ['iluminación', 'vestuarios'], 
    location: { address: 'Isla 5 - Zona Central', city: 'Ciudad Deportiva' }, 
    status: 'reserved', // Cambiado de 'occupied' a 'reserved'
    priority: 1, 
    isActive: true 
  },
  { 
    code: 'Campo 3', 
    name: 'Campo Deportivo 3', 
    type: 'césped', 
    capacity: 14, 
    facilities: ['iluminación'], 
    location: { address: 'Isla 5 - Zona Central', city: 'Ciudad Deportiva' }, 
    status: 'available', 
    priority: 1, 
    isActive: true 
  },
  { 
    code: 'Campo 4', 
    name: 'Campo Deportivo 4', 
    type: 'sintético', 
    capacity: 14, 
    facilities: ['iluminación', 'gradas'], 
    location: { address: 'Isla 5 - Zona Superior', city: 'Ciudad Deportiva' }, 
    status: 'available', 
    priority: 2, 
    isActive: true 
  },
  { 
    code: 'Campo 5', 
    name: 'Campo Deportivo 5', 
    type: 'sintético', 
    capacity: 14, 
    facilities: ['iluminación'], 
    location: { address: 'Isla 5 - Zona Superior', city: 'Ciudad Deportiva' }, 
    status: 'maintenance', 
    priority: 2, 
    isActive: true 
  },
  { 
    code: 'Campo 6', 
    name: 'Campo Deportivo 6', 
    type: 'sintético', 
    capacity: 14, 
    facilities: ['iluminación', 'vestuarios'], 
    location: { address: 'Isla 5 - Zona Superior', city: 'Ciudad Deportiva' }, 
    status: 'available', 
    priority: 2, 
    isActive: true 
  },
  { 
    code: 'Campo 7', 
    name: 'Campo Deportivo 7', 
    type: 'césped', 
    capacity: 14, 
    facilities: ['iluminación', 'estacionamiento'], 
    location: { address: 'Isla 5 - Entrada', city: 'Ciudad Deportiva' }, 
    status: 'reserved', // Cambiado de 'occupied' a 'reserved'
    priority: 3, 
    isActive: true 
  },
  { 
    code: 'Campo 8', 
    name: 'Campo Deportivo 8', 
    type: 'césped', 
    capacity: 14, 
    facilities: ['iluminación', 'estacionamiento'], 
    location: { address: 'Isla 5 - Entrada', city: 'Ciudad Deportiva' }, 
    status: 'available', 
    priority: 3, 
    isActive: true 
  },
  { 
    code: 'Campo 9', 
    name: 'Campo Deportivo 9', 
    type: 'césped', 
    capacity: 14, 
    facilities: ['iluminación'], 
    location: { address: 'Isla 5 - Entrada', city: 'Ciudad Deportiva' }, 
    status: 'available', 
    priority: 3, 
    isActive: true 
  },
  { 
    code: 'Campo 10', 
    name: 'Campo Deportivo 10', 
    type: 'sintético', 
    capacity: 14, 
    facilities: ['iluminación', 'baños'], 
    location: { address: 'Isla 5 - Zona Inferior', city: 'Ciudad Deportiva' }, 
    status: 'reserved', // Cambiado de 'occupied' a 'reserved'
    priority: 4, 
    isActive: true 
  },
  { 
    code: 'Campo 11', 
    name: 'Campo Deportivo 11', 
    type: 'sintético', 
    capacity: 14, 
    facilities: ['iluminación', 'baños'], 
    location: { address: 'Isla 5 - Zona Inferior', city: 'Ciudad Deportiva' }, 
    status: 'available', 
    priority: 4, 
    isActive: true 
  },
  { 
    code: 'Campo 12', 
    name: 'Campo Deportivo 12', 
    type: 'sintético', 
    capacity: 14, 
    facilities: ['iluminación', 'gradas', 'baños'], 
    location: { address: 'Isla 5 - Zona Inferior', city: 'Ciudad Deportiva' }, 
    status: 'available', 
    priority: 4, 
    isActive: true 
  },
  { 
    code: 'Campo 13', 
    name: 'Campo Deportivo 13', 
    type: 'césped', 
    capacity: 12, 
    facilities: ['iluminación'], 
    location: { address: 'Isla 5 - Lateral Izquierdo', city: 'Ciudad Deportiva' }, 
    status: 'maintenance', 
    priority: 5, 
    isActive: true 
  },
  { 
    code: 'Campo 14', 
    name: 'Campo Deportivo 14', 
    type: 'césped', 
    capacity: 12, 
    facilities: ['iluminación'], 
    location: { address: 'Isla 5 - Lateral Izquierdo', city: 'Ciudad Deportiva' }, 
    status: 'available', 
    priority: 5, 
    isActive: true 
  },
];

const Fields: React.FC = () => {
  const navigate = useNavigate();
  const [fields, setFields] = useState<Field[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedField, setSelectedField] = useState<Field | null>(null);
  const [view3D, setView3D] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [notification, setNotification] = useState<NotificationType | null>(null);

  useEffect(() => {
    loadFields();
  }, []);

  const loadFields = async () => {
    try {
      setLoading(true);
      const fieldsData = await fieldService.getFields();
      
      if (fieldsData.length === 0) {
        // Crear campos predeterminados si no existen
        console.log('Creando campos predeterminados...');
        for (const fieldData of DEFAULT_FIELDS) {
          await fieldService.createField(fieldData);
        }
        // Recargar campos
        const newFields = await fieldService.getFields();
        setFields(newFields);
        setNotification({ type: 'success', message: 'Campos predeterminados creados exitosamente' });
      } else {
        setFields(fieldsData);
      }
    } catch (error) {
      console.error('Error cargando campos:', error);
      setNotification({ type: 'error', message: 'Error al cargar los campos' });
    } finally {
      setLoading(false);
    }
  };

  const handleFieldClick = (field: Field) => {
    setSelectedField(field);
    setShowDetails(true);
  };

  const handleNavigate = (path: string) => {
    navigate(path);
  };

  const getStatusColor = (status: Field['status']) => {
    switch (status) {
      case 'available': return 'bg-green-500';
      case 'reserved': return 'bg-red-500'; // Usamos 'reserved' en lugar de 'occupied'
      case 'maintenance': return 'bg-yellow-500';
      case 'unavailable': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = (status: Field['status']) => {
    switch (status) {
      case 'available': return 'Libre';
      case 'reserved': return 'Ocupado'; // Mostramos "Ocupado" para 'reserved'
      case 'maintenance': return 'Mantenimiento';
      case 'unavailable': return 'No disponible';
      default: return 'Desconocido';
    }
  };

  const getStatusIcon = (status: Field['status']) => {
    switch (status) {
      case 'available': return <CheckCircle size={16} className="text-green-500" />;
      case 'reserved': return <XCircle size={16} className="text-red-500" />;
      case 'maintenance': return <AlertCircle size={16} className="text-yellow-500" />;
      case 'unavailable': return <Clock size={16} className="text-gray-500" />;
      default: return <AlertCircle size={16} className="text-gray-500" />;
    }
  };

  const getFieldByNumber = (number: number): Field | undefined => {
    return fields.find(field => {
      const match = field.code.match(/\d+/);
      return match && parseInt(match[0]) === number;
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-sky-50 to-blue-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 to-blue-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <button 
              onClick={() => navigate(-1)}
              className="p-2 -ml-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            
            <div className="text-center">
              <h1 className="text-sm font-bold tracking-tight text-gray-900 dark:text-white uppercase">
                Mapa de Sedes
              </h1>
              <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">
                Sede Cuemanco Isla 5
              </p>
            </div>
            
            <button 
              onClick={() => {
                if (navigator.share) {
                  navigator.share({
                    title: 'Mapa de Sedes - Tocho Prime',
                    text: 'Revisa los campos disponibles en Cuemanco Isla 5',
                    url: window.location.href,
                  }).catch(err => {
                    console.log('Error al compartir:', err);
                  });
                } else {
                  navigator.clipboard.writeText(window.location.href).then(() => {
                    setNotification({ type: 'success', message: 'Enlace copiado al portapapeles' });
                  }).catch(err => {
                    console.log('Error al copiar:', err);
                  });
                }
              }}
              className="p-2 -mr-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <Share2 size={20} />
            </button>
          </div>
        </div>
      </header>

      {/* Status Legend */}
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md px-4 py-3 flex items-center justify-between border-b border-gray-200 dark:border-gray-700">
        <div className="flex gap-4 items-center">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-green-500"></span>
            <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">Libre</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
            <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">Ocupado</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-500"></span>
            <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">Mantenimiento</span>
          </div>
        </div>
        
        <button
          onClick={() => setView3D(!view3D)}
          className="flex items-center gap-1.5 bg-gray-100 dark:bg-gray-800 px-3 py-1.5 rounded-full border border-gray-200 dark:border-gray-700 shadow-sm hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        >
          <Maximize2 size={14} />
          <span className="text-xs font-bold uppercase tracking-wider">
            {view3D ? 'Vista 2D' : 'Vista 3D'}
          </span>
        </button>
      </div>

      {/* Main Map Container */}
      <main className="relative overflow-hidden bg-gradient-to-b from-blue-100 to-cyan-100 dark:from-blue-950 dark:to-cyan-900 select-none">
        {/* Water Pattern */}
        <div className="absolute inset-0 opacity-5 mix-blend-overlay" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2300a8ff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}></div>

        {/* Interactive Map */}
        <div className="relative w-full h-[calc(100vh-180px)] max-w-[430px] mx-auto">
          {/* Island Shape - Water Background */}
          <div className="absolute inset-0 bg-gradient-to-b from-blue-300 to-cyan-300 dark:from-blue-800 dark:to-cyan-800 rounded-3xl m-4 shadow-2xl">
            {/* Waves Pattern */}
            <div className="absolute inset-0 opacity-30" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='20' viewBox='0 0 100 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 10 C20 0, 40 20, 60 10 S80 0, 100 10 V20 H0 Z' fill='%2300a8ff' fill-opacity='0.1'/%3E%3C/svg%3E")`
            }}></div>
          </div>

          {/* ENTRANCE AREA - Fields 7, 8, 9 */}
          <div className="absolute top-[8%] left-[10%] w-[80%] h-[15%] bg-gradient-to-r from-green-400 to-emerald-500 dark:from-green-600 dark:to-emerald-700 rounded-2xl border-4 border-blue-900 shadow-xl flex items-center justify-around px-4">
            {[7, 8, 9].map(num => {
              const field = getFieldByNumber(num);
              const fieldStatus = field?.status || 'available';
              const isReserved = fieldStatus === 'reserved';
              const isMaintenance = fieldStatus === 'maintenance';
              const isUnavailable = fieldStatus === 'unavailable';
              
              return (
                <button
                  key={num}
                  onClick={() => field && handleFieldClick(field)}
                  className={`relative w-16 h-20 rounded-lg border-2 ${
                    isReserved
                      ? 'border-red-500 bg-gradient-to-b from-red-400 to-red-600' 
                      : isMaintenance
                      ? 'border-yellow-500 bg-gradient-to-b from-yellow-400 to-yellow-600'
                      : isUnavailable
                      ? 'border-gray-500 bg-gradient-to-b from-gray-400 to-gray-600'
                      : 'border-green-500 bg-gradient-to-b from-green-400 to-green-600'
                  } flex flex-col items-center justify-center shadow-lg transition-all hover:shadow-xl active:scale-95`}
                >
                  <span className="text-xl font-bold text-white">{num}</span>
                  <span className="text-[10px] text-white font-medium mt-1">
                    {getStatusText(fieldStatus)}
                  </span>
                  <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full ${getStatusColor(fieldStatus)}`}></div>
                </button>
              );
            })}
            
            {/* Entrance Marker */}
            <div className="absolute -left-6 top-1/2 -translate-y-1/2">
              <div className="relative bg-white dark:bg-gray-800 border-2 border-blue-800 p-2 rounded-lg shadow-lg flex flex-col items-center gap-1">
                <Anchor size={16} className="text-blue-800 dark:text-blue-400" />
                <span className="text-[8px] font-black text-blue-800 dark:text-blue-400 uppercase">Entrada</span>
                <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white dark:bg-gray-800 border-r-2 border-b-2 border-blue-800 rotate-45"></div>
              </div>
            </div>
          </div>

          {/* CENTRAL AREA - Fields 1-6 */}
          <div className="absolute top-[25%] left-[27%] w-[62%] h-[35%] bg-gradient-to-r from-green-400 to-emerald-500 dark:from-green-600 dark:to-emerald-700 rounded-2xl border-4 border-blue-900 shadow-xl grid grid-cols-3 grid-rows-2 gap-3 p-4">
            {[4, 5, 6, 1, 2, 3].map(num => {
              const field = getFieldByNumber(num);
              const fieldStatus = field?.status || 'available';
              const isReserved = fieldStatus === 'reserved';
              const isMaintenance = fieldStatus === 'maintenance';
              const isUnavailable = fieldStatus === 'unavailable';
              
              return (
                <button
                  key={num}
                  onClick={() => field && handleFieldClick(field)}
                  className={`relative rounded-lg border-2 ${
                    isReserved
                      ? 'border-red-500 bg-gradient-to-b from-red-400 to-red-600' 
                      : isMaintenance
                      ? 'border-yellow-500 bg-gradient-to-b from-yellow-400 to-yellow-600'
                      : isUnavailable
                      ? 'border-gray-500 bg-gradient-to-b from-gray-400 to-gray-600'
                      : 'border-green-500 bg-gradient-to-b from-green-400 to-green-600'
                  } flex flex-col items-center justify-center shadow-lg transition-all hover:shadow-xl active:scale-95`}
                >
                  <span className="text-lg font-bold text-white">{num}</span>
                  <span className="text-[9px] text-white font-medium">
                    {getStatusText(fieldStatus)}
                  </span>
                  <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full ${getStatusColor(fieldStatus)}`}></div>
                </button>
              );
            })}
            
            {/* Restrooms Icon */}
            <div className="absolute -right-3 top-1/2 -translate-y-1/2 bg-white dark:bg-gray-800 p-2 rounded-lg border border-blue-900 flex flex-col gap-1 shadow-md">
              <Waves size={14} className="text-blue-800 dark:text-blue-300" />
            </div>
          </div>

          {/* LEFT SIDE AREA - Fields 13, 14 */}
          <div className="absolute top-[32%] left-[6%] w-[16%] h-[20%] bg-gradient-to-b from-green-400 to-emerald-500 dark:from-green-600 dark:to-emerald-700 rounded-2xl border-4 border-blue-900 shadow-xl flex flex-col items-center justify-around py-3">
            {[13, 14].map(num => {
              const field = getFieldByNumber(num);
              const fieldStatus = field?.status || 'available';
              const isReserved = fieldStatus === 'reserved';
              const isMaintenance = fieldStatus === 'maintenance';
              const isUnavailable = fieldStatus === 'unavailable';
              
              return (
                <button
                  key={num}
                  onClick={() => field && handleFieldClick(field)}
                  className={`relative w-12 h-14 rounded-lg border-2 ${
                    isReserved
                      ? 'border-red-500 bg-gradient-to-b from-red-400 to-red-600' 
                      : isMaintenance
                      ? 'border-yellow-500 bg-gradient-to-b from-yellow-400 to-yellow-600'
                      : isUnavailable
                      ? 'border-gray-500 bg-gradient-to-b from-gray-400 to-gray-600'
                      : 'border-green-500 bg-gradient-to-b from-green-400 to-green-600'
                  } flex flex-col items-center justify-center shadow-lg transition-all hover:shadow-xl active:scale-95`}
                >
                  <span className="text-sm font-bold text-white">{num}</span>
                  <div className={`absolute -top-1 -right-1 w-2 h-2 rounded-full ${getStatusColor(fieldStatus)}`}></div>
                </button>
              );
            })}
            
            {/* Restaurant Icon */}
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-green-300 dark:bg-green-700/80 p-1.5 rounded-full border-2 border-white flex items-center justify-center shadow-lg">
              <Coffee size={12} className="text-white" />
            </div>
          </div>

          {/* BOTTOM AREA - Fields 10, 11, 12 */}
          <div className="absolute bottom-[12%] left-[45%] w-[50%] h-[25%] bg-gradient-to-r from-green-400 to-emerald-500 dark:from-green-600 dark:to-emerald-700 rounded-2xl border-4 border-blue-900 shadow-xl p-4">
            <div className="flex justify-between h-[60%] mb-3">
              {[11, 10].map(num => {
                const field = getFieldByNumber(num);
                const fieldStatus = field?.status || 'available';
                const isReserved = fieldStatus === 'reserved';
                const isMaintenance = fieldStatus === 'maintenance';
                const isUnavailable = fieldStatus === 'unavailable';
                
                return (
                  <button
                    key={num}
                    onClick={() => field && handleFieldClick(field)}
                    className={`relative w-[48%] rounded-lg border-2 ${
                      isReserved
                        ? 'border-red-500 bg-gradient-to-b from-red-400 to-red-600' 
                        : isMaintenance
                        ? 'border-yellow-500 bg-gradient-to-b from-yellow-400 to-yellow-600'
                        : isUnavailable
                        ? 'border-gray-500 bg-gradient-to-b from-gray-400 to-gray-600'
                        : 'border-green-500 bg-gradient-to-b from-green-400 to-green-600'
                    } flex flex-col items-center justify-center shadow-lg transition-all hover:shadow-xl active:scale-95`}
                  >
                    <span className="text-lg font-bold text-white">{num}</span>
                    <span className="text-[9px] text-white font-medium">
                      {getStatusText(fieldStatus)}
                    </span>
                    <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full ${getStatusColor(fieldStatus)}`}></div>
                  </button>
                );
              })}
            </div>
            
            <div className="h-[30%]">
              <button
                onClick={() => {
                  const field12 = getFieldByNumber(12);
                  if (field12) handleFieldClick(field12);
                }}
                className={`relative w-full h-full rounded-lg border-2 ${
                  getFieldByNumber(12)?.status === 'reserved'
                    ? 'border-red-500 bg-gradient-to-b from-red-400 to-red-600' 
                    : getFieldByNumber(12)?.status === 'maintenance'
                    ? 'border-yellow-500 bg-gradient-to-b from-yellow-400 to-yellow-600'
                    : getFieldByNumber(12)?.status === 'unavailable'
                    ? 'border-gray-500 bg-gradient-to-b from-gray-400 to-gray-600'
                    : 'border-green-500 bg-gradient-to-b from-green-400 to-green-600'
                } flex flex-col items-center justify-center shadow-lg transition-all hover:shadow-xl active:scale-95`}
              >
                <span className="text-lg font-bold text-white">12</span>
                <span className="text-[9px] text-white font-medium">
                  {getStatusText(getFieldByNumber(12)?.status || 'available')}
                </span>
                <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full ${getStatusColor(getFieldByNumber(12)?.status || 'available')}`}></div>
              </button>
            </div>
            
            {/* Facilities Icons */}
            <div className="absolute -right-3 top-1/2 -translate-y-1/2 bg-white dark:bg-gray-800 p-2 rounded-lg border border-blue-900 flex flex-col gap-1 shadow-md">
              <Coffee size={14} className="text-blue-800 dark:text-blue-300" />
              <Waves size={14} className="text-blue-800 dark:text-blue-300" />
            </div>
            
            {/* WiFi Icon */}
            <div className="absolute bottom-2 left-2 bg-green-300 dark:bg-green-700/80 p-1.5 rounded-full border-2 border-white flex items-center justify-center shadow-lg">
              <Wifi size={12} className="text-white" />
            </div>
          </div>

          {/* Boats on Water */}
          <div className="absolute top-[22%] left-[40%] w-6 h-3 bg-amber-900/70 rounded-sm rotate-12"></div>
          <div className="absolute top-[22%] left-[65%] w-6 h-3 bg-amber-900/70 rounded-sm -rotate-6"></div>
          <div className="absolute bottom-[38%] left-[58%] w-8 h-4 bg-amber-900/70 rounded-sm rotate-45"></div>

          {/* Restaurant Markers */}
          <div className="absolute top-[50%] left-[18%] bg-green-300 dark:bg-green-700/80 p-1.5 rounded-full border-2 border-white flex items-center justify-center shadow-lg">
            <Coffee size={14} className="text-white" />
          </div>
          <div className="absolute bottom-[40%] left-[43%] bg-green-300 dark:bg-green-700/80 p-1.5 rounded-full border-2 border-white flex items-center justify-center shadow-lg">
            <Coffee size={14} className="text-white" />
          </div>
        </div>
      </main>

      {/* Bottom Navigation */}
      <nav className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 pb-6 pt-4 px-6 z-50">
        <div className="flex items-center justify-between max-w-md mx-auto">
          <button 
            onClick={() => handleNavigate('/')}
            className="flex flex-col items-center gap-1 group"
          >
            <Home size={20} className="text-gray-400 group-hover:text-blue-600 transition-colors" />
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Inicio</span>
          </button>
          
          <button className="flex flex-col items-center gap-1">
            <MapPin size={20} className="text-blue-600" />
            <span className="text-[10px] font-bold text-blue-600 uppercase tracking-tight">Mapas</span>
          </button>
          
          <button 
            onClick={() => handleNavigate('/calendario')}
            className="flex flex-col items-center gap-1 group"
          >
            <Trophy size={20} className="text-gray-400 group-hover:text-blue-600 transition-colors" />
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Torneos</span>
          </button>
          
          <button 
            onClick={() => handleNavigate('/jugador')}
            className="flex flex-col items-center gap-1 group"
          >
            <User size={20} className="text-gray-400 group-hover:text-blue-600 transition-colors" />
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Perfil</span>
          </button>
        </div>
      </nav>

      {/* Field Details Modal */}
      {selectedField && showDetails && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-sm shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    {selectedField.code}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    {selectedField.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500">
                    {selectedField.location.address}
                  </p>
                </div>
                <button
                  onClick={() => setShowDetails(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-2xl"
                >
                  &times;
                </button>
              </div>
              
              <div className="mb-6">
                <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${
                  selectedField.status === 'available' 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                    : selectedField.status === 'reserved'
                    ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                    : selectedField.status === 'maintenance'
                    ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                    : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
                }`}>
                  <div className={`w-2 h-2 rounded-full ${
                    selectedField.status === 'available' ? 'bg-green-500' :
                    selectedField.status === 'reserved' ? 'bg-red-500' :
                    selectedField.status === 'maintenance' ? 'bg-yellow-500' : 'bg-gray-500'
                  }`}></div>
                  <span className="text-sm font-semibold">{getStatusText(selectedField.status)}</span>
                </div>
              </div>
              
              <div className="space-y-4 mb-6">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Capacidad</span>
                  <span className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <Users size={16} />
                    {selectedField.capacity} jugadores
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Superficie</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {selectedField.type === 'césped' ? 'Césped natural' : 
                     selectedField.type === 'sintético' ? 'Césped sintético' : 
                     selectedField.type === 'arena' ? 'Arena' : 'Otros'}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Prioridad</span>
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <div 
                        key={i}
                        className={`w-3 h-3 rounded-full ${i < (selectedField.priority || 1) ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'}`}
                      />
                    ))}
                  </div>
                </div>
                
                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Facilidades</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedField.facilities.map((facility, index) => (
                      <span 
                        key={index}
                        className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded-md"
                      >
                        {facility}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    navigate(`/partidos?field=${selectedField.code}`);
                    setShowDetails(false);
                  }}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <Calendar size={18} />
                  Ver Partidos
                </button>
                <button
                  onClick={() => {
                    if (selectedField.status === 'available') {
                      setNotification({ 
                        type: 'success', 
                        message: `Campo ${selectedField.code} reservado exitosamente` 
                      });
                      setShowDetails(false);
                    } else {
                      setNotification({ 
                        type: 'error', 
                        message: `Campo ${selectedField.code} no está disponible para reservar` 
                      });
                    }
                  }}
                  className={`flex-1 py-3 rounded-lg transition-colors font-semibold ${
                    selectedField.status === 'available'
                      ? 'bg-green-600 hover:bg-green-700 text-white'
                      : 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                  }`}
                  disabled={selectedField.status !== 'available'}
                >
                  {selectedField.status === 'available' ? 'Reservar' : 'No disponible'}
                </button>
              </div>
              
              {selectedField.notes && (
                <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                  <p className="text-sm text-yellow-800 dark:text-yellow-300">{selectedField.notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Notification */}
      {notification && (
        <Notification
          type={notification.type as 'success' | 'error' | 'info' | 'warning'}
          message={notification.message}
          onClose={() => setNotification(null)}
        />
      )}
    </div>
  );
};

export default Fields;