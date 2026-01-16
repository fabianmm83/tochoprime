import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db, COLLECTIONS } from '../services/firebase';
import { doc, getDoc, collection, getDocs, query, where } from 'firebase/firestore';

const LeagueDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { userData } = useAuth();
  const [league, setLeague] = useState<any>(null);
  const [teams, setTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLeagueData();
  }, [id]);

  const loadLeagueData = async () => {
    if (!id) return;
    
    setLoading(true);
    try {
      // Cargar datos de la liga
      const leagueDoc = await getDoc(doc(db, COLLECTIONS.LEAGUES, id));
      if (leagueDoc.exists()) {
        setLeague({ id: leagueDoc.id, ...leagueDoc.data() });
        
        // Cargar equipos de esta liga
        const teamsQuery = query(
          collection(db, COLLECTIONS.TEAMS), 
          where('leagueId', '==', id)
        );
        const teamsSnapshot = await getDocs(teamsQuery);
        const teamsData = teamsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setTeams(teamsData);
      } else {
        navigate('/ligas'); // Redirigir si no existe
      }
    } catch (error) {
      console.error('Error cargando liga:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-tocho-primary"></div>
      </div>
    );
  }

  if (!league) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-xl font-bold text-red-800">Liga no encontrada</h2>
            <button 
              onClick={() => navigate('/ligas')}
              className="mt-4 px-4 py-2 bg-red-100 text-red-800 rounded-lg hover:bg-red-200"
            >
              Volver a Ligas
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
          <button
            onClick={() => navigate('/ligas')}
            className="text-tocho-primary hover:underline mb-4"
          >
            ← Volver a Ligas
          </button>
          
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{league.name}</h1>
              <div className="flex items-center gap-3 mt-2">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                  {league.division}
                </span>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                  Liga {league.category}
                </span>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                  {league.season}
                </span>
              </div>
              {league.description && (
                <p className="text-gray-600 mt-4 max-w-3xl">{league.description}</p>
              )}
            </div>
            
            <div className="text-right">
              <div className="text-3xl font-bold text-tocho-primary">
                {league.teamCount || 0}<span className="text-lg text-gray-500">/{league.maxTeams || 12}</span>
              </div>
              <p className="text-gray-600">Equipos registrados</p>
            </div>
          </div>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4">Información de la Liga</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Estado:</span>
                <span className={`font-medium ${league.status === 'active' ? 'text-green-600' : 'text-yellow-600'}`}>
                  {league.status === 'active' ? 'Activa' : 'Inactiva'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Creada:</span>
                <span className="font-medium">
                  {league.createdAt?.toDate ? new Date(league.createdAt.toDate()).toLocaleDateString() : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Capacidad:</span>
                <span className="font-medium">{league.maxTeams || 12} equipos</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4">Progreso de Inscripción</h3>
            <div className="mb-4">
              <div className="flex justify-between text-sm mb-1">
                <span>Equipos inscritos</span>
                <span>{league.teamCount || 0} / {league.maxTeams || 12}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-green-600 h-3 rounded-full"
                  style={{ width: `${((league.teamCount || 0) / (league.maxTeams || 12)) * 100}%` }}
                ></div>
              </div>
            </div>
            <p className="text-sm text-gray-600">
              {league.maxTeams - (league.teamCount || 0)} cupos disponibles
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4">Acciones Rápidas</h3>
            <div className="space-y-3">
              {(userData?.role === 'superadministrador' || userData?.role === 'admin') && (
                <>
                  <button
                    onClick={() => navigate(`/ligas/${id}/editar`)}
                    className="w-full text-left px-4 py-3 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100"
                  >
                    ✏️ Editar información
                  </button>
                  <button
                    onClick={() => navigate('/equipos')}
                    className="w-full text-left px-4 py-3 bg-green-50 text-green-700 rounded-lg hover:bg-green-100"
                  >
                    👥 Agregar equipos
                  </button>
                </>
              )}
              <button
                onClick={() => navigate(`/ligas/${id}/partidos`)}
                className="w-full text-left px-4 py-3 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100"
              >
                ⚽ Ver partidos
              </button>
            </div>
          </div>
        </div>

        {/* Equipos de la liga */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden mb-8">
          <div className="px-6 py-4 border-b">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">Equipos ({teams.length})</h2>
              {(userData?.role === 'superadministrador' || userData?.role === 'admin' || userData?.role === 'capitan') && (
                <button
                  onClick={() => navigate('/equipos')}
                  className="bg-tocho-primary text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700"
                >
                  + Agregar Equipo
                </button>
              )}
            </div>
          </div>
          
          {teams.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-600">No hay equipos en esta liga aún</p>
              {(userData?.role === 'superadministrador' || userData?.role === 'admin' || userData?.role === 'capitan') && (
                <button
                  onClick={() => navigate('/equipos')}
                  className="mt-4 text-tocho-primary hover:underline"
                >
                  Crear el primer equipo
                </button>
              )}
            </div>
          ) : (
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {teams.map((team) => (
                  <div key={team.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3 mb-3">
                      {team.logoUrl ? (
                        <img 
                          src={team.logoUrl} 
                          alt={team.name}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <div 
                          className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold"
                          style={{ backgroundColor: team.color || '#3B82F6' }}
                        >
                          {team.name.charAt(0)}
                        </div>
                      )}
                      <div>
                        <h3 className="font-semibold text-gray-900">{team.name}</h3>
                        <p className="text-sm text-gray-600">{team.playerCount || 0} jugadores</p>
                      </div>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                      {team.description || 'Sin descripción'}
                    </p>
                    
                    <div className="flex justify-between items-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        team.status === 'active' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {team.status === 'active' ? 'Activo' : 'Inactivo'}
                      </span>
                      <button
                        onClick={() => navigate(`/equipos/${team.id}`)}
                        className="text-sm text-tocho-primary hover:underline"
                      >
                        Ver equipo →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Información adicional */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Reglas y Consideraciones</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Reglas básicas</h3>
              <ul className="space-y-2 text-gray-600">
                <li>• Mínimo 7 jugadores por equipo</li>
                <li>• Uniformes del color asignado</li>
                <li>• Puntualidad requerida (15 min de tolerancia)</li>
                <li>• Conducta deportiva obligatoria</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Fechas importantes</h3>
              <ul className="space-y-2 text-gray-600">
                <li>• Inscripciones abiertas</li>
                <li>• Liga activa: {league.status === 'active' ? 'Sí' : 'No'}</li>
                <li>• Próximos partidos: Por programar</li>
                <li>• Temporada: {league.season}</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeagueDetail;