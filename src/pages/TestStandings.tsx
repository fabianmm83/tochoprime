import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import StandingsTable from './StandingsTable';
import { 
  TrophyIcon, 
  ArrowLeftIcon, 
  CalendarIcon,
  TagIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';

const TestStandings: React.FC = () => {
  const navigate = useNavigate();
  const [selectedSeason, setSelectedSeason] = useState<string>('');
  const [selectedDivision, setSelectedDivision] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  // Datos de prueba (reemplaza con datos reales de tu Firebase)
  const seasons = [
    { id: 'season1', name: 'Primavera 2026' },
    { id: 'season2', name: 'Otoño 2026' },
  ];

  const divisions = [
    { id: 'varonil', name: 'Varonil' },
    { id: 'femenil', name: 'Femenil' },
    { id: 'mixto', name: 'Mixto' },
  ];

  const categories = [
    { id: 'A', name: 'Categoría A' },
    { id: 'B', name: 'Categoría B' },
    { id: 'C', name: 'Categoría C' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      {/* Header con navegación */}
      <div className="mb-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-blue-600 hover:text-blue-800 mb-4"
        >
          <ArrowLeftIcon className="w-5 h-5 mr-2" />
          Volver
        </button>
        
        <div className="flex items-center space-x-3">
          <TrophyIcon className="w-8 h-8 text-yellow-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Tablas de Posiciones</h1>
            <p className="text-gray-600">Consulta las estadísticas y posiciones de los equipos</p>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
        <h3 className="font-medium text-gray-700 mb-4">Filtrar Tabla</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Temporada */}
          <div>
            <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
              <CalendarIcon className="w-4 h-4 mr-2" />
              Temporada
            </label>
            <select
              value={selectedSeason}
              onChange={(e) => setSelectedSeason(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Seleccionar temporada</option>
              {seasons.map(season => (
                <option key={season.id} value={season.id}>{season.name}</option>
              ))}
            </select>
          </div>

          {/* División */}
          <div>
            <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
              <UserGroupIcon className="w-4 h-4 mr-2" />
              División
            </label>
            <select
              value={selectedDivision}
              onChange={(e) => setSelectedDivision(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              disabled={!selectedSeason}
            >
              <option value="">Todas las divisiones</option>
              {divisions.map(division => (
                <option key={division.id} value={division.id}>{division.name}</option>
              ))}
            </select>
          </div>

          {/* Categoría */}
          <div>
            <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
              <TagIcon className="w-4 h-4 mr-2" />
              Categoría
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              disabled={!selectedDivision}
            >
              <option value="">Todas las categorías</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>{category.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          <button
            onClick={() => {
              setSelectedSeason('');
              setSelectedDivision('');
              setSelectedCategory('');
            }}
            className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Limpiar filtros
          </button>
        </div>
      </div>

      {/* Tabla de posiciones */}
      {selectedSeason ? (
        <div className="mb-6">
          <StandingsTable 
            seasonId={selectedSeason}
            divisionId={selectedDivision || undefined}
            categoryId={selectedCategory || undefined}
          />
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm p-8 text-center">
          <TrophyIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-700 mb-2">
            Selecciona una temporada
          </h3>
          <p className="text-gray-500">
            Para ver las tablas de posiciones, primero selecciona una temporada
          </p>
        </div>
      )}

      {/* Información adicional */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-4">
        <h3 className="font-medium text-blue-900 mb-2">Cómo funciona la tabla de posiciones</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• <strong>Puntos:</strong> Victoria = 3 pts, Empate = 1 pt, Derrota = 0 pts</li>
          <li>• <strong>Desempate:</strong> 1) Puntos, 2) Diferencia de goles, 3) Goles a favor</li>
          <li>• <strong>Forma:</strong> Muestra los resultados de los últimos 5 partidos (V=Victoria, E=Empate, D=Derrota)</li>
          <li>• <strong>Racha:</strong> Indica partidos consecutivos ganados o perdidos</li>
        </ul>
      </div>

      {/* Consejos de uso */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <div className="text-green-600 font-bold text-lg mb-1">Verde</div>
          <p className="text-sm text-gray-600">Equipos en posiciones de playoffs</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <div className="text-red-600 font-bold text-lg mb-1">Rojo</div>
          <p className="text-sm text-gray-600">Equipos en zona de descenso</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <div className="text-yellow-600 font-bold text-lg mb-1">Amarillo</div>
          <p className="text-sm text-gray-600">Primer lugar de la división</p>
        </div>
      </div>
    </div>
  );
};

export default TestStandings;