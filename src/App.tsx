// src/App.tsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import PrivateRoute from './components/auth/PrivateRoute';
import RoleBasedRoute from './components/auth/RoleBasedRoute';

// Páginas de autenticación
import Login from './pages/Login';
import Register from './pages/Register';
import StandingsTable from './pages/StandingsTable';
import LiveScore from './pages/LiveScore';
// Dashboard principal
import Dashboard from './pages/Dashboard';

// Vistas móviles por rol
import PlayerDashboard from './pages/PlayerDashboard';
import CaptainPanel from './pages/CaptainPanel';
import RefereePanel from './pages/RefereePanel';
import AdminDashboard from './pages/AdminDashboard';

import LandingPage from './pages/LandingPage';


// Páginas del sistema existentes
import Seasons from './pages/Seasons';
import SeasonDetail from './pages/SeasonDetail';
import Divisions from './pages/Divisions';
import Categories from './pages/Categories';
import CategoriesDetail from './pages/CategoriesDetail';
import Fields from './pages/Fields';
import Teams from './pages/Teams';
import TeamDetail from './pages/TeamDetail';
import Players from './pages/Players';
import Matches from './pages/Matches';
import MatchDetail from './pages/MatchDetail';
import Calendar from './pages/Calendar';
import Referees from './pages/Referees';
import Leagues from './pages/Leagues';
import LeagueDetail from './pages/LeagueDetail';
import MatchSchedulerPage from './pages/MatchSchedulerPage';

// Importar la página de crear partido desde la subcarpeta matches
import CreateMatchPage from './pages/matches/CreateMatchPage';

// Componente para redirección por rol
const RoleBasedRedirect: React.FC = () => {
  const { userData } = useAuth();
  
  if (!userData) {
    return <Navigate to="/login" replace />;
  }
  
  switch (userData.role) {
    case 'jugador':
      return <Navigate to="/jugador" replace />;
    case 'capitan':
      return <Navigate to="/capitan" replace />;
    case 'arbitro':
      return <Navigate to="/arbitro" replace />;
    case 'admin':
    case 'superadministrador':
      return <Navigate to="/admin" replace />;
    default:
      return <Navigate to="/dashboard" replace />;
  }
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* ==================== RUTAS PÚBLICAS ==================== */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          {/* ==================== RUTAS PRINCIPALES POR ROL ==================== */}
          
          {/* Redirección automática basada en rol */}
          <Route path="/redirect" element={
            <PrivateRoute>
              <RoleBasedRedirect />
            </PrivateRoute>
          } />
          
          {/* Dashboard principal - para todos los usuarios autenticados */}
          <Route path="/dashboard" element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          } />
          
          {/* Vistas móviles específicas por rol */}
          <Route path="/jugador" element={
            <PrivateRoute>
              <RoleBasedRoute allowedRoles={['jugador', 'superadministrador', 'admin', 'capitan']}>
                <PlayerDashboard />
              </RoleBasedRoute>
            </PrivateRoute>
          } />
          
          <Route path="/capitan" element={
            <PrivateRoute>
              <RoleBasedRoute allowedRoles={['capitan', 'superadministrador', 'admin']}>
                <CaptainPanel />
              </RoleBasedRoute>
            </PrivateRoute>
          } />
          
          <Route path="/arbitro" element={
            <PrivateRoute>
              <RoleBasedRoute allowedRoles={['arbitro', 'superadministrador', 'admin']}>
                <RefereePanel />
              </RoleBasedRoute>
            </PrivateRoute>
          } />
          
          <Route path="/admin" element={
            <PrivateRoute>
              <RoleBasedRoute allowedRoles={['superadministrador', 'admin']}>
                <AdminDashboard />
              </RoleBasedRoute>
            </PrivateRoute>
          } />
          
          {/* ==================== RUTAS DEL SISTEMA - ESPAÑOL ==================== */}
          
          {/* Sistema jerárquico */}
          <Route path="/temporadas" element={
            <PrivateRoute>
              <RoleBasedRoute allowedRoles={['superadministrador', 'admin']}>
                <Seasons />
              </RoleBasedRoute>
            </PrivateRoute>
          } />
          
          <Route path="/temporadas/:id" element={
            <PrivateRoute>
              <SeasonDetail />
            </PrivateRoute>
          } />
          
          <Route path="/divisiones" element={
            <PrivateRoute>
              <RoleBasedRoute allowedRoles={['superadministrador', 'admin']}>
                <Divisions />
              </RoleBasedRoute>
            </PrivateRoute>
          } />
          
          <Route path="/categorias" element={
            <PrivateRoute>
              <RoleBasedRoute allowedRoles={['superadministrador', 'admin']}>
                <CategoriesDetail />
              </RoleBasedRoute>
            </PrivateRoute>
          } />
          
          <Route path="/divisiones/:divisionId/categorias" element={
            <PrivateRoute>
              <RoleBasedRoute allowedRoles={['superadministrador', 'admin']}>
                <Categories />
              </RoleBasedRoute>
            </PrivateRoute>
          } />
          
          <Route path="/campos" element={
            <PrivateRoute>
              <RoleBasedRoute allowedRoles={['superadministrador', 'admin', 'capitan', 'jugador']}>
                <Fields />
              </RoleBasedRoute>
            </PrivateRoute>
          } />
          
          {/* Equipos y jugadores */}
          <Route path="/equipos" element={
            <PrivateRoute>
              <RoleBasedRoute allowedRoles={['superadministrador', 'admin', 'capitan']}>
                <Teams />
              </RoleBasedRoute>
            </PrivateRoute>
          } />
          
          <Route path="/equipos/:id" element={
            <PrivateRoute>
              <RoleBasedRoute allowedRoles={['superadministrador', 'admin', 'capitan']}>
                <TeamDetail />
              </RoleBasedRoute>
            </PrivateRoute>
          } />
          
          <Route path="/jugadores" element={
            <PrivateRoute>
              <RoleBasedRoute allowedRoles={['superadministrador', 'admin', 'capitan']}>
                <Players />
              </RoleBasedRoute>
            </PrivateRoute>
          } />
          
          {/* Partidos */}
          <Route path="/partidos" element={
            <PrivateRoute>
              <RoleBasedRoute allowedRoles={['superadministrador', 'admin', 'arbitro', 'capitan', 'jugador']}>
                <Matches />
              </RoleBasedRoute>
            </PrivateRoute>
          } />
          
          {/* Ruta CORREGIDA para crear partido - usa CreateMatchPage desde la subcarpeta */}
          <Route path="/partidos/nuevo" element={
            <PrivateRoute>
              <RoleBasedRoute allowedRoles={['superadministrador', 'admin']}>
                <CreateMatchPage />
              </RoleBasedRoute>
            </PrivateRoute>
          } />
          
          <Route path="/partidos/:id" element={
            <PrivateRoute>
              <RoleBasedRoute allowedRoles={['superadministrador', 'admin', 'arbitro', 'capitan', 'jugador']}>
                <MatchDetail />
              </RoleBasedRoute>
            </PrivateRoute>
          } />
          
          <Route path="/partidos/:id/editar" element={
            <PrivateRoute>
              <RoleBasedRoute allowedRoles={['superadministrador', 'admin']}>
                <MatchDetail />
              </RoleBasedRoute>
            </PrivateRoute>
          } />
          
          <Route path="/partidos/:id/resultado" element={
            <PrivateRoute>
              <RoleBasedRoute allowedRoles={['superadministrador', 'admin', 'arbitro']}>
                <MatchDetail />
              </RoleBasedRoute>
            </PrivateRoute>
          } />
          
          <Route path="/calendario" element={
            <PrivateRoute>
              <RoleBasedRoute allowedRoles={['superadministrador', 'admin', 'arbitro', 'capitan', 'jugador']}>
                <Calendar />
              </RoleBasedRoute>
            </PrivateRoute>
          } />
          
          <Route path="/partidos/generar-calendario" element={
            <PrivateRoute>
              <RoleBasedRoute allowedRoles={['superadministrador', 'admin']}>
                <MatchSchedulerPage />
              </RoleBasedRoute>
            </PrivateRoute>
          } />
          
          <Route path="/tabla-posiciones" element={
  <PrivateRoute>
    <RoleBasedRoute allowedRoles={['superadministrador', 'admin', 'capitan', 'jugador', 'arbitro', 'espectador']}>
      <StandingsTable />
    </RoleBasedRoute>
  </PrivateRoute>
} />

