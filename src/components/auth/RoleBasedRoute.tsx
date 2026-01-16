import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../common/LoadingSpinner';

interface RoleBasedRouteProps {
  children: React.ReactNode;
  allowedRoles: string[];
  redirectTo?: string;
}

const RoleBasedRoute: React.FC<RoleBasedRouteProps> = ({ 
  children, 
  allowedRoles, 
  redirectTo = '/login' 
}) => {
  const { userData, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!userData) {
    return <Navigate to={redirectTo} replace />;
  }

  if (!allowedRoles.includes(userData.role)) {
    // Redirigir al dashboard general si no tiene permisos
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default RoleBasedRoute;