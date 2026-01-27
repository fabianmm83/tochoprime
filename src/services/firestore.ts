import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  query, 
  where, 
  orderBy,
  serverTimestamp 
} from 'firebase/firestore';

import { db, auth, storage } from './firebase';

import { 
  Season, 
  Division, 
  Category, 
  Field,
  Team,
  Player,
  Match,
  Referee,
  CalendarEvent,
  Payment
} from '../types';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';



// Función helper para convertir Firestore Timestamp a Date
const parseFirestoreDate = (dateValue: any): Date | string => {
  if (!dateValue) return new Date();
  
  // Si es un Timestamp de Firestore
  if (dateValue && typeof dateValue.toDate === 'function') {
    return dateValue.toDate();
  }
  
  // Si ya es un Date
  if (dateValue instanceof Date) {
    return dateValue;
  }
  
  // Si es un string ISO
  if (typeof dateValue === 'string' && dateValue.includes('T')) {
    return new Date(dateValue);
  }
  
  // Devolver tal cual (string o lo que sea)
  return dateValue;
};


// Servicio para Temporadas
export const seasonsService = {
  // Obtener todas las temporadas
  async getSeasons(): Promise<Season[]> {
    try {
      const seasonsRef = collection(db, 'seasons');
      const q = query(seasonsRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          startDate: parseFirestoreDate(data.startDate),
          endDate: parseFirestoreDate(data.endDate),
          registrationDeadline: parseFirestoreDate(data.registrationDeadline),
          createdAt: parseFirestoreDate(data.createdAt),
          updatedAt: parseFirestoreDate(data.updatedAt),
        } as Season;
      });
    } catch (error) {
      console.error('Error fetching seasons:', error);
      throw error;
    }
  },

  // Obtener temporada por ID
  async getSeasonById(id: string): Promise<Season | null> {
    try {
      const seasonRef = doc(db, 'seasons', id);
      const seasonDoc = await getDoc(seasonRef);
      
      if (seasonDoc.exists()) {
        const data = seasonDoc.data();
        return {
          id: seasonDoc.id,
          ...data,
          startDate: parseFirestoreDate(data.startDate),
          endDate: parseFirestoreDate(data.endDate),
          registrationDeadline: parseFirestoreDate(data.registrationDeadline),
          createdAt: parseFirestoreDate(data.createdAt),
          updatedAt: parseFirestoreDate(data.updatedAt),
        } as Season;
      }
      return null;
    } catch (error) {
      console.error('Error fetching season:', error);
      throw error;
    }
  },

  // Crear nueva temporada
  async createSeason(seasonData: Omit<Season, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>): Promise<string> {
    try {
      const seasonsRef = collection(db, 'seasons');
      const newSeason = {
        ...seasonData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      
      const docRef = await addDoc(seasonsRef, newSeason);
      return docRef.id;
    } catch (error) {
      console.error('Error creating season:', error);
      throw error;
    }
  },

  // Actualizar temporada
  async updateSeason(id: string, seasonData: Partial<Season>): Promise<void> {
    try {
      const seasonRef = doc(db, 'seasons', id);
      await updateDoc(seasonRef, {
        ...seasonData,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error updating season:', error);
      throw error;
    }
  },

  // Archivar temporada
  async archiveSeason(id: string): Promise<void> {
    try {
      const seasonRef = doc(db, 'seasons', id);
      await updateDoc(seasonRef, {
        status: 'archived',
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error archiving season:', error);
      throw error;
    }
  },

  // Eliminar temporada
  async deleteSeason(id: string): Promise<void> {
    try {
      const seasonRef = doc(db, 'seasons', id);
      await deleteDoc(seasonRef);
    } catch (error) {
      console.error('Error deleting season:', error);
      throw error;
    }
  },

  // Duplicar temporada
  async duplicateSeason(sourceSeasonId: string, newSeasonName: string): Promise<string> {
    try {
      const sourceSeason = await this.getSeasonById(sourceSeasonId);
      if (!sourceSeason) throw new Error('Season not found');

      const { id, createdAt, updatedAt, ...seasonData } = sourceSeason;
      const newSeason: Omit<Season, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'> = {
        ...seasonData,
        name: newSeasonName,
        status: 'upcoming',
        isActive: false,
      };

      return await this.createSeason(newSeason);
    } catch (error) {
      console.error('Error duplicating season:', error);
      throw error;
    }
  },
};

// Servicio para Divisiones
export const divisionsService = {
  // Obtener divisiones por temporada
  async getDivisionsBySeason(seasonId: string): Promise<Division[]> {
    try {
      const divisionsRef = collection(db, 'divisions');
      const q = query(
        divisionsRef, 
        where('seasonId', '==', seasonId),
        orderBy('order', 'asc')
      );
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: parseFirestoreDate(data.createdAt),
          updatedAt: parseFirestoreDate(data.updatedAt),
        } as Division;
      });
    } catch (error) {
      console.error('Error fetching divisions:', error);
      throw error;
    }
  },

  // Obtener división por ID
  async getDivisionById(id: string): Promise<Division | null> {
    try {
      const divisionRef = doc(db, 'divisions', id);
      const divisionDoc = await getDoc(divisionRef);
      
      if (divisionDoc.exists()) {
        const data = divisionDoc.data();
        return {
          id: divisionDoc.id,
          ...data,
          createdAt: parseFirestoreDate(data.createdAt),
          updatedAt: parseFirestoreDate(data.updatedAt),
        } as Division;
      }
      return null;
    } catch (error) {
      console.error('Error fetching division:', error);
      throw error;
    }
  },

  // Crear división
  async createDivision(divisionData: Omit<Division, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const divisionsRef = collection(db, 'divisions');
      const newDivision = {
        ...divisionData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      
      const docRef = await addDoc(divisionsRef, newDivision);
      return docRef.id;
    } catch (error) {
      console.error('Error creating division:', error);
      throw error;
    }
  },

  // Crear divisiones predeterminadas para una temporada
  async createDefaultDivisions(seasonId: string): Promise<void> {
    const defaultDivisions: Omit<Division, 'id' | 'createdAt' | 'updatedAt'>[] = [
      {
        seasonId,
        name: 'Varonil',
        description: 'División exclusiva para equipos masculinos',
        rules: [
          'Jugadores exclusivamente masculinos',
          'Equipos de 7 jugadores',
          'Duración de partido: 40 minutos'
        ],
        order: 1,
        color: '#3b82f6',
        teamLimit: 20,
        playerLimit: 15,
        isActive: true,
      },
      {
        seasonId,
        name: 'Femenil',
        description: 'División exclusiva para equipos femeninos',
        rules: [
          'Jugadoras exclusivamente femeninas',
          'Equipos de 7 jugadoras',
          'Duración de partido: 40 minutos'
        ],
        order: 2,
        color: '#ec4899',
        teamLimit: 20,
        playerLimit: 15,
        isActive: true,
      },
      {
        seasonId,
        name: 'Mixto',
        description: 'División para equipos mixtos',
        rules: [
          'Mínimo 3 jugadoras en campo',
          'Equipos de 7 jugadores',
          'Duración de partido: 40 minutos'
        ],
        order: 3,
        color: '#8b5cf6',
        teamLimit: 20,
        playerLimit: 15,
        isActive: true,
      },
    ];

    try {
      const divisionsRef = collection(db, 'divisions');
      
      for (const division of defaultDivisions) {
        await addDoc(divisionsRef, {
          ...division,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
    } catch (error) {
      console.error('Error creating default divisions:', error);
      throw error;
    }
  },

  // Actualizar división
  async updateDivision(id: string, divisionData: Partial<Division>): Promise<void> {
    try {
      const divisionRef = doc(db, 'divisions', id);
      await updateDoc(divisionRef, {
        ...divisionData,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error updating division:', error);
      throw error;
    }
  },

  // Eliminar división
  async deleteDivision(id: string): Promise<void> {
    try {
      const divisionRef = doc(db, 'divisions', id);
      await deleteDoc(divisionRef);
    } catch (error) {
      console.error('Error deleting division:', error);
      throw error;
    }
  },


  getAllDivisions: async (): Promise<Division[]> => {
    try {
      const divisionsRef = collection(db, 'divisions');
      const q = query(divisionsRef, orderBy('order', 'asc'));
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: parseFirestoreDate(data.createdAt),
          updatedAt: parseFirestoreDate(data.updatedAt),
        } as Division;
      });
    } catch (error) {
      console.error('Error fetching all divisions:', error);
      throw error;
    }
  },




};

// Servicio para Categorías
export const categoriesService = {
  // Obtener categorías por división
  async getCategoriesByDivision(divisionId: string): Promise<Category[]> {
    try {
      const categoriesRef = collection(db, 'categories');
      const q = query(
        categoriesRef, 
        where('divisionId', '==', divisionId),
        orderBy('level', 'asc')
      );
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: parseFirestoreDate(data.createdAt),
          updatedAt: parseFirestoreDate(data.updatedAt),
        } as Category;
      });
    } catch (error) {
      console.error('Error fetching categories:', error);
      throw error;
    }
  },

  // Obtener categoría por ID
  async getCategoryById(id: string): Promise<Category | null> {
    try {
      const categoryRef = doc(db, 'categories', id);
      const categoryDoc = await getDoc(categoryRef);
      
      if (categoryDoc.exists()) {
        const data = categoryDoc.data();
        return {
          id: categoryDoc.id,
          ...data,
          createdAt: parseFirestoreDate(data.createdAt),
          updatedAt: parseFirestoreDate(data.updatedAt),
        } as Category;
      }
      return null;
    } catch (error) {
      console.error('Error fetching category:', error);
      throw error;
    }
  },

  // Crear categoría
  async createCategory(categoryData: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const categoriesRef = collection(db, 'categories');
      const newCategory = {
        ...categoryData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      
      const docRef = await addDoc(categoriesRef, newCategory);
      return docRef.id;
    } catch (error) {
      console.error('Error creating category:', error);
      throw error;
    }
  },

  // Crear categorías predeterminadas para una división
  async createDefaultCategories(divisionId: string, seasonId: string): Promise<void> {
    const defaultCategories: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>[] = [
      { name: 'A', level: 1, divisionId, seasonId, teamLimit: 10, playerLimit: 15, price: 2500, rules: [], isActive: true },
      { name: 'B', level: 2, divisionId, seasonId, teamLimit: 10, playerLimit: 15, price: 2200, rules: [], isActive: true },
      { name: 'C', level: 3, divisionId, seasonId, teamLimit: 10, playerLimit: 15, price: 2000, rules: [], isActive: true },
      { name: 'D', level: 4, divisionId, seasonId, teamLimit: 10, playerLimit: 15, price: 1800, rules: [], isActive: true },
      { name: 'E', level: 5, divisionId, seasonId, teamLimit: 10, playerLimit: 15, price: 1600, rules: [], isActive: true },
      { name: 'F', level: 6, divisionId, seasonId, teamLimit: 10, playerLimit: 15, price: 1400, rules: [], isActive: true },
      { name: 'G', level: 7, divisionId, seasonId, teamLimit: 10, playerLimit: 15, price: 1200, rules: [], isActive: true },
    ];

    try {
      const categoriesRef = collection(db, 'categories');
      
      for (const category of defaultCategories) {
        await addDoc(categoriesRef, {
          ...category,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
    } catch (error) {
      console.error('Error creating default categories:', error);
      throw error;
    }
  },

  // Actualizar categoría
  async updateCategory(id: string, categoryData: Partial<Category>): Promise<void> {
    try {
      const categoryRef = doc(db, 'categories', id);
      await updateDoc(categoryRef, {
        ...categoryData,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error updating category:', error);
      throw error;
    }
  },

  // Eliminar categoría
  async deleteCategory(id: string): Promise<void> {
    try {
      const categoryRef = doc(db, 'categories', id);
      await deleteDoc(categoryRef);
    } catch (error) {
      console.error('Error deleting category:', error);
      throw error;
    }
  },

  // Obtener todas las categorías por temporada
  async getCategoriesBySeason(seasonId: string): Promise<Category[]> {
    try {
      const categoriesRef = collection(db, 'categories');
      const q = query(
        categoriesRef, 
        where('seasonId', '==', seasonId),
        orderBy('level', 'asc')
      );
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: parseFirestoreDate(data.createdAt),
          updatedAt: parseFirestoreDate(data.updatedAt),
        } as Category;
      });
    } catch (error) {
      console.error('Error fetching categories by season:', error);
      throw error;
    }
  },
};

// Servicio para Campos
export const fieldsService = {
  // Obtener todos los campos
  async getFields(): Promise<Field[]> {
    try {
      const fieldsRef = collection(db, 'fields');
      const q = query(fieldsRef, orderBy('code', 'asc'));
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: parseFirestoreDate(data.createdAt),
          updatedAt: parseFirestoreDate(data.updatedAt),
        } as Field;
      });
    } catch (error) {
      console.error('Error fetching fields:', error);
      throw error;
    }
  },

  // Obtener campo por ID
  async getFieldById(id: string): Promise<Field | null> {
    try {
      const fieldRef = doc(db, 'fields', id);
      const fieldDoc = await getDoc(fieldRef);
      
      if (fieldDoc.exists()) {
        const data = fieldDoc.data();
        return {
          id: fieldDoc.id,
          ...data,
          createdAt: parseFirestoreDate(data.createdAt),
          updatedAt: parseFirestoreDate(data.updatedAt),
        } as Field;
      }
      return null;
    } catch (error) {
      console.error('Error fetching field:', error);
      throw error;
    }
  },

  // Crear campo
  async createField(fieldData: Omit<Field, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const fieldsRef = collection(db, 'fields');
      const newField = {
        ...fieldData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      
      const docRef = await addDoc(fieldsRef, newField);
      return docRef.id;
    } catch (error) {
      console.error('Error creating field:', error);
      throw error;
    }
  },

  // Crear campos predeterminados (16 campos)
  async createDefaultFields(): Promise<void> {
    const defaultFields: Omit<Field, 'id' | 'createdAt' | 'updatedAt'>[] = Array.from({ length: 16 }, (_, i) => ({
      code: `Campo ${i + 1}`,
      name: `Campo Deportivo ${i + 1}`,
      type: i % 2 === 0 ? 'sintético' : 'césped',
      capacity: 100 + (i * 10),
      facilities: this.getFacilitiesByIndex(i),
      location: {
        address: `Calle Deportes ${i + 1}, Col. Deportiva`,
        city: 'Ciudad Deportiva',
      },
      status: 'available',
      priority: Math.floor(i / 2) + 1,
      isActive: true,
    }));

    try {
      const fieldsRef = collection(db, 'fields');
      
      for (const field of defaultFields) {
        await addDoc(fieldsRef, {
          ...field,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
    } catch (error) {
      console.error('Error creating default fields:', error);
      throw error;
    }
  },

  // Función helper para obtener facilidades por índice
  getFacilitiesByIndex: (index: number): string[] => {
    const baseFacilities = ['iluminación'];
    
    if (index % 3 === 0) baseFacilities.push('vestuarios');
    if (index % 4 === 0) baseFacilities.push('gradas');
    if (index % 5 === 0) baseFacilities.push('baños');
    if (index % 2 === 0) baseFacilities.push('estacionamiento');
    
    return baseFacilities;
  },

  // Actualizar campo
  async updateField(id: string, fieldData: Partial<Field>): Promise<void> {
    try {
      const fieldRef = doc(db, 'fields', id);
      await updateDoc(fieldRef, {
        ...fieldData,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error updating field:', error);
      throw error;
    }
  },

  // Eliminar campo
  async deleteField(id: string): Promise<void> {
    try {
      const fieldRef = doc(db, 'fields', id);
      await deleteDoc(fieldRef);
    } catch (error) {
      console.error('Error deleting field:', error);
      throw error;
    }
  },
};

// Servicio para Equipos
export const teamsService = {
  // Obtener equipos por categoría
  async getTeamsByCategory(categoryId: string): Promise<Team[]> {
    try {
      const teamsRef = collection(db, 'teams');
      const q = query(
        teamsRef, 
        where('categoryId', '==', categoryId),
        orderBy('registrationDate', 'desc')
      );
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          registrationDate: parseFirestoreDate(data.registrationDate),
          createdAt: parseFirestoreDate(data.createdAt),
          updatedAt: parseFirestoreDate(data.updatedAt),
        } as Team;
      });
    } catch (error) {
      console.error('Error fetching teams:', error);
      throw error;
    }
  },

  // Obtener equipos por temporada
  async getTeamsBySeason(seasonId: string): Promise<Team[]> {
    try {
      const teamsRef = collection(db, 'teams');
      const q = query(
        teamsRef, 
        where('seasonId', '==', seasonId),
        orderBy('name', 'asc')
      );
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          registrationDate: parseFirestoreDate(data.registrationDate),
          createdAt: parseFirestoreDate(data.createdAt),
          updatedAt: parseFirestoreDate(data.updatedAt),
        } as Team;
      });
    } catch (error) {
      console.error('Error fetching teams by season:', error);
      throw error;
    }
  },

  // Obtener equipo por ID
  async getTeamById(id: string): Promise<Team | null> {
    try {
      const teamRef = doc(db, 'teams', id);
      const teamDoc = await getDoc(teamRef);
      
      if (teamDoc.exists()) {
        const data = teamDoc.data();
        return {
          id: teamDoc.id,
          ...data,
          registrationDate: parseFirestoreDate(data.registrationDate),
          createdAt: parseFirestoreDate(data.createdAt),
          updatedAt: parseFirestoreDate(data.updatedAt),
        } as Team;
      }
      return null;
    } catch (error) {
      console.error('Error fetching team:', error);
      throw error;
    }
  },

  // Crear equipo
  async createTeam(teamData: Omit<Team, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'playerCount' | 'stats'>): Promise<string> {
    try {
      const teamsRef = collection(db, 'teams');
      const newTeam = {
        ...teamData,
        playerCount: 0,
        stats: {
          matchesPlayed: 0,
          wins: 0,
          draws: 0,
          losses: 0,
          goalsFor: 0,
          goalsAgainst: 0,
          points: 0,
        },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      
      const docRef = await addDoc(teamsRef, newTeam);
      return docRef.id;
    } catch (error) {
      console.error('Error creating team:', error);
      throw error;
    }
  },

  // Actualizar equipo
  async updateTeam(id: string, teamData: Partial<Team>): Promise<void> {
    try {
      const teamRef = doc(db, 'teams', id);
      await updateDoc(teamRef, {
        ...teamData,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error updating team:', error);
      throw error;
    }
  },

  // Eliminar equipo
  async deleteTeam(id: string): Promise<void> {
    try {
      const teamRef = doc(db, 'teams', id);
      await deleteDoc(teamRef);
    } catch (error) {
      console.error('Error deleting team:', error);
      throw error;
    }
  },

  // Actualizar estadísticas del equipo
  async updateTeamStats(teamId: string, stats: Partial<Team['stats']>): Promise<void> {
    try {
      const teamRef = doc(db, 'teams', teamId);
      await updateDoc(teamRef, {
        'stats': stats,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error updating team stats:', error);
      throw error;
    }
  },

  // Cambiar estado del equipo
  async updateTeamStatus(teamId: string, status: Team['status']): Promise<void> {
    try {
      const teamRef = doc(db, 'teams', teamId);
      await updateDoc(teamRef, {
        status,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error updating team status:', error);
      throw error;
    }
  },

  // Cambiar estado de pago
  async updatePaymentStatus(teamId: string, paymentStatus: Team['paymentStatus']): Promise<void> {
    try {
      const teamRef = doc(db, 'teams', teamId);
      await updateDoc(teamRef, {
        paymentStatus,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error updating payment status:', error);
      throw error;
    }
  },

  // Obtener equipos por división
  async getTeamsByDivision(divisionId: string): Promise<Team[]> {
    try {
      const teamsRef = collection(db, 'teams');
      const q = query(
        teamsRef, 
        where('divisionId', '==', divisionId),
        orderBy('name', 'asc')
      );
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          registrationDate: parseFirestoreDate(data.registrationDate),
          createdAt: parseFirestoreDate(data.createdAt),
          updatedAt: parseFirestoreDate(data.updatedAt),
        } as Team;
      });
    } catch (error) {
      console.error('Error fetching teams by division:', error);
      throw error;
    }
  },

  // Obtener TODOS los equipos
  async getAllTeams(): Promise<Team[]> {
    try {
      const teamsRef = collection(db, 'teams');
      const q = query(teamsRef, orderBy('name', 'asc'));
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          registrationDate: parseFirestoreDate(data.registrationDate),
          createdAt: parseFirestoreDate(data.createdAt),
          updatedAt: parseFirestoreDate(data.updatedAt),
        } as Team;
      });
    } catch (error) {
      console.error('Error fetching all teams:', error);
      throw error;
    }
  },
};

// Servicio para Jugadores
export const playersService = {
  // Obtener jugadores por equipo
  async getPlayersByTeam(teamId: string): Promise<Player[]> {
    try {
      const playersRef = collection(db, 'players');
      const q = query(
        playersRef, 
        where('teamId', '==', teamId),
        orderBy('number', 'asc')
      );
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          dateOfBirth: parseFirestoreDate(data.dateOfBirth),
          registrationDate: parseFirestoreDate(data.registrationDate),
          createdAt: parseFirestoreDate(data.createdAt),
          updatedAt: parseFirestoreDate(data.updatedAt),
        } as Player;
      });
    } catch (error) {
      console.error('Error fetching players:', error);
      throw error;
    }
  },

  // Obtener jugador por ID
  async getPlayerById(id: string): Promise<Player | null> {
    try {
      const playerRef = doc(db, 'players', id);
      const playerDoc = await getDoc(playerRef);
      
      if (playerDoc.exists()) {
        const data = playerDoc.data();
        return {
          id: playerDoc.id,
          ...data,
          dateOfBirth: parseFirestoreDate(data.dateOfBirth),
          registrationDate: parseFirestoreDate(data.registrationDate),
          createdAt: parseFirestoreDate(data.createdAt),
          updatedAt: parseFirestoreDate(data.updatedAt),
        } as Player;
      }
      return null;
    } catch (error) {
      console.error('Error fetching player:', error);
      throw error;
    }
  },

  // Crear jugador
  async createPlayer(playerData: Omit<Player, 'id' | 'createdAt' | 'updatedAt' | 'stats'>): Promise<string> {
    try {
      const playersRef = collection(db, 'players');
      const newPlayer = {
        ...playerData,
        stats: {
          matchesPlayed: 0,
          goals: 0,
          assists: 0,
          yellowCards: 0,
          redCards: 0,
          cleanSheets: 0,
        },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      
      const docRef = await addDoc(playersRef, newPlayer);
      
      // Actualizar contador de jugadores en el equipo
      if (playerData.teamId) {
        const team = await teamsService.getTeamById(playerData.teamId);
        if (team) {
          await teamsService.updateTeam(playerData.teamId, {
            playerCount: team.playerCount + 1
          });
        }
      }
      
      return docRef.id;
    } catch (error) {
      console.error('Error creating player:', error);
      throw error;
    }
  },

  // Actualizar jugador
  async updatePlayer(id: string, playerData: Partial<Player>): Promise<void> {
    try {
      const playerRef = doc(db, 'players', id);
      await updateDoc(playerRef, {
        ...playerData,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error updating player:', error);
      throw error;
    }
  },

  // Eliminar jugador
  async deletePlayer(id: string): Promise<void> {
    try {
      // Obtener jugador primero para actualizar el contador del equipo
      const player = await this.getPlayerById(id);
      
      const playerRef = doc(db, 'players', id);
      await deleteDoc(playerRef);
      
      // Actualizar contador de jugadores en el equipo
      if (player && player.teamId) {
        const team = await teamsService.getTeamById(player.teamId);
        if (team && team.playerCount > 0) {
          await teamsService.updateTeam(player.teamId, {
            playerCount: team.playerCount - 1
          });
        }
      }
    } catch (error) {
      console.error('Error deleting player:', error);
      throw error;
    }
  },

  // Actualizar estadísticas del jugador
  async updatePlayerStats(playerId: string, stats: Partial<Player['stats']>): Promise<void> {
    try {
      const playerRef = doc(db, 'players', playerId);
      await updateDoc(playerRef, {
        'stats': stats,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error updating player stats:', error);
      throw error;
    }
  },

  // Cambiar estado del jugador
  async updatePlayerStatus(playerId: string, status: Player['status']): Promise<void> {
    try {
      const playerRef = doc(db, 'players', playerId);
      await updateDoc(playerRef, {
        status,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error updating player status:', error);
      throw error;
    }
  },

  // Designar capitán
  async setTeamCaptain(teamId: string, playerId: string): Promise<void> {
    try {
      // Primero, quitar capitán anterior si existe
      const players = await this.getPlayersByTeam(teamId);
      const previousCaptain = players.find(p => p.isCaptain);
      
      if (previousCaptain) {
        await this.updatePlayer(previousCaptain.id, {
          isCaptain: false
        });
      }
      
      // Designar nuevo capitán
      await this.updatePlayer(playerId, {
        isCaptain: true
      });
      
      // Actualizar equipo con ID del capitán
      await teamsService.updateTeam(teamId, {
        captainId: playerId
      });
    } catch (error) {
      console.error('Error setting team captain:', error);
      throw error;
    }
  },

  // Designar vice-capitán
  async setTeamViceCaptain(teamId: string, playerId: string): Promise<void> {
    try {
      // Primero, quitar vice-capitán anterior si existe
      const players = await this.getPlayersByTeam(teamId);
      const previousViceCaptain = players.find(p => p.isViceCaptain);
      
      if (previousViceCaptain) {
        await this.updatePlayer(previousViceCaptain.id, {
          isViceCaptain: false
        });
      }
      
      // Designar nuevo vice-capitán
      await this.updatePlayer(playerId, {
        isViceCaptain: true
      });
    } catch (error) {
      console.error('Error setting team vice-captain:', error);
      throw error;
    }
  },

  // Obtener todos los jugadores por temporada
  async getPlayersBySeason(seasonId: string): Promise<Player[]> {
    try {
      // Primero obtener todos los equipos de la temporada
      const teams = await teamsService.getTeamsBySeason(seasonId);
      const allPlayers: Player[] = [];
      
      // Para cada equipo, obtener sus jugadores
      for (const team of teams) {
        const teamPlayers = await this.getPlayersByTeam(team.id);
        allPlayers.push(...teamPlayers);
      }
      
      return allPlayers;
    } catch (error) {
      console.error('Error fetching players by season:', error);
      throw error;
    }
  },

  // Obtener TODOS los jugadores
  async getAllPlayers(): Promise<Player[]> {
    try {
      const playersRef = collection(db, 'players');
      const q = query(playersRef, orderBy('lastName', 'asc'), orderBy('name', 'asc'));
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          dateOfBirth: parseFirestoreDate(data.dateOfBirth),
          registrationDate: parseFirestoreDate(data.registrationDate),
          createdAt: parseFirestoreDate(data.createdAt),
          updatedAt: parseFirestoreDate(data.updatedAt),
        } as Player;
      });
    } catch (error) {
      console.error('Error fetching all players:', error);
      throw error;
    }
  },

  // Obtener jugadores por categoría
  async getPlayersByCategory(categoryId: string): Promise<Player[]> {
    try {
      // Primero obtener todos los equipos de la categoría
      const teams = await teamsService.getTeamsByCategory(categoryId);
      const allPlayers: Player[] = [];
      
      // Para cada equipo, obtener sus jugadores
      for (const team of teams) {
        const teamPlayers = await this.getPlayersByTeam(team.id);
        allPlayers.push(...teamPlayers);
      }
      
      return allPlayers;
    } catch (error) {
      console.error('Error fetching players by category:', error);
      throw error;
    }
  },

  // Obtener jugadores por división
  async getPlayersByDivision(divisionId: string): Promise<Player[]> {
    try {
      // Primero obtener todos los equipos de la división
      const teams = await teamsService.getTeamsByDivision(divisionId);
      const allPlayers: Player[] = [];
      
      // Para cada equipo, obtener sus jugadores
      for (const team of teams) {
        const teamPlayers = await this.getPlayersByTeam(team.id);
        allPlayers.push(...teamPlayers);
      }
      
      return allPlayers;
    } catch (error) {
      console.error('Error fetching players by division:', error);
      throw error;
    }
  },

  // Buscar jugadores
  async searchPlayers(searchTerm: string): Promise<Player[]> {
    try {
      const players = await this.getAllPlayers();
      const searchLower = searchTerm.toLowerCase();
      
      return players.filter(player => 
        player.name.toLowerCase().includes(searchLower) ||
        player.lastName.toLowerCase().includes(searchLower) ||
        player.email?.toLowerCase().includes(searchLower) ||
        player.phone?.includes(searchTerm)
      );
    } catch (error) {
      console.error('Error searching players:', error);
      throw error;
    }
  },
};

// Servicio para Partidos
export const matchesService = {
  // Obtener partidos por temporada
  async getMatches(seasonId?: string): Promise<Match[]> {
    try {
      const matchesRef = collection(db, 'matches');
      let q;
      
      if (seasonId) {
        q = query(matchesRef, where('seasonId', '==', seasonId));
      } else {
        q = query(matchesRef, orderBy('matchDate', 'asc'));
      }
      
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          matchDate: parseFirestoreDate(data.matchDate),
          createdAt: parseFirestoreDate(data.createdAt),
          updatedAt: parseFirestoreDate(data.updatedAt),
        } as Match;
      });
    } catch (error) {
      console.error('Error fetching matches:', error);
      throw error;
    }
  },

  // Obtener partidos por división
  async getMatchesByDivision(divisionId: string): Promise<Match[]> {
    try {
      const matchesRef = collection(db, 'matches');
      const q = query(
        matchesRef, 
        where('divisionId', '==', divisionId),
        orderBy('matchDate', 'asc')
      );
      
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          matchDate: parseFirestoreDate(data.matchDate),
          createdAt: parseFirestoreDate(data.createdAt),
          updatedAt: parseFirestoreDate(data.updatedAt),
        } as Match;
      });
    } catch (error) {
      console.error('Error fetching matches by division:', error);
      throw error;
    }
  },

  // Obtener partido por ID
  async getMatchById(id: string): Promise<Match | null> {
    try {
      const matchRef = doc(db, 'matches', id);
      const matchDoc = await getDoc(matchRef);
      
      if (matchDoc.exists()) {
        const data = matchDoc.data();
        return {
          id: matchDoc.id,
          ...data,
          matchDate: parseFirestoreDate(data.matchDate),
          createdAt: parseFirestoreDate(data.createdAt),
          updatedAt: parseFirestoreDate(data.updatedAt),
        } as Match;
      }
      return null;
    } catch (error) {
      console.error('Error fetching match:', error);
      throw error;
    }
  },

  // Crear partido
  async createMatch(matchData: Omit<Match, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy'>): Promise<string> {
    try {
      const user = auth.currentUser;
      const matchesRef = collection(db, 'matches');
      const newMatch = {
        ...matchData,
        createdBy: user?.uid || '',
        updatedBy: user?.uid || '',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      
      const docRef = await addDoc(matchesRef, newMatch);
      return docRef.id;
    } catch (error) {
      console.error('Error creating match:', error);
      throw error;
    }
  },

  // Actualizar partido
  async updateMatch(id: string, matchData: Partial<Match>): Promise<void> {
    try {
      const user = auth.currentUser;
      const matchRef = doc(db, 'matches', id);
      await updateDoc(matchRef, {
        ...matchData,
        updatedBy: user?.uid || '',
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error updating match:', error);
      throw error;
    }
  },

  // Eliminar partido
  async deleteMatch(id: string): Promise<void> {
    try {
      const matchRef = doc(db, 'matches', id);
      await deleteDoc(matchRef);
    } catch (error) {
      console.error('Error deleting match:', error);
      throw error;
    }
  },

  // Actualizar resultado del partido
  async updateMatchResult(
    matchId: string, 
    homeScore: number, 
    awayScore: number,
    notes?: string,
    resultDetails?: Match['resultDetails']
  ): Promise<void> {
    try {
      const user = auth.currentUser;
      const matchRef = doc(db, 'matches', matchId);
      
      let winner: 'home' | 'away' | 'draw' | undefined;
      if (homeScore > awayScore) {
        winner = 'home';
      } else if (awayScore > homeScore) {
        winner = 'away';
      } else {
        winner = 'draw';
      }
      
      const updateData: any = {
        homeScore,
        awayScore,
        winner,
        status: 'completed',
        updatedBy: user?.uid || '',
        updatedAt: serverTimestamp(),
      };
      
      if (notes) updateData.notes = notes;
      if (resultDetails) updateData.resultDetails = resultDetails;
      
      await updateDoc(matchRef, updateData);
    } catch (error) {
      console.error('Error updating match result:', error);
      throw error;
    }
  },

  // Obtener partidos por equipo
  async getMatchesByTeam(teamId: string): Promise<Match[]> {
    try {
      const matchesRef = collection(db, 'matches');
      const q = query(
        matchesRef,
        where('homeTeamId', '==', teamId)
      );
      
      const q2 = query(
        matchesRef,
        where('awayTeamId', '==', teamId)
      );
      
      const [snapshot1, snapshot2] = await Promise.all([
        getDocs(q),
        getDocs(q2)
      ]);
      
      const matches: Match[] = [];
      
      snapshot1.docs.forEach(doc => {
        const data = doc.data();
        matches.push({
          id: doc.id,
          ...data,
          matchDate: parseFirestoreDate(data.matchDate),
          createdAt: parseFirestoreDate(data.createdAt),
          updatedAt: parseFirestoreDate(data.updatedAt),
        } as Match);
      });
      
      snapshot2.docs.forEach(doc => {
        const data = doc.data();
        matches.push({
          id: doc.id,
          ...data,
          matchDate: parseFirestoreDate(data.matchDate),
          createdAt: parseFirestoreDate(data.createdAt),
          updatedAt: parseFirestoreDate(data.updatedAt),
        } as Match);
      });
      
      // Ordenar por fecha
      return matches.sort((a, b) => 
        new Date(a.matchDate).getTime() - new Date(b.matchDate).getTime()
      );
    } catch (error) {
      console.error('Error fetching matches by team:', error);
      throw error;
    }
  },

  // Generar calendario de temporada
  // Generar calendario de temporada CON FÓRMULA MIXTA (9 jornadas)
async generateSeasonCalendar(
  seasonId: string,
  divisionId: string,
  teams: Team[],
  isDoubleRoundRobin: boolean = false // Cambiado a false por defecto
): Promise<Match[]> {
  try {
    const user = auth.currentUser;
    const createdMatches: Match[] = [];
    const teamCount = teams.length;
    
    if (teamCount < 2) {
      throw new Error('Se necesitan al menos 2 equipos para generar un calendario');
    }
    
    // Obtener categoría de la división
    const categories = await categoriesService.getCategoriesByDivision(divisionId);
    if (categories.length === 0) {
      throw new Error('No hay categorías en esta división');
    }
    
    const categoryId = categories[0].id;
    
    // Obtener campos disponibles
    const fields = await fieldsService.getFields();
    if (fields.length === 0) {
      throw new Error('No hay campos disponibles');
    }
    
    // Obtener árbitros disponibles
    const referees = await refereesService.getReferees(seasonId);
    
    // CONFIGURACIÓN DE TEMPORADA - 9 JORNADAS FIJAS
    const TOTAL_JORNADAS = 9;
    const PARTIDOS_POR_EQUIPO = 8;
    
    // 1. DETERMINAR FÓRMULA SEGÚN NÚMERO DE EQUIPOS
    let partidosUnicosPorEquipo: number;
    let repeticionesNecesarias: number;
    let tieneBYE: boolean = false;
    
    switch (teamCount) {
      case 9:
        // Fórmula perfecta: 8 partidos + 1 BYE
        partidosUnicosPorEquipo = 8; // Juega contra todos
        repeticionesNecesarias = 0;
        tieneBYE = true;
        break;
        
      case 8:
        // 7 partidos únicos + 1 repetición
        partidosUnicosPorEquipo = 7; // Juega contra 7 rivales
        repeticionesNecesarias = 1;  // Repite 1 rival
        tieneBYE = false;
        break;
        
      case 7:
        // 6 partidos únicos + 2 repeticiones
        partidosUnicosPorEquipo = 6;
        repeticionesNecesarias = 2;
        tieneBYE = false;
        break;
        
      case 6:
        // 5 partidos únicos + 3 repeticiones
        partidosUnicosPorEquipo = 5;
        repeticionesNecesarias = 3;
        tieneBYE = false;
        break;
        
      default:
        // Para otros tamaños, usar fórmula proporcional
        if (teamCount > 9) {
          // Dividir en grupos o ajustar fórmula
          throw new Error(`Para ${teamCount} equipos, se recomienda dividir en grupos de 8-9 equipos`);
        } else {
          // Para grupos pequeños (<6), usar jornadas dobles
          partidosUnicosPorEquipo = teamCount - 1;
          repeticionesNecesarias = PARTIDOS_POR_EQUIPO - partidosUnicosPorEquipo;
          tieneBYE = false;
        }
    }
    
    console.log(`Generando calendario para ${teamCount} equipos:`);
    console.log(`- Partidos únicos por equipo: ${partidosUnicosPorEquipo}`);
    console.log(`- Repeticiones necesarias: ${repeticionesNecesarias}`);
    console.log(`- Tiene BYE: ${tieneBYE}`);
    
    // 2. GENERAR ROUND-ROBIN BÁSICO (partidos únicos)
    const partidosUnicos: Array<{homeIdx: number, awayIdx: number, round: number}> = [];
    const teamIndices = [...Array(teamCount).keys()];
    
    // Generar round-robin estándar
    for (let round = 0; round < partidosUnicosPorEquipo; round++) {
      for (let i = 0; i < teamCount / 2; i++) {
        const homeIdx = teamIndices[i];
        const awayIdx = teamIndices[teamCount - 1 - i];
        
        if (homeIdx !== undefined && awayIdx !== undefined && homeIdx !== awayIdx) {
          partidosUnicos.push({
            homeIdx,
            awayIdx,
            round: round + 1
          });
        }
      }
      
      // Rotación round-robin (algoritmo estándar)
      const last = teamIndices.pop();
      if (last !== undefined) {
        teamIndices.splice(1, 0, last);
      }
    }
    
    // 3. SELECCIONAR RIVALES A REPETIR (si es necesario)
    const repeticiones: Array<{homeIdx: number, awayIdx: number, round: number}> = [];
    
    if (repeticionesNecesarias > 0) {
      // Estrategia simple: repetir primeros rivales del round-robin
      for (let r = 0; r < repeticionesNecesarias; r++) {
        const roundBase = partidosUnicosPorEquipo + r;
        
        // Tomar partidos de las primeras rondas para repetir
        const partidosARepetir = partidosUnicos
          .filter(p => p.round === (r % partidosUnicosPorEquipo) + 1)
          .slice(0, Math.ceil(teamCount / 2));
        
        partidosARepetir.forEach(partido => {
          repeticiones.push({
            homeIdx: partido.awayIdx, // Intercambiar localía
            awayIdx: partido.homeIdx,
            round: roundBase + 1
          });
        });
      }
    }
    
    // 4. ASIGNAR BYE A GRUPOS DE 9
    const equiposConBYE: number[] = [];
    if (tieneBYE && teamCount === 9) {
      // Cada equipo tiene 1 BYE en diferente jornada
      for (let equipoIdx = 0; equipoIdx < teamCount; equipoIdx++) {
        equiposConBYE.push(equipoIdx);
      }
    }
    
    // 5. COMBINAR TODOS LOS PARTIDOS Y ASIGNAR FECHAS/HORARIOS
    const todosLosPartidos = [...partidosUnicos, ...repeticiones];
    
    // Agrupar por jornada
    const partidosPorJornada: Record<number, typeof todosLosPartidos> = {};
    
    todosLosPartidos.forEach(partido => {
      if (!partidosPorJornada[partido.round]) {
        partidosPorJornada[partido.round] = [];
      }
      partidosPorJornada[partido.round].push(partido);
    });
    
    // 6. ASIGNAR FECHAS Y HORARIOS REALES
    // Fechas base (ejemplo: empezar en 2 semanas)
    const fechaBase = new Date();
    fechaBase.setDate(fechaBase.getDate() + 14); // 2 semanas después
    fechaBase.setHours(0, 0, 0, 0);
    
    // Horarios disponibles (sábados y domingos)
    const horarios = ['09:00', '11:00', '13:00', '15:00', '17:00', '19:00'];
    
    // 7. CREAR PARTIDOS EN FIRESTORE
    for (let jornada = 1; jornada <= TOTAL_JORNADAS; jornada++) {
      const partidosJornada = partidosPorJornada[jornada] || [];
      const fechaPartido = new Date(fechaBase);
      fechaPartido.setDate(fechaBase.getDate() + ((jornada - 1) * 7)); // Una semana por jornada
      
      // Asegurar que sea fin de semana (sábado)
      const diaSemana = fechaPartido.getDay();
      if (diaSemana !== 6) { // 6 = sábado
        const ajuste = (6 - diaSemana + 7) % 7;
        fechaPartido.setDate(fechaPartido.getDate() + ajuste);
      }
      
      // Asignar horarios a los partidos de esta jornada
      for (const [indexPartido, partido] of partidosJornada.entries()) {
        const homeTeam = teams[partido.homeIdx];
        const awayTeam = teams[partido.awayIdx];
        
        // Asignar campo rotando
        const fieldIndex = (jornada + indexPartido) % fields.length;
        const field = fields[fieldIndex];
        
        // Asignar horario
        const horarioIndex = indexPartido % horarios.length;
        const matchTime = horarios[horarioIndex];
        
        // Asignar árbitro si hay disponibles
        let refereeId: string | undefined = undefined;
        let refereeName: string | undefined = undefined;
        
        if (referees.length > 0) {
          const refereeIndex = (jornada + indexPartido) % referees.length;
          const referee = referees[refereeIndex];
          refereeId = referee.id;
          refereeName = referee.fullName; // Usa fullName según tu interfaz
        }
        
        // Datos del partido - Tipo correcto
        const matchData: Omit<Match, 'id' | 'createdAt' | 'updatedAt' | 'homeTeam' | 'awayTeam'> = {
          // IDs de referencia
          seasonId,
          divisionId,
          categoryId,
          fieldId: field.id,
          
          // Equipos (solo IDs)
          homeTeamId: homeTeam.id,
          awayTeamId: awayTeam.id,
          
          // Fecha y hora
          matchDate: fechaPartido,
          matchTime,
          
          // Información de ronda
          round: jornada,
          isPlayoff: false,
          status: 'scheduled' as const,
          
          // Árbitro (opcional)
          ...(refereeId && { refereeId }),
          ...(refereeName && { refereeName }),
          
          // Notas
          notes: `Jornada ${jornada} - ${field.name}`,
          
          // Campos de sistema (requeridos)
          createdBy: user?.uid || 'system',
          updatedBy: user?.uid || 'system',
          
          // Campos opcionales (se pueden omitir)
          // Estos campos son opcionales en tu interfaz Match:
          // homeScore, awayScore, winner, resultDetails, videoUrl,
          // spectators, weather, statsSubmitted, statsSubmittedBy,
          // statsSubmittedAt, playoffStage
        };
        
        try {
          // Crear partido de forma síncrona en este bucle
          const matchId = await this.createMatch(matchData);
          const match = await this.getMatchById(matchId);
          if (match) createdMatches.push(match);
        } catch (error) {
          console.error(`Error creando partido ${homeTeam.name} vs ${awayTeam.name}:`, error);
        }
      }
    }
    
    // 8. REGISTRAR BYE SI APLICA
    if (tieneBYE && teamCount === 9) {
      console.log(`Nota: Grupo de 9 equipos - Cada equipo tendrá 1 jornada de descanso (BYE)`);
      
      // Registrar BYEs en el sistema (opcional)
      for (let equipoIdx = 0; equipoIdx < teamCount; equipoIdx++) {
        const equipo = teams[equipoIdx];
        const jornadaBYE = (equipoIdx % 9) + 1;
        
        console.log(`${equipo.name}: BYE en Jornada ${jornadaBYE}`);
        
        // Podrías crear un registro especial o evento de calendario
        try {
          const byeEventData = {
            type: 'bye' as const,
            title: `Descanso - ${equipo.name}`,
            description: `Jornada ${jornadaBYE}: ${equipo.name} tiene día libre`,
            startDate: new Date(fechaBase.getTime() + ((jornadaBYE - 1) * 7 * 24 * 60 * 60 * 1000)),
            endDate: new Date(fechaBase.getTime() + ((jornadaBYE - 1) * 7 * 24 * 60 * 60 * 1000) + (2 * 60 * 60 * 1000)),
            allDay: false,
            teamId: equipo.id,
            color: '#6B7280',
            textColor: '#FFFFFF',
            notifyParticipants: false,
            createdBy: user?.uid || 'system'
          };
          
          // Si tienes un servicio de eventos, podrías crearlo
          // await calendarService.createCalendarEvent(byeEventData);
        } catch (error) {
          console.error(`Error registrando BYE para ${equipo.name}:`, error);
        }
      }
    }
    
    // 9. VALIDAR QUE TODOS LOS EQUIPOS TENGAN PARTIDOS CORRECTOS
    const partidosPorEquipo: Record<string, number> = {};
    const equiposConPartidosIncorrectos: string[] = [];
    
    teams.forEach((team, idx) => {
      const partidosCount = todosLosPartidos.filter(p => 
        p.homeIdx === idx || p.awayIdx === idx
      ).length;
      
      partidosPorEquipo[team.name] = partidosCount;
      
      // Validación: Para grupos sin BYE, deben tener 8 partidos
      if (!tieneBYE && partidosCount !== PARTIDOS_POR_EQUIPO) {
        equiposConPartidosIncorrectos.push(`${team.name} (${partidosCount} partidos)`);
      }
      
      // Para grupos con BYE (9 equipos), deben tener 8 partidos
      if (tieneBYE && partidosCount !== 8) {
        equiposConPartidosIncorrectos.push(`${team.name} (${partidosCount} partidos, debería tener 8)`);
      }
    });
    
    // Mostrar resumen
    console.log('=== RESUMEN DEL CALENDARIO GENERADO ===');
    console.log(`Total de equipos: ${teamCount}`);
    console.log(`Total de partidos creados: ${createdMatches.length}`);
    console.log(`Total de jornadas: ${TOTAL_JORNADAS}`);
    console.log('Partidos por equipo:', partidosPorEquipo);
    
    if (equiposConPartidosIncorrectos.length > 0) {
      console.warn('⚠️ Equipos con número de partidos incorrecto:', equiposConPartidosIncorrectos);
    } else {
      console.log('✅ Todos los equipos tienen el número correcto de partidos');
    }
    
    // Mostrar distribución por jornada
    console.log('Distribución por jornada:');
    for (let jornada = 1; jornada <= TOTAL_JORNADAS; jornada++) {
      const partidosEnJornada = partidosPorJornada[jornada]?.length || 0;
      console.log(`  Jornada ${jornada}: ${partidosEnJornada} partidos`);
    }
    
    // 10. CONVERTIR PARTIDOS A EVENTOS DE CALENDARIO (opcional)
    try {
      if (createdMatches.length > 0) {
        // Si tienes un servicio de calendario, puedes convertir los partidos
        // await calendarService.convertMatchesToCalendarEvents(createdMatches);
        console.log(`✅ ${createdMatches.length} partidos creados exitosamente`);
      }
    } catch (error) {
      console.error('Error convirtiendo partidos a eventos de calendario:', error);
    }
    
    return createdMatches;
    
  } catch (error) {
    console.error('Error generating season calendar:', error);
    throw error;
  }
},












  // Obtener próximos partidos
  async getUpcomingMatches(limit: number = 10): Promise<Match[]> {
    try {
      const now = new Date();
      const matchesRef = collection(db, 'matches');
      const q = query(
        matchesRef,
        where('matchDate', '>=', now),
        where('status', '==', 'scheduled'),
        orderBy('matchDate', 'asc'),
        orderBy('matchTime', 'asc')
      );
      
      const querySnapshot = await getDocs(q);
      const matches = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          matchDate: parseFirestoreDate(data.matchDate),
          createdAt: parseFirestoreDate(data.createdAt),
          updatedAt: parseFirestoreDate(data.updatedAt),
        } as Match;
      });
      
      return matches.slice(0, limit);
    } catch (error) {
      console.error('Error fetching upcoming matches:', error);
      throw error;
    }
  },
};

