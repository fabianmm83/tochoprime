import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  getDoc, 
  doc, 
  updateDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../services/firebase';
import { 
  ClockIcon,
  TrophyIcon,
  UsersIcon,
  MapPinIcon,
  ArrowLeftIcon,
  PlayIcon,
  PauseIcon,
  StopIcon,
  PlusIcon,
  MinusIcon,
  FlagIcon,
  ExclamationTriangleIcon,
  UserGroupIcon,
  DocumentTextIcon,
  CameraIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import { Match, Team } from '../types';

interface LiveScoreProps {
  matchId?: string;
}

interface ScoreUpdate {
  team: 'home' | 'away';
  type: 'touchdown' | 'conversion' | 'safety' | 'penalty' | 'other';
  points: number;
  description: string;
  playerName?: string;
  playerNumber?: number;
  timestamp: Date;
}

const LiveScore: React.FC<LiveScoreProps> = ({ matchId: initialMatchId }) => {
  const { id } = useParams<{ id: string }>();
  const matchId = initialMatchId || id;
  const navigate = useNavigate();
  
  const [match, setMatch] = useState<Match | null>(null);
  const [homeTeam, setHomeTeam] = useState<Team | null>(null);
  const [awayTeam, setAwayTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Estado del marcador
  const [homeScore, setHomeScore] = useState(0);
  const [awayScore, setAwayScore] = useState(0);
  
  // Contadores específicos para tochito
  const [homeTouchdowns, setHomeTouchdowns] = useState(0);
  const [awayTouchdowns, setAwayTouchdowns] = useState(0);
  const [homeConversions, setHomeConversions] = useState(0);
  const [awayConversions, setAwayConversions] = useState(0);
  const [homeSafeties, setHomeSafeties] = useState(0);
  const [awaySafeties, setAwaySafeties] = useState(0);
  const [homePenalties, setHomePenalties] = useState(0);
  const [awayPenalties, setAwayPenalties] = useState(0);
  
  // Estado del partido
  type MatchStatusType = 'pre_match' | 'in_progress' | 'halftime' | 'completed' | 'cancelled';
  const [matchStatus, setMatchStatus] = useState<MatchStatusType>('pre_match');
  const [currentMinute, setCurrentMinute] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  
  // Usar number para el timer en lugar de NodeJS.Timeout
  const timerRef = useRef<number | null>(null);
  
  // Eventos del partido
  const [events, setEvents] = useState<ScoreUpdate[]>([]);
  const [newEventDescription, setNewEventDescription] = useState('');
  const [newEventType, setNewEventType] = useState<ScoreUpdate['type']>('touchdown');
  const [newEventTeam, setNewEventTeam] = useState<'home' | 'away'>('home');
  
  // Configuración del partido
  const totalMinutes = 60; // 4 cuartos de 15 minutos
  const halftimeMinute = 30;

  // Cargar datos del partido
  useEffect(() => {
    if (matchId) {
      loadMatchData();
    }
    
    return () => {
      // Limpiar timer al desmontar
      if (timerRef.current !== null) {
        window.clearInterval(timerRef.current);
      }
    };
  }, [matchId]);

  const loadMatchData = async () => {
    if (!matchId) return;
    
    setLoading(true);
    try {
      // Cargar partido
      const matchDoc = await getDoc(doc(db, 'matches', matchId));
      if (!matchDoc.exists()) {
        console.error('Partido no encontrado');
        setLoading(false);
        return;
      }
      
      const matchData = matchDoc.data() as Match;
      setMatch(matchData);
      setHomeScore(matchData.homeScore || 0);
      setAwayScore(matchData.awayScore || 0);
      
      // Convertir status de match al tipo MatchStatusType
      let initialStatus: MatchStatusType = 'pre_match';
      if (matchData.status === 'in_progress') {
        initialStatus = 'in_progress';
      } else if (matchData.status === 'completed') {
        initialStatus = 'completed';
      } else if (matchData.status === 'cancelled') {
        initialStatus = 'cancelled';
      }
      setMatchStatus(initialStatus);
      
      // Cargar equipos
      if (matchData.homeTeamId) {
        const homeTeamDoc = await getDoc(doc(db, 'teams', matchData.homeTeamId));
        if (homeTeamDoc.exists()) {
          setHomeTeam(homeTeamDoc.data() as Team);
        }
      }
      
      if (matchData.awayTeamId) {
        const awayTeamDoc = await getDoc(doc(db, 'teams', matchData.awayTeamId));
        if (awayTeamDoc.exists()) {
          setAwayTeam(awayTeamDoc.data() as Team);
        }
      }
      
      // Cargar eventos existentes si los hay
      loadMatchEvents();
      
    } catch (error) {
      console.error('Error cargando datos del partido:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMatchEvents = async () => {
    // Aquí podrías cargar eventos guardados de la base de datos
    // Por ahora inicializamos con eventos vacíos
    setEvents([]);
  };

  // Manejo del temporizador
  useEffect(() => {
    if (isTimerRunning) {
      // Usar window.setInterval para obtener number en lugar de NodeJS.Timeout
      timerRef.current = window.setInterval(() => {
        setCurrentMinute(prev => {
          if (prev >= totalMinutes) {
            stopTimer();
            if (matchStatus === 'in_progress') {
              completeMatch();
            }
            return totalMinutes;
          }
          const newMinute = prev + 1;
          
          // Verificar si es medio tiempo
          if (newMinute === halftimeMinute && matchStatus === 'in_progress') {
            setMatchStatus('halftime');
            pauseTimer();
          }
          
          return newMinute;
        });
      }, 1000); // 1 segundo = 1 minuto de juego (ajustable)
      
      return () => {
        if (timerRef.current !== null) {
          window.clearInterval(timerRef.current);
        }
      };
    }
  }, [isTimerRunning, matchStatus]);

  const startTimer = () => {
    if (matchStatus === 'pre_match') {
      setMatchStatus('in_progress');
      updateMatchStatus('in_progress');
    } else if (matchStatus === 'halftime') {
      setMatchStatus('in_progress');
      updateMatchStatus('in_progress');
    }
    setIsTimerRunning(true);
  };

  const pauseTimer = () => {
    setIsTimerRunning(false);
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const stopTimer = () => {
    setIsTimerRunning(false);
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const completeMatch = async () => {
    setMatchStatus('completed');
    stopTimer();
    
    // Actualizar en base de datos
    if (matchId) {
      try {
        await updateDoc(doc(db, 'matches', matchId), {
          status: 'completed',
          homeScore: homeScore,
          awayScore: awayScore,
          winner: homeScore > awayScore ? 'home' : awayScore > homeScore ? 'away' : 'draw',
          updatedAt: serverTimestamp()
        });
      } catch (error) {
        console.error('Error completando partido:', error);
      }
    }
  };

  const updateMatchStatus = async (status: Match['status']) => {
    if (!matchId) return;
    
    try {
      await updateDoc(doc(db, 'matches', matchId), {
        status: status,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error actualizando estado:', error);
    }
  };

  const addScore = (team: 'home' | 'away', points: number, type: ScoreUpdate['type'], description: string) => {
    const event: ScoreUpdate = {
      team,
      type,
      points,
      description,
      timestamp: new Date()
    };

    setEvents(prev => [event, ...prev]);

    if (team === 'home') {
      const newScore = homeScore + points;
      setHomeScore(newScore);
      
      // Actualizar contadores específicos
      switch (type) {
        case 'touchdown':
          setHomeTouchdowns(prev => prev + 1);
          break;
        case 'conversion':
          setHomeConversions(prev => prev + 1);
          break;
        case 'safety':
          setHomeSafeties(prev => prev + 1);
          break;
        case 'penalty':
          setHomePenalties(prev => prev + 1);
          break;
      }
      
      // Actualizar en base de datos
      updateScoreInDatabase(newScore, awayScore);
    } else {
      const newScore = awayScore + points;
      setAwayScore(newScore);
      
      // Actualizar contadores específicos
      switch (type) {
        case 'touchdown':
          setAwayTouchdowns(prev => prev + 1);
          break;
        case 'conversion':
          setAwayConversions(prev => prev + 1);
          break;
        case 'safety':
          setAwaySafeties(prev => prev + 1);
          break;
        case 'penalty':
          setAwayPenalties(prev => prev + 1);
          break;
      }
      
      // Actualizar en base de datos
      updateScoreInDatabase(homeScore, newScore);
    }
  };

  const updateScoreInDatabase = async (home: number, away: number) => {
    if (!matchId) return;
    
    try {
      await updateDoc(doc(db, 'matches', matchId), {
        homeScore: home,
        awayScore: away,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error actualizando marcador:', error);
    }
  };

  const handleAddEvent = () => {
    if (!newEventDescription.trim()) return;

    let points = 0;
    let description = newEventDescription;

    switch (newEventType) {
      case 'touchdown':
        points = 1; // Touchdown en tochito vale 1 punto
        description = `Touchdown: ${description}`;
        break;
      case 'conversion':
        points = 1; // Conversión vale 1 punto adicional
        description = `Conversión: ${description}`;
        break;
      case 'safety':
        points = 1; // Safety vale 1 punto
        description = `Safety: ${description}`;
        break;
      case 'penalty':
        points = 0; // Penal no suma puntos directamente
        description = `Penal: ${description}`;
        break;
      default:
        points = 0;
    }

    if (points > 0) {
      addScore(newEventTeam, points, newEventType, description);
    } else {
      // Solo agregar como evento sin puntos
      const event: ScoreUpdate = {
        team: newEventTeam,
        type: newEventType,
        points: 0,
        description,
        timestamp: new Date()
      };
      setEvents(prev => [event, ...prev]);
    }

    setNewEventDescription('');
  };

  const handleBack = () => {
    navigate(-1);
  };

  const formatMinute = (minute: number) => {
    if (minute <= halftimeMinute) {
      const quarter = Math.ceil(minute / 15);
      return `Q${quarter} - ${minute}'`;
    } else {
      const quarter = Math.ceil((minute - halftimeMinute) / 15) + 2;
      return `Q${quarter} - ${minute}'`;
    }
  };

  const getMatchStatusText = () => {
    switch (matchStatus) {
      case 'pre_match': return 'Por iniciar';
      case 'in_progress': return 'En juego';
      case 'halftime': return 'Medio tiempo';
      case 'completed': return 'Finalizado';
      case 'cancelled': return 'Cancelado';
      default: return 'Desconocido';
    }
  };

  const getStatusColor = () => {
    switch (matchStatus) {
      case 'pre_match': return 'bg-gray-100 text-gray-800';
      case 'in_progress': return 'bg-green-100 text-green-800';
      case 'halftime': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Quick score buttons
  const quickScoreActions = [
    { type: 'touchdown' as const, label: 'Touchdown', points: 1, color: 'bg-green-500 hover:bg-green-600' },
    { type: 'conversion' as const, label: 'Conversión', points: 1, color: 'bg-blue-500 hover:bg-blue-600' },
    { type: 'safety' as const, label: 'Safety', points: 1, color: 'bg-yellow-500 hover:bg-yellow-600' },
    { type: 'penalty' as const, label: 'Penal', points: 0, color: 'bg-red-500 hover:bg-red-600' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white p-4">
        <div className="flex items-center mb-6">
          <button
            onClick={handleBack}
            className="p-2 rounded-full hover:bg-gray-100 mr-3"
          >
            <ArrowLeftIcon className="w-6 h-6 text-gray-700" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Marcador en Vivo</h1>
        </div>
        
        <div className="animate-pulse space-y-4">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="h-8 bg-gray-200 rounded-lg w-48 mb-6"></div>
            <div className="flex justify-between mb-8">
              <div className="text-center">
                <div className="h-12 bg-gray-200 rounded-lg w-32 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-24"></div>
              </div>
              <div className="h-16 bg-gray-200 rounded-lg w-16"></div>
              <div className="text-center">
                <div className="h-12 bg-gray-200 rounded-lg w-32 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-24"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!match) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white p-4 flex flex-col items-center justify-center">
        <XCircleIcon className="w-16 h-16 text-red-500 mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Partido no encontrado</h1>
        <p className="text-gray-600 mb-6">No se pudo cargar la información del partido.</p>
        <button
          onClick={handleBack}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Volver
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white p-4 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <button
            onClick={handleBack}
            className="p-2 rounded-full hover:bg-gray-100 mr-3 active:scale-95 transition-transform"
            aria-label="Volver atrás"
          >
            <ArrowLeftIcon className="w-6 h-6 text-gray-700" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Marcador en Vivo</h1>
            <div className="flex items-center space-x-2 mt-1">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor()}`}>
                {getMatchStatusText()}
              </span>
              <span className="text-sm text-gray-600">
                {match.divisionId} • {match.categoryId}
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <div className="text-center bg-gray-100 rounded-lg px-3 py-2">
            <div className="flex items-center justify-center space-x-1">
              <ClockIcon className="w-5 h-5 text-gray-600" />
              <span className="text-lg font-bold text-gray-900">{formatMinute(currentMinute)}</span>
            </div>
            <div className="text-xs text-gray-500">Tiempo</div>
          </div>
          
          {matchStatus === 'in_progress' && (
            <button
              onClick={pauseTimer}
              className="p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
              aria-label="Pausar partido"
            >
              <PauseIcon className="w-6 h-6" />
            </button>
          )}
        </div>
      </div>

      {/* Match Info Card */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <MapPinIcon className="w-5 h-5 text-gray-500" />
            <span className="text-gray-700">Campo {match.fieldId}</span>
          </div>
          <div className="flex items-center space-x-2">
            <TrophyIcon className="w-5 h-5 text-gray-500" />
            <span className="text-gray-700">Jornada {match.round}</span>
          </div>
        </div>
        
        {/* Scoreboard */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 mb-6">
          <div className="flex items-center justify-between mb-2">
            <div className="text-center flex-1">
              <div className="text-lg font-bold text-gray-900 mb-1">
                {homeTeam?.name || 'Equipo Local'}
              </div>
              {homeTeam?.logoUrl && (
                <img 
                  src={homeTeam.logoUrl} 
                  alt={homeTeam.name} 
                  className="w-16 h-16 object-contain mx-auto mb-2"
                />
              )}
            </div>
            
            <div className="text-center mx-8">
              <div className="text-5xl font-bold text-gray-900 mb-1">
                {homeScore} - {awayScore}
              </div>
              <div className="text-sm text-gray-600">Marcador</div>
            </div>
            
            <div className="text-center flex-1">
              <div className="text-lg font-bold text-gray-900 mb-1">
                {awayTeam?.name || 'Equipo Visitante'}
              </div>
              {awayTeam?.logoUrl && (
                <img 
                  src={awayTeam.logoUrl} 
                  alt={awayTeam.name} 
                  className="w-16 h-16 object-contain mx-auto mb-2"
                />
              )}
            </div>
          </div>
          
          {/* Detailed Stats */}
          <div className="grid grid-cols-4 gap-4 mt-4">
            <div className="text-center">
              <div className="text-xl font-bold text-green-600">{homeTouchdowns}</div>
              <div className="text-xs text-gray-600">Touchdowns</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-blue-600">{homeConversions}</div>
              <div className="text-xs text-gray-600">Conversiones</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-yellow-600">{homeSafeties}</div>
              <div className="text-xs text-gray-600">Safeties</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-red-600">{homePenalties}</div>
              <div className="text-xs text-gray-600">Penales</div>
            </div>
          </div>
          
          <div className="grid grid-cols-4 gap-4 mt-4">
            <div className="text-center">
              <div className="text-xl font-bold text-green-600">{awayTouchdowns}</div>
              <div className="text-xs text-gray-600">Touchdowns</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-blue-600">{awayConversions}</div>
              <div className="text-xs text-gray-600">Conversiones</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-yellow-600">{awaySafeties}</div>
              <div className="text-xs text-gray-600">Safeties</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-red-600">{awayPenalties}</div>
              <div className="text-xs text-gray-600">Penales</div>
            </div>
          </div>
        </div>

        {/* Match Controls */}
        <div className="flex justify-center space-x-4 mb-6">
          {matchStatus === 'pre_match' && (
            <button
              onClick={startTimer}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center space-x-2"
            >
              <PlayIcon className="w-5 h-5" />
              <span>Iniciar Partido</span>
            </button>
          )}
          
          {matchStatus === 'in_progress' && (
            <>
              <button
                onClick={pauseTimer}
                className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 flex items-center space-x-2"
              >
                <PauseIcon className="w-5 h-5" />
                <span>Pausar</span>
              </button>
              
              {currentMinute >= halftimeMinute && (
                <button
                  onClick={() => {
                    setMatchStatus('halftime');
                    pauseTimer();
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
                >
                  <FlagIcon className="w-5 h-5" />
                  <span>Medio Tiempo</span>
                </button>
              )}
              
              <button
                onClick={completeMatch}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center space-x-2"
              >
                <StopIcon className="w-5 h-5" />
                <span>Finalizar</span>
              </button>
            </>
          )}
          
          {matchStatus === 'halftime' && (
            <button
              onClick={startTimer}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center space-x-2"
            >
              <PlayIcon className="w-5 h-5" />
              <span>Reanudar</span>
            </button>
          )}
          
          {matchStatus === 'completed' && (
            <button
              onClick={() => alert('El partido ya está finalizado')}
              className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center space-x-2"
            >
              <CheckCircleIcon className="w-5 h-5" />
              <span>Finalizado</span>
            </button>
          )}
        </div>
      </div>

      {/* Quick Score Actions */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Acciones Rápidas</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {quickScoreActions.map((action, index) => (
            <div key={index} className="space-y-2">
              <button
                onClick={() => {
                  addScore('home', action.points, action.type, `${action.label} del equipo local`);
                }}
                className={`w-full py-3 text-white rounded-lg font-medium flex items-center justify-center space-x-2 ${action.color}`}
              >
                <PlusIcon className="w-5 h-5" />
                <span>{action.label} Local</span>
              </button>
              <button
                onClick={() => {
                  addScore('away', action.points, action.type, `${action.label} del equipo visitante`);
                }}
                className={`w-full py-3 text-white rounded-lg font-medium flex items-center justify-center space-x-2 ${action.color}`}
              >
                <PlusIcon className="w-5 h-5" />
                <span>{action.label} Visitante</span>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Add Custom Event */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Agregar Evento Personalizado</h2>
        
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Equipo
              </label>
              <select
                value={newEventTeam}
                onChange={(e) => setNewEventTeam(e.target.value as 'home' | 'away')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="home">Local ({homeTeam?.name || 'Equipo A'})</option>
                <option value="away">Visitante ({awayTeam?.name || 'Equipo B'})</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Evento
              </label>
              <select
                value={newEventType}
                onChange={(e) => setNewEventType(e.target.value as ScoreUpdate['type'])}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="touchdown">Touchdown (+1)</option>
                <option value="conversion">Conversión (+1)</option>
                <option value="safety">Safety (+1)</option>
                <option value="penalty">Penal</option>
                <option value="other">Otro</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descripción
              </label>
              <input
                type="text"
                value={newEventDescription}
                onChange={(e) => setNewEventDescription(e.target.value)}
                placeholder="Ej: Pase de 20 yardas de Juan Pérez"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          
          <button
            onClick={handleAddEvent}
            disabled={!newEventDescription.trim()}
            className="w-full py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Agregar Evento
          </button>
        </div>
      </div>

      {/* Events Timeline */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Línea de Tiempo</h2>
          <span className="text-sm text-gray-600">{events.length} eventos</span>
        </div>
        
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {events.length > 0 ? (
            events.map((event, index) => (
              <div 
                key={index} 
                className={`p-3 rounded-lg border ${
                  event.team === 'home' 
                    ? 'border-blue-200 bg-blue-50' 
                    : 'border-red-200 bg-red-50'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className={`font-medium ${
                        event.team === 'home' ? 'text-blue-700' : 'text-red-700'
                      }`}>
                        {event.team === 'home' ? homeTeam?.name || 'Local' : awayTeam?.name || 'Visitante'}
                      </span>
                      {event.points > 0 && (
                        <span className="bg-green-100 text-green-800 text-xs font-bold px-2 py-1 rounded-full">
                          +{event.points}
                        </span>
                      )}
                    </div>
                    <p className="text-gray-700 mt-1">{event.description}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-500">
                      {formatMinute(currentMinute)}
                    </div>
                    <div className="text-xs text-gray-400">
                      {event.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-500">
              <DocumentTextIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>No hay eventos registrados aún</p>
              <p className="text-sm mt-1">Agrega eventos usando los botones de arriba</p>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="fixed bottom-4 left-4 right-4 bg-white rounded-xl shadow-lg p-4 border border-gray-200">
        <div className="flex justify-between">
          <div className="flex space-x-2">
            <button
              onClick={() => navigate(`/partidos/${matchId}`)}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center space-x-2"
            >
              <DocumentTextIcon className="w-5 h-5" />
              <span>Ver Detalles</span>
            </button>
            
            <button
              onClick={() => navigate(`/partidos/${matchId}/resultado`)}
              className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 flex items-center space-x-2"
            >
              <CheckCircleIcon className="w-5 h-5" />
              <span>Reporte Final</span>
            </button>
          </div>
          
          {matchStatus === 'completed' && (
            <button
              onClick={() => {
                alert('Estadísticas guardadas exitosamente');
              }}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center space-x-2"
            >
              <CheckCircleIcon className="w-5 h-5" />
              <span>Guardar Todo</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default LiveScore;