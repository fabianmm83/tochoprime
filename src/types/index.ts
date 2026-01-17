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

// Tipo extendido para campos con información detallada
export interface FieldDetail extends Field {
  schedule?: FieldSchedule[];
  currentBookings?: BookingSlot[];
  equipmentAvailable?: string[];
  restrictions?: string[];
  photos?: string[];
  lastMaintenance?: string | Date;
  nextMaintenance?: string | Date;
}

export interface FieldSchedule {
  day: string;
  openingTime: string;
  closingTime: string;
  availableForMatches: boolean;
  maxMatchesPerDay: number;
}

export interface BookingSlot {
  matchId?: string;
  eventId?: string;
  startTime: string;
  endTime: string;
  status: 'available' | 'booked' | 'maintenance' | 'reserved';
  bookedBy?: string;
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
  viceCaptainId?: string;
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
  
  // ✅ CAMBIO CRÍTICO: Usar TeamStats en lugar de tipo inline
  stats?: TeamStats;
  
  leadershipRules?: {
    minAge?: number;
    minTeamTenure?: number;
    requireActiveStatus: boolean;
    allowConcurrentRoles: boolean;
    maxCaptainTransfers?: number;
  };
  leadershipStats?: {
    captainChanges: number;
    viceCaptainChanges: number;
    lastCaptainChange?: string | Date;
    lastViceCaptainChange?: string | Date;
  };
  createdAt: Date | string;
  updatedAt: Date | string;
  createdBy: string;
}



export interface TeamStats {
  matchesPlayed: number;
  wins: number;
  draws: number;
  losses: number;
  touchdowns?: number;
  passingTouchdowns?: number;
  interceptions?: number;
  safeties?: number;
  tackles?: number;
  penalties?: number;
  yards?: number;
  goalsFor?: number;     // Mantener por compatibilidad
  goalsAgainst?: number; // Mantener por compatibilidad
  points: number;
}

export interface Player {
  id: string;
  teamId: string;
  name: string;
  lastName: string;
  dateOfBirth?: Date | string;
  number: number;
  // ✅ Cambiar posiciones para tocho
  position: 'quarterback' | 'runningback' | 'wide_receiver' | 'tight_end' | 'offensive_line' | 
            'defensive_line' | 'linebacker' | 'cornerback' | 'safety' | 'kicker' | 'punter' | 'utility';
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
  // ✅ Cambiar estadísticas para tocho
  stats?: {
    matchesPlayed: number;
    touchdowns: number;
    passingTouchdowns: number;
    interceptions: number;
    safeties: number;
    tackles: number;
    penalties: number;
    yards?: number; // opcional para futuras mejoras
  };
  isCaptain: boolean;
  isViceCaptain: boolean;
  leadershipHistory?: LeadershipRole[];
  leadershipScore?: number;
  captainSince?: string | Date;
  viceCaptainSince?: string | Date;
  eligibility?: {
    canBeCaptain: boolean;
    canBeViceCaptain: boolean;
    reasons: string[];
    score: number;
  };
  createdAt: Date | string;
  updatedAt: Date | string;
}

// Tipo para historial de liderazgo
export interface LeadershipRole {
  id: string;
  playerId: string;
  teamId: string;
  role: 'captain' | 'vice_captain';
  startDate: string | Date;
  endDate?: string | Date;
  assignedBy: string;
  reason?: string;
  notes?: string;
}

// Tipo para permisos de liderazgo
export interface LeadershipPermission {
  playerId: string;
  teamId: string;
  role: 'captain' | 'vice_captain';
  permissions: {
    canManageTeam: boolean;
    canManagePlayers: boolean;
    canEditTeamInfo: boolean;
    canViewFinancials: boolean;
    canAssignLineup: boolean;
    canCommunicateWithLeague: boolean;
    permissions: string[];
  };
  grantedAt: string | Date;
  expiresAt?: string | Date;
}

// Tipos para validaciones
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  eligibility?: PlayerEligibility;
}

export interface PlayerEligibility {
  playerId: string;
  canBeCaptain: boolean;
  canBeViceCaptain: boolean;
  reasons: string[];
  score: number;
}

export interface Match {
  id: string;
  seasonId: string;
  divisionId: string;
  categoryId: string;
  fieldId: string;
  
  // Equipos
  homeTeamId: string;
  awayTeamId: string;
  homeTeam?: Team;
  awayTeam?: Team;
  
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
  
  // Estadísticas relacionadas
  statsSubmitted?: boolean;
  statsSubmittedBy?: string;
  statsSubmittedAt?: string | Date;
  
  // Sistema
  createdAt: Date | string;
  updatedAt: Date | string;
  createdBy: string;
  updatedBy: string;
}

// TIPO ÁRBITRO COMPLETO
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
  
  // Estadísticas extendidas
  matchesAssigned: number;
  matchesCompleted: number;
  rating?: number;
  stats?: {
    totalMatches: number;
    completedMatches: number;
    averageRating: number;
    yellowCardsIssued: number;
    redCardsIssued: number;
    penaltiesIssued: number;
    substitutionsRecorded: number;
    injuriesReported: number;
    matchesByDivision: Record<string, number>;
    performanceScore: number;
  };
  
  // Configuración personal
  preferences?: {
    preferredTimeSlots: string[];
    maxMatchesPerWeek: number;
    receiveNotifications: boolean;
    offlineModeEnabled: boolean;
    autoSyncData: boolean;
  };
  
  // Equipamiento
  equipment?: {
    whistle: boolean;
    cards: boolean;
    stopwatch: boolean;
    uniform: boolean;
    communicationDevice: boolean;
  };
  
  // Disponibilidad actualizada
  availabilityDetail?: {
    monday: { available: boolean; times: string[] };
    tuesday: { available: boolean; times: string[] };
    wednesday: { available: boolean; times: string[] };
    thursday: { available: boolean; times: string[] };
    friday: { available: boolean; times: string[] };
    saturday: { available: boolean; times: string[] };
    sunday: { available: boolean; times: string[] };
  };
  
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