// Servicio para Árbitros
export const refereesService = {
  // Obtener árbitros por temporada
  async getReferees(seasonId?: string): Promise<Referee[]> {
    try {
      const refereesRef = collection(db, 'referees');
      let q;
      
      if (seasonId) {
        q = query(refereesRef, where('seasonId', '==', seasonId));
      } else {
        q = query(refereesRef, orderBy('lastName', 'asc'));
      }
      
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          birthDate: parseFirestoreDate(data.birthDate),
          licenseExpiry: parseFirestoreDate(data.licenseExpiry),
          createdAt: parseFirestoreDate(data.createdAt),
          updatedAt: parseFirestoreDate(data.updatedAt),
        } as Referee;
      });
    } catch (error) {
      console.error('Error fetching referees:', error);
      throw error;
    }
  },

  // Obtener árbitro por ID
  async getRefereeById(id: string): Promise<Referee | null> {
    try {
      const refereeRef = doc(db, 'referees', id);
      const refereeDoc = await getDoc(refereeRef);
      
      if (refereeDoc.exists()) {
        const data = refereeDoc.data();
        return {
          id: refereeDoc.id,
          ...data,
          birthDate: parseFirestoreDate(data.birthDate),
          licenseExpiry: parseFirestoreDate(data.licenseExpiry),
          createdAt: parseFirestoreDate(data.createdAt),
          updatedAt: parseFirestoreDate(data.updatedAt),
        } as Referee;
      }
      return null;
    } catch (error) {
      console.error('Error fetching referee:', error);
      throw error;
    }
  },

  // Crear árbitro
  async createReferee(refereeData: Omit<Referee, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'matchesAssigned' | 'matchesCompleted'>): Promise<string> {
    try {
      const user = auth.currentUser;
      const refereesRef = collection(db, 'referees');
      const newReferee = {
        ...refereeData,
        fullName: `${refereeData.firstName} ${refereeData.lastName}`,
        matchesAssigned: 0,
        matchesCompleted: 0,
        createdBy: user?.uid || '',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      
      const docRef = await addDoc(refereesRef, newReferee);
      return docRef.id;
    } catch (error) {
      console.error('Error creating referee:', error);
      throw error;
    }
  },

  // Actualizar árbitro
  async updateReferee(id: string, refereeData: Partial<Referee>): Promise<void> {
    try {
      const user = auth.currentUser;
      const refereeRef = doc(db, 'referees', id);
      
      // Si se actualizan nombre o apellido, actualizar fullName
      const updateData: any = { ...refereeData };
      if (refereeData.firstName || refereeData.lastName) {
        const currentReferee = await this.getRefereeById(id);
        if (currentReferee) {
          updateData.fullName = `${refereeData.firstName || currentReferee.firstName} ${refereeData.lastName || currentReferee.lastName}`;
        }
      }
      
      await updateDoc(refereeRef, {
        ...updateData,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error updating referee:', error);
      throw error;
    }
  },

  // Eliminar árbitro
  async deleteReferee(id: string): Promise<void> {
    try {
      const refereeRef = doc(db, 'referees', id);
      await deleteDoc(refereeRef);
    } catch (error) {
      console.error('Error deleting referee:', error);
      throw error;
    }
  },

  // Asignar árbitro a partido
  async assignRefereeToMatch(matchId: string, refereeId: string): Promise<void> {
    try {
      const user = auth.currentUser;
      const referee = await this.getRefereeById(refereeId);
      if (!referee) throw new Error('Árbitro no encontrado');
      
      // Actualizar partido con árbitro
      await matchesService.updateMatch(matchId, {
        refereeId,
        refereeName: referee.fullName,
      });
      
      // Actualizar estadísticas del árbitro
      await this.updateReferee(refereeId, {
        matchesAssigned: referee.matchesAssigned + 1,
      });
    } catch (error) {
      console.error('Error assigning referee to match:', error);
      throw error;
    }
  },

  // Obtener árbitros disponibles por fecha y hora
  async getAvailableReferees(date: Date, time: string): Promise<Referee[]> {
    try {
      // Primero obtener todos los árbitros activos
      const allReferees = await this.getReferees();
      const activeReferees = allReferees.filter(referee => referee.isActive);
      
      // Verificar disponibilidad según día de la semana
      const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const dayOfWeek = dayNames[date.getDay()];
      
      return activeReferees.filter(referee => {
        // Verificar disponibilidad en ese día
        return referee.availability[dayOfWeek as keyof typeof referee.availability];
      });
    } catch (error) {
      console.error('Error getting available referees:', error);
      throw error;
    }
  },

  // Actualizar rating del árbitro
  async updateRefereeRating(refereeId: string, newRating: number): Promise<void> {
    try {
      const referee = await this.getRefereeById(refereeId);
      if (!referee) throw new Error('Árbitro no encontrado');
      
      // Calcular nuevo rating promedio
      const currentRating = referee.rating || 0;
      const matchesRated = referee.matchesCompleted || 0;
      const newAverage = ((currentRating * matchesRated) + newRating) / (matchesRated + 1);
      
      await this.updateReferee(refereeId, {
        rating: parseFloat(newAverage.toFixed(2)),
      });
    } catch (error) {
      console.error('Error updating referee rating:', error);
      throw error;
    }
  },

  // Incrementar partidos completados
  async incrementMatchesCompleted(refereeId: string): Promise<void> {
    try {
      const referee = await this.getRefereeById(refereeId);
      if (!referee) throw new Error('Árbitro no encontrado');
      
      await this.updateReferee(refereeId, {
        matchesCompleted: referee.matchesCompleted + 1,
      });
    } catch (error) {
      console.error('Error incrementing matches completed:', error);
      throw error;
    }
  },
};

// Servicio para Eventos de Calendario
export const calendarService = {
  // Obtener eventos del calendario por rango de fechas
  async getCalendarEvents(startDate: Date, endDate: Date, type?: CalendarEvent['type']): Promise<CalendarEvent[]> {
    try {
      const eventsRef = collection(db, 'calendarEvents');
      let q = query(
        eventsRef,
        where('startDate', '>=', startDate),
        where('startDate', '<=', endDate),
        orderBy('startDate', 'asc')
      );
      
      const querySnapshot = await getDocs(q);
      let events = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          startDate: parseFirestoreDate(data.startDate),
          endDate: parseFirestoreDate(data.endDate),
          createdAt: parseFirestoreDate(data.createdAt),
          updatedAt: parseFirestoreDate(data.updatedAt),
        } as CalendarEvent;
      });
      
      // Filtrar por tipo si se especifica
      if (type) {
        events = events.filter(event => event.type === type);
      }
      
      return events;
    } catch (error) {
      console.error('Error fetching calendar events:', error);
      throw error;
    }
  },

  // Obtener evento por ID
  async getCalendarEventById(id: string): Promise<CalendarEvent | null> {
    try {
      const eventRef = doc(db, 'calendarEvents', id);
      const eventDoc = await getDoc(eventRef);
      
      if (eventDoc.exists()) {
        const data = eventDoc.data();
        return {
          id: eventDoc.id,
          ...data,
          startDate: parseFirestoreDate(data.startDate),
          endDate: parseFirestoreDate(data.endDate),
          createdAt: parseFirestoreDate(data.createdAt),
          updatedAt: parseFirestoreDate(data.updatedAt),
        } as CalendarEvent;
      }
      return null;
    } catch (error) {
      console.error('Error fetching calendar event:', error);
      throw error;
    }
  },

  // Crear evento de calendario
  async createCalendarEvent(eventData: Omit<CalendarEvent, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>): Promise<string> {
    try {
      const user = auth.currentUser;
      const eventsRef = collection(db, 'calendarEvents');
      const newEvent = {
        ...eventData,
        createdBy: user?.uid || '',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      
      const docRef = await addDoc(eventsRef, newEvent);
      return docRef.id;
    } catch (error) {
      console.error('Error creating calendar event:', error);
      throw error;
    }
  },

  // Actualizar evento de calendario
  async updateCalendarEvent(id: string, eventData: Partial<CalendarEvent>): Promise<void> {
    try {
      const user = auth.currentUser;
      const eventRef = doc(db, 'calendarEvents', id);
      await updateDoc(eventRef, {
        ...eventData,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error updating calendar event:', error);
      throw error;
    }
  },

  // Eliminar evento de calendario
  async deleteCalendarEvent(id: string): Promise<void> {
    try {
      const eventRef = doc(db, 'calendarEvents', id);
      await deleteDoc(eventRef);
    } catch (error) {
      console.error('Error deleting calendar event:', error);
      throw error;
    }
  },

  // Convertir partidos a eventos del calendario
  async convertMatchesToCalendarEvents(matches: Match[]): Promise<void> {
    try {
      const user = auth.currentUser;
      
      for (const match of matches) {
        // Verificar si ya existe un evento para este partido
        const existingEvents = await this.getCalendarEvents(
          new Date(match.matchDate),
          new Date(match.matchDate)
        );
        
        const existingEvent = existingEvents.find(event => event.matchId === match.id);
        
        if (!existingEvent) {
          // Obtener información de los equipos
          const homeTeam = await teamsService.getTeamById(match.homeTeamId);
          const awayTeam = await teamsService.getTeamById(match.awayTeamId);
          
          const eventData: Omit<CalendarEvent, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'> = {
            type: 'match',
            title: `${homeTeam?.name || 'Equipo local'} vs ${awayTeam?.name || 'Equipo visitante'}`,
            description: `Partido de la jornada ${match.round}`,
            startDate: new Date(match.matchDate),
            endDate: new Date(new Date(match.matchDate).getTime() + 2 * 60 * 60 * 1000), // 2 horas después
            allDay: false,
            matchId: match.id,
            teamId: match.homeTeamId,
            fieldId: match.fieldId,
            color: '#3B82F6',
            textColor: '#FFFFFF',
            notifyParticipants: true,
            notificationTime: 60, // 1 hora antes
          };
          
          await this.createCalendarEvent(eventData);
        }
      }
    } catch (error) {
      console.error('Error converting matches to calendar events:', error);
      throw error;
    }
  },

  // Obtener eventos por equipo
  async getEventsByTeam(teamId: string, startDate?: Date, endDate?: Date): Promise<CalendarEvent[]> {
    try {
      const eventsRef = collection(db, 'calendarEvents');
      let q = query(eventsRef, where('teamId', '==', teamId));
      
      if (startDate && endDate) {
        q = query(
          eventsRef,
          where('teamId', '==', teamId),
          where('startDate', '>=', startDate),
          where('startDate', '<=', endDate),
          orderBy('startDate', 'asc')
        );
      }
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          startDate: parseFirestoreDate(data.startDate),
          endDate: parseFirestoreDate(data.endDate),
          createdAt: parseFirestoreDate(data.createdAt),
          updatedAt: parseFirestoreDate(data.updatedAt),
        } as CalendarEvent;
      });
    } catch (error) {
      console.error('Error fetching events by team:', error);
      throw error;
    }
  },

  // Obtener eventos por campo
  async getEventsByField(fieldId: string, date: Date): Promise<CalendarEvent[]> {
    try {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      
      const eventsRef = collection(db, 'calendarEvents');
      const q = query(
        eventsRef,
        where('fieldId', '==', fieldId),
        where('startDate', '>=', startOfDay),
        where('startDate', '<=', endOfDay),
        orderBy('startDate', 'asc')
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          startDate: parseFirestoreDate(data.startDate),
          endDate: parseFirestoreDate(data.endDate),
          createdAt: parseFirestoreDate(data.createdAt),
          updatedAt: parseFirestoreDate(data.updatedAt),
        } as CalendarEvent;
      });
    } catch (error) {
      console.error('Error fetching events by field:', error);
      throw error;
    }
  },

  // Obtener eventos próximos
  async getUpcomingEvents(limit: number = 10): Promise<CalendarEvent[]> {
    try {
      const now = new Date();
      const eventsRef = collection(db, 'calendarEvents');
      const q = query(
        eventsRef,
        where('startDate', '>=', now),
        orderBy('startDate', 'asc')
      );
      
      const querySnapshot = await getDocs(q);
      const events = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          startDate: parseFirestoreDate(data.startDate),
          endDate: parseFirestoreDate(data.endDate),
          createdAt: parseFirestoreDate(data.createdAt),
          updatedAt: parseFirestoreDate(data.updatedAt),
        } as CalendarEvent;
      });
      
      return events.slice(0, limit);
    } catch (error) {
      console.error('Error fetching upcoming events:', error);
      throw error;
    }
  },
};

