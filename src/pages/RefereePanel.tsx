import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Clock,
  Calendar,
  Users,
  Award,
  FileText,
  ChevronRight,
  PlayCircle,
  PauseCircle,
  StopCircle,
  PlusCircle,
  MinusCircle,
  UserCheck,
  AlertCircle,
  CheckCircle,
  XCircle,
  Timer,
  TrendingUp,
  BarChart3,
  Car,
  Flag,
  Home,
  MapPin
} from 'lucide-react';
import Scoreboard from '../components/scoreboard/Scoreboard';
import MatchCard from '../components/cards/MatchCard';
import {
  Match,
  Referee,
  MatchCardData,
  LiveScoreData,
  MatchEvent,
  adaptMatchToCardData
} from '../types';
import {
  matchesService,
  refereesService,
  teamsService
} from '../services/firestore';

// Función auxiliar para obtener árbitro por ID
const getRefereeById = async (refereeId: string): Promise<Referee | null> => {
  try {
    const referee = await refereesService.getRefereeById(refereeId);
    return referee;
  } catch (error) {
    console.error('Error obteniendo árbitro:', error);
    return null;
  }
};

// Función auxiliar para actualizar estado del partido
const updateMatchStatus = async (matchId: string, status: Match['status']): Promise<void> => {
  try {
    await matchesService.updateMatch(matchId, { status });
  } catch (error) {
    console.error('Error actualizando estado del partido:', error);
    throw error;
  }
};

// Función auxiliar para actualizar resultado
const updateMatchResult = async (
  matchId: string,
  homeScore: number,
  awayScore: number,
  notes?: string,
  resultDetails?: any
): Promise<void> => {
  try {
    await matchesService.updateMatch(matchId, {
      homeScore,
      awayScore,
      status: 'completed',
      notes,
      resultDetails
    });
  } catch (error) {
    console.error('Error actualizando resultado:', error);
    throw error;
  }
};

