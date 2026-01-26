// src/pages/matches/MatchResultPage.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { matchesService, teamsService } from '../../services/firestore';
import { Match, Team } from '../../types';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Notification from '../../components/common/Notification';

const MatchResultPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Estados
  const [match, setMatch] = useState<Match | null>(null);
  const [homeTeam, setHomeTeam] = useState<Team | null>(null);
  const [awayTeam, setAwayTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);
  
  // Resultados específicos de tochito
  const [resultData, setResultData] = useState({
    homeScore: 0,
    awayScore: 0,
    winner: '' as '' | 'home' | 'away' | 'draw',
    
    // Estadísticas específicas de tochito
    touchdowns: {
      home: 0,
      away: 0
    },
    extraPoints: {
      home: {
        onePoint: 0,
        twoPoints: 0
      },
      away: {
        onePoint: 0,
        twoPoints: 0
      }
    },
    fieldGoals: {
      home: 0,
      away: 0
    },
    safeties: {
      home: 0,
      away: 0
    },
    
    // Estadísticas defensivas
    interceptions: {
      home: 0,
      away: 0
    },
    fumblesRecovered: {
      home: 0,
      away: 0
    },
    sacks: {
      home: 0,
      away: 0
    },
    
    // Penales
    penalties: {
      home: {
        count: 0,
        yards: 0
      },
      away: {
        count: 0,
        yards: 0
      }
    },
    
    // Notas
    notes: ''
  });
  
  // Handlers específicos para cada tipo de dato
  const handleTouchdownChange = (team: 'home' | 'away', value: number) => {
    setResultData(prev => ({
      ...prev,
      touchdowns: { ...prev.touchdowns, [team]: value }
    }));
  };
  
  const handleExtraPointChange = (team: 'home' | 'away', type: 'onePoint' | 'twoPoints', value: number) => {
    setResultData(prev => ({
      ...prev,
      extraPoints: {
        ...prev.extraPoints,
        [team]: { ...prev.extraPoints[team], [type]: value }
      }
    }));
  };
  
  const handleFieldGoalChange = (team: 'home' | 'away', value: number) => {
    setResultData(prev => ({
      ...prev,
      fieldGoals: { ...prev.fieldGoals, [team]: value }
    }));
  };
  
  const handleSafetyChange = (team: 'home' | 'away', value: number) => {
    setResultData(prev => ({
      ...prev,
      safeties: { ...prev.safeties, [team]: value }
    }));
  };
  
  const handleInterceptionChange = (team: 'home' | 'away', value: number) => {
    setResultData(prev => ({
      ...prev,
      interceptions: { ...prev.interceptions, [team]: value }
    }));
  };
  
  const handleFumbleChange = (team: 'home' | 'away', value: number) => {
    setResultData(prev => ({
      ...prev,
      fumblesRecovered: { ...prev.fumblesRecovered, [team]: value }
    }));
  };
  
  const handleSackChange = (team: 'home' | 'away', value: number) => {
    setResultData(prev => ({
      ...prev,
      sacks: { ...prev.sacks, [team]: value }
    }));
  };
  
  const handlePenaltyChange = (team: 'home' | 'away', field: 'count' | 'yards', value: number) => {
    setResultData(prev => ({
      ...prev,
      penalties: {
        ...prev.penalties,
        [team]: { ...prev.penalties[team], [field]: value }
      }
    }));
  };
  
  // Calcular puntuación automática
  const calculateScore = () => {
    const homeScore = 
      (resultData.touchdowns.home * 6) +
      (resultData.extraPoints.home.onePoint * 1) +
      (resultData.extraPoints.home.twoPoints * 2) +
      (resultData.fieldGoals.home * 3) +
      (resultData.safeties.home * 2);
    
    const awayScore = 
      (resultData.touchdowns.away * 6) +
      (resultData.extraPoints.away.onePoint * 1) +
      (resultData.extraPoints.away.twoPoints * 2) +
      (resultData.fieldGoals.away * 3) +
      (resultData.safeties.away * 2);
    
    return { homeScore, awayScore };
  };
  
  // Cargar datos
  useEffect(() => {
    if (id) {
      loadMatch(id);
    } else {
      navigate('/partidos');
    }
  }, [id, navigate]);
  
  const loadMatch = async (matchId: string) => {
    try {
      setLoading(true);
      const matchData = await matchesService.getMatchById(matchId);
      
      if (!matchData) {
        setNotification({
          type: 'error',
          message: 'Partido no encontrado'
        });
        setTimeout(() => navigate('/partidos'), 2000);
        return;
      }
      
      if (matchData.status === 'completed') {
        setNotification({
          type: 'error',
          message: 'Este partido ya tiene resultado registrado'
        });
        setTimeout(() => navigate(`/partidos/${matchId}`), 2000);
        return;
      }
      
      if (matchData.status !== 'scheduled' && matchData.status !== 'in_progress') {
        setNotification({
          type: 'error',
          message: 'Solo se pueden registrar resultados en partidos programados o en curso'
        });
        setTimeout(() => navigate(`/partidos/${matchId}`), 2000);
        return;
      }
      
      setMatch(matchData);
      
      // Cargar equipos
      const home = await teamsService.getTeamById(matchData.homeTeamId);
      const away = await teamsService.getTeamById(matchData.awayTeamId);
      setHomeTeam(home);
      setAwayTeam(away);
      
    } catch (error) {
      console.error('Error loading match:', error);
      setNotification({
        type: 'error',
        message: 'Error al cargar el partido'
      });
      navigate('/partidos');
    } finally {
      setLoading(false);
    }
  };
  
  const handleWinnerChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setResultData(prev => ({ ...prev, winner: e.target.value as any }));
  };
  
  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setResultData(prev => ({ ...prev, notes: e.target.value }));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!match || !id) return;
    
    try {
      setSaving(true);
      
      // Calcular puntuación final
      const scores = calculateScore();
      
      // Determinar ganador
      let winner: 'home' | 'away' | 'draw' | undefined;
      if (scores.homeScore > scores.awayScore) {
        winner = 'home';
      } else if (scores.awayScore > scores.homeScore) {
        winner = 'away';
      } else {
        winner = 'draw';
      }
      
      // Preparar datos del resultado
      const updateData: any = {
        homeScore: scores.homeScore,
        awayScore: scores.awayScore,
        winner,
        status: 'completed',
        notes: resultData.notes || `Resultado registrado por ${user?.email}`,
        resultDetails: {
          touchdownCount: resultData.touchdowns,
          extraPoints: resultData.extraPoints,
          fieldGoals: resultData.fieldGoals,
          safeties: resultData.safeties,
          interceptions: resultData.interceptions,
          fumblesRecovered: resultData.fumblesRecovered,
          sacks: resultData.sacks,
          penalties: resultData.penalties,
          totalScore: {
            home: scores.homeScore,
            away: scores.awayScore
          }
        },
        updatedAt: new Date(),
        updatedBy: user?.uid || ''
      };
      
      // Actualizar partido
      await matchesService.updateMatch(id, updateData);
      
      setNotification({
        type: 'success',
        message: 'Resultado registrado exitosamente'
      });
      
      // Redirigir después de 2 segundos
      setTimeout(() => {
        navigate(`/partidos/${id}`);
      }, 2000);
      
    } catch (error) {
      console.error('Error saving result:', error);
      setNotification({
        type: 'error',
        message: 'Error al registrar el resultado'
      });
    } finally {
      setSaving(false);
    }
  };
  
  if (loading) return <LoadingSpinner />;
  
  if (!match || !homeTeam || !awayTeam) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <div className="text-6xl mb-4">⚠️</div>
          <h3 className="text-xl font-medium text-gray-900 mb-2">Partido no encontrado</h3>
          <p className="text-gray-600 mb-6">El partido que buscas no existe o no tienes permiso para verlo.</p>
          <button
            onClick={() => navigate('/partidos')}
            className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Volver a Partidos
          </button>
        </div>
      </div>
    );
  }
  
  const scores = calculateScore();
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Registrar Resultado</h1>
            <p className="text-gray-600">
              {homeTeam.name} vs {awayTeam.name} - Jornada {match.round}
            </p>
          </div>
          
          <button
            onClick={() => navigate(`/partidos/${id}`)}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 flex items-center space-x-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span>Volver al Partido</span>
          </button>
        </div>
      </div>
      
      {/* Notificación */}
      {notification && (
        <Notification
          type={notification.type}
          message={notification.message}
          onClose={() => setNotification(null)}
        />
      )}
      
      {/* Resumen del partido */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{homeTeam.name}</div>
              <div className="text-sm text-gray-600">Local</div>
            </div>
            <div className="text-3xl font-bold text-gray-500">VS</div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{awayTeam.name}</div>
              <div className="text-sm text-gray-600">Visitante</div>
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-sm text-gray-600">Puntuación Final</div>
            <div className="text-2xl font-bold">
              {scores.homeScore} - {scores.awayScore}
            </div>
          </div>
        </div>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Puntuación de Tochito</h2>
          
          {/* Touchdowns */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Touchdowns (6 puntos cada uno)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <label className="block text-sm font-medium text-blue-700 mb-2">
                  {homeTeam.name}
                </label>
                <input
                  type="number"
                  value={resultData.touchdowns.home}
                  onChange={(e) => handleTouchdownChange('home', parseInt(e.target.value) || 0)}
                  min="0"
                  className="w-full px-3 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                />
                <div className="mt-2 text-sm text-blue-600">
                  {resultData.touchdowns.home} TD × 6 = {resultData.touchdowns.home * 6} pts
                </div>
              </div>
              
              <div className="bg-red-50 p-4 rounded-lg">
                <label className="block text-sm font-medium text-red-700 mb-2">
                  {awayTeam.name}
                </label>
                <input
                  type="number"
                  value={resultData.touchdowns.away}
                  onChange={(e) => handleTouchdownChange('away', parseInt(e.target.value) || 0)}
                  min="0"
                  className="w-full px-3 py-2 border border-red-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
                />
                <div className="mt-2 text-sm text-red-600">
                  {resultData.touchdowns.away} TD × 6 = {resultData.touchdowns.away * 6} pts
                </div>
              </div>
            </div>
          </div>
          
          {/* Puntos Extra */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Puntos Extra</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Local */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-800 mb-3">{homeTeam.name}</h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm text-blue-700 mb-1">Conversión de 1 punto</label>
                    <input
                      type="number"
                      value={resultData.extraPoints.home.onePoint}
                      onChange={(e) => handleExtraPointChange('home', 'onePoint', parseInt(e.target.value) || 0)}
                      min="0"
                      className="w-full px-3 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-blue-700 mb-1">Conversión de 2 puntos</label>
                    <input
                      type="number"
                      value={resultData.extraPoints.home.twoPoints}
                      onChange={(e) => handleExtraPointChange('home', 'twoPoints', parseInt(e.target.value) || 0)}
                      min="0"
                      className="w-full px-3 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    />
                  </div>
                </div>
              </div>
              
              {/* Visitante */}
              <div className="bg-red-50 p-4 rounded-lg">
                <h4 className="font-medium text-red-800 mb-3">{awayTeam.name}</h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm text-red-700 mb-1">Conversión de 1 punto</label>
                    <input
                      type="number"
                      value={resultData.extraPoints.away.onePoint}
                      onChange={(e) => handleExtraPointChange('away', 'onePoint', parseInt(e.target.value) || 0)}
                      min="0"
                      className="w-full px-3 py-2 border border-red-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-red-700 mb-1">Conversión de 2 puntos</label>
                    <input
                      type="number"
                      value={resultData.extraPoints.away.twoPoints}
                      onChange={(e) => handleExtraPointChange('away', 'twoPoints', parseInt(e.target.value) || 0)}
                      min="0"
                      className="w-full px-3 py-2 border border-red-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Field Goals y Safeties */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Field Goals */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Field Goals (3 puntos)</h3>
              <div className="space-y-4">
                <div className="bg-green-50 p-4 rounded-lg">
                  <label className="block text-sm font-medium text-green-700 mb-2">
                    {homeTeam.name}
                  </label>
                  <input
                    type="number"
                    value={resultData.fieldGoals.home}
                    onChange={(e) => handleFieldGoalChange('home', parseInt(e.target.value) || 0)}
                    min="0"
                    className="w-full px-3 py-2 border border-green-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
                  />
                </div>
                
                <div className="bg-green-50 p-4 rounded-lg">
                  <label className="block text-sm font-medium text-green-700 mb-2">
                    {awayTeam.name}
                  </label>
                  <input
                    type="number"
                    value={resultData.fieldGoals.away}
                    onChange={(e) => handleFieldGoalChange('away', parseInt(e.target.value) || 0)}
                    min="0"
                    className="w-full px-3 py-2 border border-green-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
                  />
                </div>
              </div>
            </div>
            
            {/* Safeties */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Safeties (2 puntos)</h3>
              <div className="space-y-4">
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <label className="block text-sm font-medium text-yellow-700 mb-2">
                    {homeTeam.name}
                  </label>
                  <input
                    type="number"
                    value={resultData.safeties.home}
                    onChange={(e) => handleSafetyChange('home', parseInt(e.target.value) || 0)}
                    min="0"
                    className="w-full px-3 py-2 border border-yellow-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 bg-white"
                  />
                </div>
                
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <label className="block text-sm font-medium text-yellow-700 mb-2">
                    {awayTeam.name}
                  </label>
                  <input
                    type="number"
                    value={resultData.safeties.away}
                    onChange={(e) => handleSafetyChange('away', parseInt(e.target.value) || 0)}
                    min="0"
                    className="w-full px-3 py-2 border border-yellow-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 bg-white"
                  />
                </div>
              </div>
            </div>
          </div>
          
          {/* Estadísticas defensivas */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Estadísticas Defensivas</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Intercepciones */}
              <div className="bg-purple-50 p-4 rounded-lg">
                <h4 className="font-medium text-purple-800 mb-3">Intercepciones</h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm text-purple-700 mb-1">{homeTeam.name}</label>
                    <input
                      type="number"
                      value={resultData.interceptions.home}
                      onChange={(e) => handleInterceptionChange('home', parseInt(e.target.value) || 0)}
                      min="0"
                      className="w-full px-3 py-2 border border-purple-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-purple-700 mb-1">{awayTeam.name}</label>
                    <input
                      type="number"
                      value={resultData.interceptions.away}
                      onChange={(e) => handleInterceptionChange('away', parseInt(e.target.value) || 0)}
                      min="0"
                      className="w-full px-3 py-2 border border-purple-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                    />
                  </div>
                </div>
              </div>
              
              {/* Fumbles recuperados */}
              <div className="bg-indigo-50 p-4 rounded-lg">
                <h4 className="font-medium text-indigo-800 mb-3">Fumbles Recuperados</h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm text-indigo-700 mb-1">{homeTeam.name}</label>
                    <input
                      type="number"
                      value={resultData.fumblesRecovered.home}
                      onChange={(e) => handleFumbleChange('home', parseInt(e.target.value) || 0)}
                      min="0"
                      className="w-full px-3 py-2 border border-indigo-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-indigo-700 mb-1">{awayTeam.name}</label>
                    <input
                      type="number"
                      value={resultData.fumblesRecovered.away}
                      onChange={(e) => handleFumbleChange('away', parseInt(e.target.value) || 0)}
                      min="0"
                      className="w-full px-3 py-2 border border-indigo-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                    />
                  </div>
                </div>
              </div>
              
              {/* Sacks */}
              <div className="bg-pink-50 p-4 rounded-lg">
                <h4 className="font-medium text-pink-800 mb-3">Sacks</h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm text-pink-700 mb-1">{homeTeam.name}</label>
                    <input
                      type="number"
                      value={resultData.sacks.home}
                      onChange={(e) => handleSackChange('home', parseInt(e.target.value) || 0)}
                      min="0"
                      className="w-full px-3 py-2 border border-pink-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-pink-700 mb-1">{awayTeam.name}</label>
                    <input
                      type="number"
                      value={resultData.sacks.away}
                      onChange={(e) => handleSackChange('away', parseInt(e.target.value) || 0)}
                      min="0"
                      className="w-full px-3 py-2 border border-pink-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 bg-white"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Penales */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Penales</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Local */}
              <div className="bg-orange-50 p-4 rounded-lg">
                <h4 className="font-medium text-orange-800 mb-3">{homeTeam.name}</h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm text-orange-700 mb-1">Cantidad de penales</label>
                    <input
                      type="number"
                      value={resultData.penalties.home.count}
                      onChange={(e) => handlePenaltyChange('home', 'count', parseInt(e.target.value) || 0)}
                      min="0"
                      className="w-full px-3 py-2 border border-orange-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-orange-700 mb-1">Yardas de penalización</label>
                    <input
                      type="number"
                      value={resultData.penalties.home.yards}
                      onChange={(e) => handlePenaltyChange('home', 'yards', parseInt(e.target.value) || 0)}
                      min="0"
                      className="w-full px-3 py-2 border border-orange-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
                    />
                  </div>
                </div>
              </div>
              
              {/* Visitante */}
              <div className="bg-orange-50 p-4 rounded-lg">
                <h4 className="font-medium text-orange-800 mb-3">{awayTeam.name}</h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm text-orange-700 mb-1">Cantidad de penales</label>
                    <input
                      type="number"
                      value={resultData.penalties.away.count}
                      onChange={(e) => handlePenaltyChange('away', 'count', parseInt(e.target.value) || 0)}
                      min="0"
                      className="w-full px-3 py-2 border border-orange-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-orange-700 mb-1">Yardas de penalización</label>
                    <input
                      type="number"
                      value={resultData.penalties.away.yards}
                      onChange={(e) => handlePenaltyChange('away', 'yards', parseInt(e.target.value) || 0)}
                      min="0"
                      className="w-full px-3 py-2 border border-orange-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Ganador */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ganador
            </label>
            <select
              name="winner"
              value={resultData.winner}
              onChange={handleWinnerChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Seleccionar ganador</option>
              <option value="home">{homeTeam.name} (Local)</option>
              <option value="away">{awayTeam.name} (Visitante)</option>
              <option value="draw">Empate</option>
            </select>
          </div>
          
          {/* Notas */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notas Adicionales
            </label>
            <textarea
              name="notes"
              value={resultData.notes}
              onChange={handleNotesChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Observaciones, comentarios, etc..."
            />
          </div>
        </div>
        
        {/* Resumen Final */}
        <div className="bg-gray-50 p-6 rounded-lg mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Resumen Final</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-600 mb-2">{scores.homeScore}</div>
              <div className="text-lg font-medium text-gray-900">{homeTeam.name}</div>
              <div className="text-sm text-gray-600 mt-2">Puntos totales</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-red-600 mb-2">{scores.awayScore}</div>
              <div className="text-lg font-medium text-gray-900">{awayTeam.name}</div>
              <div className="text-sm text-gray-600 mt-2">Puntos totales</div>
            </div>
          </div>
          
          <div className="mt-6 text-center">
            {scores.homeScore > scores.awayScore ? (
              <div className="inline-block px-6 py-3 bg-green-100 text-green-800 rounded-lg font-medium text-lg">
                Ganador: {homeTeam.name}
              </div>
            ) : scores.awayScore > scores.homeScore ? (
              <div className="inline-block px-6 py-3 bg-green-100 text-green-800 rounded-lg font-medium text-lg">
                Ganador: {awayTeam.name}
              </div>
            ) : (
              <div className="inline-block px-6 py-3 bg-yellow-100 text-yellow-800 rounded-lg font-medium text-lg">
                Empate
              </div>
            )}
          </div>
        </div>
        
        {/* Botones */}
        <div className="flex space-x-3">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {saving ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Registrando...</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Registrar Resultado</span>
              </>
            )}
          </button>
          
          <button
            type="button"
            onClick={() => navigate(`/partidos/${id}`)}
            className="px-6 py-3 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 flex items-center space-x-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
            <span>Cancelar</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default MatchResultPage;