// Servicio para datos relacionados
export const dataService = {
  // Obtener equipo con detalles extendidos
  async getTeamWithExtendedDetails(teamId: string): Promise<any> {
    try {
      const team = await teamsService.getTeamById(teamId);
      if (!team) return null;

      // Obtener jugadores del equipo
      const players = await playersService.getPlayersByTeam(teamId);
      
      // Obtener categoría
      const category = await categoriesService.getCategoryById(team.categoryId);
      
      // Obtener división
      let division = null;
      if (category) {
        division = await divisionsService.getDivisionById(category.divisionId);
      }
      
      // Obtener temporada
      let season = null;
      if (category) {
        season = await seasonsService.getSeasonById(category.seasonId);
      }

      return {
        ...team,
        players,
        category,
        division,
        season
      };
    } catch (error) {
      console.error('Error getting team with extended details:', error);
      throw error;
    }
  },

  // Obtener jugador con detalles del equipo
  async getPlayerWithTeamDetails(playerId: string): Promise<any> {
    try {
      const player = await playersService.getPlayerById(playerId);
      if (!player) return null;

      // Obtener equipo del jugador
      let team = null;
      if (player.teamId) {
        team = await teamsService.getTeamById(player.teamId);
      }

      return {
        ...player,
        team
      };
    } catch (error) {
      console.error('Error getting player with team details:', error);
      throw error;
    }
  },

  // Obtener partido con detalles extendidos
  async getMatchWithExtendedDetails(matchId: string): Promise<any> {
    try {
      const match = await matchesService.getMatchById(matchId);
      if (!match) return null;

      // Obtener equipos
      const homeTeam = await teamsService.getTeamById(match.homeTeamId);
      const awayTeam = await teamsService.getTeamById(match.awayTeamId);
      
      // Obtener campo
      const field = await fieldsService.getFieldById(match.fieldId);
      
      // Obtener categoría
      const category = await categoriesService.getCategoryById(match.categoryId);
      
      // Obtener árbitro
      let referee = null;
      if (match.refereeId) {
        referee = await refereesService.getRefereeById(match.refereeId);
      }

      return {
        ...match,
        homeTeam,
        awayTeam,
        field,
        category,
        referee
      };
    } catch (error) {
      console.error('Error getting match with extended details:', error);
      throw error;
    }
  },

  // Obtener árbitro con estadísticas
  async getRefereeWithStats(refereeId: string): Promise<any> {
    try {
      const referee = await refereesService.getRefereeById(refereeId);
      if (!referee) return null;

      // Obtener partidos asignados
      const allMatches = await matchesService.getMatches();
      const assignedMatches = allMatches.filter(match => match.refereeId === refereeId);
      const completedMatches = assignedMatches.filter(match => match.status === 'completed');

      return {
        ...referee,
        assignedMatches: assignedMatches.length,
        completedMatches: completedMatches.length,
        upcomingMatches: assignedMatches.filter(match => match.status === 'scheduled').length,
      };
    } catch (error) {
      console.error('Error getting referee with stats:', error);
      throw error;
    }
  },
};


