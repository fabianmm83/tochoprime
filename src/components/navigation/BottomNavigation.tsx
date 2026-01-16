// src/components/navigation/BottomNavigation.tsx
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Home,
  Calendar,
  Trophy,
  Users,
  User,
  Settings,
  Bell,
  DollarSign
} from 'lucide-react';
import { User as UserType } from '../../types';

// Función de mapeo de roles
const mapRoleForNavigation = (role: string): UserType['role'] => {
  const roleMap: Record<string, UserType['role']> = {
    'arbitro': 'árbitro',
    'capitan': 'capitán',
    'fotografo': 'fotógrafo',
    'superadministrador': 'superadministrador',
    'admin': 'admin',
    'jugador': 'jugador',
    'espectador': 'espectador'
  };
  return roleMap[role] || 'espectador';
};

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  path: string;
  roles: UserType['role'][];
}

const BottomNavigation: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { userData } = useAuth();
  
  // Obtener rol mapeado
  const userRole = userData?.role 
    ? mapRoleForNavigation(userData.role)
    : 'espectador';
  
  // Definir items de navegación basados en rol
  const getNavItems = (): NavItem[] => {
    const baseItems: NavItem[] = [
      {
        id: 'home',
        label: 'Inicio',
        icon: <Home size={24} />,
        path: '/dashboard',
        roles: ['superadministrador', 'admin', 'capitán', 'jugador', 'árbitro', 'espectador']
      },
      {
        id: 'matches',
        label: 'Partidos',
        icon: <Calendar size={24} />,
        path: '/matches',
        roles: ['superadministrador', 'admin', 'capitán', 'jugador', 'árbitro', 'espectador']
      },
      {
        id: 'standings',
        label: 'Tabla',
        icon: <Trophy size={24} />,
        path: '/standings',
        roles: ['superadministrador', 'admin', 'capitán', 'jugador', 'espectador']
      }
    ];

    // Items específicos por rol
    const roleSpecificItems: NavItem[] = [];

    if (userRole === 'capitán') {
      roleSpecificItems.push(
        {
          id: 'team',
          label: 'Mi Equipo',
          icon: <Users size={24} />,
          path: '/team',
          roles: ['capitán']
        },
        {
          id: 'payments',
          label: 'Pagos',
          icon: <DollarSign size={24} />,
          path: '/payments',
          roles: ['capitán']
        }
      );
    }

    if (userRole === 'árbitro') {
      roleSpecificItems.push(
        {
          id: 'referee',
          label: 'Árbitro',
          icon: <User size={24} />,
          path: '/referee',
          roles: ['árbitro']
        }
      );
    }

    if (userRole === 'jugador') {
      roleSpecificItems.push(
        {
          id: 'profile',
          label: 'Perfil',
          icon: <User size={24} />,
          path: '/profile',
          roles: ['jugador']
        }
      );
    }

    if (userRole === 'superadministrador' || userRole === 'admin') {
      roleSpecificItems.push(
        {
          id: 'admin',
          label: 'Admin',
          icon: <Settings size={24} />,
          path: '/admin',
          roles: ['superadministrador', 'admin']
        }
      );
    }

    // Todos los usuarios pueden ver notificaciones
    roleSpecificItems.push(
      {
        id: 'notifications',
        label: 'Notificaciones',
        icon: <Bell size={24} />,
        path: '/notifications',
        roles: ['superadministrador', 'admin', 'capitán', 'jugador', 'árbitro', 'espectador']
      }
    );

    return [...baseItems, ...roleSpecificItems];
  };

  const navItems = getNavItems().filter(item => 
    item.roles.includes(userRole)
  );

  const isActive = (path: string) => location.pathname.startsWith(path);

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 safe-area-bottom">
      <div className="flex justify-around items-center h-16">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => navigate(item.path)}
            className={`flex flex-col items-center justify-center p-2 w-full ${
              isActive(item.path)
                ? 'text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <div className={`p-2 rounded-full ${
              isActive(item.path) ? 'bg-blue-50' : ''
            }`}>
              {item.icon}
            </div>
            <span className="text-xs mt-1 font-medium">{item.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
};

export default BottomNavigation;