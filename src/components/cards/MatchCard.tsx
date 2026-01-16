import React from 'react';
import type { Match, MatchCardData } from '../../types';

// Define un tipo unión para aceptar ambos
export type MatchCardProps = {
  match: Match | MatchCardData;
  variant?: 'compact' | 'default' | 'detailed';
  onClick?: () => void;
  className?: string;
};

const MatchCard: React.FC<MatchCardProps> = ({ match, variant = 'default', onClick, className = '' }) => {
  // Función para extraer datos independientemente del tipo
  const getMatchData = () => {
    // Si es MatchCardData
    if ('homeTeam' in match && typeof match.homeTeam === 'object') {
      const matchCard = match as MatchCardData;
      return {
        id: matchCard.id,
        homeTeamName: matchCard.homeTeam.name,
        awayTeamName: matchCard.awayTeam.name,
        homeTeamScore: matchCard.homeTeam.score,
        awayTeamScore: matchCard.awayTeam.score,
        date: matchCard.date,
        time: matchCard.time,
        status: matchCard.status,
        fieldName: matchCard.fieldName,
        isLive: matchCard.isLive,
        isHighlighted: matchCard.isHighlighted
      };
    }
    
    // Si es Match
    const matchObj = match as Match;
    return {
      id: matchObj.id,
      homeTeamName: matchObj.homeTeam?.name || 'Equipo Local',
      awayTeamName: matchObj.awayTeam?.name || 'Equipo Visitante',
      homeTeamScore: matchObj.homeScore,
      awayTeamScore: matchObj.awayScore,
      date: matchObj.matchDate,
      time: matchObj.matchTime,
      status: matchObj.status,
      fieldName: `Campo ${matchObj.fieldId}`,
      isLive: matchObj.status === 'in_progress',
      isHighlighted: matchObj.isPlayoff
    };
  };

  const {
    id,
    homeTeamName,
    awayTeamName,
    homeTeamScore,
    awayTeamScore,
    date,
    time,
    status,
    fieldName,
    isLive,
    isHighlighted
  } = getMatchData();

  // Resto de tu componente existente...
  return (
    <div 
      className={`bg-white rounded-lg shadow-sm border border-gray-200 p-4 ${className} ${
        onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''
      } ${isHighlighted ? 'border-yellow-300 bg-yellow-50' : ''}`}
      onClick={onClick}
    >
      {/* Tu contenido existente */}
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center">
          <div className="w-2 h-2 rounded-full bg-gray-400 mr-2"></div>
          <span className="text-sm text-gray-600">
            {new Date(date).toLocaleDateString()} • {time}
          </span>
        </div>
        {isLive && (
          <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded-full animate-pulse">
            EN VIVO
          </span>
        )}
      </div>
      
      <div className="flex items-center justify-between">
        <div className="text-center flex-1">
          <div className="font-bold text-lg">{homeTeamName}</div>
          <div className="text-xs text-gray-500">Local</div>
        </div>
        
        <div className="mx-4 text-center">
          <div className="text-2xl font-bold">
            {homeTeamScore || 0} - {awayTeamScore || 0}
          </div>
          <div className="text-xs text-gray-500">VS</div>
        </div>
        
        <div className="text-center flex-1">
          <div className="font-bold text-lg">{awayTeamName}</div>
          <div className="text-xs text-gray-500">Visitante</div>
        </div>
      </div>
      
      <div className="mt-3 pt-3 border-t border-gray-100 text-center">
        <div className="text-sm text-gray-600">{fieldName}</div>
        <div className={`text-xs mt-1 px-2 py-1 rounded-full inline-block ${
          status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
          status === 'in_progress' ? 'bg-green-100 text-green-800' :
          status === 'completed' ? 'bg-gray-100 text-gray-800' :
          'bg-yellow-100 text-yellow-800'
        }`}>
          {status === 'scheduled' ? 'Programado' :
           status === 'in_progress' ? 'En vivo' :
           status === 'completed' ? 'Completado' : 'Pendiente'}
        </div>
      </div>
    </div>
  );
};

export default MatchCard;