// Funciones específicas para PlayerDashboard
export const getPlayerMatches = async (playerId: string): Promise<Match[]> => {
  try {
    // Primero obtener el equipo del jugador
    const player = await playersService.getPlayerById(playerId);
    if (!player || !player.teamId) return [];

    // Obtener partidos del equipo
    const teamMatches = await matchesService.getMatchesByTeam(player.teamId);
    
    // Filtrar solo partidos futuros o en progreso
    const now = new Date();
    return teamMatches.filter(match => {
      const matchDate = parseFirestoreDate(match.matchDate);
      return new Date(matchDate) >= now || match.status === 'in_progress';
    }).sort((a, b) => {
      const dateA = new Date(parseFirestoreDate(a.matchDate)).getTime();
      const dateB = new Date(parseFirestoreDate(b.matchDate)).getTime();
      return dateA - dateB;
    });
  } catch (error) {
    console.error('Error obteniendo partidos del jugador:', error);
    return [];
  }
};

export const getPlayerStats = async (playerId: string): Promise<Player['stats'] | null> => {
  try {
    const player = await playersService.getPlayerById(playerId);
    return player?.stats || null;
  } catch (error) {
    console.error('Error obteniendo estadísticas del jugador:', error);
    return null;
  }
};

export const getTeamStandings = async (playerId: string): Promise<any[]> => {
  try {
    // Obtener jugador y su equipo
    const player = await playersService.getPlayerById(playerId);
    if (!player || !player.teamId) return [];

    const team = await teamsService.getTeamById(player.teamId);
    if (!team) return [];

    // Obtener todos los equipos de la misma categoría
    const teamsInCategory = await teamsService.getTeamsByCategory(team.categoryId);
    
    // Ordenar por puntos (simplificado)
    return teamsInCategory
      .filter(t => t.status === 'active')
      .map(t => ({
        id: t.id,
        name: t.name,
        matchesPlayed: t.stats?.matchesPlayed || 0,
        wins: t.stats?.wins || 0,
        losses: t.stats?.losses || 0,
        draws: t.stats?.draws || 0,
        goalsFor: t.stats?.goalsFor || 0,
        goalsAgainst: t.stats?.goalsAgainst || 0,
        points: t.stats?.points || 0
      }))
      .sort((a, b) => b.points - a.points)
      .slice(0, 8); // Limitar a los primeros 8 equipos
  } catch (error) {
    console.error('Error obteniendo tabla de posiciones:', error);
    return [];
  }
};

