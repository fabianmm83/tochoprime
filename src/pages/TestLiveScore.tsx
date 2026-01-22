import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import LiveScore from './LiveScore';
import { 
  PlayIcon, 
  ClockIcon, 
  ArrowLeftIcon,
  ShieldCheckIcon,
  TrophyIcon
} from '@heroicons/react/24/outline';

const TestLiveScore: React.FC = () => {
  const navigate = useNavigate();
  const [matchId, setMatchId] = useState('');
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  
  // Lista de partidos de ejemplo (deberías obtenerlos de tu Firebase)
  const exampleMatches = [
    { id: 'match1', name: 'Tiburones vs Águilas', date: '2026-01-25' },
    { id: 'match2', name: 'Leones vs Halcones', date: '2026-01-26' },
    { id: 'match3', name: 'Dragones vs Toros', date: '2026-01-27' },
  ];

  const handleTestMatch = (id: string) => {
    setMatchId(id);
  };

  const handleComplete = () => {
    alert('Partido completado! Los datos han sido guardados.');
    setMatchId('');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-blue-600 hover:text-blue-800 mb-4"
        >
          <ArrowLeftIcon className="w-5 h-5 mr-2" />
          Volver
        </button>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <ShieldCheckIcon className="w-8 h-8 text-amber-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Marcador en Vivo</h1>
              <p className="text-gray-600">Para árbitros - Registra partidos en tiempo real</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">Modo:</span>
            <button
              onClick={() => setIsOfflineMode(!isOfflineMode)}
              className={`px-3 py-1 text-sm rounded-full ${
                isOfflineMode 
                  ? 'bg-yellow-100 text-yellow-800 border border-yellow-300' 
                  : 'bg-green-100 text-green-800 border border-green-300'
              }`}
            >
              {isOfflineMode ? 'Offline' : 'Online'}
            </button>
          </div>
        </div>
      </div>

      {/* Instrucciones */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
        <h3 className="font-medium text-blue-900 mb-2">Instrucciones para árbitros</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• <strong>Iniciar partido:</strong> Presiona el botón verde para comenzar</li>
          <li>• <strong>Agregar eventos:</strong> Selecciona tipo de evento y equipo</li>
          <li>• <strong>Pausar:</strong> Botón amarillo para pausar el cronómetro</li>
          <li>• <strong>Finalizar:</strong> Botón rojo cuando termine el partido</li>
          <li>• <strong>Modo Offline:</strong> Disponible cuando no hay conexión a internet</li>
        </ul>
      </div>

      {/* Selección de partido */}
      {!matchId ? (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="font-medium text-gray-700 mb-4">Selecciona un partido para comenzar</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {exampleMatches.map((match) => (
              <button
                key={match.id}
                onClick={() => handleTestMatch(match.id)}
                className="p-4 border border-gray-200 rounded-xl hover:border-blue-300 hover:shadow-sm transition-all text-left"
              >
                <div className="flex items-center mb-2">
                  <TrophyIcon className="w-5 h-5 text-gray-400 mr-2" />
                  <span className="font-medium text-gray-900">{match.name}</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <ClockIcon className="w-4 h-4 mr-1" />
                  <span>{match.date}</span>
                </div>
                <div className="mt-3">
                  <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                    Seleccionar
                  </span>
                </div>
              </button>
            ))}
          </div>

          {/* Campo para ID manual */}
          <div className="border-t pt-6">
            <h4 className="font-medium text-gray-700 mb-3">O ingresa un ID de partido manualmente</h4>
            <div className="flex space-x-3">
              <input
                type="text"
                value={matchId}
                onChange={(e) => setMatchId(e.target.value)}
                placeholder="Ej: match_abc123"
                className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={() => {
                  if (matchId.trim()) {
                    handleTestMatch(matchId);
                  }
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Cargar
              </button>
            </div>
          </div>

          {/* Info offline */}
          {isOfflineMode && (
            <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center">
                <PlayIcon className="w-5 h-5 text-yellow-600 mr-2" />
                <span className="text-sm text-yellow-800">
                  Modo offline activado. Los datos se guardarán localmente y se sincronizarán al reconectar.
                </span>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Componente LiveScore */
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-700">
              Partido en curso: <span className="text-gray-900">{matchId}</span>
            </h3>
            <button
              onClick={() => setMatchId('')}
              className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cambiar partido
            </button>
          </div>
          
          <LiveScore 
            matchId={matchId}
            onComplete={handleComplete}
            isOffline={isOfflineMode}
          />
          
          {/* Botones de control adicionales */}
          <div className="mt-6 grid grid-cols-2 gap-4">
            <button
              onClick={handleComplete}
              className="px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
            >
              Finalizar Partido
            </button>
            <button
              onClick={() => setMatchId('')}
              className="px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-medium"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Información de eventos */}
      <div className="mt-8 bg-white rounded-xl shadow-sm p-4">
        <h3 className="font-medium text-gray-700 mb-3">Tipos de eventos para tochito</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { type: 'Touchdown', points: 6, color: 'bg-green-100 text-green-800' },
            { type: 'Punto Extra', points: 1, color: 'bg-blue-100 text-blue-800' },
            { type: 'Field Goal', points: 3, color: 'bg-purple-100 text-purple-800' },
            { type: 'Safety', points: 2, color: 'bg-red-100 text-red-800' },
            { type: 'Conversión 2pts', points: 2, color: 'bg-yellow-100 text-yellow-800' },
          ].map((event, index) => (
            <div key={index} className="text-center p-3 rounded-lg border border-gray-200">
              <div className="font-medium text-gray-900">{event.type}</div>
              <div className={`text-xs px-2 py-1 rounded-full mt-1 ${event.color}`}>
                {event.points} punto{event.points !== 1 ? 's' : ''}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TestLiveScore;