// src/scripts/seedTeams.ts
import * as dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Obtener __dirname en ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cargar variables de entorno desde .env.node
dotenv.config({ path: path.join(__dirname, '../../.env.node') });

import { initializeApp, getApps, deleteApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  setDoc, 
  writeBatch,
  getDoc
} from 'firebase/firestore';

// ==================== CONFIGURACIÓN FIREBASE ====================
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
  measurementId: process.env.FIREBASE_MEASUREMENT_ID
};

// Verificar configuración
const requiredEnvVars = [
  'FIREBASE_API_KEY',
  'FIREBASE_AUTH_DOMAIN', 
  'FIREBASE_PROJECT_ID',
  'FIREBASE_STORAGE_BUCKET'
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`❌ ERROR: ${envVar} no está configurada en .env.node`);
    console.log('💡 Asegúrate de que tu archivo .env.node tenga:');
    console.log('   FIREBASE_API_KEY=tu-api-key');
    console.log('   FIREBASE_AUTH_DOMAIN=tu-proyecto.firebaseapp.com');
    console.log('   FIREBASE_PROJECT_ID=tu-proyecto-id');
    console.log('   ... etc.');
    process.exit(1);
  }
}

console.log('🔧 Configuración Firebase cargada correctamente');
console.log(`   Proyecto: ${firebaseConfig.projectId}`);
console.log(`   Auth Domain: ${firebaseConfig.authDomain}`);

// Inicializar Firebase
let app;
try {
  // Inicializar Firebase (no necesitas limpiar apps manualmente)
  app = initializeApp(firebaseConfig, 'TochoPrime-SeedScript');
  console.log('✅ Firebase inicializado correctamente');
} catch (error) {
  console.error('❌ Error inicializando Firebase:', error);
  process.exit(1);
}

const db = getFirestore(app);

// ==================== CONSTANTES Y DATOS ====================

// PRECIO POR EQUIPO: $7,000
const PRICE_PER_TEAM = 7000;

// Colores para equipos
const TEAM_COLORS = [
  { primary: '#1E40AF', secondary: '#93C5FD' }, // Azul
  { primary: '#059669', secondary: '#6EE7B7' }, // Verde
  { primary: '#DC2626', secondary: '#FCA5A5' }, // Rojo
  { primary: '#7C3AED', secondary: '#C4B5FD' }, // Morado
  { primary: '#EA580C', secondary: '#FDBA74' }, // Naranja
  { primary: '#BE185D', secondary: '#F9A8D4' }, // Rosa
  { primary: '#0D9488', secondary: '#5EEAD4' }, // Cyan
  { primary: '#CA8A04', secondary: '#FDE047' }, // Amarillo
  { primary: '#4B5563', secondary: '#D1D5DB' }, // Gris
  { primary: '#3730A3', secondary: '#A5B4FC' }, // Índigo
  { primary: '#0F766E', secondary: '#99F6E4' }, // Teal
  { primary: '#9D174D', secondary: '#F9A8D4' }, // Fucsia
  { primary: '#2563EB', secondary: '#60A5FA' }, // Blue-600
  { primary: '#7C2D12', secondary: '#FBBF24' }, // Brown-Yellow
  { primary: '#1E3A8A', secondary: '#BFDBFE' }, // Dark Blue
  { primary: '#064E3B', secondary: '#A7F3D0' }, // Dark Green
  { primary: '#701A75', secondary: '#E9D5FF' }, // Purple
  { primary: '#831843', secondary: '#FBCFE8' }, // Pink-800
  { primary: '#78350F', secondary: '#FDE68A' }, // Amber-900
  { primary: '#0C4A6E', secondary: '#BAE6FD' }, // Sky-900
];

