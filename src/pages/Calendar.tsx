import React, { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import { Link, useNavigate } from 'react-router-dom';
import { 
  calendarService, 
  matchService, 
  seasonService,
  teamService 
} from '../services/firestore';
import { CalendarEvent, Match, Season, Team } from '../types';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Notification from '../components/common/Notification';

// Extender tipos de FullCalendar
interface CalendarEventExtended {
  id: string;
  title: string;
  start: string | Date;
  end: string | Date;
  allDay: boolean;
  backgroundColor: string;
  borderColor: string;
  textColor: string;
  extendedProps: {
    type: CalendarEvent['type'];
    matchId?: string;
    teamId?: string;
    fieldId?: string;
    refereeId?: string;
    description?: string;
  };
}

const Calendar: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Estados
  const [events, setEvents] = useState<CalendarEventExtended[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSeason, setSelectedSeason] = useState<string>('');
  const [viewType, setViewType] = useState<'dayGridMonth' | 'timeGridWeek' | 'timeGridDay' | 'listWeek'>('dayGridMonth');
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);

  // Cargar datos iniciales
  useEffect(() => {
    loadData();
  }, []);

  // Cargar datos cuando cambia la temporada
  useEffect(() => {
    if (selectedSeason) {
      loadEvents();
      loadMatches();
    }
  }, [selectedSeason]);

  const loadData = async () => {
    try {
      setLoading(true);
      const seasonsData = await seasonService.getSeasons();
      setSeasons(seasonsData);
      
      if (seasonsData.length > 0) {
        setSelectedSeason(seasonsData[0].id);
      }
      
      const teamsData = await teamService.getAllTeams();
      setTeams(teamsData);
    } catch (error) {
      console.error('Error loading data:', error);
      setNotification({
        type: 'error',
        message: 'Error al cargar los datos'
      });
    } finally {
      setLoading(false);
    }
  };

  const loadEvents = async () => {
    try {
      const startDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
      const endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 2, 0);
      
      const eventsData = await calendarService.getCalendarEvents(startDate, endDate);
      
      const formattedEvents: CalendarEventExtended[] = eventsData.map(event => ({
        id: event.id,
        title: event.title,
        start: new Date(event.startDate),
        end: new Date(event.endDate),
        allDay: event.allDay,
        backgroundColor: event.color,
        borderColor: event.color,
        textColor: event.textColor,
        extendedProps: {
          type: event.type,
          matchId: event.matchId,
          teamId: event.teamId,
          fieldId: event.fieldId,
          refereeId: event.refereeId,
          description: event.description
        }
      }));
      
      setEvents(formattedEvents);
    } catch (error) {
      console.error('Error loading events:', error);
    }
  };

  const loadMatches = async () => {
    try {
      const matchesData = await matchService.getMatches(selectedSeason);
      setMatches(matchesData);
    } catch (error) {
      console.error('Error loading matches:', error);
    }
  };

  // Convertir partidos a eventos
  const convertMatchesToEvents = async () => {
    try {
      await calendarService.convertMatchesToCalendarEvents(matches);
      
      setNotification({
        type: 'success',
        message: 'Partidos convertidos a eventos del calendario'
      });
      
      loadEvents();
    } catch (error) {
      console.error('Error converting matches:', error);
      setNotification({
        type: 'error',
        message: 'Error al convertir partidos'
      });
    }
  };

  // Manejar clic en evento
  const handleEventClick = (clickInfo: any) => {
    const event = clickInfo.event;
    const extendedProps = event.extendedProps;
    
    if (extendedProps.matchId) {
      navigate(`/matches/${extendedProps.matchId}`);
    } else if (extendedProps.teamId) {
      navigate(`/teams/${extendedProps.teamId}`);
    }
  };

  // Manejar clic en fecha
  const handleDateClick = (clickInfo: any) => {
    const dateStr = clickInfo.dateStr;
    setNotification({
      type: 'info',
      message: `Fecha seleccionada: ${dateStr}`
    });
  };

  // Manejar cambio de vista
  const handleViewChange = (view: any) => {
    setViewType(view.view.type);
  };

  // Manejar cambio de fecha
  const handleDatesSet = (dateInfo: any) => {
    setCurrentDate(dateInfo.start);
  };

  // Obtener nombre del equipo
  const getTeamName = (teamId?: string) => {
    if (!teamId) return '';
    const team = teams.find(t => t.id === teamId);
    return team ? team.name : '';
  };

  // Configuración de FullCalendar
  // Configuración de FullCalendar