export const getPlayerTeam = async (playerId: string): Promise<Team | null> => {
  try {
    const player = await playersService.getPlayerById(playerId);
    if (!player || !player.teamId) return null;
    
    return await teamsService.getTeamById(player.teamId);
  } catch (error) {
    console.error('Error obteniendo equipo del jugador:', error);
    return null;
  }
};



// =============== SERVICIO DE STORAGE (FIREBASE STORAGE) ===============

export const storageService = {
  // Subir archivo
  uploadFile: async (file: File, path: string): Promise<string> => {
    try {
      console.log('Subiendo archivo:', file.name, 'a la ruta:', path);
      
      // Crear referencia al Storage
      const storageRef = ref(storage, path);
      
      // Subir el archivo
      const snapshot = await uploadBytes(storageRef, file);
      console.log('Archivo subido exitosamente:', snapshot.metadata.fullPath);
      
      // Obtener URL de descarga
      const downloadUrl = await getDownloadURL(snapshot.ref);
      console.log('URL de descarga:', downloadUrl);
      
      return downloadUrl;
    } catch (error) {
      console.error('Error subiendo archivo:', error);
      throw new Error('Error al subir el archivo: ' + (error as Error).message);
    }
  },

  // Subir logo de equipo
  uploadTeamLogo: async (file: File, teamId: string): Promise<string> => {
    try {
      // Crear nombre único para el archivo
      const timestamp = Date.now();
      const extension = file.name.split('.').pop();
      const fileName = `team-logos/${teamId}/${timestamp}.${extension}`;
      
      return await storageService.uploadFile(file, fileName);
    } catch (error) {
      console.error('Error subiendo logo del equipo:', error);
      throw error;
    }
  },

  // Subir imagen de perfil de jugador
  uploadPlayerPhoto: async (file: File, playerId: string): Promise<string> => {
    try {
      const timestamp = Date.now();
      const extension = file.name.split('.').pop();
      const fileName = `player-photos/${playerId}/${timestamp}.${extension}`;
      
      return await storageService.uploadFile(file, fileName);
    } catch (error) {
      console.error('Error subiendo foto del jugador:', error);
      throw error;
    }
  },

  // Subir imagen de campo
  uploadFieldImage: async (file: File, fieldId: string): Promise<string> => {
    try {
      const timestamp = Date.now();
      const extension = file.name.split('.').pop();
      const fileName = `field-images/${fieldId}/${timestamp}.${extension}`;
      
      return await storageService.uploadFile(file, fileName);
    } catch (error) {
      console.error('Error subiendo imagen de campo:', error);
      throw error;
    }
  },

  // Subir documentos (PDF, etc.)
  uploadDocument: async (file: File, folder: string, documentId: string): Promise<string> => {
    try {
      const timestamp = Date.now();
      const originalName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
      const fileName = `documents/${folder}/${documentId}_${timestamp}_${originalName}`;
      
      return await storageService.uploadFile(file, fileName);
    } catch (error) {
      console.error('Error subiendo documento:', error);
      throw error;
    }
  }
};