// ==================== DATOS DE TEMPORADA ====================
const CURRENT_SEASON = {
  id: 'primeravera-2026',
  name: 'Primavera 2026',
  status: 'active' as const,
  startDate: new Date('2026-01-15').toISOString(),
  endDate: new Date('2026-06-15').toISOString(),
  description: 'Temporada Primavera 2026 Tocho Prime',
  registrationDeadline: new Date('2026-01-30').toISOString(),
  priceConfiguration: {
    basePrice: PRICE_PER_TEAM,
    earlyBirdDiscount: 0,
    teamDiscounts: []
  },
  rules: [
    'Equipos de 15 jugadores máximo',
    'Uniforme completo obligatorio',
    'Puntualidad en horarios',
    'Respeto a árbitros y rivales'
  ],
  isActive: true,
  createdBy: 'seed-script',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

// ==================== DATOS DE DIVISIONES ====================
const DIVISIONS = [
  { 
    id: 'femenil', 
    name: 'Femenil', 
    description: 'División femenil', 
    color: '#DB2777', 
    order: 1,
    teamLimit: 150,
    playerLimit: 15
  },
  { 
    id: 'mixto', 
    name: 'Mixto', 
    description: 'División mixta', 
    color: '#7C3AED', 
    order: 2,
    teamLimit: 150,
    playerLimit: 15
  },
  { 
    id: 'varonil', 
    name: 'Varonil', 
    description: 'División varonil', 
    color: '#1D4ED8', 
    order: 3,
    teamLimit: 150,
    playerLimit: 15
  },
];

// ==================== DATOS DE CATEGORÍAS ====================
const CATEGORIES = [
  // FEMENIL
  { id: 'femenil-a-flag', divisionId: 'femenil', name: 'Femenil A Flag', level: 1, teamLimit: 10, price: PRICE_PER_TEAM, type: 'flag' },
  { id: 'femenil-b-flag', divisionId: 'femenil', name: 'Femenil B Flag', level: 2, teamLimit: 15, price: PRICE_PER_TEAM, type: 'flag' },
  { id: 'femenil-c-flag', divisionId: 'femenil', name: 'Femenil C Flag', level: 3, teamLimit: 20, price: PRICE_PER_TEAM, type: 'flag' },
  { id: 'femenil-d-flag', divisionId: 'femenil', name: 'Femenil D Flag', level: 4, teamLimit: 25, price: PRICE_PER_TEAM, type: 'flag' },
  { id: 'femenil-e-flag', divisionId: 'femenil', name: 'Femenil E Flag', level: 5, teamLimit: 15, price: PRICE_PER_TEAM, type: 'flag' },
  { id: 'femenil-f-flag', divisionId: 'femenil', name: 'Femenil F Flag', level: 6, teamLimit: 30, price: PRICE_PER_TEAM, type: 'flag' },
  
  // MIXTO
  { id: 'mixto-a-flag', divisionId: 'mixto', name: 'Mixto A Flag', level: 1, teamLimit: 10, price: PRICE_PER_TEAM, type: 'flag' },
  { id: 'mixto-b-flag', divisionId: 'mixto', name: 'Mixto B Flag', level: 2, teamLimit: 15, price: PRICE_PER_TEAM, type: 'flag' },
  { id: 'mixto-c-flag', divisionId: 'mixto', name: 'Mixto C Flag', level: 3, teamLimit: 15, price: PRICE_PER_TEAM, type: 'flag' },
  { id: 'mixto-d-flag', divisionId: 'mixto', name: 'Mixto D Flag', level: 4, teamLimit: 20, price: PRICE_PER_TEAM, type: 'flag' },
  { id: 'mixto-e-flag', divisionId: 'mixto', name: 'Mixto E Flag', level: 5, teamLimit: 25, price: PRICE_PER_TEAM, type: 'flag' },
  { id: 'mixto-f-flag', divisionId: 'mixto', name: 'Mixto F Flag', level: 6, teamLimit: 30, price: PRICE_PER_TEAM, type: 'flag' },
  { id: 'mixto-g-flag', divisionId: 'mixto', name: 'Mixto G Flag', level: 7, teamLimit: 35, price: PRICE_PER_TEAM, type: 'flag' },
  
  // VARONIL
  { id: 'varonil-plus35-flag', divisionId: 'varonil', name: 'Varonil +35 Flag', level: 1, teamLimit: 10, price: PRICE_PER_TEAM, type: 'flag' },
  { id: 'varonil-a-flag', divisionId: 'varonil', name: 'Varonil A Flag', level: 2, teamLimit: 10, price: PRICE_PER_TEAM, type: 'flag' },
  { id: 'varonil-a-tocado', divisionId: 'varonil', name: 'Varonil A Tocado', level: 3, teamLimit: 10, price: PRICE_PER_TEAM, type: 'tocado' },
  { id: 'varonil-b-flag', divisionId: 'varonil', name: 'Varonil B Flag', level: 4, teamLimit: 15, price: PRICE_PER_TEAM, type: 'flag' },
  { id: 'varonil-b-tocado', divisionId: 'varonil', name: 'Varonil B Tocado', level: 5, teamLimit: 20, price: PRICE_PER_TEAM, type: 'tocado' },
  { id: 'varonil-c-flag', divisionId: 'varonil', name: 'Varonil C Flag', level: 6, teamLimit: 25, price: PRICE_PER_TEAM, type: 'flag' },
  { id: 'varonil-d-flag', divisionId: 'varonil', name: 'Varonil D Flag', level: 7, teamLimit: 60, price: PRICE_PER_TEAM, type: 'flag' },
];

// ==================== DATOS DE TODOS LOS EQUIPOS (371 equipos) ====================

// FEMENIL - 103 equipos
const FEMENIL_TEAMS = {
  'femenil-a-flag': [
    'AIRONS', 'BAYLOR', 'CARPE DIEM', 'EAGLES FLAG', 'LAS DESOBEDIENTES', 
    'PIGSTOLAS', 'VAQUERAS DIAMANTE'
  ],
  'femenil-b-flag': [
    'AIRONS BABY', 'BANANITAS', 'BLUE DRAGONS AQUA', 'GIGANTES', 'HURRICANES',
    'LXS DURXS', 'MANDALA', 'PANTERAS', 'PAPAYAS CAPEADAS', 'PULGAS MORDELONAS',
    'RUST-EZE', 'THUNDER', 'WINX'
  ],
  'femenil-c-flag': [
    'BLACK BULL', 'BLUE DRAGONS FIRE', 'CARPE DIEM', 'DARK SIDE', 'EVIL MEESEEKS',
    'GIGANTES', 'KAMIKAZES', 'LA MANADA', 'LOKIS', 'MAMA-DUCKS GREEN',
    'MARSHALL', 'MARVEL', 'NIUPIS', 'ÑRASS', 'OHANA', 'PELOTOCHERAS', 'WONDER'
  ],
  'femenil-d-flag': [
    'ALPHAS BABY', 'ARBORVITAE', 'BACARDIANAS', 'BLUE DRAGONS DARK', 'BULLDOGS',
    'CARPE DIEM', 'COATLICUES', 'COWBOYS', 'FLAG FIGHTERS', 'HUARGOS',
    'KND', 'KUMBIA KINGS', 'MAMBAS', 'MUSHU', 'NEW MIX CANTARITO', 'NIFFLERS',
    'PANTERAS-COUGARS', 'PAPAYITAS', 'PHOENIX FLAG FOOTBALL', 'PULGAS MORDELONAS',
    'QUEENS', 'ROOKYS', 'SIRENAS', 'TARGARYENS'
  ],
  'femenil-e-flag': [
    'BLACK HORSES', 'BLUE DRAGONS SHADOW', 'BLUE DRAGONS THUNDER', 'CAVEIRAS',
    'LAZ TLÁHUAC', 'MAMA-DUCKS TEENS', 'MEXAS', 'OHIO STATE', 'PELOTOCHERAS',
    'SKITTLES', 'SWEET DREAMS', 'TIGERS', 'TIGERS CDMX', 'VALKIRIAS', 'VAQUERAS ESMERALDA'
  ],
  'femenil-f-flag': [
    'ATLÉTICO LOMAS ESTRELLA', 'BLITZ BABES', 'BLUE DRAGONS FORCE', 'BLUE DRAGONS NOVA',
    'CARPE DIEM', 'CUATRERAS AZUL', 'CUATRERAS MORADO', 'CUATRERAS NEGRO',
    'CUATRERAS ORO', 'CUATRERAS ROSA', 'DIABLITAS', 'GIGANTES', 'LAZ N', 'LAZ X',
    'MUSHU', 'NOMADAS', 'PANTERAS NEGRAS', 'RED DRAGONS ESCARLATA', 'RED DRAGONS FIRE',
    'SILVERCATS', 'TÓXICAS', 'UNION DEPORTIVA FENIX', 'VAQUERAS AMARILO', 'VAQUERAS BLANCO',
    'VAQUERAS ORO', 'VAQUERAS VERDE', 'VILLAINS'
  ],
};

// MIXTO - 135 equipos
const MIXTO_TEAMS = {
  'mixto-a-flag': [
    'BAYLOR', 'EAGLES FLAG', 'MANDALA', 'PIGSTOLS', 'PULGAS MORDELONAS',
    'SOBRITAS', 'STORMTROOPERS'
  ],
  'mixto-b-flag': [
    'BAYLOR ACADEMY', 'CENTURIONES', 'GITANOS', 'LOS DESOBEDIENTES',
    'PAPAYONES', 'QUETZALES', 'RANITAS TEIBOLERAS', 'ROOKYS', 'RUST-EZE',
    'SILVERBACKS', 'WHITE LYNX'
  ],
  'mixto-c-flag': [
    'AIRONS BABY', 'ARYA\'S', 'HURRICANES', 'KAMIKAZES', 'LXS DURXS',
    'MEESEEKS', 'NINERS', 'PANTERAS', 'POLUX', 'PULGAS MORDELONAS',
    'RICHMOND', 'VAQUEROS DIAMANTE', 'WAKANDA'
  ],
  'mixto-d-flag': [
    'ARBORVITAE', 'BLACK TEAM', 'BÚFALOS', 'CARPE DIEM', 'DEVIL BATS',
    'DYNASTY', 'EVIL MEESEEKS', 'GUARDIANES DE LA GALAXIA', 'HAKUNA BULLS',
    'LSU', 'MALOTES JR', 'MAMA-DUCKS', 'MORTÍFAGOS', 'NEW MIX CANTARITO',
    'NOOBS', 'ÑROSS', 'PANTERAS-COUGARS', 'PELOTOCHEROS', 'WASAUSKYS'
  ],
  'mixto-e-flag': [
    'BACARDIANOS', 'BIPOLAR', 'BLACK BULL', 'BLUE DRAGONS WIND',
    'COATLICUES VERDE', 'CUERVOS', 'DRAGONES', 'FURBYS', 'GATORS',
    'KND', 'KRAKENS', 'LOKIS LOKIS', 'MARVEL', 'MEXAS', 'MUD DOGS',
    'NIFFLERS', 'PELUCHINES', 'SKITTLES', 'STEELERS FLAG', 'THE 6IX ACADEMY',
    'THUNDERCATS', 'THUNDERS', 'TIGERS', 'TOALLIN', 'TUNE SQUAD'
  ],
  'mixto-f-flag': [
    'AJOLOTES WARRIORS', 'BIPOLAR', 'BLACK HORSES', 'BLUE DRAGONS ICE',
    'BLUE DRAGONS SILVER', 'BULLDOGS', 'CAVEIRAS', 'CHANTASTIC\'S',
    'EL DESTAPAMIX', 'HAWAI', 'HUARGOS', 'INJUSTICE', 'KUROMIS',
    'LA MANADA', 'LAZ', 'LEONES', 'MINIONS', 'NÓMADAS', 'OHANA',
    'OLIMPO', 'POLARES', 'RED EAGLES', 'ROOKYS', 'SCI-MARSHALL',
    'TARGARYENS', 'TORTOLITOS DE CULIACÁN', 'TÓXICOS', 'WYDS'
  ],
  'mixto-g-flag': [
    'ATLÉTICO LOMAS ESTRELLA', 'BIPOLAR', 'BLUE DRAGONS SHADOW',
    'COATLICUES ROJO', 'COWBOYS', 'CUATRER@S', 'DOBERS', 'FAMILIA PELUCHE',
    'GENGARS', 'GIGANTES', 'HUARGOS', 'LAZ TLALPAN', 'LOKIS RUKIS',
    'LOKITOS', 'LOS TOYS', 'MAFIA', 'MÁQUINA DEL MAL', 'MERAKI',
    'MICHIGAN', 'OHANA', 'RAYO MCQUEEN', 'RED BULL', 'ROTOS',
    'STRANGER TEAM', 'TEAM CRASH', 'TIGERS CDMX', 'TIGRES', 'VALKIRIAS',
    'VAQUEROS VERDE', 'VERDUGOS', 'VIKINGOS MIX', 'WHITE PANTHERS',
    'WILD RABBITS', 'X-FORCE', 'YUPIS'
  ],
};

// VARONIL - 133 equipos
const VARONIL_TEAMS = {
  'varonil-plus35-flag': [
    'CENTURIONES', 'GATORS', 'JUDAS', 'MARSHALL', 'OREGON', 'PIGSTOLS',
    'TX8S', 'VAQUEROS'
  ],
  'varonil-a-flag': [
    'CHOSEN ONES', 'LONGHORNS', 'MANDALA', 'MCLOVINS', 'PICOS STATE',
    'PIGSTOLS', 'PULGAS MORDELONAS'
  ],
  'varonil-a-tocado': [
    'BOLTZ', 'EL DESTAPADOR', 'HUSKIES NIU', 'PIGSTOLS', 'POLUX',
    'SHARKS', 'THUNDERS', 'WACHACHARA'
  ],
  'varonil-b-flag': [
    'BLACK DIAMONDS', 'BLUE DRAGONS IRON', 'CENTURIONES', 'DYNASTY',
    'EAGLES FLAG', 'GIGANTES', 'LA FAM', 'LM9', 'LSU', 'MAMBO KINGS',
    'ÑROSS', 'PIGSTOLS B', 'ROYALTY', 'SILVERBACKS'
  ],
  'varonil-b-tocado': [
    'ATLÉTICO LOMAS ESTRELLA', 'AUTÉNTICOS TITANES', 'BISONTES VOLADORES',
    'CAPIBARA', 'DARK SIDE', 'GEARS', 'GENERACIONES', 'HIAWATHA', 'KINGS',
    'KRAKENS', 'MUD DOGS', 'NEW MIX', 'PANTERAS SEMINOLES', 'PELOTÓN CHIFLADO',
    'RUDOS PREPA 1', 'TIGERS', 'VERDUGOS', 'VIEJOS CLAVOS', 'VIKINGOS',
    'WILDCATS'
  ],
  'varonil-c-flag': [
    'BACARDIANOS', 'BANDIDOS', 'BIKER BOYZ', 'BLACK BULL', 'CARPE DIEM',
    'DARK SIDE', 'DIABLITOS', 'GATORS', 'GUERREROS JAGUAR', 'HAKUNA BULLS GOLD',
    'LXS DURXS', 'MAPACHES', 'MEESEEKS', 'PAKETAXO', 'PANTERAS',
    'PELOTOCHEROS', 'PHANTOMS', 'RAPTORS', 'RUST-EZE', 'SKITTLES',
    'SWEET DREAMS', 'TIGERS', 'VALHALLA', 'VIEJOS SABROSOS'
  ],
  'varonil-d-flag': [
    'ARBORVITAE', 'BEAVERS', 'BIPOLAR', 'BOTS', 'BÚFALOS', 'BULLDOGS',
    'CARTOONS', 'CASCAJOS', 'CAVEIRAS', 'COATLICUES', 'COBRA KAI',
    'COMANDOS', 'COWBOYS', 'DESQUAKADOS', 'DOLPHINS', 'GEARS', 'GIGANTES',
    'GORILAS', 'GUERREROS MEXICAS', 'HAKUNA BULLS SILVER', 'HALCONES DEL OLVIDO',
    'HAWAI', 'HDLV', 'HUARGOS', 'HUERQUILLOS', 'KINGS', 'LEONES', 'LOKIS',
    'M&M', 'MÁQUINA DEL MAL', 'MARSHALL NEGRO', 'MARVEL', 'MEXAS', 'NIFFLERS',
    'NOMADAS', 'PANTERAS NEGRAS', 'PINZONES COAPETONES', 'POLUX FLAG',
    'RED DRAGONS', 'SCI MARSHALL', 'SCISSORS', 'SPOTS', 'THUNDERCATS',
    'TÓXICOS', 'VIKINGOS FLAG', 'WHITE PANTHERS', 'X-FORCE EST.2020', 'YUPIS'
  ],
};

// Combinar todos los equipos
const ALL_TEAMS = { ...FEMENIL_TEAMS, ...MIXTO_TEAMS, ...VARONIL_TEAMS };

// ==================== FUNCIONES AUXILIARES ====================

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const generateTeamId = (teamName: string, categoryId: string) => {
  return `${teamName.toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]/g, '')
    .replace(/á/g, 'a').replace(/é/g, 'e').replace(/í/g, 'i')
    .replace(/ó/g, 'o').replace(/ú/g, 'u').replace(/ñ/g, 'n')
    .substring(0, 30)}-${categoryId}`;
};

// ==================== FUNCIONES PRINCIPALES ====================

const createSeason = async () => {
  console.log('\n📅 CREANDO TEMPORADA...');
  const seasonRef = doc(db, 'seasons', CURRENT_SEASON.id);
  const seasonDoc = await getDoc(seasonRef);
  
  if (seasonDoc.exists()) {
    console.log(`ℹ️  Temporada "${CURRENT_SEASON.name}" ya existe`);
    return CURRENT_SEASON.id;
  }
  
  await setDoc(seasonRef, CURRENT_SEASON);
  console.log(`✅ Temporada "${CURRENT_SEASON.name}" creada`);
  return CURRENT_SEASON.id;
};

const createDivisions = async (seasonId: string) => {
  console.log('\n🏆 CREANDO DIVISIONES...');
  const batch = writeBatch(db);
  let mutationCount = 0;
  
  for (const division of DIVISIONS) {
    const divisionRef = doc(db, 'divisions', division.id);
    const divisionDoc = await getDoc(divisionRef);
    
    if (divisionDoc.exists()) {
      console.log(`ℹ️  División "${division.name}" ya existe`);
      continue;
    }
    
    batch.set(divisionRef, {
      ...division,
      seasonId,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    mutationCount++;
  }
  
  if (mutationCount > 0) {
    await batch.commit();
    console.log(`✅ ${mutationCount} divisiones creadas`);
  }
};

const createCategories = async (seasonId: string) => {
  console.log('\n📊 CREANDO CATEGORÍAS...');
  let created = 0;
  let skipped = 0;
  
  for (const category of CATEGORIES) {
    const categoryRef = doc(db, 'categories', category.id);
    const categoryDoc = await getDoc(categoryRef);
    
    if (categoryDoc.exists()) {
      skipped++;
      continue;
    }
    
    await setDoc(categoryRef, {
      ...category,
      seasonId,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    created++;
    
    // Pequeña pausa para no saturar
    if (created % 10 === 0) {
      await sleep(100);
    }
  }
  
  console.log(`✅ ${created} categorías creadas | ${skipped} ya existían`);
};

const createTeams = async () => {
  console.log('\n👥 CREANDO EQUIPOS...');
  
  let totalCreated = 0;
  let totalSkipped = 0;
  let colorIndex = 0;
  
  const categories = CATEGORIES.map(cat => cat.id);
  
  for (const categoryId of categories) {
    const teamsInCategory = ALL_TEAMS[categoryId as keyof typeof ALL_TEAMS];
    
    if (!teamsInCategory || teamsInCategory.length === 0) {
      console.log(`⚠️  No hay equipos para la categoría: ${categoryId}`);
      continue;
    }
    
    console.log(`\n📋 Categoría: ${categoryId}`);
    console.log(`   Equipos a procesar: ${teamsInCategory.length}`);
    
    const categoryData = CATEGORIES.find(c => c.id === categoryId);
    if (!categoryData) continue;
    
    let categoryCreated = 0;
    let categorySkipped = 0;
    
    // Procesar en lotes de 20 (más pequeño para evitar problemas)
    for (let i = 0; i < teamsInCategory.length; i += 20) {
      const batch = writeBatch(db);
      const batchTeams = teamsInCategory.slice(i, i + 20);
      let batchMutationCount = 0;
      
      for (const teamName of batchTeams) {
        const teamId = generateTeamId(teamName, categoryId);
        const teamRef = doc(db, 'teams', teamId);
        
        // Verificar si ya existe
        const teamDoc = await getDoc(teamRef);
        if (teamDoc.exists()) {
          categorySkipped++;
          continue;
        }
        
        const colors = TEAM_COLORS[colorIndex % TEAM_COLORS.length];
        colorIndex++;
        
        // Crear datos del equipo
        const shortName = teamName.length > 20 
          ? teamName.substring(0, 17) + '...' 
          : teamName;
        
        const teamData = {
          id: teamId,
          name: teamName,
          shortName: shortName,
          categoryId: categoryId,
          seasonId: CURRENT_SEASON.id,
          divisionId: categoryData.divisionId,
          primaryColor: colors.primary,
          secondaryColor: colors.secondary,
          logoUrl: '',
          playerCount: 0,
          registrationDate: new Date().toISOString(),
          status: 'active' as const,
          paymentStatus: 'pending' as const,
          stats: {
            matchesPlayed: 0,
            wins: 0,
            draws: 0,
            losses: 0,
            touchdowns: 0,
            passingTouchdowns: 0,
            interceptions: 0,
            safeties: 0,
            tackles: 0,
            penalties: 0,
            goalsFor: 0,
            goalsAgainst: 0,
            points: 0,
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          createdBy: 'seed-script',
        };
        
        batch.set(teamRef, teamData);
        batchMutationCount++;
        categoryCreated++;
        totalCreated++;
      }
      
      // Ejecutar batch
      if (batchMutationCount > 0) {
        await batch.commit();
        console.log(`   ✅ Batch: ${batchMutationCount} equipos procesados`);
        await sleep(500); // Pausa para no saturar Firebase
      }
    }
    
    totalSkipped += categorySkipped;
    console.log(`   📊 Creados: ${categoryCreated} | Saltados: ${categorySkipped}`);
  }
  
  return { totalCreated, totalSkipped };
};

const seedAllData = async () => {
  console.log('='.repeat(60));
  console.log('🚀 TOCHO PRIME - SCRIPT DE CARGA MASIVA');
  console.log('='.repeat(60));
  console.log(`📊 Proyecto: ${firebaseConfig.projectId}`);
  console.log(`💰 Precio por equipo: $${PRICE_PER_TEAM.toLocaleString()}`);
  console.log('='.repeat(60));
  
  const startTime = Date.now();
  
  try {
    // 1. Crear temporada
    const seasonId = await createSeason();
    
    // 2. Crear divisiones
    await createDivisions(seasonId);
    
    // 3. Crear categorías
    await createCategories(seasonId);
    
    // 4. Crear equipos
    const teamResults = await createTeams();
    
    // ==================== RESUMEN FINAL ====================
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 RESUMEN DE CARGA COMPLETADA');
    console.log('='.repeat(60));
    console.log(`⏱️  Duración: ${duration} segundos`);
    console.log(`📅 Temporada: ${CURRENT_SEASON.name}`);
    console.log(`🏆 Divisiones: ${DIVISIONS.length}`);
    console.log(`📊 Categorías: ${CATEGORIES.length}`);
    console.log(`👥 Equipos totales: ${teamResults.totalCreated + teamResults.totalSkipped}`);
    console.log(`✅ Equipos creados: ${teamResults.totalCreated}`);
    console.log(`ℹ️  Equipos ya existentes: ${teamResults.totalSkipped}`);
    
    // Calcular estadísticas por división
    console.log('\n📈 ESTADÍSTICAS POR DIVISIÓN:');
    
    const divisionStats: Record<string, number> = {};
    CATEGORIES.forEach(category => {
      const teams = ALL_TEAMS[category.id as keyof typeof ALL_TEAMS] || [];
      divisionStats[category.divisionId] = (divisionStats[category.divisionId] || 0) + teams.length;
    });
    
    Object.entries(divisionStats).forEach(([divisionId, count]) => {
      const division = DIVISIONS.find(d => d.id === divisionId);
      console.log(`   ${division?.name || divisionId}: ${count} equipos`);
    });
    
    // Calcular ingresos
    const totalRevenue = teamResults.totalCreated * PRICE_PER_TEAM;
    console.log(`\n💰 INGRESOS POTENCIALES:`);
    console.log(`   Por equipo: $${PRICE_PER_TEAM.toLocaleString()}`);
    console.log(`   Total: $${totalRevenue.toLocaleString()}`);
    
    console.log('\n' + '='.repeat(60));
    console.log('🎉 ¡CARGA MASIVA COMPLETADA EXITOSAMENTE!');
    console.log('='.repeat(60));
    
  } catch (error) {
    console.error('\n❌ ERROR DURANTE LA CARGA:', error);
    console.error('\n💡 Posibles soluciones:');
    console.error('   1. Verifica tu conexión a internet');
    console.error('   2. Revisa las credenciales en .env.node');
    console.error('   3. Asegúrate de tener permisos en Firebase Firestore');
  }
};

// Ejecutar la función principal
seedAllData().then(() => {
  console.log('\n✨ Script finalizado');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Error en ejecución principal:', error);
  process.exit(1);
});