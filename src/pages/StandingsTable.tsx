import React, { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  orderBy 
} from 'firebase/firestore';
import { db } from '../services/firebase'; // Cambiar de firestore a firebase
import { 
  TrophyIcon, 
  ChevronUpIcon, 
  ChevronDownIcon, 
  MinusIcon 
} from '@heroicons/react/24/outline';
import { Team, Match, TeamStats } from '../types'; // Importar desde types

interface Standing {
  teamId: string;
  teamName: string;
  logoUrl?: string;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  points: number;
  form: string[];
  streak: number;
}

interface StandingsTableProps {
  seasonId: string;
  divisionId?: string;
  categoryId?: string;
}

const StandingsTable: React.FC<StandingsTableProps> = ({ 
  seasonId, 
  divisionId, 
  categoryId 
}) => {
  const [standings, setStandings] = useState<Standing[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedView, setSelectedView] = useState('general');

  useEffect(() => {
    loadStandings();
  }, [seasonId, divisionId, categoryId]);

  const loadStandings = async () => {
    setLoading(true);
    try {
      // Obtener equipos de la temporada/filtros
      const constraints = [
        where('seasonId', '==', seasonId),
        where('status', '==', 'active')
      ];
      
      if (divisionId && divisionId !== 'all') {
        constraints.push(where('divisionId', '==', divisionId));
      }
      
      if (categoryId && categoryId !== 'all') {
        constraints.push(where('categoryId', '==', categoryId));
      }

      const teamsQuery = query(
        collection(db, 'teams'),
        ...constraints
      );

      const teamsSnapshot = await getDocs(teamsQuery);
      const teams: Team[] = teamsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Team));

      // Obtener partidos completados
      const matchesConstraints = [
        where('seasonId', '==', seasonId),
        where('status', '==', 'completed')
      ];
      
      if (divisionId && divisionId !== 'all') {
        matchesConstraints.push(where('divisionId', '==', divisionId));
      }
      
      if (categoryId && categoryId !== 'all') {
        matchesConstraints.push(where('categoryId', '==', categoryId));
      }

      const matchesQuery = query(
        collection(db, 'matches'),
        ...matchesConstraints
      );

      const matchesSnapshot = await getDocs(matchesQuery);
      const matches: Match[] = matchesSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          matchDate: data.matchDate?.toDate ? data.matchDate.toDate() : data.matchDate,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : data.createdAt,
          updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : data.updatedAt,
        } as Match;
      });

      // Calcular estadísticas para cada equipo
      const standingsData: Standing[] = teams.map(team => {
        const teamMatches = matches.filter(match => 
          match.homeTeamId === team.id || match.awayTeamId === team.id
        );

        let wins = 0;
        let draws = 0;
        let losses = 0;
        let goalsFor = 0;
        let goalsAgainst = 0;
        const recentResults: string[] = [];

        teamMatches.forEach(match => {
          const isHome = match.homeTeamId === team.id;
          const teamScore = isHome ? match.homeScore || 0 : match.awayScore || 0;
          const opponentScore = isHome ? match.awayScore || 0 : match.homeScore || 0;

          goalsFor += teamScore;
          goalsAgainst += opponentScore;

          if (teamScore > opponentScore) {
            wins++;
            recentResults.push('W');
          } else if (teamScore < opponentScore) {
            losses++;
            recentResults.push('L');
          } else {
            draws++;
            recentResults.push('D');
          }
        });

        // Calcular racha actual
        let streak = 0;
        if (recentResults.length > 0) {
          const lastResult = recentResults[recentResults.length - 1];
          for (let i = recentResults.length - 1; i >= 0; i--) {
            if (recentResults[i] === lastResult) {
              streak += lastResult === 'W' ? 1 : lastResult === 'L' ? -1 : 0;
            } else {
              break;
            }
          }
        }

        return {
          teamId: team.id,
          teamName: team.name,
          logoUrl: team.logoUrl,
          played: teamMatches.length,
          wins,
          draws,
          losses,
          goalsFor,
          goalsAgainst,
          points: (wins * 3) + draws,
          form: recentResults.slice(-5).reverse(),
          streak
        };
      });

      // Ordenar por puntos, diferencia de goles, goles a favor
      const sortedStandings = standingsData.sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        const diffA = a.goalsFor - a.goalsAgainst;
        const diffB = b.goalsFor - b.goalsAgainst;
        if (diffB !== diffA) return diffB - diffA;
        return b.goalsFor - a.goalsFor;
      });

      setStandings(sortedStandings);
    } catch (error) {
      console.error('Error loading standings:', error);
    } finally {
      setLoading(false);
    }
  };

  const getFormIcon = (result: string) => {
    switch (result) {
      case 'W': return <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white text-xs">V</div>;
      case 'D': return <div className="w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center text-white text-xs">E</div>;
      case 'L': return <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white text-xs">D</div>;
      default: return <div className="w-6 h-6 bg-gray-300 rounded-full"></div>;
    }
  };

  const getStreakIcon = (streak: number) => {
    if (streak > 0) {
      return (
        <div className="flex items-center text-green-600">
          <ChevronUpIcon className="w-4 h-4" />
          <span>{streak}</span>
        </div>
      );
    } else if (streak < 0) {
      return (
        <div className="flex items-center text-red-600">
          <ChevronDownIcon className="w-4 h-4" />
          <span>{Math.abs(streak)}</span>
        </div>
      );
    } else {
      return (
        <div className="flex items-center text-gray-500">
          <MinusIcon className="w-4 h-4" />
        </div>
      );
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="h-16 bg-gray-200 rounded-lg mb-2"></div>
        ))}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-indigo-600 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <TrophyIcon className="w-8 h-8 text-yellow-300" />
            <h2 className="text-xl font-bold text-white">Tabla de Posiciones</h2>
          </div>
          <div className="flex space-x-2">
            <button 
              className={`px-3 py-1 rounded-lg ${selectedView === 'general' ? 'bg-white text-indigo-600' : 'bg-indigo-500 text-white'}`}
              onClick={() => setSelectedView('general')}
            >
              General
            </button>
            <button 
              className={`px-3 py-1 rounded-lg ${selectedView === 'home' ? 'bg-white text-indigo-600' : 'bg-indigo-500 text-white'}`}
              onClick={() => setSelectedView('home')}
            >
              Local
            </button>
            <button 
              className={`px-3 py-1 rounded-lg ${selectedView === 'away' ? 'bg-white text-indigo-600' : 'bg-indigo-500 text-white'}`}
              onClick={() => setSelectedView('away')}
            >
              Visitante
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700 w-12">#</th>
              <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">Equipo</th>
              <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">PJ</th>
              <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">PG</th>
              <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">PE</th>
              <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">PP</th>
              <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">GF</th>
              <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">GC</th>
              <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">DG</th>
              <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">PTS</th>
              <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">Forma</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {standings.map((team, index) => (
              <tr key={team.teamId} className={index < 4 ? 'bg-green-50' : index >= standings.length - 2 ? 'bg-red-50' : 'hover:bg-gray-50'}>
                <td className="py-4 px-4">
                  <div className="flex items-center justify-center">
                    <span className={`w-8 h-8 flex items-center justify-center rounded-full ${
                      index === 0 ? 'bg-yellow-100 text-yellow-800 font-bold' :
                      index === 1 ? 'bg-gray-100 text-gray-800 font-bold' :
                      index === 2 ? 'bg-orange-100 text-orange-800 font-bold' :
                      'bg-gray-50 text-gray-600'
                    }`}>
                      {index + 1}
                    </span>
                  </div>
                </td>
                <td className="py-4 px-4">
                  <div className="flex items-center space-x-3">
                    {team.logoUrl ? (
                      <img src={team.logoUrl} alt={team.teamName} className="w-10 h-10 rounded-full object-cover" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                        <span className="text-indigo-600 font-bold">{team.teamName.charAt(0)}</span>
                      </div>
                    )}
                    <div>
                      <div className="font-medium text-gray-900">{team.teamName}</div>
                      {getStreakIcon(team.streak)}
                    </div>
                  </div>
                </td>
                <td className="py-4 px-4 text-center font-medium">{team.played}</td>
                <td className="py-4 px-4 text-center text-green-600 font-semibold">{team.wins}</td>
                <td className="py-4 px-4 text-center text-yellow-600 font-semibold">{team.draws}</td>
                <td className="py-4 px-4 text-center text-red-600 font-semibold">{team.losses}</td>
                <td className="py-4 px-4 text-center font-semibold">{team.goalsFor}</td>
                <td className="py-4 px-4 text-center font-semibold">{team.goalsAgainst}</td>
                <td className={`py-4 px-4 text-center font-bold ${
                  team.goalsFor - team.goalsAgainst > 0 ? 'text-green-600' :
                  team.goalsFor - team.goalsAgainst < 0 ? 'text-red-600' : 'text-gray-600'
                }`}>
                  {team.goalsFor - team.goalsAgainst > 0 ? '+' : ''}{team.goalsFor - team.goalsAgainst}
                </td>
                <td className="py-4 px-4 text-center">
                  <span className="bg-indigo-100 text-indigo-800 font-bold py-1 px-3 rounded-full">
                    {team.points}
                  </span>
                </td>
                <td className="py-4 px-4">
                  <div className="flex space-x-1 justify-center">
                    {team.form.map((result, i) => (
                      <div key={i}>
                        {getFormIcon(result)}
                      </div>
                    ))}
                    {team.form.length < 5 && (
                      [...Array(5 - team.form.length)].map((_, i) => (
                        <div key={`empty-${i}`} className="w-6 h-6 bg-gray-100 rounded-full"></div>
                      ))
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="p-4 bg-gray-50 border-t border-gray-200">
        <div className="flex flex-wrap gap-4 text-sm text-gray-600">
          <div className="flex items-center">
            <div className="w-4 h-4 bg-yellow-100 rounded mr-2"></div>
            <span>Primer lugar</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-gray-100 rounded mr-2"></div>
            <span>Segundo lugar</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-orange-100 rounded mr-2"></div>
            <span>Tercer lugar</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-green-50 rounded mr-2 border border-green-200"></div>
            <span>Playoffs</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-red-50 rounded mr-2 border border-red-200"></div>
            <span>Descenso</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StandingsTable;