const calendarOptions = {
  plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin],
  initialView: viewType,
  locale: 'es',
  headerToolbar: {
    left: 'prev,next today',
    center: 'title',
    right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek'
  },
  events: events,
  eventClick: handleEventClick,
  dateClick: handleDateClick,
  datesSet: handleDatesSet,
  viewDidMount: handleViewChange,
  height: 'auto',
  eventTimeFormat: {
    hour: '2-digit' as const,  // Cambiado de string a tipo literal
    minute: '2-digit' as const, // Cambiado de string a tipo literal
    meridiem: false
  },
  buttonText: {
    today: 'Hoy',
    month: 'Mes',
    week: 'Semana',
    day: 'Día',
    list: 'Lista'
  }
};

  if (loading) return <LoadingSpinner />;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Calendario</h1>
        <p className="text-gray-600">Visualización de partidos y eventos de la liga</p>
      </div>
      
      {/* Notificación */}
      {notification && (
        <Notification
          type={notification.type}
          message={notification.message}
          onClose={() => setNotification(null)}
        />
      )}
      
      {/* Controles */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Selector de temporada */}
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Temporada
            </label>
            <select
              value={selectedSeason}
              onChange={(e) => setSelectedSeason(e.target.value)}
              className="w-full md:w-auto px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Seleccionar temporada</option>
              {seasons.map(season => (
                <option key={season.id} value={season.id}>
                  {season.name}
                </option>
              ))}
            </select>
          </div>
          
          {/* Botones de acción */}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => navigate('/matches')}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Gestionar Partidos
            </button>
            
            <button
              onClick={convertMatchesToEvents}
              disabled={matches.length === 0}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Sincronizar Partidos
            </button>
            
            <button
              onClick={() => navigate('/referees')}
              className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
            >
              Ver Árbitros
            </button>
          </div>
        </div>
        
        {/* Leyenda */}
        <div className="mt-6">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Leyenda</h3>
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center">
              <div className="w-4 h-4 bg-blue-500 rounded mr-2"></div>
              <span className="text-sm text-gray-600">Partidos</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-green-500 rounded mr-2"></div>
              <span className="text-sm text-gray-600">Entrenamientos</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-purple-500 rounded mr-2"></div>
              <span className="text-sm text-gray-600">Eventos</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-yellow-500 rounded mr-2"></div>
              <span className="text-sm text-gray-600">Reuniones</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Calendario */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <FullCalendar {...calendarOptions} />
      </div>
      
      {/* Lista de próximos eventos */}
      <div className="mt-8 bg-white rounded-lg shadow-md overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 px-6 py-4">
          <h2 className="text-xl font-bold text-white">Próximos Eventos</h2>
        </div>
        
        <div className="p-6">
          {events.length > 0 ? (
            <div className="space-y-4">
              {events
                .filter(event => new Date(event.start) >= new Date())
                .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
                .slice(0, 5)
                .map(event => (
                  <div
                    key={event.id}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex items-center space-x-4">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: event.backgroundColor }}
                      />
                      <div>
                        <div className="font-medium text-gray-900">{event.title}</div>
                        <div className="text-sm text-gray-600">
                          {new Date(event.start).toLocaleDateString('es-ES', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {event.extendedProps.teamId && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded">
                          {getTeamName(event.extendedProps.teamId)}
                        </span>
                      )}
                      
                      <span className={`px-2 py-1 text-xs font-medium rounded ${
                        event.extendedProps.type === 'match' ? 'bg-blue-100 text-blue-800' :
                        event.extendedProps.type === 'training' ? 'bg-green-100 text-green-800' :
                        event.extendedProps.type === 'event' ? 'bg-purple-100 text-purple-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {event.extendedProps.type === 'match' ? 'Partido' :
                         event.extendedProps.type === 'training' ? 'Entrenamiento' :
                         event.extendedProps.type === 'event' ? 'Evento' : 'Reunión'}
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="mx-auto w-16 h-16 text-gray-400 mb-4">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No hay eventos programados</h3>
              <p className="text-gray-600 mb-4">
                {selectedSeason 
                  ? 'No hay eventos para esta temporada. Puedes sincronizar partidos o crear eventos manualmente.'
                  : 'Selecciona una temporada para ver los eventos.'
                }
              </p>
              <div className="flex justify-center space-x-3">
                <button
                  onClick={convertMatchesToEvents}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Sincronizar Partidos
                </button>
                <button
                  onClick={() => navigate('/matches')}
                  className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                >
                  Ver Partidos
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Calendar;