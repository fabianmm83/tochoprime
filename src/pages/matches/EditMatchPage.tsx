// src/pages/matches/EditMatchPage.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { matchesService } from '../../services/firestore';
import CreateMatchPage from './CreateMatchPage';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Notification from '../../components/common/Notification';

const EditMatchPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [matchData, setMatchData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
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
      const match = await matchesService.getMatchById(matchId);
      
      if (!match) {
        setError('Partido no encontrado');
        return;
      }
      
      setMatchData(match);
    } catch (error) {
      console.error('Error loading match:', error);
      setError('Error al cargar el partido');
    } finally {
      setLoading(false);
    }
  };
  
  if (loading) {
    return <LoadingSpinner />;
  }
  
  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Notification
          type="error"
          message={error}
          onClose={() => navigate('/partidos')}
        />
        <div className="text-center py-12">
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
  
  return <CreateMatchPage initialData={matchData} mode="edit" />;
};

export default EditMatchPage;