// components/landing/PublicTeamsView.tsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Users, Trophy, Target, ChevronRight } from 'lucide-react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { Team } from '../../types';

const PublicTeamsView: React.FC = () => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDivision, setSelectedDivision] = useState('Todos');

  const divisions = [
    { id: 'todos', name: 'Todos', value: 'Todos' },
    { id: 'varonil', name: 'Varonil', value: 'Varonil' },
    { id: 'femenil', name: 'Femenil', value: 'Femenil' },
    { id: 'mixto', name: 'Mixto', value: 'Mixto' },
  ];

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        setLoading(true);
        const teamsRef = collection(db, 'teams');
        
        // Filtrar por estado activo
        const q = query(
          teamsRef,
          where('status', 'in', ['active', 'approved'])
        );
        
        const snapshot = await getDocs(q);
        
        if (snapshot.empty) {
          setTeams([]);
          setError('No hay equipos registrados aún');
          return;
        }
        
        const teamsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Team[];
        
        // Ordenar por nombre
        teamsData.sort((a, b) => a.name.localeCompare(b.name));
        setTeams(teamsData);
        setError(null);
      } catch (error) {
        console.error('Error cargando equipos:', error);
        setError('Error al cargar equipos. Intenta de nuevo más tarde.');
      } finally {
        setLoading(false);
      }
    };

    fetchTeams();
  }, []);

  const filteredTeams = selectedDivision === 'Todos' 
    ? teams 
    : teams.filter(team => team.divisionId === selectedDivision.toLowerCase());

  const getDivisionColor = (divisionId: string) => {
    switch (divisionId) {
      case 'varonil': return 'bg-blue-500';
      case 'femenil': return 'bg-pink-500';
      case 'mixto': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  const getDivisionName = (divisionId: string) => {
    switch (divisionId) {
      case 'varonil': return 'Varonil';
      case 'femenil': return 'Femenil';
      case 'mixto': return 'Mixto';
      default: return divisionId;
    }
  };

  if (loading) {
    return (
      <section className="py-16 bg-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-tocho-primary mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Cargando equipos...</p>
          </div>
        </div>
      </section>
    );
  }

  if (error && teams.length === 0) {
    return (
      <section className="py-16 bg-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="text-yellow-500 mb-4">⚠️</div>
            <p className="text-gray-600 dark:text-gray-400">{error}</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 bg-white dark:bg-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-6 py-3 bg-blue-50 dark:bg-blue-900/30 rounded-full mb-6">
            <Users size={20} className="text-blue-600 dark:text-blue-400" />
            <span className="font-semibold text-blue-700 dark:text-blue-400">
              Equipos Registrados
            </span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-6">
            Conoce los equipos de la liga
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            {teams.length} equipos compitiendo en 3 divisiones
          </p>
        </div>

        {/* Filtros de división */}
        <div className="flex flex-wrap gap-2 justify-center mb-8">
          {divisions.map((division) => (
            <button
              key={division.id}
              onClick={() => setSelectedDivision(division.value)}
              className={`px-6 py-3 rounded-full font-semibold transition-all ${
                selectedDivision === division.value
                  ? 'bg-tocho-primary text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {division.name}
            </button>
          ))}
        </div>

        {/* Lista de equipos */}
        {filteredTeams.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-400">
              No hay equipos en esta división
            </p>
          </div>
        ) : (
          <>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-12">
              {filteredTeams.slice(0, 12).map((team) => (
                <div 
                  key={team.id}
                  className="bg-gray-50 dark:bg-gray-700 rounded-xl shadow-lg border border-gray-200 dark:border-gray-600 overflow-hidden hover:shadow-xl transition-all"
                >
                  {/* Header con color */}
                  <div className={`h-2 ${getDivisionColor(team.divisionId || '')}`}></div>
                  
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white truncate">
                          {team.name}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {getDivisionName(team.divisionId || '')}
                          </span>
                          {team.status === 'active' && (
                            <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 px-2 py-1 rounded">
                              Activo
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Trophy size={18} className="text-yellow-500" />
                        <span className="text-sm font-semibold">
                          {team.stats?.points || 0} pts
                        </span>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-4 mb-6">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">
                          {team.stats?.wins || 0}
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">Victorias</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">
                          {team.stats?.losses || 0}
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">Derrotas</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">
                          {team.stats?.matchesPlayed || 0}
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">Partidos</div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
                      <div className="flex items-center gap-1">
                        <Target size={14} />
                        <span>{team.playerCount || 0} jugadores</span>
                      </div>
                      <span className="text-xs bg-gray-200 dark:bg-gray-600 px-2 py-1 rounded">
                        ID: {team.id.substring(0, 8)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Ver todos */}
            <div className="text-center">
              <Link
                to="/login"
                className="inline-flex items-center gap-2 px-8 py-3 bg-tocho-primary text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
              >
                Inicia sesión para ver todos los equipos ({teams.length})
                <ChevronRight size={20} />
              </Link>
            </div>
          </>
        )}
      </div>
    </section>
  );
};

export default PublicTeamsView;