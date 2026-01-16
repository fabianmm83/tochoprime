// Tipos principales para el sistema jerárquico

export interface User {
  id: string;
  email: string;
  role: 'superadministrador' | 'admin' | 'árbitro' | 'capitán' | 'jugador' | 'fotógrafo' | 'espectador';
  name: string;
  phone?: string;
  createdAt: Date | string;
  updatedAt: Date | string;
  isActive: boolean;
}

export interface Season {
  id: string;
  name: string;
  startDate: Date | string;
  endDate: Date | string;
  status: 'active' | 'upcoming' | 'completed' | 'archived';
  description: string;
  registrationDeadline: Date | string;
  priceConfiguration: {
    basePrice: number;
    earlyBirdDiscount?: number;
    teamDiscounts?: {
      minTeams: number;
      discountPercentage: number;
    }[];
  };
  rules: string[];
  isActive: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
  createdBy: string;
}

export interface Division {
  id: string;
  seasonId: string;
  name: 'Varonil' | 'Femenil' | 'Mixto' | string;
  description: string;
  rules: string[];
  order: number;
  color: string;
  teamLimit?: number;
  playerLimit?: number;
  isActive: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface Category {
  id: string;
  divisionId: string;
  seasonId: string;
  name: string; // A, B, C, D, E, F, G
  level: number;
  teamLimit: number;
  playerLimit: number;
  price: number;
  rules: string[];
  isActive: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface Field {
  id: string;
  code: string; // Campo 1, Campo 2, etc.
  name: string;
  type: 'césped' | 'sintético' | 'arena' | 'otros';
  capacity: number;
  facilities: string[]; // vestuarios, iluminación, gradas, baños, etc.
  location: {
    address: string;
    city: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  status: 'available' | 'maintenance' | 'reserved' | 'unavailable';
  priority: number; // 1-10
  notes?: string;
  isActive: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface Team {
  id: string;
  categoryId: string;
  seasonId: string;
  divisionId: string;
  name: string;
  shortName?: string;
  primaryColor: string;
  secondaryColor?: string;
  logoUrl?: string;
  captainId?: string;
  coach?: {
    name: string;
    phone: string;
    email: string;
  };
  playerCount: number;
  registrationDate: Date | string;
  status: 'pending' | 'approved' | 'rejected' | 'suspended' | 'active';
  paymentStatus: 'pending' | 'partial' | 'paid' | 'overdue';
  notes?: string;
  stats?: {
    matchesPlayed: number;
    wins: number;
    draws: number;
    losses: number;
    goalsFor: number;
    goalsAgainst: number;
    points: number;
  };
  createdAt: Date | string;
  updatedAt: Date | string;
  createdBy: string;
}

export interface Player {
  id: string;
  teamId: string;
  name: string;
  lastName: string;
  dateOfBirth?: Date | string;
  number: number;
  position: 'portero' | 'defensa' | 'mediocampista' | 'delantero' | 'utility';
  email: string;
  phone: string;
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
  identification?: {
    type: string;
    number: string;
  };
  registrationDate: Date | string;
  status: 'active' | 'suspended' | 'injured' | 'inactive' | 'pending';
  medicalInfo?: {
    allergies?: string;
    conditions?: string;
    insurance?: string;
  };
  stats?: {
    matchesPlayed: number;
    goals: number;
    assists: number;
    yellowCards: number;
    redCards: number;
    cleanSheets?: number; // para porteros
  };
  isCaptain: boolean;
  isViceCaptain: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
}

// TIPO MATCH ACTUALIZADO
export interface Match {
  id: string;
  seasonId: string;
  divisionId: string;
  categoryId: string;
  fieldId: string;
  
  // Equipos
  homeTeamId: string;
  awayTeamId: string;
  homeTeam?: Team; // Relación con equipo local
  awayTeam?: Team; // Relación con equipo visitante
  
  // Información del partido
  matchDate: Date | string;
  matchTime: string;
  round: number;
  isPlayoff: boolean;
  playoffStage?: 'quarterfinals' | 'semifinals' | 'final' | 'third_place';
  
  // Estado del partido
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'postponed';
  
  // Resultados
  homeScore?: number;
  awayScore?: number;
  winner?: 'home' | 'away' | 'draw';
  
  // Detalles del resultado
  resultDetails?: {
    halftimeScore?: {
      home: number;
      away: number;
    };
    cards?: {
      homeYellow: number;
      homeRed: number;
      awayYellow: number;
      awayRed: number;
    };
    substitutions?: string[];
    injuries?: string[];
  };
  
  // Árbitro
  refereeId?: string;
  refereeName?: string;
  
  // Información adicional
  notes?: string;
  videoUrl?: string;
  spectators?: number;
  weather?: 'sunny' | 'cloudy' | 'rainy' | 'stormy';
  
  // Sistema
  createdAt: Date | string;
  updatedAt: Date | string;
  createdBy: string;
  updatedBy: string;
}

// TIPO ÁRBITRO ACTUALIZADO
export interface Referee {
  id: string;
  seasonId: string;
  
  // Información personal
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phone: string;
  birthDate?: Date | string;
  idNumber: string;
  
  // Información deportiva
  licenseNumber: string;
  licenseExpiry: Date | string;
  level: 'beginner' | 'intermediate' | 'advanced' | 'fifa';
  specialization: 'main' | 'assistant' | 'fourth_official' | 'var';
  
  // Disponibilidad
  availability: {
    monday: boolean;
    tuesday: boolean;
    wednesday: boolean;
    thursday: boolean;
    friday: boolean;
    saturday: boolean;
    sunday: boolean;
    preferredTimes: string[];
  };
  
  // Historial
  matchesAssigned: number;
  matchesCompleted: number;
  rating?: number;
  
  // Documentos
  photoUrl?: string;
  licenseUrl?: string;
  idDocumentUrl?: string;
  
  // Contacto de emergencia
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
  
  // Sistema
  isActive: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
  createdBy: string;
}

// TIPO EVENTO DE CALENDARIO
export interface CalendarEvent {
  id: string;
  type: 'match' | 'training' | 'event' | 'meeting';
  title: string;
  description?: string;
  startDate: Date | string;
  endDate: Date | string;
  allDay: boolean;
  
  // Relaciones
  matchId?: string;
  teamId?: string;
  fieldId?: string;
  refereeId?: string;
  
  // Colores y estilo
  color: string;
  textColor: string;
  
  // Notificaciones
  notifyParticipants: boolean;
  notificationTime?: number; // minutos antes
  
  // Sistema
  createdAt: Date | string;
  updatedAt: Date | string;
  createdBy: string;
}

export interface Payment {
  id: string;
  teamId: string;
  seasonId: string;
  amount: number;
  status: 'pending' | 'paid' | 'overdue' | 'cancelled' | 'refunded';
  dueDate: Date | string;
  paidDate?: Date | string;
  method?: 'cash' | 'transfer' | 'card' | 'online';
  reference?: string;
  invoiceNumber?: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

// Tipos para formularios
export type SeasonFormData = Omit<Season, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>;
export type DivisionFormData = Omit<Division, 'id' | 'createdAt' | 'updatedAt'>;
export type CategoryFormData = Omit<Category, 'id' | 'createdAt' | 'updatedAt'>;
export type FieldFormData = Omit<Field, 'id' | 'createdAt' | 'updatedAt'>;
export type TeamFormData = Omit<Team, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'playerCount' | 'stats'>;
export type PlayerFormData = Omit<Player, 'id' | 'createdAt' | 'updatedAt' | 'teamId' | 'stats'>;
export type MatchFormData = Omit<Match, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy' | 'homeTeam' | 'awayTeam'>;
export type RefereeFormData = Omit<Referee, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'matchesAssigned' | 'matchesCompleted'>;
export type CalendarEventFormData = Omit<CalendarEvent, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>;
export type PaymentFormData = Omit<Payment, 'id' | 'createdAt' | 'updatedAt'>;

// Tipos auxiliares
export interface SelectOption {
  value: string;
  label: string;
  color?: string;
  disabled?: boolean;
}

export interface FilterOptions {
  seasonId?: string;
  divisionId?: string;
  categoryId?: string;
  status?: string;
  searchTerm?: string;
}

export interface Stats {
  total: number;
  active: number;
  pending: number;
  completed: number;
}

// Tipos para Dashboard
export interface DashboardStats {
  seasons: Stats;
  divisions: Stats;
  categories: Stats;
  teams: Stats;
  players: Stats;
  matches: Stats;
  referees: Stats;
}

export interface RecentActivity {
  id: string;
  type: 'season_created' | 'team_registered' | 'match_scheduled' | 'payment_received';
  title: string;
  description: string;
  timestamp: Date | string;
  user: string;
}

// Tipos para autenticación
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials extends LoginCredentials {
  name: string;
  role: User['role'];
}

// Tipos para notificaciones
export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: Date | string;
  read: boolean;
}

// Tipos para archivos
export interface UploadedFile {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
  uploadedAt: Date | string;
  uploadedBy: string;
}

// Tipos para configuraciones
export interface AppConfig {
  siteName: string;
  maintenanceMode: boolean;
  registrationOpen: boolean;
  maxPlayersPerTeam: number;
  maxTeamsPerCategory: number;
}

// Tipos para reportes
export interface MatchReport {
  matchId: string;
  homeTeam: string;
  awayTeam: string;
  score: string;
  date: Date | string;
  referee: string;
  incidents: string[];
}

export interface TeamReport {
  teamId: string;
  teamName: string;
  matchesPlayed: number;
  wins: number;
  losses: number;
  draws: number;
  goalsFor: number;
  goalsAgainst: number;
  points: number;
}

// Tipo para el contexto de autenticación
export interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (credentials: RegisterCredentials) => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
}

// Enums para mayor claridad
export enum MatchStatus {
  SCHEDULED = 'scheduled',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  POSTPONED = 'postponed'
}

export enum TeamStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  SUSPENDED = 'suspended',
  ACTIVE = 'active'
}

export enum PlayerPosition {
  GOALKEEPER = 'portero',
  DEFENDER = 'defensa',
  MIDFIELDER = 'mediocampista',
  FORWARD = 'delantero',
  UTILITY = 'utility'
}

export enum PaymentStatus {
  PENDING = 'pending',
  PAID = 'paid',
  OVERDUE = 'overdue',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded'
}

export enum UserRole {
  SUPER_ADMIN = 'superadministrador',
  ADMIN = 'admin',
  REFEREE = 'árbitro',
  CAPTAIN = 'capitán',
  PLAYER = 'jugador',
  PHOTOGRAPHER = 'fotógrafo',
  SPECTATOR = 'espectador'
}

// Helper types para funciones
export type WithId<T> = T & { id: string };
export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

// TIPOS PARA DISEÑO MOBILE DE GOOGLE STITCH

// Tipos para componentes de navegación móvil
export interface NavItem {
  id: string;
  label: string;
  icon: string; // Nombre del icono de lucide-react
  path: string;
  roles: User['role'][];
  badge?: number;
}

export interface BottomNavConfig {
  visible: boolean;
  items: NavItem[];
}

// Tipos para tarjetas de partido móvil
export interface MatchCardData {
  id: string;
  homeTeam: {
    id: string;
    name: string;
    logo?: string;
    score?: number;
  };
  awayTeam: {
    id: string;
    name: string;
    logo?: string;
    score?: number;
  };
  date: Date | string;
  time: string;
  status: Match['status'];
  currentMinute?: number;
  fieldName: string;
  division: string;
  category: string;
  isLive?: boolean;
  isHighlighted?: boolean;
}

// Tipos para estadísticas móviles
export interface MobileStatsCard {
  title: string;
  value: number | string;
  change?: number;
  icon: string;
  color: string;
  link?: string;
}

// Tipos para calendario móvil
export interface MobileCalendarEvent {
  id: string;
  type: CalendarEvent['type'];
  title: string;
  date: Date | string;
  time: string;
  color: string;
  location?: string;
  participants?: string[];
  matchId?: string;
  teamId?: string;
}

// Tipos para marcador en vivo
export interface LiveScoreData {
  matchId: string;
  homeTeam: {
    name: string;
    score: number;
    shots?: number;
    possession?: number;
    fouls?: number;
  };
  awayTeam: {
    name: string;
    score: number;
    shots?: number;
    possession?: number;
    fouls?: number;
  };
  currentMinute: number;
  half: 'first' | 'second' | 'extra' | 'finished';
  events: MatchEvent[];
  referee?: string;
}

export interface MatchEvent {
  id: string;
  minute: number;
  type: 'goal' | 'yellow_card' | 'red_card' | 'substitution' | 'penalty' | 'injury';
  team: 'home' | 'away';
  player: string;
  playerNumber?: number;
  description?: string;
}

// Tipos para gestión de pagos móvil
export interface MobilePayment {
  id: string;
  teamName: string;
  amount: number;
  dueDate: Date | string;
  status: Payment['status'];
  invoiceNumber?: string;
  method?: Payment['method'];
  paidDate?: Date | string;
  isOverdue?: boolean;
}

// Tipos para gestión de equipo móvil
export interface MobileTeamMember {
  id: string;
  name: string;
  number: number;
  position: Player['position'];
  status: Player['status'];
  isCaptain: boolean;
  isViceCaptain: boolean;
  stats?: Player['stats'];
  lastMatch?: {
    date: Date | string;
    performance?: number;
  };
}

// Tipos para notificaciones móviles
export interface MobileNotification {
  id: string;
  type: 'match' | 'payment' | 'team' | 'system' | 'alert';
  title: string;
  message: string;
  timestamp: Date | string;
  read: boolean;
  action?: {
    label: string;
    url: string;
  };
  priority: 'low' | 'medium' | 'high';
}

// Tipos para perfiles móviles
export interface MobileUserProfile {
  id: string;
  name: string;
  role: User['role'];
  team?: {
    id: string;
    name: string;
    position?: string;
    number?: number;
  };
  stats?: {
    matches: number;
    goals?: number;
    assists?: number;
    yellowCards?: number;
    redCards?: number;
  };
  upcomingMatches?: MatchCardData[];
  recentActivity?: {
    type: string;
    description: string;
    date: Date | string;
  }[];
}

// Tipos para formularios móviles
export interface MobileFormField {
  id: string;
  type: 'text' | 'email' | 'phone' | 'number' | 'date' | 'select' | 'multiselect' | 'textarea' | 'switch';
  label: string;
  placeholder?: string;
  value: any;
  required?: boolean;
  options?: SelectOption[];
  validation?: {
    pattern?: RegExp;
    min?: number;
    max?: number;
    message?: string;
  };
}

// Tipos para búsqueda móvil
export interface MobileSearchResult {
  type: 'match' | 'team' | 'player' | 'field' | 'division';
  id: string;
  title: string;
  subtitle?: string;
  icon: string;
  matchDate?: Date | string;
  score?: string;
  status?: string;
}

// Tipos para dashboard móvil por rol
export interface MobileDashboardData {
  user: MobileUserProfile;
  stats: MobileStatsCard[];
  upcomingMatches: MatchCardData[];
  recentActivities: RecentActivity[];
  quickActions: {
    id: string;
    label: string;
    icon: string;
    action: () => void | string;
    color: string;
  }[];
  notifications: {
    unread: number;
    items: MobileNotification[];
  };
}

// Tipos para estados de carga móvil
export interface MobileLoadingState {
  isLoading: boolean;
  isRefreshing?: boolean;
  error?: string;
  emptyMessage?: string;
}

// Tipos para animaciones y transiciones móviles
export interface MobileAnimationConfig {
  type: 'slide' | 'fade' | 'scale' | 'none';
  duration: number;
  delay?: number;
}

// Tipos para temas móviles
export interface MobileTheme {
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  cardBackground: string;
  textColor: string;
  borderColor: string;
  borderRadius: number;
}

// Tipos para respuestas de API móvil
export interface MobileApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Tipos para caché móvil
export interface MobileCacheItem<T> {
  data: T;
  timestamp: number;
  expiresIn: number;
}

// Tipos para geolocalización móvil
export interface MobileLocation {
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp: Date | string;
}

// Tipos para push notifications móviles
export interface MobilePushNotification {
  title: string;
  body: string;
  data?: Record<string, any>;
  badge?: number;
  sound?: string;
}

// Tipos para offline mode móvil
export interface MobileOfflineData {
  isOnline: boolean;
  lastSync: Date | string;
  pendingActions: {
    type: string;
    data: any;
    timestamp: Date | string;
  }[];
  cachedData: Record<string, MobileCacheItem<any>>;
}

// Tipos para accesibilidad móvil
export interface MobileAccessibility {
  fontSize: 'small' | 'medium' | 'large' | 'xlarge';
  highContrast: boolean;
  screenReader: boolean;
  reduceMotion: boolean;
}

// Unión de tipos para props de componentes
export type ComponentProps<T> = React.PropsWithChildren<T>;

// Función de utilidad para adaptar Match a MatchCardData
export const adaptMatchToCardData = (match: Match, homeTeam?: Team, awayTeam?: Team): MatchCardData => {
  const matchDate = new Date(match.matchDate);
  
  return {
    id: match.id,
    homeTeam: {
      id: match.homeTeamId,
      name: homeTeam?.name || 'Equipo Local',
      logo: homeTeam?.logoUrl,
      score: match.homeScore
    },
    awayTeam: {
      id: match.awayTeamId,
      name: awayTeam?.name || 'Equipo Visitante',
      logo: awayTeam?.logoUrl,
      score: match.awayScore
    },
    date: matchDate,
    time: match.matchTime,
    status: match.status,
    fieldName: 'Campo por definir', // Esto debería venir del field
    division: match.divisionId,
    category: match.categoryId,
    isLive: match.status === 'in_progress',
    isHighlighted: match.isPlayoff
  };
};

// Función de utilidad para adaptar Player a MobileTeamMember
export const adaptPlayerToMobileMember = (player: Player): MobileTeamMember => {
  return {
    id: player.id,
    name: `${player.name} ${player.lastName}`,
    number: player.number,
    position: player.position,
    status: player.status,
    isCaptain: player.isCaptain,
    isViceCaptain: player.isViceCaptain,
    stats: player.stats
  };
};

// Exportación de todos los tipos - ARCHIVO ÚNICO
// No hay export * from './firestore' porque este archivo contiene todo