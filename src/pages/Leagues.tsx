import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db, DIVISIONS, CATEGORIES, COLLECTIONS } from '../services/firebase';
import { 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  where, 
  orderBy 
} from 'firebase/firestore';

const Leagues: React.FC = () => {
  const navigate = useNavigate();
  const { userData } = useAuth();
  const [leagues, setLeagues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filters, setFilters] = useState({
    division: '',
    category: '',
    status: 'active'
  });
  
  // Formulario nueva liga
  const [newLeague, setNewLeague] = useState({
    name: '',
    division: 'varonil',
    category: 'A',
    season: '2024',
    maxTeams: 12,
    description: ''
  });

  // Cargar ligas
  const loadLeagues = async () => {
    setLoading(true);
    try {
      let q = query(collection(db, COLLECTIONS.LEAGUES), orderBy('createdAt', 'desc'));
      
      // Aplicar filtros
      const conditions = [];
      if (filters.division) conditions.push(where('division', '==', filters.division));
      if (filters.category) conditions.push(where('category', '==', filters.category));
      if (filters.status) conditions.push(where('status', '==', filters.status));
      
      if (conditions.length > 0) {
        q = query(collection(db, COLLECTIONS.LEAGUES), ...conditions, orderBy('createdAt', 'desc'));
      }

      const snapshot = await getDocs(q);
      const leaguesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setLeagues(leaguesData);
    } catch (error) {
      console.error('Error cargando ligas:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLeagues();
  }, [filters]);

  // Crear liga
  const handleCreateLeague = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userData) return;

    try {
      await addDoc(collection(db, COLLECTIONS.LEAGUES), {
        ...newLeague,
        teamCount: 0,
        status: 'active',
        createdBy: userData.uid,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      setShowCreateModal(false);
      setNewLeague({
        name: '',
        division: 'varonil',
        category: 'A',
        season: '2024',
        maxTeams: 12,
        description: ''
      });
      
      loadLeagues();
      alert('Liga creada exitosamente!');
    } catch (error) {
      console.error('Error creando liga:', error);
      alert('Error al crear la liga');
    }
  };

  // Eliminar liga
  const handleDeleteLeague = async (leagueId: string) => {
    if (!confirm('¿Estás seguro de eliminar esta liga?')) return;
    
    try {
      await deleteDoc(doc(db, COLLECTIONS.LEAGUES, leagueId));
      loadLeagues();
      alert('Liga eliminada');
    } catch (error) {
      console.error('Error eliminando liga:', error);
    }
  };

  // Verificar permisos
  const canManageLeagues = userData?.role === 'superadministrador' || userData?.role === 'admin';

  if (!canManageLeagues) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <h2 className="text-xl font-bold text-yellow-800">Acceso restringido</h2>
            <p className="text-yellow-700 mt-2">No tienes permisos para gestionar ligas.</p>
            <button 
              onClick={() => navigate('/dashboard')}
              className="mt-4 px-4 py-2 bg-yellow-100 text-yellow-800 rounded-lg hover:bg-yellow-200"
            >
              Volver al Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Gestión de Ligas</h1>
              <p className="text-gray-600 mt-2">Administra las ligas de Tocho Prime</p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-tocho-primary text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700"
            >
              + Nueva Liga
            </button>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Filtros</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">División</label>
              <select
                value={filters.division}
                onChange={(e) => setFilters({...filters, division: e.target.value})}
                className="w-full px-4 py-2 border rounded-lg"
              >
                <option value="">Todas</option>
                {DIVISIONS.map(div => (
                  <option key={div} value={div}>{div.charAt(0).toUpperCase() + div.slice(1)}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Categoría</label>
              <select
                value={filters.category}
                onChange={(e) => setFilters({...filters, category: e.target.value})}
                className="w-full px-4 py-2 border rounded-lg"
              >
                <option value="">Todas</option>
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>Liga {cat}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Estado</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({...filters, status: e.target.value})}
                className="w-full px-4 py-2 border rounded-lg"
              >
                <option value="active">Activas</option>
                <option value="inactive">Inactivas</option>
                <option value="all">Todos</option>
              </select>
            </div>
          </div>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="text-3xl font-bold text-blue-600">{leagues.length}</div>
            <p className="text-gray-600">Ligas Totales</p>
          </div>
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="text-3xl font-bold text-green-600">
              {leagues.filter(l => l.status === 'active').length}
            </div>
            <p className="text-gray-600">Ligas Activas</p>
          </div>
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="text-3xl font-bold text-purple-600">
              {leagues.reduce((sum, league) => sum + (league.teamCount || 0), 0)}
            </div>
            <p className="text-gray-600">Equipos Totales</p>
          </div>
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="text-3xl font-bold text-yellow-600">
              {leagues.reduce((sum, league) => sum + (league.maxTeams || 0), 0)}
            </div>
            <p className="text-gray-600">Capacidad Total</p>
          </div>
        </div>

        {/* Lista de Ligas */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-tocho-primary"></div>
              <p className="mt-2 text-gray-600">Cargando ligas...</p>
            </div>
          ) : leagues.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-600">No hay ligas registradas</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="mt-4 text-tocho-primary hover:underline"
              >
                Crear la primera liga
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Liga</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">División/Categoría</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Temporada</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Equipos</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {leagues.map((league) => (
                    <tr key={league.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-medium text-gray-900">{league.name}</div>
                          <div className="text-sm text-gray-500 truncate max-w-xs">{league.description}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {league.division}
                          </span>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                            Liga {league.category}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">{league.season}</td>
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          <span className="font-medium">{league.teamCount || 0}</span>
                          <span className="text-gray-500"> / {league.maxTeams || 12}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                          <div 
                            className="bg-green-600 h-2 rounded-full"
                            style={{ width: `${((league.teamCount || 0) / (league.maxTeams || 12)) * 100}%` }}
                          ></div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                          league.status === 'active' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {league.status === 'active' ? 'Activa' : 'Inactiva'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => navigate(`/ligas/${league.id}`)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            Ver
                          </button>
                          <button
                            onClick={() => navigate(`/ligas/${league.id}/equipos`)}
                            className="text-green-600 hover:text-green-900"
                          >
                            Equipos
                          </button>
                          <button
                            onClick={() => handleDeleteLeague(league.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal Crear Liga */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-lg max-w-md w-full">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Nueva Liga</h2>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              
              <form onSubmit={handleCreateLeague}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Nombre de la Liga *</label>
                    <input
                      type="text"
                      value={newLeague.name}
                      onChange={(e) => setNewLeague({...newLeague, name: e.target.value})}
                      className="w-full px-4 py-2 border rounded-lg"
                      required
                      placeholder="Ej: Liga A Varonil"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">División *</label>
                      <select
                        value={newLeague.division}
                        onChange={(e) => setNewLeague({...newLeague, division: e.target.value})}
                        className="w-full px-4 py-2 border rounded-lg"
                        required
                      >
                        {DIVISIONS.map(div => (
                          <option key={div} value={div}>{div.charAt(0).toUpperCase() + div.slice(1)}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-2">Categoría *</label>
                      <select
                        value={newLeague.category}
                        onChange={(e) => setNewLeague({...newLeague, category: e.target.value})}
                        className="w-full px-4 py-2 border rounded-lg"
                        required
                      >
                        {CATEGORIES.map(cat => (
                          <option key={cat} value={cat}>Liga {cat}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Temporada *</label>
                    <input
                      type="text"
                      value={newLeague.season}
                      onChange={(e) => setNewLeague({...newLeague, season: e.target.value})}
                      className="w-full px-4 py-2 border rounded-lg"
                      required
                      placeholder="Ej: Primavera 2024"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Máximo de Equipos</label>
                    <input
                      type="number"
                      value={newLeague.maxTeams}
                      onChange={(e) => setNewLeague({...newLeague, maxTeams: parseInt(e.target.value)})}
                      className="w-full px-4 py-2 border rounded-lg"
                      min="2"
                      max="20"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Descripción</label>
                    <textarea
                      value={newLeague.description}
                      onChange={(e) => setNewLeague({...newLeague, description: e.target.value})}
                      className="w-full px-4 py-2 border rounded-lg"
                      rows={3}
                      placeholder="Descripción opcional..."
                    />
                  </div>
                </div>
                
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-tocho-primary text-white rounded-lg hover:bg-blue-700"
                  >
                    Crear Liga
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Leagues;