<Route path="/marcador-en-vivo" element={
  <PrivateRoute>
    <RoleBasedRoute allowedRoles={['superadministrador', 'admin', 'arbitro']}>
      <LiveScore />
    </RoleBasedRoute>
  </PrivateRoute>
} />
          
          {/* Árbitros */}
          <Route path="/arbitros" element={
            <PrivateRoute>
              <RoleBasedRoute allowedRoles={['superadministrador', 'admin']}>
                <Referees />
              </RoleBasedRoute>
            </PrivateRoute>
          } />
          
          {/* Sistema anterior (legacy) */}
          <Route path="/ligas" element={
            <PrivateRoute>
              <RoleBasedRoute allowedRoles={['superadministrador', 'admin']}>
                <Leagues />
              </RoleBasedRoute>
            </PrivateRoute>
          } />
          
          <Route path="/ligas/:id" element={
            <PrivateRoute>
              <LeagueDetail />
            </PrivateRoute>
          } />
          
          {/* ==================== RUTAS EN INGLÉS (COMPATIBILIDAD) ==================== */}
          
          {/* Redirecciones para compatibilidad */}
          <Route path="/seasons" element={<Navigate to="/temporadas" replace />} />
          <Route path="/seasons/:id" element={<Navigate to="/temporadas/:id" replace />} />
          <Route path="/divisions" element={<Navigate to="/divisiones" replace />} />
          <Route path="/categories" element={<Navigate to="/categorias" replace />} />
          <Route path="/fields" element={<Navigate to="/campos" replace />} />
          <Route path="/teams" element={<Navigate to="/equipos" replace />} />
          <Route path="/teams/:id" element={<Navigate to="/equipos/:id" replace />} />
          <Route path="/players" element={<Navigate to="/jugadores" replace />} />
          <Route path="/matches" element={<Navigate to="/partidos" replace />} />
          <Route path="/matches/new" element={<Navigate to="/partidos/nuevo" replace />} />
          <Route path="/matches/:id" element={<Navigate to="/partidos/:id" replace />} />
          <Route path="/matches/:id/edit" element={<Navigate to="/partidos/:id/editar" replace />} />
          <Route path="/matches/:id/result" element={<Navigate to="/partidos/:id/resultado" replace />} />
          <Route path="/calendar" element={<Navigate to="/calendario" replace />} />
          <Route path="/referees" element={<Navigate to="/arbitros" replace />} />
          <Route path="/leagues" element={<Navigate to="/ligas" replace />} />
          <Route path="/leagues/:id" element={<Navigate to="/ligas/:id" replace />} />
          
          {/* ==================== RUTA 404 ==================== */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;