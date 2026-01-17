import React, { useState } from 'react';
import { MatchStats } from '../../types';
import { refereeService } from '../../services/refereeService';
import {
  Plus,
  Minus,
  Edit2,
  Save,
  X,
  BarChart2,
  Target,
  Trophy,
  Flag,
  AlertTriangle,
  Shield
} from 'lucide-react';

interface MatchStatsManagerProps {
  matchId: string;
  refereeId: string;
}

const MatchStatsManager: React.FC<MatchStatsManagerProps> = ({ matchId, refereeId }) => {
  const [stats, setStats] = useState<MatchStats>({
    matchId,
    refereeId,
    general: {
      touchdowns: [0, 0],           // [local, visitante] - TD vale 1 punto cada uno
      passingTouchdowns: [0, 0],    // Pases para TD
      interceptions: [0, 0],        // Intercepciones
      safeties: [0, 0],             // Safety - vale 1 punto
      totalPoints: [0, 0],          // Puntos totales (TDs + Safeties)
      penalties: [0, 0],            // Penales
      penaltyYards: [0, 0]          // Yardas de penal (aunque no se miden yardas de juego)
    },
    events: {
      touchdowns: [],
      interceptions: [],
      safeties: [],
      penalties: [],
      otherEvents: []
    },
    playerStats: [],
    metadata: {
      startTime: new Date().toISOString(),
      endTime: new Date().toISOString(),
      duration: 60,                 // 60 minutos de juego
      weatherConditions: 'bueno',
      fieldConditions: 'bueno',
      attendance: 0,
      notes: ''
    }
  });

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Actualizar estadísticas individuales
  const updateStat = (category: keyof MatchStats['general'], teamIndex: number, value: number) => {
    setStats(prev => {
      const newStats = { ...prev };
      const currentArray = newStats.general[category] as number[];
      const newArray = [...currentArray];
      newArray[teamIndex] = Math.max(0, value);
      
      // Actualizar puntos totales automáticamente
      if (category === 'touchdowns' || category === 'safeties') {
        const touchdowns = newStats.general.touchdowns as number[];
        const safeties = newStats.general.safeties as number[];
        
        // Cada TD vale 1 punto, cada Safety vale 1 punto
        const totalPoints = touchdowns.map((td, index) => td + safeties[index]);
        
        newStats.general = {
          ...newStats.general,
          [category]: newArray,
          totalPoints: totalPoints
        };
      } else {
        newStats.general = {
          ...newStats.general,
          [category]: newArray
        };
      }
      
      return newStats;
    });
  };

  // Guardar estadísticas
  const handleSave = async () => {
    setSaving(true);
    try {
      const result = await refereeService.uploadMatchStats(matchId, stats);
      if (result.success) {
        setEditing(false);
        alert('Estadísticas guardadas exitosamente');
      } else {
        alert(result.error || 'Error guardando estadísticas');
      }
    } catch (error) {
      console.error('Error guardando estadísticas:', error);
      alert('Error guardando estadísticas');
    } finally {
      setSaving(false);
    }
  };

  // Calcular porcentaje de pases TD
  const getPassingTDPercentage = (teamIndex: number) => {
    const passingTDs = stats.general.passingTouchdowns[teamIndex];
    const totalTDs = stats.general.touchdowns[teamIndex];
    
    if (totalTDs === 0) return 0;
    return Math.round((passingTDs / totalTDs) * 100);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">🏈 Estadísticas del Partido (Tocho)</h3>
        <div className="flex items-center space-x-2">
          {!editing ? (
            <button
              onClick={() => setEditing(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
            >
              <Edit2 className="w-4 h-4 mr-2" />
              Editar
            </button>
          ) : (
            <>
              <button
                onClick={() => setEditing(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center"
              >
                <X className="w-4 h-4 mr-2" />
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center disabled:opacity-50"
              >
                <Save className="w-4 h-4 mr-2" />
                {saving ? 'Guardando...' : 'Guardar'}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Estadísticas de anotación */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <h4 className="font-medium text-gray-900 mb-4 flex items-center">
          <Trophy className="w-5 h-5 mr-2" />
          Anotaciones
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Equipo Local */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h5 className="font-medium text-gray-700">Equipo Local</h5>
              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">Local</span>
            </div>
            
            <StatControl
              label="Touchdowns (1 punto)"
              value={stats.general.touchdowns[0]}
              onChange={(value) => updateStat('touchdowns', 0, value)}
              editing={editing}
            />
            
            <StatControl
              label="Pases para TD"
              value={stats.general.passingTouchdowns[0]}
              onChange={(value) => updateStat('passingTouchdowns', 0, value)}
              editing={editing}
              max={stats.general.touchdowns[0]}
            />
            
            <div className="text-sm text-gray-600">
              {stats.general.touchdowns[0] > 0 && (
                <span>
                  {getPassingTDPercentage(0)}% de TDs por pase
                </span>
              )}
            </div>
            
            <StatControl
              label="Safety (1 punto)"
              value={stats.general.safeties[0]}
              onChange={(value) => updateStat('safeties', 0, value)}
              editing={editing}
            />
            
            <div className="pt-2 border-t border-gray-200">
              <div className="flex items-center justify-between font-bold text-lg">
                <span className="text-gray-900">Puntos Totales:</span>
                <span className="text-green-600">{stats.general.totalPoints[0]} punto(s)</span>
              </div>
            </div>
          </div>

          {/* Equipo Visitante */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h5 className="font-medium text-gray-700">Equipo Visitante</h5>
              <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">Visitante</span>
            </div>
            
            <StatControl
              label="Touchdowns (1 punto)"
              value={stats.general.touchdowns[1]}
              onChange={(value) => updateStat('touchdowns', 1, value)}
              editing={editing}
            />
            
            <StatControl
              label="Pases para TD"
              value={stats.general.passingTouchdowns[1]}
              onChange={(value) => updateStat('passingTouchdowns', 1, value)}
              editing={editing}
              max={stats.general.touchdowns[1]}
            />
            
            <div className="text-sm text-gray-600">
              {stats.general.touchdowns[1] > 0 && (
                <span>
                  {getPassingTDPercentage(1)}% de TDs por pase
                </span>
              )}
            </div>
            
            <StatControl
              label="Safety (1 punto)"
              value={stats.general.safeties[1]}
              onChange={(value) => updateStat('safeties', 1, value)}
              editing={editing}
            />
            
            <div className="pt-2 border-t border-gray-200">
              <div className="flex items-center justify-between font-bold text-lg">
                <span className="text-gray-900">Puntos Totales:</span>
                <span className="text-green-600">{stats.general.totalPoints[1]} punto(s)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Estadísticas defensivas */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <h4 className="font-medium text-gray-900 mb-4 flex items-center">
          <Shield className="w-5 h-5 mr-2" />
          Estadísticas Defensivas
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h5 className="font-medium text-gray-700">Equipo Local</h5>
            
            <StatControl
              label="Intercepciones"
              value={stats.general.interceptions[0]}
              onChange={(value) => updateStat('interceptions', 0, value)}
              editing={editing}
            />
            
            <StatControl
              label="Penales Cometidos"
              value={stats.general.penalties[0]}
              onChange={(value) => updateStat('penalties', 0, value)}
              editing={editing}
            />
          </div>
          
          <div className="space-y-4">
            <h5 className="font-medium text-gray-700">Equipo Visitante</h5>
            
            <StatControl
              label="Intercepciones"
              value={stats.general.interceptions[1]}
              onChange={(value) => updateStat('interceptions', 1, value)}
              editing={editing}
            />
            
            <StatControl
              label="Penales Cometidos"
              value={stats.general.penalties[1]}
              onChange={(value) => updateStat('penalties', 1, value)}
              editing={editing}
            />
          </div>
        </div>
      </div>

      {/* Marcador Final */}
      <div className="bg-gradient-to-r from-blue-50 to-red-50 rounded-xl shadow-sm border border-gray-200 p-6">
        <h4 className="font-medium text-gray-900 mb-6 flex items-center justify-center">
          <Trophy className="w-6 h-6 mr-2" />
          MARCADOR FINAL
        </h4>
        
        <div className="flex justify-between items-center">
          <div className="text-center">
            <div className="text-4xl font-bold text-blue-600">
              {stats.general.totalPoints[0]}
            </div>
            <div className="text-sm text-gray-600 mt-1">Local</div>
            <div className="text-xs text-gray-500 mt-2">
              {stats.general.touchdowns[0]} TD + {stats.general.safeties[0]} Safety
            </div>
          </div>
          
          <div className="text-2xl font-bold text-gray-500">VS</div>
          
          <div className="text-center">
            <div className="text-4xl font-bold text-red-600">
              {stats.general.totalPoints[1]}
            </div>
            <div className="text-sm text-gray-600 mt-1">Visitante</div>
            <div className="text-xs text-gray-500 mt-2">
              {stats.general.touchdowns[1]} TD + {stats.general.safeties[1]} Safety
            </div>
          </div>
        </div>
        
        {/* Ganador */}
        {stats.general.totalPoints[0] !== stats.general.totalPoints[1] && (
          <div className="mt-6 text-center">
            <div className="inline-block px-4 py-2 bg-yellow-100 text-yellow-800 rounded-lg font-medium">
              {stats.general.totalPoints[0] > stats.general.totalPoints[1] 
                ? '🏆 Gana el Local' 
                : '🏆 Gana el Visitante'}
            </div>
          </div>
        )}
      </div>

      {/* Metadatos */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <h4 className="font-medium text-gray-900 mb-4 flex items-center">
          <BarChart2 className="w-5 h-5 mr-2" />
          Información del Partido
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Condiciones Climáticas
            </label>
            <select
              value={stats.metadata.weatherConditions}
              onChange={(e) => setStats(prev => ({
                ...prev,
                metadata: { ...prev.metadata, weatherConditions: e.target.value }
              }))}
              disabled={!editing}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg disabled:bg-gray-100"
            >
              <option value="bueno">Buenas condiciones</option>
              <option value="calor">Calor</option>
              <option value="lluvia">Lluvia</option>
              <option value="viento">Viento fuerte</option>
              <option value="noche">Juego nocturno</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Estado del Campo
            </label>
            <select
              value={stats.metadata.fieldConditions}
              onChange={(e) => setStats(prev => ({
                ...prev,
                metadata: { ...prev.metadata, fieldConditions: e.target.value }
              }))}
              disabled={!editing}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg disabled:bg-gray-100"
            >
              <option value="bueno">Bueno</option>
              <option value="regular">Regular</option>
              <option value="mojado">Mojado</option>
              <option value="duro">Duro</option>
              <option value="irregular">Irregular</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Asistencia
            </label>
            <input
              type="number"
              value={stats.metadata.attendance}
              onChange={(e) => setStats(prev => ({
                ...prev,
                metadata: { ...prev.metadata, attendance: parseInt(e.target.value) || 0 }
              }))}
              disabled={!editing}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg disabled:bg-gray-100"
              min="0"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Duración (minutos)
            </label>
            <input
              type="number"
              value={stats.metadata.duration}
              onChange={(e) => setStats(prev => ({
                ...prev,
                metadata: { ...prev.metadata, duration: parseInt(e.target.value) || 60 }
              }))}
              disabled={!editing}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg disabled:bg-gray-100"
              min="1"
              max="90"
            />
          </div>
          
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notas del Árbitro
            </label>
            <textarea
              value={stats.metadata.notes}
              onChange={(e) => setStats(prev => ({
                ...prev,
                metadata: { ...prev.metadata, notes: e.target.value }
              }))}
              disabled={!editing}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg disabled:bg-gray-100"
              rows={3}
              placeholder="Observaciones importantes, incidentes, jugadores destacados..."
            />
          </div>
        </div>
      </div>
    </div>
  );
};

// Componente auxiliar para controles de estadísticas
const StatControl: React.FC<{
  label: string;
  value: number;
  onChange: (value: number) => void;
  editing: boolean;
  min?: number;
  max?: number;
  suffix?: string;
}> = ({ label, value, onChange, editing, min = 0, max = 100, suffix = '' }) => {
  return (
    <div className="flex items-center justify-between">
      <span className="text-gray-700">{label}</span>
      <div className="flex items-center space-x-3">
        {editing ? (
          <>
            <button
              onClick={() => onChange(Math.max(min, value - 1))}
              className="p-1 bg-gray-200 rounded-full hover:bg-gray-300"
              disabled={value <= min}
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="font-bold min-w-[40px] text-center">
              {value}{suffix}
            </span>
            <button
              onClick={() => onChange(Math.min(max, value + 1))}
              className="p-1 bg-gray-200 rounded-full hover:bg-gray-300"
              disabled={value >= max}
            >
              <Plus className="w-4 h-4" />
            </button>
          </>
        ) : (
          <span className="font-bold">
            {value}{suffix}
          </span>
        )}
      </div>
    </div>
  );
};

export default MatchStatsManager;