const RefereePanel: React.FC = () => {
  const { userData } = useAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [refereeData, setRefereeData] = useState<Referee | null>(null);
  const [assignedMatches, setAssignedMatches] = useState<Match[]>([]);
  const [upcomingMatches, setUpcomingMatches] = useState<MatchCardData[]>([]);
  const [pastMatches, setPastMatches] = useState<Match[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [showScoreboard, setShowScoreboard] = useState(false);
  const [liveScore, setLiveScore] = useState<LiveScoreData | null>(null);
  const [matchEvents, setMatchEvents] = useState<MatchEvent[]>([]);
  const [matchTime, setMatchTime] = useState(0);
  const [matchTimer, setMatchTimer] = useState<any>(null); // Cambiado de NodeJS.Timeout
  
  // Estadísticas del árbitro
  const [refereeStats, setRefereeStats] = useState({
    totalMatches: 0,
    completedMatches: 0,
    upcomingMatches: 0,
    averageRating: 4.5,
    yellowCards: 24,
    redCards: 8,
    goalsRecorded: 156
  });

  useEffect(() => {
    const loadRefereeData = async () => {
      if (!userData?.uid) return;
      
      setLoading(true);
      try {
        // Obtener datos del árbitro
        const referee = await getRefereeById(userData.uid);
        setRefereeData(referee);
        
        // Obtener partidos asignados
        const allMatches = await matchesService.getMatches();
        const assigned = allMatches.filter(match => 
          match.refereeId === userData.uid || match.refereeName?.includes(referee?.fullName || '')
        );
        
        setAssignedMatches(assigned);
        
        // Separar partidos futuros y pasados
        const now = new Date();
        const futureMatches = assigned.filter(match => 
          new Date(match.matchDate) >= now && match.status !== 'completed'
        );
        const past = assigned.filter(match => 
          new Date(match.matchDate) < now || match.status === 'completed'
        );
        
        // Convertir a MatchCardData para visualización
        const matchCards = await Promise.all(
          futureMatches.slice(0, 3).map(async (match) => {
            const homeTeam = match.homeTeamId ? await teamsService.getTeamById(match.homeTeamId) : undefined;
            const awayTeam = match.awayTeamId ? await teamsService.getTeamById(match.awayTeamId) : undefined;
            return adaptMatchToCardData(match, homeTeam || undefined, awayTeam || undefined);
          })
        );
        
        setUpcomingMatches(matchCards);
        setPastMatches(past.slice(0, 5));
        
        // Cargar estadísticas
        if (referee) {
          setRefereeStats({
            totalMatches: referee.matchesAssigned || 0,
            completedMatches: referee.matchesCompleted || 0,
            upcomingMatches: futureMatches.length,
            averageRating: referee.rating || 4.5,
            yellowCards: 24,
            redCards: 8,
            goalsRecorded: 156
          });
        }
        
        // Si hay un partido en progreso, cargarlo
        const liveMatch = assigned.find(match => match.status === 'in_progress');
        if (liveMatch) {
          setSelectedMatch(liveMatch);
          setShowScoreboard(true);
          initializeLiveScore(liveMatch);
        }
        
      } catch (error) {
        console.error('Error cargando datos del árbitro:', error);
      } finally {
        setLoading(false);
      }
    };

    loadRefereeData();
  }, [userData?.uid]);

  const initializeLiveScore = (match: Match) => {
    const liveScoreData: LiveScoreData = {
      matchId: match.id,
      homeTeam: {
        name: match.homeTeam?.name || 'Equipo Local',
        score: match.homeScore || 0,
        shots: 0,
        possession: 50,
        fouls: 0
      },
      awayTeam: {
        name: match.awayTeam?.name || 'Equipo Visitante',
        score: match.awayScore || 0,
        shots: 0,
        possession: 50,
        fouls: 0
      },
      currentMinute: 0,
      half: 'first',
      events: [],
      referee: refereeData?.fullName
    };
    
    setLiveScore(liveScoreData);
    setMatchTime(0);
    startTimer();
  };

  const startTimer = () => {
    if (matchTimer) clearInterval(matchTimer);
    const timer = setInterval(() => {
      setMatchTime(prev => {
        if (prev >= 90) {
          clearInterval(timer);
          return 90;
        }
        return prev + 1;
      });
    }, 1000);
    setMatchTimer(timer);
  };

  const pauseTimer = () => {
    if (matchTimer) {
      clearInterval(matchTimer);
      setMatchTimer(null);
    }
  };

  const stopTimer = () => {
    if (matchTimer) {
      clearInterval(matchTimer);
      setMatchTimer(null);
    }
    setMatchTime(0);
  };

  const handleStartMatch = async (match: Match) => {
    try {
      await updateMatchStatus(match.id, 'in_progress');
      setSelectedMatch(match);
      setShowScoreboard(true);
      initializeLiveScore(match);
    } catch (error) {
      console.error('Error iniciando partido:', error);
      alert('Error al iniciar el partido');
    }
  };

  const handleRecordEvent = (eventType: MatchEvent['type'], team: 'home' | 'away') => {
    if (!liveScore) return;
    
    const newEvent: MatchEvent = {
      id: Date.now().toString(),
      minute: matchTime,
      type: eventType,
      team,
      player: 'Jugador',
      playerNumber: 10,
      description: getEventDescription(eventType, team)
    };
    
    setMatchEvents(prev => [...prev, newEvent]);
    
    // Actualizar marcador según el evento
    if (eventType === 'goal') {
      const updatedLiveScore = { ...liveScore };
      if (team === 'home') {
        updatedLiveScore.homeTeam.score += 1;
      } else {
        updatedLiveScore.awayTeam.score += 1;
      }
      setLiveScore(updatedLiveScore);
    }
  };

  const getEventDescription = (type: MatchEvent['type'], team: 'home' | 'away'): string => {
    const teamName = team === 'home' ? liveScore?.homeTeam.name : liveScore?.awayTeam.name;
    switch (type) {
      case 'goal': return `Gol de ${teamName}`;
      case 'yellow_card': return `Tarjeta amarilla para ${teamName}`;
      case 'red_card': return `Tarjeta roja para ${teamName}`;
      case 'substitution': return `Sustitución en ${teamName}`;
      case 'penalty': return `Penal a favor de ${teamName}`;
      case 'injury': return `Lesión en ${teamName}`;
      default: return 'Evento del partido';
    }
  };

  const handleFinishMatch = async () => {
    if (!selectedMatch || !liveScore) return;
    
    try {
      await updateMatchResult(
        selectedMatch.id,
        liveScore.homeTeam.score,
        liveScore.awayTeam.score,
        'Partido finalizado por el árbitro',
        {
          cards: {
            homeYellow: matchEvents.filter(e => e.type === 'yellow_card' && e.team === 'home').length,
            homeRed: matchEvents.filter(e => e.type === 'red_card' && e.team === 'home').length,
            awayYellow: matchEvents.filter(e => e.type === 'yellow_card' && e.team === 'away').length,
            awayRed: matchEvents.filter(e => e.type === 'red_card' && e.team === 'away').length
          }
        }
      );
      
      // Actualizar estadísticas del árbitro
      if (refereeData) {
        await refereesService.incrementMatchesCompleted(refereeData.id);
      }
      
      setShowScoreboard(false);
      setSelectedMatch(null);
      stopTimer();
      alert('Partido finalizado exitosamente');
    } catch (error) {
      console.error('Error finalizando partido:', error);
      alert('Error al finalizar el partido');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 pb-20">
        <div className="p-4">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 pb-20">
      {/* Header del árbitro */}
      <div className="bg-gradient-to-r from-orange-600 to-red-600 text-white p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Panel del Árbitro</h1>
            <div className="flex items-center mt-1">
              <Flag className="w-4 h-4 mr-1" />
              <span className="text-sm opacity-90">
                {refereeData?.fullName || 'Árbitro'} • Nivel {refereeData?.level || 'Intermedio'}
              </span>
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-sm opacity-90">Licencia: {refereeData?.licenseNumber || 'N/A'}</div>
            <div className="text-xs opacity-75">Válida hasta: {refereeData?.licenseExpiry ? 
              new Date(refereeData.licenseExpiry).toLocaleDateString() : 'N/A'}
            </div>
          </div>
        </div>
      </div>

      {/* Estadísticas rápidas */}
      <div className="p-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 mb-1">Partidos</p>
                <p className="text-2xl font-bold text-gray-900">{refereeStats.totalMatches}</p>
              </div>
              <div className="p-2 bg-orange-100 rounded-full">
                <Flag className="w-6 h-6 text-orange-600" />
              </div>
            </div>
            <div className="text-xs text-gray-600 mt-2">
              {refereeStats.completedMatches} completados
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 mb-1">Calificación</p>
                <p className="text-2xl font-bold text-gray-900">{refereeStats.averageRating.toFixed(1)}</p>
              </div>
              <div className="p-2 bg-green-100 rounded-full">
                <Award className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <div className="text-xs text-gray-600 mt-2">/ 5.0 promedio</div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 mb-1">Próximos</p>
                <p className="text-2xl font-bold text-gray-900">{refereeStats.upcomingMatches}</p>
              </div>
              <div className="p-2 bg-blue-100 rounded-full">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <div className="text-xs text-gray-600 mt-2">Partidos asignados</div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 mb-1">Tarjetas</p>
                <p className="text-2xl font-bold text-gray-900">{refereeStats.yellowCards + refereeStats.redCards}</p>
              </div>
              <div className="p-2 bg-yellow-100 rounded-full">
                <Car className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
            <div className="text-xs text-gray-600 mt-2">
              {refereeStats.yellowCards}A / {refereeStats.redCards}R
            </div>
          </div>
        </div>
      </div>

      {/* Scoreboard en vivo */}
      {showScoreboard && liveScore && selectedMatch && (
        <div className="p-4">
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">Marcador en Vivo</h2>
              <div className="flex items-center space-x-2">
                <div className="flex items-center bg-gray-100 px-3 py-1 rounded-full">
                  <Timer className="w-4 h-4 text-gray-600 mr-2" />
                  <span className="font-bold">{matchTime}'</span>
                </div>
                <button
                  onClick={pauseTimer}
                  className="p-2 bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200"
                >
                  <PauseCircle className="w-5 h-5" />
                </button>
                <button
                  onClick={handleFinishMatch}
                  className="p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
                >
                  <StopCircle className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            {/* Verifica las props que acepta tu Scoreboard */}
            <div className="bg-gray-800 text-white rounded-lg p-4 mb-4">
              <div className="flex justify-between items-center mb-4">
                <div className="text-center flex-1">
                  <div className="text-xl font-bold">{liveScore.homeTeam.name}</div>
                  <div className="text-sm opacity-75">Local</div>
                </div>
                <div className="text-4xl font-bold mx-4">{liveScore.homeTeam.score}</div>
                <div className="text-center flex-1">
                  <div className="text-xl font-bold">{liveScore.awayTeam.name}</div>
                  <div className="text-sm opacity-75">Visitante</div>
                </div>
                <div className="text-4xl font-bold mx-4">{liveScore.awayTeam.score}</div>
              </div>
              
              <div className="text-center mt-2">
                <div className="text-sm">
                  Tiempo: {matchTime}' • {matchTime <= 45 ? 'Primer tiempo' : 'Segundo tiempo'}
                </div>
                <div className="text-xs opacity-75 mt-1">
                  Árbitro: {refereeData?.fullName}
                </div>
              </div>
            </div>
            
            {/* Controles de eventos */}
            <div className="mt-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Registrar Evento</h3>
              <div className="grid grid-cols-3 gap-2 mb-4">
                <button
                  onClick={() => handleRecordEvent('goal', 'home')}
                  className="p-3 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 flex flex-col items-center"
                >
                  <PlusCircle className="w-5 h-5 mb-1" />
                  <span className="text-xs">Gol Local</span>
                </button>
                <button
                  onClick={() => handleRecordEvent('yellow_card', 'home')}
                  className="p-3 bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 flex flex-col items-center"
                >
                  <Car className="w-5 h-5 mb-1" />
                  <span className="text-xs">Amarilla Local</span>
                </button>
                <button
                  onClick={() => handleRecordEvent('red_card', 'home')}
                  className="p-3 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 flex flex-col items-center"
                >
                  <Car className="w-5 h-5 mb-1" />
                  <span className="text-xs">Roja Local</span>
                </button>
                
                <button
                  onClick={() => handleRecordEvent('goal', 'away')}
                  className="p-3 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 flex flex-col items-center"
                >
                  <PlusCircle className="w-5 h-5 mb-1" />
                  <span className="text-xs">Gol Visitante</span>
                </button>
                <button
                  onClick={() => handleRecordEvent('yellow_card', 'away')}
                  className="p-3 bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 flex flex-col items-center"
                >
                  <Car className="w-5 h-5 mb-1" />
                  <span className="text-xs">Amarilla Visitante</span>
                </button>
                <button
                  onClick={() => handleRecordEvent('red_card', 'away')}
                  className="p-3 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 flex flex-col items-center"
                >
                  <Car className="w-5 h-5 mb-1" />
                  <span className="text-xs">Roja Visitante</span>
                </button>
              </div>
            </div>
            
            {/* Eventos registrados */}
            {matchEvents.length > 0 && (
              <div className="mt-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Eventos del Partido</h3>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {matchEvents.slice(-5).reverse().map(event => (
                    <div key={event.id} className="flex items-center bg-gray-50 p-2 rounded">
                      <div className="w-10 text-center font-bold text-gray-700">
                        {event.minute}'
                      </div>
                      <div className="ml-2">
                        <span className={`text-xs px-2 py-1 rounded ${
                          event.type === 'goal' ? 'bg-green-100 text-green-800' :
                          event.type === 'yellow_card' ? 'bg-yellow-100 text-yellow-800' :
                          event.type === 'red_card' ? 'bg-red-100 text-red-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {event.type === 'goal' ? '⚽' : 
                           event.type === 'yellow_card' ? '🟨' :
                           event.type === 'red_card' ? '🟥' : '🔄'}
                        </span>
                        <span className="text-sm text-gray-600 ml-2">{event.description}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}


      {/* Partidos asignados */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-gray-900 flex items-center">
            <Calendar className="w-5 h-5 mr-2 text-blue-500" />
            Partidos Asignados
          </h2>
          <button 
            onClick={() => navigate('/matches')}
            className="text-sm text-blue-600 font-medium flex items-center"
          >
            Ver todos
            <ChevronRight className="w-4 h-4 ml-1" />
          </button>
        </div>
        
        {upcomingMatches.length > 0 ? (
          <div className="space-y-3">
            {upcomingMatches.map((match, index) => {
              const originalMatch = assignedMatches.find(m => m.id === match.id);
              return (
                <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-600">{match.time}</span>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">{match.fieldName}</div>
                    </div>
                    <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                      originalMatch?.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                      originalMatch?.status === 'in_progress' ? 'bg-green-100 text-green-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {originalMatch?.status === 'scheduled' ? 'Programado' :
                       originalMatch?.status === 'in_progress' ? 'En vivo' :
                       'Completado'}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex-1 text-center">
                      <div className="font-bold text-lg">{match.homeTeam.name}</div>
                      <div className="text-xs text-gray-500">Local</div>
                    </div>
                    <div className="mx-4 text-center">
                      <div className="text-2xl font-bold">{match.homeTeam.score || 0} - {match.awayTeam.score || 0}</div>
                      <div className="text-xs text-gray-500">VS</div>
                    </div>
                    <div className="flex-1 text-center">
                      <div className="font-bold text-lg">{match.awayTeam.name}</div>
                      <div className="text-xs text-gray-500">Visitante</div>
                    </div>
                  </div>
                  
                  {originalMatch?.status === 'scheduled' && (
                    <button
                      onClick={() => originalMatch && handleStartMatch(originalMatch)}
                      className="w-full py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 flex items-center justify-center"
                    >
                      <PlayCircle className="w-4 h-4 mr-2" />
                      Iniciar Partido
                    </button>
                  )}
                  
                  {originalMatch?.status === 'in_progress' && (
                    <button
                      onClick={() => {
                        if (originalMatch) {
                          setSelectedMatch(originalMatch);
                          setShowScoreboard(true);
                        }
                      }}
                      className="w-full py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center"
                    >
                      <Flag className="w-4 h-4 mr-2" />
                      Ir al Marcador
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
            <Flag className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-600">No tienes partidos asignados</p>
            <p className="text-sm text-gray-500 mt-1">Los administradores te asignarán partidos próximamente</p>
          </div>
        )}
      </div>

      {/* Historial de partidos */}
      {pastMatches.length > 0 && (
        <div className="p-4">
          <h2 className="text-lg font-bold text-gray-900 mb-3">Historial Reciente</h2>
          <div className="space-y-2">
            {pastMatches.slice(0, 3).map((match, index) => (
              <div
                key={index}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 hover:bg-gray-50 cursor-pointer"
                onClick={() => navigate(`/matches/${match.id}`)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">
                      {match.homeTeam?.name || 'Equipo Local'} vs {match.awayTeam?.name || 'Equipo Visitante'}
                    </div>
                    <div className="text-sm text-gray-600">
                      {new Date(match.matchDate).toLocaleDateString()} • {match.fieldId}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold">
                      {match.homeScore || 0} - {match.awayScore || 0}
                    </div>
                    <div className={`text-xs px-2 py-1 rounded-full ${
                      match.status === 'completed' ? 'bg-green-100 text-green-800' :
                      match.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {match.status === 'completed' ? 'Finalizado' :
                       match.status === 'cancelled' ? 'Cancelado' : 'Pendiente'}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Acciones rápidas */}
      <div className="p-4">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Acciones Rápidas</h2>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => navigate('/calendar')}
            className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl p-4 text-center hover:from-blue-600 hover:to-blue-700 transition-all active:scale-[0.98]"
          >
            <Calendar className="w-6 h-6 mx-auto mb-2" />
            <span className="font-medium">Calendario</span>
          </button>
          
          <button
            onClick={() => navigate('/reports')}
            className="bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl p-4 text-center hover:from-purple-600 hover:to-purple-700 transition-all active:scale-[0.98]"
          >
            <FileText className="w-6 h-6 mx-auto mb-2" />
            <span className="font-medium">Reportes</span>
          </button>
          
          <button
            onClick={() => navigate('/referee-stats')}
            className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl p-4 text-center hover:from-green-600 hover:to-green-700 transition-all active:scale-[0.98]"
          >
            <BarChart3 className="w-6 h-6 mx-auto mb-2" />
            <span className="font-medium">Estadísticas</span>
          </button>
          
          <button
            onClick={() => navigate('/profile')}
            className="bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl p-4 text-center hover:from-orange-600 hover:to-orange-700 transition-all active:scale-[0.98]"
          >
            <UserCheck className="w-6 h-6 mx-auto mb-2" />
            <span className="font-medium">Perfil</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default RefereePanel;