// Servicio para Pagos
export const paymentsService = {
  // Crear pago
  async createPayment(paymentData: Omit<Payment, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const paymentsRef = collection(db, 'payments');
      const newPayment = {
        ...paymentData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      
      const docRef = await addDoc(paymentsRef, newPayment);
      return docRef.id;
    } catch (error) {
      console.error('Error creating payment:', error);
      throw error;
    }
  },

  // Obtener pagos por equipo
  async getPaymentsByTeam(teamId: string): Promise<Payment[]> {
    try {
      const paymentsRef = collection(db, 'payments');
      const q = query(
        paymentsRef, 
        where('teamId', '==', teamId),
        orderBy('date', 'desc')
      );
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          date: parseFirestoreDate(data.date),
          createdAt: parseFirestoreDate(data.createdAt),
          updatedAt: parseFirestoreDate(data.updatedAt),
        } as Payment;
      });
    } catch (error) {
      console.error('Error fetching payments:', error);
      throw error;
    }
  },

  // Obtener pagos por temporada
  async getPaymentsBySeason(seasonId: string): Promise<Payment[]> {
    try {
      // Primero obtener todos los equipos de la temporada
      const teams = await teamsService.getTeamsBySeason(seasonId);
      const allPayments: Payment[] = [];
      
      // Para cada equipo, obtener sus pagos
      for (const team of teams) {
        const teamPayments = await this.getPaymentsByTeam(team.id);
        allPayments.push(...teamPayments);
      }
      
      return allPayments.sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );
    } catch (error) {
      console.error('Error fetching payments by season:', error);
      throw error;
    }
  },

  // Obtener pago por ID
  async getPaymentById(id: string): Promise<Payment | null> {
    try {
      const paymentRef = doc(db, 'payments', id);
      const paymentDoc = await getDoc(paymentRef);
      
      if (paymentDoc.exists()) {
        const data = paymentDoc.data();
        return {
          id: paymentDoc.id,
          ...data,
          date: parseFirestoreDate(data.date),
          createdAt: parseFirestoreDate(data.createdAt),
          updatedAt: parseFirestoreDate(data.updatedAt),
        } as Payment;
      }
      return null;
    } catch (error) {
      console.error('Error fetching payment:', error);
      throw error;
    }
  },

  // Actualizar pago
  async updatePayment(id: string, paymentData: Partial<Payment>): Promise<void> {
    try {
      const paymentRef = doc(db, 'payments', id);
      await updateDoc(paymentRef, {
        ...paymentData,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error updating payment:', error);
      throw error;
    }
  },

  // Eliminar pago
  async deletePayment(id: string): Promise<void> {
    try {
      const paymentRef = doc(db, 'payments', id);
      await deleteDoc(paymentRef);
    } catch (error) {
      console.error('Error deleting payment:', error);
      throw error;
    }
  },

  // Obtener resumen de pagos por equipo
  // En paymentsService.getPaymentSummary, corregir el tipo de lastPayment:
async getPaymentSummary(teamId: string): Promise<{
  totalPaid: number;
  lastPayment: Date | null; // ← Ya está bien
  paymentsCount: number;
}> {
  try {
    const payments = await this.getPaymentsByTeam(teamId);
    const totalPaid = payments.reduce((sum, payment) => sum + payment.amount, 0);
    
    // Asegurar que lastPayment sea Date | null
    let lastPayment: Date | null = null;
    if (payments.length > 0) {
      const lastPaymentDate = payments[0].date; // asumiendo que está ordenado por fecha descendente
      
      // Convertir a Date si es string
      lastPayment = typeof lastPaymentDate === 'string' 
        ? new Date(lastPaymentDate) 
        : lastPaymentDate;
    }
    
    return {
      totalPaid,
      lastPayment,
      paymentsCount: payments.length
    };
  } catch (error) {
    console.error('Error getting payment summary:', error);
    throw error;
  }
}
};










// Alias para compatibilidad con imports existentes
export const seasonService = seasonsService;
export const divisionService = divisionsService;
export const categoryService = categoriesService;
export const fieldService = fieldsService;
export const teamService = teamsService;
export const playerService = playersService;
export const matchService = matchesService;
export const refereeService = refereesService;