// Nuevos tipos para evidencia de partidos
export interface MatchEvidence {
  id: string;
  matchId: string;
  refereeId: string;
  type: 'photo' | 'video' | 'document' | 'audio' | 'other';
  fileName: string;
  fileUrl: string;
  fileSize?: number;
  description?: string;
  uploadDate: string | Date;
  uploadedBy: string;
  tags?: string[];
  relatedEventId?: string;
  verified: boolean;
  verificationDate?: string | Date;
  verifiedBy?: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export interface MatchStats {
  matchId: string;
  refereeId: string;
  
  // Estadísticas generales PARA TOCHO
  general: {
    touchdowns: number[];           // [local, visitante] - TD vale 1 punto cada uno
    passingTouchdowns: number[];    // Pases para TD
    interceptions: number[];        // Intercepciones
    safeties: number[];             // Safety - vale 1 punto
    totalPoints: number[];          // Puntos totales (TDs + Safeties)
    penalties: number[];            // Penales
    penaltyYards: number[];         // Yardas de penal
  };
  
  // Eventos detallados
  events: {
    touchdowns: MatchEvent[];
    interceptions: MatchEvent[];
    safeties: MatchEvent[];
    penalties: MatchEvent[];
    otherEvents: MatchEvent[];
  };
  
  // Datos de jugadores PARA TOCHO
  playerStats: {
    playerId: string;
    teamId: string;
    touchdowns: number;
    passingTouchdowns: number;
    interceptions: number;
    safeties: number;
    tackles: number;
    penalties: number;
  }[];
  
  // Metadatos
  metadata: {
    startTime: string | Date;
    endTime: string | Date;
    duration: number;
    weatherConditions?: string;
    fieldConditions?: string;
    attendance?: number;
    notes?: string;
  };
  
  submittedAt?: string | Date;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}
// Tipo para datos offline
export interface OfflineData {
  id: string;
  refereeId: string;
  dataType: 'match' | 'evidence' | 'stats' | 'calendar' | 'field';
  data: any;
  syncStatus: 'pending' | 'synced' | 'error';
  lastModified: string | Date;
  syncAttempts: number;
  errorMessage?: string;
  createdAt: string | Date;
  updatedAt?: Date | string;
}

// Tipo para gestión de partidos del árbitro
export interface RefereeMatchManagement {
  id?: string;
  matchId: string;
  refereeId: string;
  status: 'pre_match' | 'in_progress' | 'completed' | 'reported' | 'verified';
  preMatchChecklist: {
    fieldInspection: boolean;
    equipmentCheck: boolean;
    teamRostersVerified: boolean;
    playerIDsChecked: boolean;
    safetyBriefing: boolean;
  };
  matchLog: {
    timestamp: string;
    action: string;
    details?: any;
    recordedBy: string;
  }[];
  evidenceIds: string[];
  statsId?: string;
  reportSubmitted: boolean;
  reportDate?: string | Date;
  verificationStatus: 'pending' | 'approved' | 'rejected' | 'needs_revision';
  verificationNotes?: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

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
  notificationTime?: number;
  
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
  QUARTERBACK = 'quarterback',
  RUNNINGBACK = 'runningback',
  WIDE_RECEIVER = 'wide_receiver',
  TIGHT_END = 'tight_end',
  OFFENSIVE_LINE = 'offensive_line',
  DEFENSIVE_LINE = 'defensive_line',
  LINEBACKER = 'linebacker',
  CORNERBACK = 'cornerback',
  SAFETY = 'safety',
  KICKER = 'kicker',
  PUNTER = 'punter',
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
  icon: string;
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
  icon: 'CalendarDays' | 'Target' | 'Users' | 'AlertCircle' | 'TrendingUp' | 'BarChart3' | 'Trophy' | 'Clock';
  color: string;
  change?: number;
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
  role: UserRole | 'jugador' | 'capitán' | 'árbitro';
  team?: {
    id: string;
    name: string;
    position: string;
    number: number;
  };
  stats?: {
    matches: number;
    touchdowns?: number;
    passingTouchdowns?: number;
    interceptions?: number;
    tackles?: number;
    penalties?: number;
    yards?: number;
  };
  upcomingMatches: MatchCardData[];
  recentActivity: MobileActivity[];
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

// Tipos para reportes generados
export interface GeneratedReport {
  id: string;
  matchId: string;
  refereeId: string;
  report: any;
  generatedAt: string | Date;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

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
    fieldName: 'Campo por definir',
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
export type {
  // No necesitamos re-exportar porque todo está en este archivo
};

// ============== INTERFACES MÓVILES COMPLETAS ==============

export interface MobileActivity {
  type: 'match_participation' | 'touchdown_scored' | 'passing_touchdown' | 'interception' | 'tackle' | 'safety' | 'penalty' | 'registration' | 'award';
  description: string;
  date: Date | string;
}

// Asegúrate de que MobileUserProfile use MobileActivity:
export interface MobileUserProfile {
  id: string;
  name: string;
  role: UserRole | 'jugador' | 'capitán' | 'árbitro';
  team?: {
    id: string;
    name: string;
    position: string;
    number: number;
  };
  stats?: {
    matches: number;
    touchdowns?: number;
    passingTouchdowns?: number;
    interceptions?: number;
    tackles?: number;
    penalties?: number;
    yards?: number;
  };
  upcomingMatches: MatchCardData[];
  recentActivity: MobileActivity[];  // ✅ Esto necesita MobileActivity
}