import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  CalendarIcon,
  UserGroupIcon,
  MapPinIcon,
  TrophyIcon,
  UsersIcon,
  DocumentTextIcon,
  CurrencyDollarIcon,
  Cog6ToothIcon,
  BuildingLibraryIcon,
  UserCircleIcon,
  CameraIcon,
  EyeIcon,
  ChartBarIcon,
  ClipboardDocumentListIcon,
  TagIcon,
  BellIcon,
  ArrowRightOnRectangleIcon,
  ChevronRightIcon,
  HomeIcon,
  UserIcon,
  ShieldCheckIcon,
  CalendarDaysIcon,
  TrophyIcon as TrophySolid,
} from '@heroicons/react/24/outline';
import {
  TrophyIcon as TrophyOutline,
  UsersIcon as UsersOutline,
  CalendarDaysIcon as CalendarDaysOutline,
  ChartBarIcon as ChartBarOutline,
} from '@heroicons/react/24/outline';

interface MenuItem {
  titulo: string;
  descripcion: string;
  icono: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  color: string;
  ruta: string;
  rolesPermitidos: string[];
  etiqueta?: string;
  proximamente?: boolean;
}

const Dashboard: React.FC = () => {
  const { userData, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('activos');

  const menuItems: MenuItem[] = [
    // Sistema jerárquico - Fase 1 ✅
    {
      titulo: 'Temporadas',
      descripcion: 'Gestiona temporadas (Primavera 2024, Otoño 2024, etc.)',
      icono: CalendarIcon,
      color: 'bg-blue-500',
      ruta: '/temporadas',
      rolesPermitidos: ['superadministrador', 'admin'],
      etiqueta: 'Activo'
    },
    {
      titulo: 'Divisiones',
      descripcion: 'Configura divisiones (Varonil, Femenil, Mixto)',
      icono: UserGroupIcon,
      color: 'bg-purple-500',
      ruta: '/divisiones',
      rolesPermitidos: ['superadministrador', 'admin'],
      etiqueta: 'Activo'
    },
    {
      titulo: 'Categorías',
      descripcion: 'Gestiona categorías de liga por división',
      icono: TagIcon,
      color: 'bg-indigo-500',
      ruta: '/categorias',
      rolesPermitidos: ['superadministrador', 'admin'],
      etiqueta: 'Activo'
    },
    {
      titulo: 'Campos',
      descripcion: 'Administra los 16+ campos deportivos disponibles',
      icono: MapPinIcon,
      color: 'bg-green-500',
      ruta: '/campos',
      rolesPermitidos: ['superadministrador', 'admin'],
      etiqueta: 'Activo'
    },

    // Equipos y Jugadores - Fase 2 ✅
    {
      titulo: 'Equipos',
      descripcion: 'Gestiona equipos por categoría',
      icono: TrophyIcon,
      color: 'bg-yellow-500',
      ruta: '/equipos',
      rolesPermitidos: ['superadministrador', 'admin', 'capitan'],
      etiqueta: 'Activo'
    },
    {
      titulo: 'Jugadores',
      descripcion: 'Registro y gestión de jugadores',
      icono: UsersIcon,
      color: 'bg-pink-500',
      ruta: '/jugadores',
      rolesPermitidos: ['superadministrador', 'admin', 'capitan'],
      etiqueta: 'Activo'
    },

    // Sistema de Competencia - Fase 3 ✅
    {
      titulo: 'Partidos',
      descripcion: 'Programa y gestiona partidos',
      icono: DocumentTextIcon,
      color: 'bg-red-500',
      ruta: '/partidos',
      rolesPermitidos: ['superadministrador', 'admin', 'arbitro'],
      etiqueta: 'Activo'
    },
    {
      titulo: 'Calendario',
      descripcion: 'Ver calendario de partidos y horarios',
      icono: CalendarIcon,
      color: 'bg-orange-500',
      ruta: '/calendario',
      rolesPermitidos: ['superadministrador', 'admin', 'arbitro', 'capitan', 'jugador'],
      etiqueta: 'Activo'
    },
    {
      titulo: 'Árbitros',
      descripcion: 'Gestiona árbitros y asignaciones',
      icono: UserCircleIcon,
      color: 'bg-teal-500',
      ruta: '/arbitros',
      rolesPermitidos: ['superadministrador', 'admin'],
      etiqueta: 'Activo'
    },

    {
   titulo: 'Mi Panel de Árbitro',
  descripcion: 'Gestiona mis partidos asignados y reportes',
  icono: ShieldCheckIcon, // Usa un icono diferente
  color: 'bg-amber-500',
  ruta: '/arbitro', // ← Esta ruta es para ÁRBITROS
  rolesPermitidos: ['arbitro'], // Solo árbitros
  etiqueta: 'Panel'
},

    // Sistema Antiguo (Compatibilidad)
    {
      titulo: 'Ligas',
      descripcion: 'Sistema antiguo de gestión de ligas',
      icono: BuildingLibraryIcon,
      color: 'bg-gray-500',
      ruta: '/ligas',
      rolesPermitidos: ['superadministrador', 'admin'],
      etiqueta: 'Legado'
    },

    // Funcionalidades Futuras - Fase 4
    {
      titulo: 'Finanzas',
      descripcion: 'Sistema de gestión de pagos y cuotas',
      icono: CurrencyDollarIcon,
      color: 'bg-emerald-500',
      ruta: '/finanzas',
      rolesPermitidos: ['superadministrador', 'admin'],
      proximamente: true
    },
    {
      titulo: 'Fotógrafos',
      descripcion: 'Gestiona fotógrafos asignados',
      icono: CameraIcon,
      color: 'bg-rose-500',
      ruta: '/fotografos',
      rolesPermitidos: ['superadministrador', 'admin'],
      proximamente: true
    },
    {
      titulo: 'Espectadores',
      descripcion: 'Acceso para espectadores y aficionados',
      icono: EyeIcon,
      color: 'bg-gray-400',
      ruta: '/espectadores',
      rolesPermitidos: ['espectador', 'todos'],
      proximamente: true
    },
    {
      titulo: 'Estadísticas',
      descripcion: 'Estadísticas de jugadores y equipos',
      icono: ChartBarIcon,
      color: 'bg-cyan-500',
      ruta: '/estadisticas',
      rolesPermitidos: ['superadministrador', 'admin', 'capitan', 'jugador'],
      proximamente: true
    },
    {
      titulo: 'Reportes',
      descripcion: 'Genera reportes y análisis',
      icono: ClipboardDocumentListIcon,
      color: 'bg-violet-500',
      ruta: '/reportes',
      rolesPermitidos: ['superadministrador', 'admin'],
      proximamente: true
    },
    {
      titulo: 'Notificaciones',
      descripcion: 'Notificaciones y alertas del sistema',
      icono: BellIcon,
      color: 'bg-amber-500',
      ruta: '/notificaciones',
      rolesPermitidos: ['superadministrador', 'admin', 'capitan', 'jugador'],
      proximamente: true
    },
    {
      titulo: 'Configuración',
      descripcion: 'Configuración del sistema',
      icono: Cog6ToothIcon,
      color: 'bg-gray-600',
      ruta: '/configuracion',
      rolesPermitidos: ['superadministrador'],
      proximamente: true
    },
  ];

  const rolUsuario = userData?.role || 'jugador';
  
  // Filtrar items por rol del usuario
  const itemsFiltrados = menuItems.filter(item => 
    item.rolesPermitidos.includes(rolUsuario) || item.rolesPermitidos.includes('todos')
  );
  
  // Separar items activos y próximos
  const itemsActivos = itemsFiltrados.filter(item => !item.proximamente);
  const itemsProximos = itemsFiltrados.filter(item => item.proximamente);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  // Quick access based on role
  const getQuickAccessItems = () => {
    const baseItems = [
      { icon: CalendarDaysOutline, label: 'Calendario', path: '/calendario', color: 'text-blue-600' },
      { icon: TrophyOutline, label: 'Equipos', path: '/equipos', color: 'text-yellow-600' },
      { icon: UsersOutline, label: 'Jugadores', path: '/jugadores', color: 'text-green-600' },
    ];

    if (rolUsuario === 'superadministrador' || rolUsuario === 'admin') {
      return [
        ...baseItems,
        { icon: ChartBarOutline, label: 'Estadísticas', path: '/estadisticas', color: 'text-purple-600' },
        { icon: DocumentTextIcon, label: 'Reportes', path: '/reportes', color: 'text-red-600' },
      ];
    }

    if (rolUsuario === 'capitan') {
      return [
        { icon: TrophyOutline, label: 'Mi Equipo', path: '/teams/me', color: 'text-yellow-600' },
        { icon: CalendarDaysOutline, label: 'Calendario', path: '/calendario', color: 'text-blue-600' },
        { icon: UsersOutline, label: 'Jugadores', path: '/jugadores', color: 'text-green-600' },
      ];
    }

    if (rolUsuario === 'jugador') {
      return [
        { icon: CalendarDaysOutline, label: 'Mis Partidos', path: '/calendario', color: 'text-blue-600' },
        { icon: ChartBarOutline, label: 'Estadísticas', path: '/estadisticas', color: 'text-purple-600' },
        { icon: UsersOutline, label: 'Mi Equipo', path: '/teams/me', color: 'text-green-600' },
      ];
    }

    if (rolUsuario === 'arbitro') {
  return [
    { icon: CalendarDaysOutline, label: 'Mis Partidos', path: '/arbitro', color: 'text-blue-600' },
    { icon: DocumentTextIcon, label: 'Asignaciones', path: '/arbitro', color: 'text-red-600' },
    { icon: ShieldCheckIcon, label: 'Panel Árbitro', path: '/arbitro', color: 'text-amber-600' },
  ];
}

    return baseItems;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white pb-20">
      {/* Header - Mobile Optimized */}
      <div className="bg-white border-b border-gray-200 px-4 pt-4 pb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Panel Principal</h1>
            <div className="flex items-center space-x-2 mt-1">
              <span className="text-sm text-gray-600">
                {userData?.email?.split('@')[0] || 'Usuario'}
              </span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                rolUsuario === 'superadministrador' ? 'bg-purple-100 text-purple-800' :
                rolUsuario === 'admin' ? 'bg-blue-100 text-blue-800' :
                rolUsuario === 'capitan' ? 'bg-green-100 text-green-800' :
                rolUsuario === 'jugador' ? 'bg-gray-100 text-gray-800' :
                rolUsuario === 'arbitro' ? 'bg-orange-100 text-orange-800' :
                'bg-yellow-100 text-yellow-800'
              }`}>
                {rolUsuario === 'superadministrador' ? 'Super Admin' :
                 rolUsuario === 'admin' ? 'Administrador' :
                 rolUsuario === 'capitan' ? 'Capitán' :
                 rolUsuario === 'jugador' ? 'Jugador' :
                 rolUsuario === 'arbitro' ? 'Árbitro' : rolUsuario}
              </span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full"
          >
            <ArrowRightOnRectangleIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Quick Access - Mobile First */}
        <div className="mt-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Acceso Rápido</h2>
          <div className="grid grid-cols-3 gap-3">
            {getQuickAccessItems().map((item, index) => (
              <button
                key={index}
                onClick={() => navigate(item.path)}
                className="flex flex-col items-center p-3 bg-white border border-gray-200 rounded-xl hover:border-blue-300 hover:shadow-sm transition-all"
              >
                <item.icon className={`w-8 h-8 ${item.color} mb-2`} />
                <span className="text-xs font-medium text-gray-700 text-center">{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 pt-6">
        {/* Tabs for Active/Upcoming */}
        <div className="flex border-b border-gray-200 mb-6">
          <button
            className={`flex-1 py-3 text-center font-medium ${
              activeTab === 'activos'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('activos')}
          >
            Activos ({itemsActivos.length})
          </button>
          {itemsProximos.length > 0 && (
            <button
              className={`flex-1 py-3 text-center font-medium ${
                activeTab === 'proximos'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('proximos')}
            >
              Próximos ({itemsProximos.length})
            </button>
          )}
        </div>

        {/* Features Grid - Responsive */}
        <div className="space-y-4">
          {(activeTab === 'activos' ? itemsActivos : itemsProximos).map((item, index) => (
            <div
              key={index}
              className={`bg-white rounded-xl shadow-sm border ${
                item.proximamente ? 'border-gray-200' : 'border-gray-200 hover:border-blue-300'
              } p-4 ${!item.proximamente ? 'active:scale-[0.98] transition-transform' : ''}`}
              onClick={!item.proximamente ? () => navigate(item.ruta) : undefined}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4">
                  <div className={`p-3 ${item.color} rounded-xl`}>
                    <item.icono className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <h3 className="font-semibold text-gray-900">{item.titulo}</h3>
                      {item.etiqueta && (
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          item.etiqueta === 'Activo' ? 'bg-green-100 text-green-800' :
                          item.etiqueta === 'Legado' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {item.etiqueta}
                        </span>
                      )}
                      {item.proximamente && (
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
                          Próximamente
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{item.descripcion}</p>
                  </div>
                </div>
                {!item.proximamente && (
                  <ChevronRightIcon className="w-5 h-5 text-gray-400" />
                )}
              </div>
            </div>
          ))}

          {activeTab === 'activos' && itemsActivos.length === 0 && (
            <div className="text-center py-12">
              <UserCircleIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Sin funcionalidades disponibles</h3>
              <p className="text-gray-600">Tu rol no tiene acceso a ninguna funcionalidad aún.</p>
            </div>
          )}
        </div>

        {/* Role Information - Mobile Optimized */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-start space-x-3">
            <UserCircleIcon className="w-6 h-6 text-blue-600 mt-0.5" />
            <div>
              <h3 className="font-semibold text-blue-900 mb-1">Tu Rol: {rolUsuario}</h3>
              <p className="text-sm text-blue-800">
                {rolUsuario === 'superadministrador' && 'Acceso completo a todas las funcionalidades del sistema.'}
                {rolUsuario === 'admin' && 'Puedes gestionar temporadas, divisiones, campos, equipos, jugadores y partidos.'}
                {rolUsuario === 'capitan' && 'Puedes gestionar tu equipo, jugadores y ver el calendario.'}
                {rolUsuario === 'jugador' && 'Puedes ver tu equipo, horarios de partidos y estadísticas.'}
                {rolUsuario === 'arbitro' && 'Puedes ver partidos asignados y reportar resultados.'}
                {rolUsuario === 'espectador' && 'Puedes ver resultados de partidos y tablas de posiciones.'}
              </p>
            </div>
          </div>
        </div>

        {/* Quick Actions based on Role */}
        {(rolUsuario === 'superadministrador' || rolUsuario === 'admin') && (
          <div className="mt-8">
            <h3 className="font-semibold text-gray-900 mb-4">Acciones Rápidas</h3>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => navigate('/temporadas/nueva')}
                className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 active:scale-95 transition-all text-sm font-medium"
              >
                + Nueva Temporada
              </button>
              <button
                onClick={() => navigate('/equipos/nuevo')}
                className="px-4 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 active:scale-95 transition-all text-sm font-medium"
              >
                + Nuevo Equipo
              </button>
              <button
                onClick={() => navigate('/partidos/nuevo')}
                className="px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 active:scale-95 transition-all text-sm font-medium"
              >
                + Nuevo Partido
              </button>
              <button
                onClick={() => navigate('/jugadores/nuevo')}
                className="px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 active:scale-95 transition-all text-sm font-medium"
              >
                + Nuevo Jugador
              </button>
            </div>
          </div>
        )}

        {rolUsuario === 'capitan' && (
          <div className="mt-8">
            <h3 className="font-semibold text-gray-900 mb-4">Acciones Rápidas</h3>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => navigate('/jugadores/nuevo')}
                className="px-4 py-3 bg-pink-600 text-white rounded-lg hover:bg-pink-700 active:scale-95 transition-all text-sm font-medium"
              >
                + Registrar Jugador
              </button>
              <button
                onClick={() => navigate('/calendario')}
                className="px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 active:scale-95 transition-all text-sm font-medium"
              >
                Ver Calendario
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Padding for Mobile Navigation */}
      <div className="h-20"></div>
    </div>
  );
};

export default Dashboard;