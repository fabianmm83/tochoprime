import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Share2, 
  MapPin, 
  Trophy,
  User,
  Home,
  Wifi,
  Coffee,
  Waves,
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
    status: 'reserved',
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
    status: 'reserved',
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
    status: 'reserved',
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
      case 'reserved': return 'bg-red-500';
      case 'maintenance': return 'bg-yellow-500';
      case 'unavailable': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = (status: Field['status']) => {
    switch (status) {
      case 'available': return 'Libre';
      case 'reserved': return 'Ocupado';
      case 'maintenance': return 'Mantenimiento';
      case 'unavailable': return 'No disponible';
      default: return 'Desconocido';
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
      <header className="pt-6 px-4 pb-3 bg-white dark:bg-gray-900 shadow-md sticky top-0 z-50">
        <div className="flex items-baseline justify-between">
          <h1 className="text-xl font-extrabold tracking-tighter text-blue-700 dark:text-blue-400">TOCHO PRIME</h1>
          <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">Layout de Sedes</span>
        </div>
        <div className="mt-2">
          <h2 className="text-lg font-bold leading-tight">Mapa Maestro Cuemanco</h2>
          <p className="text-[10px] uppercase text-gray-500 dark:text-gray-400 font-bold tracking-wider">Temporada Otoño 2024</p>
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
      <main className="relative flex-grow overflow-hidden min-h-[calc(100vh-180px)] bg-gradient-to-b from-blue-900 via-blue-800 to-cyan-800">
        {/* Water Ripples */}
        <div className="absolute w-40 h-40 top-1/4 -left-10 rounded-full bg-white/5 animate-pulse" style={{ animationDelay: '0s' }}></div>
        <div className="absolute w-60 h-60 bottom-1/4 -right-20 rounded-full bg-white/5 animate-pulse" style={{ animationDelay: '2s' }}></div>
        
        {/* Lizards/Iguanas */}
        <div className="absolute right-4 top-16 opacity-90 z-10">
          <div className="w-8 h-8 rounded-full bg-pink-100 flex items-center justify-center border-2 border-pink-400 shadow-md">
            <span className="text-xs">🦎</span>
          </div>
        </div>
        <div className="absolute left-8 bottom-32 opacity-90 z-10">
          <div className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center border-2 border-pink-400 shadow-md">
            <span className="text-base">🦎</span>
          </div>
        </div>

        {/* Map Layout */}
        <div className="relative w-full h-full max-w-sm mx-auto px-4 pt-8 pb-12 flex flex-col">
          {/* TOP AREA - Fields 7, 8, 9 */}
          <div className="flex justify-center ml-16 z-20">
            <div className="bg-emerald-600/90 p-2.5 rounded-xl border-4 border-blue-900 flex gap-2 shadow-xl">
              {[7, 8, 9].map(num => {
                const field = getFieldByNumber(num);
                const status = field?.status || 'available';
                const isReserved = status === 'reserved';
                const isMaintenance = status === 'maintenance';
                const isUnavailable = status === 'unavailable';
                
                return (
                  <button
                    key={num}
                    onClick={() => field && handleFieldClick(field)}
                    className={`flex flex-col items-center justify-center rounded-md border-2 border-white/40 w-16 h-20 shadow-inner transition-all hover:scale-105 active:scale-95 ${
                      isReserved
                        ? 'bg-red-500'
                        : isMaintenance
                        ? 'bg-yellow-500'
                        : isUnavailable
                        ? 'bg-gray-500'
                        : 'bg-green-500'
                    }`}
                  >
                    <span className="text-xl font-extrabold text-white">{num}</span>
                    <span className="text-[8px] font-black uppercase text-white">
                      {getStatusText(status)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Vertical Bridge */}
          <div className="trajinera-path w-5 h-8 ml-[195px] -my-0.5 z-10 bg-amber-900 shadow-md">
            <div className="trajinera-line h-full w-px bg-black/20 mx-auto"></div>
            <div className="trajinera-line h-full w-px bg-black/20 mx-auto"></div>
          </div>

          {/* MAIN CONTENT AREA */}
          <div className="flex gap-4">
            {/* LEFT SIDE - Fields 13, 14, Soccer, 15, 16 */}
            <div className="flex flex-col gap-4 z-20">
              {/* Fields 13, 14 */}
              <div className="bg-emerald-600/90 p-2 rounded-lg border-4 border-blue-900 flex flex-col gap-2 shadow-lg">
                {[13, 14].map(num => {
                  const field = getFieldByNumber(num);
                  const status = field?.status || 'available';
                  const isReserved = status === 'reserved';
                  const isMaintenance = status === 'maintenance';
                  const isUnavailable = status === 'unavailable';
                  
                  return (
                    <button
                      key={num}
                      onClick={() => field && handleFieldClick(field)}
                      className={`flex items-center justify-center rounded border border-white/50 w-14 h-16 transition-all hover:scale-105 active:scale-95 ${
                        isReserved
                          ? 'bg-red-500'
                          : isMaintenance
                          ? 'bg-yellow-500'
                          : isUnavailable
                          ? 'bg-gray-500'
                          : 'bg-green-500'
                      }`}
                    >
                      <span className="text-lg font-extrabold text-white">{num}</span>
                    </button>
                  );
                })}
              </div>

              {/* Bridge */}
              <div className="trajinera-path w-6 h-4 mx-auto -my-4 z-10 bg-amber-900 shadow-sm">
                <div className="trajinera-line h-full w-px bg-black/20 mx-auto"></div>
              </div>

              {/* Soccer Field */}
              <div className="bg-emerald-600/90 p-2 rounded-lg border-4 border-blue-900 shadow-lg relative">
                <div className="flex items-center justify-center bg-green-500 rounded border border-white/50 w-14 h-28">
                  <span className="text-xs font-black uppercase -rotate-90 tracking-tighter text-white">SOCCER</span>
                </div>
              </div>

              {/* Bridge */}
              <div className="trajinera-path w-6 h-4 mx-auto -my-4 z-10 bg-amber-900 shadow-sm">
                <div className="trajinera-line h-full w-px bg-black/20 mx-auto"></div>
              </div>

              {/* Fields 15, 16 */}
              <div className="bg-emerald-600/90 p-2 rounded-lg border-4 border-blue-900 flex flex-col gap-2 shadow-lg">
                {[15, 16].map(num => {
                  const field = getFieldByNumber(num);
                  const status = field?.status || 'available';
                  const isReserved = status === 'reserved';
                  const isMaintenance = status === 'maintenance';
                  const isUnavailable = status === 'unavailable';
                  
                  return (
                    <button
                      key={num}
                      onClick={() => field && handleFieldClick(field)}
                      className={`flex items-center justify-center rounded border border-white/50 w-14 h-12 transition-all hover:scale-105 active:scale-95 ${
                        isReserved
                          ? 'bg-red-500'
                          : isMaintenance
                          ? 'bg-yellow-500'
                          : isUnavailable
                          ? 'bg-gray-500'
                          : 'bg-green-500'
                      }`}
                    >
                      <span className="text-lg font-extrabold text-white">{num}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* RIGHT SIDE - Fields 1-6 and 10-12 */}
            <div className="flex flex-col flex-grow items-end gap-0">
              {/* Horizontal Bridge */}
              <div className="flex items-center justify-end w-full">
                <div className="trajinera-path h-5 w-6 mr-[-4px] z-10 mt-12 bg-amber-900 shadow-sm">
                  <div className="w-full flex flex-col justify-around py-1">
                    <div className="w-full h-px bg-black/20"></div>
                    <div className="w-full h-px bg-black/20"></div>
                  </div>
                </div>
                
                {/* CENTRAL AREA - Fields 1-6 */}
                <div className="bg-emerald-600/90 p-3.5 rounded-xl border-4 border-blue-900 grid grid-cols-3 gap-2.5 shadow-2xl relative z-20">
                  {[4, 5, 6, 1, 2, 3].map(num => {
                    const field = getFieldByNumber(num);
                    const status = field?.status || 'available';
                    const isReserved = status === 'reserved';
                    const isMaintenance = status === 'maintenance';
                    const isUnavailable = status === 'unavailable';
                    
                    return (
                      <button
                        key={num}
                        onClick={() => field && handleFieldClick(field)}
                        className={`flex flex-col items-center justify-center rounded-md border-2 border-white/40 w-16 h-22 shadow-inner transition-all hover:scale-105 active:scale-95 ${
                          isReserved
                            ? 'bg-red-500'
                            : isMaintenance
                            ? 'bg-yellow-500'
                            : isUnavailable
                            ? 'bg-gray-500'
                            : 'bg-green-500'
                        }`}
                      >
                        <span className="text-xl font-extrabold text-white">{num}</span>
                        <span className="text-[8px] font-black uppercase text-white">
                          {getStatusText(status)}
                        </span>
                      </button>
                    );
                  })}
                  
                  {/* Facilities Icons */}
                  <div className="absolute -right-6 top-1/2 -translate-y-1/2 flex flex-col gap-1 z-30">
                    <div className="bg-blue-600 p-1 rounded-md border border-white/30 shadow-md">
                      <Waves size={14} className="text-white" />
                    </div>
                    <div className="bg-blue-600 p-1 rounded-md border border-white/30 shadow-md">
                      <Coffee size={14} className="text-white" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Vertical Bridge */}
              <div className="trajinera-path w-5 h-8 mr-12 -my-1 z-10 bg-amber-900 shadow-md">
                <div className="trajinera-line h-full w-px bg-black/20 mx-auto"></div>
                <div className="trajinera-line h-full w-px bg-black/20 mx-auto"></div>
              </div>

              {/* BOTTOM AREA - Fields 10, 11, 12 */}
              <div className="bg-emerald-600/90 p-3 rounded-xl border-4 border-blue-900 flex flex-col gap-2.5 shadow-xl relative z-20">
                {/* Row with Fields 11 and 10 */}
                <div className="flex gap-2.5">
                  {[11, 10].map(num => {
                    const field = getFieldByNumber(num);
                    const status = field?.status || 'available';
                    const isReserved = status === 'reserved';
                    const isMaintenance = status === 'maintenance';
                    const isUnavailable = status === 'unavailable';
                    
                    return (
                      <button
                        key={num}
                        onClick={() => field && handleFieldClick(field)}
                        className={`flex flex-col items-center justify-center rounded-md border-2 border-white/40 w-16 h-18 shadow-inner transition-all hover:scale-105 active:scale-95 ${
                          isReserved
                            ? 'bg-red-500'
                            : isMaintenance
                            ? 'bg-yellow-500'
                            : isUnavailable
                            ? 'bg-gray-500'
                            : 'bg-green-500'
                        }`}
                      >
                        <span className="text-xl font-extrabold text-white">{num}</span>
                        <span className="text-[8px] font-black uppercase text-white">
                          {getStatusText(status)}
                        </span>
                      </button>
                    );
                  })}
                </div>
                
                {/* Field 12 */}
                <button
                  onClick={() => {
                    const field12 = getFieldByNumber(12);
                    if (field12) handleFieldClick(field12);
                  }}
                  className={`flex flex-col items-center justify-center rounded-md border-2 border-white/40 w-full h-14 shadow-inner transition-all hover:scale-105 active:scale-95 ${
                    getFieldByNumber(12)?.status === 'reserved'
                      ? 'bg-red-500'
                      : getFieldByNumber(12)?.status === 'maintenance'
                      ? 'bg-yellow-500'
                      : getFieldByNumber(12)?.status === 'unavailable'
                      ? 'bg-gray-500'
                      : 'bg-green-500'
                  }`}
                >
                  <span className="text-xl font-extrabold text-white">12</span>
                  <span className="text-[8px] font-black uppercase text-white">
                    {getStatusText(getFieldByNumber(12)?.status || 'available')}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Status Legend Bar */}
      <div className="px-4 py-3 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 flex items-center justify-center gap-8 text-[11px] font-bold">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-500 border border-white/50 rounded-sm shadow-sm"></div>
          <span className="tracking-widest text-gray-700 dark:text-gray-300">LIBRE</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-500 border border-white/50 rounded-sm shadow-sm"></div>
          <span className="tracking-widest text-gray-700 dark:text-gray-300">OCUPADO</span>
        </div>
      </div>

      {/* Bottom Navigation */}
      <nav className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 px-8 py-3 flex justify-between items-center z-50">
        <button 
          onClick={() => handleNavigate('/')}
          className="flex flex-col items-center text-gray-400 hover:text-blue-600 transition-colors"
        >
          <Home size={20} />
          <span className="text-[9px] font-bold uppercase mt-0.5">Inicio</span>
        </button>
        
        <button className="flex flex-col items-center text-blue-600">
          <MapPin size={20} />
          <span className="text-[9px] font-bold uppercase mt-0.5">Mapas</span>
        </button>
        
        <button 
          onClick={() => handleNavigate('/calendario')}
          className="flex flex-col items-center text-gray-400 hover:text-blue-600 transition-colors"
        >
          <Trophy size={20} />
          <span className="text-[9px] font-bold uppercase mt-0.5">Torneos</span>
        </button>
        
        <button 
          onClick={() => handleNavigate('/jugador')}
          className="flex flex-col items-center text-gray-400 hover:text-blue-600 transition-colors"
        >
          <User size={20} />
          <span className="text-[9px] font-bold uppercase mt-0.5">Perfil</span>
        </button>
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