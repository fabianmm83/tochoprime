import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';
import { getStorage } from 'firebase/storage';

// Configuración desde variables de entorno
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Exportar servicios
export const auth = getAuth(app);
export const db = getFirestore(app);
export const functions = getFunctions(app);
export const storage = getStorage(app);

// Para desarrollo local
if (import.meta.env.DEV) {
  connectFunctionsEmulator(functions, 'localhost', 5001);
}

// Constantes para Tocho Prime
export const DIVISIONS = ['varonil', 'femenil', 'mixto'] as const;
export const CATEGORIES = ['A', 'B', 'C', 'D', 'E', 'F', 'G'] as const;
export const FIELDS_COUNT = 16;

// Tipos TypeScript
export type Division = typeof DIVISIONS[number];
export type Category = typeof CATEGORIES[number];
export type Role = 'superadministrador' | 'admin' | 'arbitro' | 'capitan' | 'jugador' | 'fotografo' | 'espectador';

// Colecciones de Firestore
export const COLLECTIONS = {
  USERS: 'users',
  LEAGUES: 'leagues',
  TEAMS: 'teams',
  MATCHES: 'matches',
  FIELDS: 'fields',
  NOTIFICATIONS: 'notifications',
  PLAYERS: 'players',
  SEASONS: 'seasons'
} as const;