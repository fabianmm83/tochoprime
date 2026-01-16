// src/components/scoreboard/Scoreboard.tsx
import React, { useState, useEffect } from 'react';
import { Play, Pause, StopCircle, Clock, Undo, Save } from 'lucide-react';
import { matchesService } from '../../services/firestore';
import { Match, MatchStatus } from '../../types';

interface ScoreboardProps {
  match: Match;
  onUpdate?: (match: Match) => void;
}

const Scoreboard: React.FC<ScoreboardProps> = ({ match, onUpdate }) => {
  const [homeScore, setHomeScore] = useState<number>(match.homeScore || 0);
  const [awayScore, setAwayScore] = useState<number>(match.awayScore || 0);
  const [isLive, setIsLive] = useState<boolean>(match.status === MatchStatus.IN_PROGRESS);
  const [timer, setTimer] = useState<number | null>(null); // Cambiado de NodeJS.Timeout a number
  const [half, setHalf] = useState<'first' | 'second'>('first');
  const [minute, setMinute] = useState<number>(0);

  // Manejar el temporizador
  useEffect(() => {
    if (isLive && timer === null) {
      const newTimer = window.setInterval(() => {
        setMinute(prev => {
          if (prev >= 45) {
            if (half === 'first') {
              setHalf('second');
              return 0;
            } else {
              handleFinishMatch();
              return 45;
            }
          }
          return prev + 1;
        });
      }, 1000); // 1 segundo = 1 minuto de juego (para demo)

      setTimer(newTimer);
    } else if (!isLive && timer !== null) {
      window.clearInterval(timer);
      setTimer(null);
    }

    return () => {
      if (timer !== null) {
        window.clearInterval(timer);
      }
    };
  }, [isLive, half, timer]);

  const handleStartMatch = async () => {
    setIsLive(true);
    await matchesService.updateMatch(match.id, { 
      status: MatchStatus.IN_PROGRESS,
      resultDetails: {
        ...match.resultDetails,
        halftimeScore: { home: 0, away: 0 }
      }
    });
  };

  const handlePauseMatch = async () => {
    setIsLive(false);
    await matchesService.updateMatch(match.id, { 
      status: MatchStatus.IN_PROGRESS
    });
  };

  const handleFinishMatch = async () => {
    setIsLive(false);
    if (timer !== null) {
      window.clearInterval(timer);
      setTimer(null);
    }
    
    let winner: 'home' | 'away' | 'draw' | undefined;
    if (homeScore > awayScore) {
      winner = 'home';
    } else if (awayScore > homeScore) {
      winner = 'away';
    } else {
      winner = 'draw';
    }
    
    const updatedMatchData = {
      status: MatchStatus.COMPLETED as const,
      homeScore,
      awayScore,
      winner,
      resultDetails: {
        ...match.resultDetails,
        halftimeScore: match.resultDetails?.halftimeScore || { home: 0, away: 0 }
      }
    };
    
    await matchesService.updateMatch(match.id, updatedMatchData);
    
    // Crear el objeto Match actualizado
    const updatedMatch: Match = {
      ...match,
      ...updatedMatchData
    };
    
    onUpdate?.(updatedMatch);
  };

  const handleScoreChange = (team: 'home' | 'away', operation: 'increment' | 'decrement') => {
    if (!isLive) return;

    if (team === 'home') {
      const newScore = operation === 'increment' ? homeScore + 1 : Math.max(0, homeScore - 1);
      setHomeScore(newScore);
    } else {
      const newScore = operation === 'increment' ? awayScore + 1 : Math.max(0, awayScore - 1);
      setAwayScore(newScore);
    }
  };

  const handleHalftimeScore = () => {
    if (half === 'first' && isLive) {
      const halftimeUpdate = {
        resultDetails: {
          ...match.resultDetails,
          halftimeScore: { home: homeScore, away: awayScore }
        }
      };
      matchesService.updateMatch(match.id, halftimeUpdate);
    }
  };

  const handleSaveScore = async () => {
    const updateData = {
      homeScore,
      awayScore
    };
    
    await matchesService.updateMatch(match.id, updateData);
    
    const updatedMatch: Match = {
      ...match,
      ...updateData
    };
    
    onUpdate?.(updatedMatch);
  };

  const formatTime = () => {
    return `${minute}'`;
  };

  return (
    <div className="bg-gradient-to-b from-gray-900 to-black text-white rounded-2xl p-6 shadow-2xl">
      {/* Encabezado */}
      <div className="text-center mb-6">
        <div className="flex items-center justify-center space-x-2 mb-2">
          <Clock className="text-yellow-400" size={20} />
          <span className="text-lg font-semibold">CONTROL DE PARTIDO</span>
        </div>
        <div className="text-sm text-gray-400">
          Jornada {match.round} • {match.isPlayoff ? 'Playoffs' : 'Temporada Regular'}
        </div>
      </div>

      {/* Marcador principal */}
      <div className="flex justify-between items-center mb-8">
        {/* Equipo local */}
        <div className="flex-1 text-center">
          <div className="text-2xl font-bold mb-2 truncate">
            {match.homeTeam?.name || 'Equipo Local'}
          </div>
          <div className="flex items-center justify-center space-x-4">
            <button
              onClick={() => handleScoreChange('home', 'decrement')}
              disabled={!isLive}
              className="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center disabled:opacity-30 hover:bg-gray-700 transition-colors"
            >
              <span className="text-2xl">-</span>
            </button>
            
            <div className="relative">
              <div className="text-7xl font-bold bg-gray-800 rounded-xl px-8 py-4">
                {homeScore}
              </div>
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-xs">
                L
              </div>
            </div>
            
            <button
              onClick={() => handleScoreChange('home', 'increment')}
              disabled={!isLive}
              className="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center disabled:opacity-30 hover:bg-gray-700 transition-colors"
            >
              <span className="text-2xl">+</span>
            </button>
          </div>
        </div>

        {/* Separador */}
        <div className="mx-4">
          <div className="text-4xl font-bold text-gray-400">:</div>
          <div className="text-center mt-2">
            <div className="text-lg font-semibold">{half === 'first' ? '1° T' : '2° T'}</div>
            <div className="text-2xl font-bold text-yellow-400">{formatTime()}</div>
          </div>
        </div>

        {/* Equipo visitante */}
        <div className="flex-1 text-center">
          <div className="text-2xl font-bold mb-2 truncate">
            {match.awayTeam?.name || 'Equipo Visitante'}
          </div>
          <div className="flex items-center justify-center space-x-4">
            <button
              onClick={() => handleScoreChange('away', 'decrement')}
              disabled={!isLive}
              className="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center disabled:opacity-30 hover:bg-gray-700 transition-colors"
            >
              <span className="text-2xl">-</span>
            </button>
            
            <div className="relative">
              <div className="text-7xl font-bold bg-gray-800 rounded-xl px-8 py-4">
                {awayScore}
              </div>
              <div className="absolute -top-2 -left-2 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-xs">
                V
              </div>
            </div>
            
            <button
              onClick={() => handleScoreChange('away', 'increment')}
              disabled={!isLive}
              className="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center disabled:opacity-30 hover:bg-gray-700 transition-colors"
            >
              <span className="text-2xl">+</span>
            </button>
          </div>
        </div>
      </div>

      {/* Controles del partido */}
      <div className="space-y-4">
        {/* Temporizador y medios tiempos */}
        <div className="bg-gray-800 rounded-xl p-4">
          <div className="flex justify-between items-center">
            <div className="text-lg font-semibold">CONTROLES</div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setMinute(prev => Math.max(0, prev - 1))}
                disabled={isLive}
                className="p-2 rounded-lg bg-gray-700 disabled:opacity-30 hover:bg-gray-600 transition-colors"
              >
                <Undo size={20} />
              </button>
              
              <button
                onClick={handleHalftimeScore}
                disabled={half !== 'first' || !isLive}
                className="px-4 py-2 bg-yellow-600 rounded-lg disabled:opacity-30 hover:bg-yellow-700 transition-colors"
              >
                Medio Tiempo
              </button>
              
              <button
                onClick={() => setMinute(prev => prev + 1)}
                disabled={isLive}
                className="p-2 rounded-lg bg-gray-700 disabled:opacity-30 hover:bg-gray-600 transition-colors"
              >
                <span className="text-2xl">+</span>
              </button>
            </div>
          </div>
        </div>

        {/* Botones de control */}
        <div className="grid grid-cols-3 gap-3">
          {!isLive && match.status === MatchStatus.SCHEDULED && (
            <button
              onClick={handleStartMatch}
              className="flex flex-col items-center justify-center p-4 bg-green-600 rounded-xl hover:bg-green-700 transition-colors"
            >
              <Play size={24} className="mb-2" />
              <span className="font-medium">Iniciar</span>
            </button>
          )}
          
          {isLive && (
            <button
              onClick={handlePauseMatch}
              className="flex flex-col items-center justify-center p-4 bg-yellow-600 rounded-xl hover:bg-yellow-700 transition-colors"
            >
              <Pause size={24} className="mb-2" />
              <span className="font-medium">Pausar</span>
            </button>
          )}
          
          {isLive && (
            <button
              onClick={handleFinishMatch}
              className="flex flex-col items-center justify-center p-4 bg-red-600 rounded-xl hover:bg-red-700 transition-colors"
            >
              <StopCircle size={24} className="mb-2" />
              <span className="font-medium">Finalizar</span>
            </button>
          )}
          
          <button
            onClick={handleSaveScore}
            className="flex flex-col items-center justify-center p-4 bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors col-span-3"
          >
            <Save size={24} className="mb-2" />
            <span className="font-medium">Guardar Cambios</span>
          </button>
        </div>
      </div>

      {/* Información del partido */}
      <div className="mt-6 pt-4 border-t border-gray-700">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-gray-400">Árbitro</div>
            <div className="font-medium">{match.refereeName || 'Por asignar'}</div>
          </div>
          <div>
            <div className="text-gray-400">Estado</div>
            <div className="font-medium">
              {match.status === MatchStatus.IN_PROGRESS ? 'En Vivo' : 
               match.status === MatchStatus.COMPLETED ? 'Finalizado' : 
               match.status === MatchStatus.SCHEDULED ? 'Programado' :
               match.status === MatchStatus.CANCELLED ? 'Cancelado' : 'Aplazado'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Scoreboard;