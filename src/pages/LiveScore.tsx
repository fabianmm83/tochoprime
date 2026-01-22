import React, { useState, useEffect, useRef } from 'react';
import { 
  doc, 
  updateDoc, 
  onSnapshot,
  serverTimestamp,
  getDoc,
  DocumentData,
  DocumentSnapshot
} from 'firebase/firestore';
import { db } from '../services/firebase';
import { 
  PlayIcon, 
  PauseIcon, 
  StopIcon,
  ClockIcon,
  TrophyIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { Match, Team } from '../types';

interface LiveScoreProps {
  matchId: string;
  onComplete?: () => void;
  isOffline?: boolean;
  offlineData?: any;
}

// Interface local para el LiveScore (no modifica el tipo Match principal)
interface LiveScoreData {
  // Propiedades de Match
  id: string;
  homeTeamId: string;
  awayTeamId: string;
  status: Match['status'];
  homeScore?: number;
  awayScore?: number;
  
  // Propiedades específicas para LiveScore
  events?: any[];
  currentQuarter?: number;
  gameTime?: number;
  homeTimeouts?: number;
  awayTimeouts?: number;
  startedAt?: any;
  endedAt?: any;
}

// Interface para eventos del partido
interface ScoreEvent {
  type: 'touchdown' | 'extraPoint' | 'twoPoint' | 'fieldGoal' | 'safety' | 'interception' | 'fumble' | 'sack' | 'penalty' | 'timeout';
  team: 'home' | 'away';
  playerId?: string;
  playerName?: string;
  timestamp: number;
  quarter: number;
  description?: string;
  points?: number;
}

const LiveScore: React.FC<LiveScoreProps> = ({ 
  matchId, 
  onComplete,
  isOffline = false,
  offlineData = null
}) => {
  const [matchData, setMatchData] = useState<LiveScoreData | null>(null);
  const [homeTeam, setHomeTeam] = useState<Team | null>(null);
  const [awayTeam, setAwayTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [quarter, setQuarter] = useState(1);
  const [gameTime, setGameTime] = useState(1800);
  const [homeScore, setHomeScore] = useState(0);
  const [awayScore, setAwayScore] = useState(0);
  const [homeTimeouts, setHomeTimeouts] = useState(3);
  const [awayTimeouts, setAwayTimeouts] = useState(3);
  const [events, setEvents] = useState<ScoreEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<string>('touchdown');
  const [selectedTeam, setSelectedTeam] = useState<'home' | 'away'>('home');
  
  const timerRef = useRef<any>(null);

  useEffect(() => {
    if (isOffline && offlineData) {
      setMatchData(offlineData.matchData);
      setHomeTeam(offlineData.homeTeam);
      setAwayTeam(offlineData.awayTeam);
      setHomeScore(offlineData.homeScore || 0);
      setAwayScore(offlineData.awayScore || 0);
      setEvents(offlineData.events || []);
      setLoading(false);
      return;
    }

    // Escuchar cambios en tiempo real del partido
    const unsubscribe = onSnapshot(doc(db, 'matches', matchId), async (docSnapshot) => {
      if (docSnapshot.exists()) {
        const data = docSnapshot.data() as DocumentData;
        
        // Crear objeto LiveScoreData con datos del partido
        const matchData: LiveScoreData = {
          id: docSnapshot.id,
          homeTeamId: data.homeTeamId || '',
          awayTeamId: data.awayTeamId || '',
          status: data.status || 'scheduled',
          homeScore: data.homeScore || 0,
          awayScore: data.awayScore || 0,
          events: data.events || [],
          currentQuarter: data.currentQuarter || 1,
          gameTime: data.gameTime || 1800,
          homeTimeouts: data.homeTimeouts || 3,
          awayTimeouts: data.awayTimeouts || 3,
          startedAt: data.startedAt,
          endedAt: data.endedAt
        };
        
        setMatchData(matchData);
        setHomeScore(matchData.homeScore || 0);
        setAwayScore(matchData.awayScore || 0);
        setEvents(matchData.events || []);
        setIsPlaying(matchData.status === 'in_progress');
        setQuarter(matchData.currentQuarter || 1);
        setGameTime(matchData.gameTime || 1800);
        setHomeTimeouts(matchData.homeTimeouts || 3);
        setAwayTimeouts(matchData.awayTimeouts || 3);
        
        // Cargar información de equipos
        if (matchData.homeTeamId) {
          try {
            const homeTeamDoc = await getDoc(doc(db, 'teams', matchData.homeTeamId));
            if (homeTeamDoc.exists()) {
              const teamData = homeTeamDoc.data() as DocumentData;
              const team: Team = {
                id: homeTeamDoc.id,
                name: teamData.name || 'Equipo Local',
                logoUrl: teamData.logoUrl,
                seasonId: teamData.seasonId,
                divisionId: teamData.divisionId,
                categoryId: teamData.categoryId,
                captainId: teamData.captainId,
                viceCaptainId: teamData.viceCaptainId,
                coach: teamData.coach,
                playerCount: teamData.playerCount || 0,
                registrationDate: teamData.registrationDate?.toDate ? teamData.registrationDate.toDate() : teamData.registrationDate,
                status: teamData.status || 'active',
                paymentStatus: teamData.paymentStatus || 'pending',
                notes: teamData.notes,
                stats: teamData.stats,
                leadershipRules: teamData.leadershipRules,
                leadershipStats: teamData.leadershipStats,
                createdAt: teamData.createdAt?.toDate ? teamData.createdAt.toDate() : teamData.createdAt,
                updatedAt: teamData.updatedAt?.toDate ? teamData.updatedAt.toDate() : teamData.updatedAt,
                createdBy: teamData.createdBy || '',
                primaryColor: teamData.primaryColor || '#3B82F6',
                shortName: teamData.shortName,
                secondaryColor: teamData.secondaryColor
              };
              setHomeTeam(team);
            }
          } catch (error) {
            console.error('Error cargando equipo local:', error);
          }
        }
        
        if (matchData.awayTeamId) {
          try {
            const awayTeamDoc = await getDoc(doc(db, 'teams', matchData.awayTeamId));
            if (awayTeamDoc.exists()) {
              const teamData = awayTeamDoc.data() as DocumentData;
              const team: Team = {
                id: awayTeamDoc.id,
                name: teamData.name || 'Equipo Visitante',
                logoUrl: teamData.logoUrl,
                seasonId: teamData.seasonId,
                divisionId: teamData.divisionId,
                categoryId: teamData.categoryId,
                captainId: teamData.captainId,
                viceCaptainId: teamData.viceCaptainId,
                coach: teamData.coach,
                playerCount: teamData.playerCount || 0,
                registrationDate: teamData.registrationDate?.toDate ? teamData.registrationDate.toDate() : teamData.registrationDate,
                status: teamData.status || 'active',
                paymentStatus: teamData.paymentStatus || 'pending',
                notes: teamData.notes,
                stats: teamData.stats,
                leadershipRules: teamData.leadershipRules,
                leadershipStats: teamData.leadershipStats,
                createdAt: teamData.createdAt?.toDate ? teamData.createdAt.toDate() : teamData.createdAt,
                updatedAt: teamData.updatedAt?.toDate ? teamData.updatedAt.toDate() : teamData.updatedAt,
                createdBy: teamData.createdBy || '',
                primaryColor: teamData.primaryColor || '#8B5CF6',
                shortName: teamData.shortName,
                secondaryColor: teamData.secondaryColor
              };
              setAwayTeam(team);
            }
          } catch (error) {
            console.error('Error cargando equipo visitante:', error);
          }
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [matchId, isOffline, offlineData]);

  useEffect(() => {
    if (isPlaying && !isOffline) {
      timerRef.current = setInterval(() => {
        setGameTime((prev) => {
          if (prev <= 0) {
            handleEndQuarter();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isPlaying, isOffline]);

  const handleStartGame = async () => {
    if (isOffline) {
      setIsPlaying(true);
      return;
    }

    try {
      await updateDoc(doc(db, 'matches', matchId), {
        status: 'in_progress',
        startedAt: serverTimestamp(),
        currentQuarter: 1,
        gameTime: 1800,
        homeTimeouts: 3,
        awayTimeouts: 3
      });
      setIsPlaying(true);
    } catch (error) {
      console.error('Error starting game:', error);
    }
  };

  const handlePauseGame = async () => {
    if (isOffline) {
      setIsPlaying(false);
      return;
    }

    try {
      await updateDoc(doc(db, 'matches', matchId), {
        status: 'paused',
        gameTime
      });
      setIsPlaying(false);
    } catch (error) {
      console.error('Error pausing game:', error);
    }
  };

  const handleEndGame = async () => {
    if (isOffline) {
      if (onComplete) onComplete();
      return;
    }

    try {
      await updateDoc(doc(db, 'matches', matchId), {
        status: 'completed',
        endedAt: serverTimestamp(),
        homeScore,
        awayScore,
        events,
        homeTimeouts,
        awayTimeouts,
        currentQuarter: quarter,
        gameTime
      });

      if (onComplete) onComplete();
    } catch (error) {
      console.error('Error ending game:', error);
    }
  };

  const handleEndQuarter = async () => {
    if (quarter >= 4) {
      handleEndGame();
      return;
    }

    const newQuarter = quarter + 1;
    setQuarter(newQuarter);
    setGameTime(1800);

    if (!isOffline) {
      await updateDoc(doc(db, 'matches', matchId), {
        currentQuarter: newQuarter,
        gameTime: 1800
      });
    }

    addEvent({
      type: 'timeout',
      team: 'home',
      timestamp: Date.now(),
      quarter,
      description: `Fin del ${getQuarterName(quarter)} cuarto`
    });
  };

  const addEvent = async (event: ScoreEvent) => {
    const newEvents = [...events, event];
    setEvents(newEvents);

    let points = 0;
    switch (event.type) {
      case 'touchdown':
        points = 6;
        break;
      case 'extraPoint':
        points = 1;
        break;
      case 'twoPoint':
        points = 2;
        break;
      case 'fieldGoal':
        points = 3;
        break;
      case 'safety':
        points = 2;
        break;
      default:
        points = 0;
    }

    if (event.team === 'home') {
      setHomeScore(prev => prev + points);
    } else {
      setAwayScore(prev => prev + points);
    }

    if (!isOffline && matchData) {
      await updateDoc(doc(db, 'matches', matchId), {
        events: newEvents,
        homeScore: homeScore + (event.team === 'home' ? points : 0),
        awayScore: awayScore + (event.team === 'away' ? points : 0)
      });
    }
  };

  const handleAddEvent = () => {
    const event: ScoreEvent = {
      type: selectedEvent as any,
      team: selectedTeam,
      timestamp: Date.now(),
      quarter,
      description: getEventDescription(selectedEvent, selectedTeam),
      points: getEventPoints(selectedEvent)
    };

    addEvent(event);
  };

  const handleTimeout = (team: 'home' | 'away') => {
  if (team === 'home' && homeTimeouts > 0) {
    setHomeTimeouts(prev => prev - 1);
    addEvent({
      type: 'timeout',
      team: team,
      timestamp: Date.now(),
      quarter,
      description: `Timeout de Local`
    });
  } else if (team === 'away' && awayTimeouts > 0) {
    setAwayTimeouts(prev => prev - 1);
    addEvent({
      type: 'timeout',
      team: team,
      timestamp: Date.now(),
      quarter,
      description: `Timeout de Visitante`
    });
  }
};

  const getEventDescription = (type: string, team: string) => {
    const teamName = team === 'home' ? 'Local' : 'Visitante';
    switch (type) {
      case 'touchdown': return `Touchdown de ${teamName}`;
      case 'extraPoint': return `Punto extra de ${teamName}`;
      case 'twoPoint': return `Conversión de 2 puntos de ${teamName}`;
      case 'fieldGoal': return `Field goal de ${teamName}`;
      case 'safety': return `Safety de ${teamName}`;
      case 'interception': return `Intercepción de ${teamName}`;
      case 'fumble': return `Fumble recuperado por ${teamName}`;
      case 'sack': return `Sack de ${teamName}`;
      case 'penalty': return `Penalización contra ${teamName}`;
      case 'timeout': return `Timeout de ${teamName}`;
      default: return '';
    }
  };

  const getEventPoints = (type: string) => {
    switch (type) {
      case 'touchdown': return 6;
      case 'extraPoint': return 1;
      case 'twoPoint': return 2;
      case 'fieldGoal': return 3;
      case 'safety': return 2;
      default: return 0;
    }
  };

  const getQuarterName = (q: number) => {
    switch (q) {
      case 1: return 'Primer';
      case 2: return 'Segundo';
      case 3: return 'Tercer';
      case 4: return 'Cuarto';
      case 5: return 'Overtime';
      default: return `Cuarto ${q}`;
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-64 bg-gray-200 rounded-lg"></div>
      </div>
    );
  }

  if (!matchData) {
    return (
      <div className="text-center py-12">
        <TrophyIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">Partido no encontrado</p>
      </div>
    );
  }

  const homeTeamName = homeTeam?.name || 'Equipo Local';
  const awayTeamName = awayTeam?.name || 'Equipo Visitante';
  const homeTeamLogo = homeTeam?.logoUrl;
  const awayTeamLogo = awayTeam?.logoUrl;

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      {/* Encabezado con estado del partido */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-4">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-white">Marcador en Vivo</h2>
            <p className="text-indigo-200 text-sm">
              {homeTeamName} vs {awayTeamName}
            </p>
          </div>
          {isOffline && (
            <div className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium">
              Modo Offline
            </div>
          )}
        </div>
      </div>

      {/* Marcador principal */}
      <div className="p-6">
        <div className="grid grid-cols-3 gap-4 mb-6">
          {/* Equipo local */}
          <div className="text-center">
            <div className="mb-2">
              {homeTeamLogo ? (
                <img src={homeTeamLogo} alt={homeTeamName} className="w-16 h-16 mx-auto rounded-full object-cover" />
              ) : (
                <div className="w-16 h-16 mx-auto rounded-full bg-indigo-100 flex items-center justify-center">
                  <span className="text-2xl font-bold text-indigo-600">{homeTeamName.charAt(0)}</span>
                </div>
              )}
            </div>
            <h3 className="font-bold text-gray-900 truncate">{homeTeamName}</h3>
            <div className="text-5xl font-black text-indigo-600 mt-2">{homeScore}</div>
          </div>

          {/* Centro con tiempo y controles */}
          <div className="text-center">
            <div className="mb-4">
              <div className="text-sm text-gray-600 mb-1">CUARTO</div>
              <div className="text-2xl font-bold text-gray-900">{getQuarterName(quarter)}</div>
            </div>
            
            <div className="mb-4">
              <div className="text-3xl font-mono font-bold text-gray-900 bg-gray-100 py-2 px-4 rounded-lg inline-block">
                {formatTime(gameTime)}
              </div>
            </div>

            <div className="flex justify-center space-x-3">
              {!isPlaying ? (
                <button
                  onClick={handleStartGame}
                  className="bg-green-600 hover:bg-green-700 text-white p-3 rounded-full shadow-lg transition-colors"
                >
                  <PlayIcon className="w-6 h-6" />
                </button>
              ) : (
                <button
                  onClick={handlePauseGame}
                  className="bg-yellow-600 hover:bg-yellow-700 text-white p-3 rounded-full shadow-lg transition-colors"
                >
                  <PauseIcon className="w-6 h-6" />
                </button>
              )}
              
              <button
                onClick={handleEndGame}
                className="bg-red-600 hover:bg-red-700 text-white p-3 rounded-full shadow-lg transition-colors"
              >
                <StopIcon className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Equipo visitante */}
          <div className="text-center">
            <div className="mb-2">
              {awayTeamLogo ? (
                <img src={awayTeamLogo} alt={awayTeamName} className="w-16 h-16 mx-auto rounded-full object-cover" />
              ) : (
                <div className="w-16 h-16 mx-auto rounded-full bg-purple-100 flex items-center justify-center">
                  <span className="text-2xl font-bold text-purple-600">{awayTeamName.charAt(0)}</span>
                </div>
              )}
            </div>
            <h3 className="font-bold text-gray-900 truncate">{awayTeamName}</h3>
            <div className="text-5xl font-black text-purple-600 mt-2">{awayScore}</div>
          </div>
        </div>

        {/* Timeouts */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700">Timeouts Local</span>
              <button
                onClick={() => handleTimeout('home')}
                disabled={homeTimeouts === 0 || !isPlaying}
                className={`px-3 py-1 text-sm rounded ${
                  homeTimeouts === 0 || !isPlaying
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-red-600 hover:bg-red-700 text-white'
                }`}
              >
                Usar
              </button>
            </div>
            <div className="flex space-x-2">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className={`w-full h-8 rounded ${
                    i < homeTimeouts ? 'bg-green-500' : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700">Timeouts Visitante</span>
              <button
                onClick={() => handleTimeout('away')}
                disabled={awayTimeouts === 0 || !isPlaying}
                className={`px-3 py-1 text-sm rounded ${
                  awayTimeouts === 0 || !isPlaying
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-red-600 hover:bg-red-700 text-white'
                }`}
              >
                Usar
              </button>
            </div>
            <div className="flex space-x-2">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className={`w-full h-8 rounded ${
                    i < awayTimeouts ? 'bg-green-500' : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Agregar eventos */}
        <div className="bg-gray-50 p-4 rounded-lg mb-6">
          <h3 className="font-bold text-gray-900 mb-4">Agregar Evento</h3>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Evento</label>
              <select
                value={selectedEvent}
                onChange={(e) => setSelectedEvent(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg"
              >
                <option value="touchdown">Touchdown (6 pts)</option>
                <option value="extraPoint">Punto Extra (1 pt)</option>
                <option value="twoPoint">Conversión 2 pts (2 pts)</option>
                <option value="fieldGoal">Field Goal (3 pts)</option>
                <option value="safety">Safety (2 pts)</option>
                <option value="interception">Intercepción</option>
                <option value="fumble">Fumble</option>
                <option value="sack">Sack</option>
                <option value="penalty">Penalización</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Equipo</label>
              <div className="flex space-x-4">
                <button
                  onClick={() => setSelectedTeam('home')}
                  className={`flex-1 py-2 rounded-lg ${
                    selectedTeam === 'home'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  Local
                </button>
                <button
                  onClick={() => setSelectedTeam('away')}
                  className={`flex-1 py-2 rounded-lg ${
                    selectedTeam === 'away'
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  Visitante
                </button>
              </div>
            </div>
          </div>
          <button
            onClick={handleAddEvent}
            disabled={!isPlaying}
            className={`w-full py-3 rounded-lg font-medium ${
              isPlaying
                ? 'bg-green-600 hover:bg-green-700 text-white'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            Registrar Evento
          </button>
        </div>

        {/* Lista de eventos */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-bold text-gray-900 mb-4">Eventos del Partido</h3>
          <div className="space-y-3 max-h-60 overflow-y-auto">
            {events.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No hay eventos registrados</p>
            ) : (
              events
                .sort((a, b) => b.timestamp - a.timestamp)
                .map((event, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg border-l-4 ${
                      event.type === 'touchdown'
                        ? 'border-l-green-500 bg-green-50'
                        : event.type === 'fieldGoal'
                        ? 'border-l-blue-500 bg-blue-50'
                        : event.type === 'safety'
                        ? 'border-l-red-500 bg-red-50'
                        : 'border-l-gray-500 bg-gray-50'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className={`font-medium ${
                            event.team === 'home' ? 'text-indigo-600' : 'text-purple-600'
                          }`}>
                            {event.team === 'home' ? homeTeamName : awayTeamName}
                          </span>
                          {event.points && event.points > 0 && (
                            <span className="bg-gray-200 text-gray-800 text-xs px-2 py-1 rounded-full">
                              +{event.points} pts
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{event.description}</p>
                      </div>
                      <div className="text-xs text-gray-500">
                        Q{event.quarter} • {new Date(event.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>
      </div>

      {/* Nota para árbitros */}
      {isOffline && (
        <div className="bg-yellow-50 border-t border-yellow-200 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <ArrowPathIcon className="w-5 h-5 text-yellow-600" />
              <span className="text-sm text-yellow-800">
                Modo offline activado. Los datos se sincronizarán al reconectar.
              </span>
            </div>
            <button
              onClick={() => {/* Función para sincronizar */}}
              className="text-sm text-yellow-800 font-medium hover:text-yellow-900 underline"
            >
              Forzar sincronización
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveScore;