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

  async generateSeasonCalendar(
    seasonId: string,
    divisionId: string,
    teams: Team[],
    startDate: Date = new Date(),
    useAvailableFieldsOnly: boolean = true,
    useGroups: boolean = false,
    groupSize: number = 9,
    generateByRound: boolean = false // NUEVO: Generar por jornada
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
      let fields = await fieldsService.getFields();
      if (useAvailableFieldsOnly) {
        fields = fields.filter(f => f.status === 'available');
      }
      
      if (fields.length === 0) {
        throw new Error('No hay campos disponibles');
      }
      
      // Obtener árbitros disponibles
      const referees = await refereesService.getReferees(seasonId);
      
      // CONFIGURACIÓN
      const TOTAL_JORNADAS = 9;
      const PARTIDOS_POR_EQUIPO = 8;
      
      // Horarios personalizados
      const horarios = [
        '07:00', '08:00', '09:00', '10:00', '11:00', 
        '12:00', '13:00', '14:00', '15:00', '16:00'
      ];
      
      // ====== NUEVA LÓGICA: POR JORNADA O COMPLETO ======
      if (generateByRound) {
        // Solo generar para la jornada específica (fecha proporcionada)
        console.log(`📅 Generando calendario por jornada para fecha: ${startDate.toLocaleDateString()}`);
        return await this.generateRoundCalendar(
          seasonId,
          divisionId,
          teams,
          startDate,
          fields,
          referees,
          useGroups,
          groupSize,
          user
        );
      }
      
      // ====== LÓGICA ORIGINAL: CALENDARIO COMPLETO ======
      let grupos: Team[][] = [];
      
      // Agrupar equipos por categoría SIEMPRE (esto es clave)
      const teamsByCategory: Record<string, Team[]> = {};
      teams.forEach(team => {
        if (!teamsByCategory[team.categoryId]) {
          teamsByCategory[team.categoryId] = [];
        }
        teamsByCategory[team.categoryId].push(team);
      });
      
      // Crear grupos dentro de cada categoría
      Object.entries(teamsByCategory).forEach(([categoryId, categoryTeams]) => {
        if (useGroups && categoryTeams.length > groupSize) {
          // Dividir equipos de esta categoría en grupos
          const shuffledTeams = [...categoryTeams].sort(() => Math.random() - 0.5);
          
          for (let i = 0; i < shuffledTeams.length; i += groupSize) {
            const grupo = shuffledTeams.slice(i, i + groupSize);
            grupos.push(grupo);
            console.log(`🏆 Grupo en categoría ${categoryId}: ${grupo.length} equipos`);
          }
        } else {
          // Sin grupos, usar todos los equipos de la categoría
          grupos.push(categoryTeams);
        }
      });
      
      // Si no hay categorías definidas (fallback)
      if (grupos.length === 0) {
        if (useGroups && teamCount > groupSize) {
          const shuffledTeams = [...teams].sort(() => Math.random() - 0.5);
          for (let i = 0; i < shuffledTeams.length; i += groupSize) {
            const grupo = shuffledTeams.slice(i, i + groupSize);
            grupos.push(grupo);
          }
        } else {
          grupos = [teams];
        }
      }
      
      // ====== FÓRMULA CORREGIDA Y MEJORADA ======
      const generarCalendarioParaGrupo = async (
        grupo: Team[], 
        grupoNumero: number,
        fechaInicioGrupo: Date
      ): Promise<Match[]> => {
        const grupoMatches: Match[] = [];
        const grupoTeamCount = grupo.length;
        
        if (grupoTeamCount < 2) {
          console.log(`⚠️  Grupo ${grupoNumero} tiene menos de 2 equipos, se omite`);
          return [];
        }
        
        console.log(`\n📋 GENERANDO CALENDARIO PARA GRUPO ${grupoNumero} (${grupoTeamCount} equipos)`);
        
        // FÓRMULA MEJORADA - GARANTIZA 8 PARTIDOS POR EQUIPO
        let partidosUnicosPorEquipo: number;
        let repeticionesNecesarias: number;
        let tieneBYE: boolean = false;
        let rondasTotales: number = TOTAL_JORNADAS;
        
        // FÓRMULA ÓPTIMA PARA TODOS LOS TAMAÑOS (CORREGIDA PARA 7 EQUIPOS)
        switch (grupoTeamCount) {
          case 2:
            // Para 2 equipos: 1 partido único + 7 repeticiones = 8 partidos
            partidosUnicosPorEquipo = 1;
            repeticionesNecesarias = 7;
            tieneBYE = false;
            break;
          case 3:
            // Para 3 equipos: 2 partidos únicos + 6 repeticiones
            partidosUnicosPorEquipo = 2;
            repeticionesNecesarias = 6;
            tieneBYE = false;
            break;
          case 4:
            // Para 4 equipos: 3 partidos únicos + 5 repeticiones
            partidosUnicosPorEquipo = 3;
            repeticionesNecesarias = 5;
            tieneBYE = false;
            break;
          case 5:
            // Para 5 equipos: 4 partidos únicos + 4 repeticiones
            partidosUnicosPorEquipo = 4;
            repeticionesNecesarias = 4;
            tieneBYE = false;
            break;
          case 6:
            // Para 6 equipos: 5 partidos únicos + 3 repeticiones
            partidosUnicosPorEquipo = 5;
            repeticionesNecesarias = 3;
            tieneBYE = false;
            break;
          case 7:
            // CORREGIDO: Para 7 equipos: 6 partidos únicos + 2 repeticiones = 8 partidos
            partidosUnicosPorEquipo = 6;
            repeticionesNecesarias = 2;
            tieneBYE = false;
            break;
          case 8:
            // Para 8 equipos: 7 partidos únicos + 1 repetición
            partidosUnicosPorEquipo = 7;
            repeticionesNecesarias = 1;
            tieneBYE = false;
            break;
          case 9:
            // Para 9 equipos: 8 partidos únicos + BYE
            partidosUnicosPorEquipo = 8;
            repeticionesNecesarias = 0;
            tieneBYE = true;
            break;
          default:
            // Para 10+ equipos: fórmula adaptativa
            if (grupoTeamCount >= 10 && grupoTeamCount <= 16) {
              // Para 10-16 equipos: 8 partidos por equipo
              partidosUnicosPorEquipo = Math.min(8, grupoTeamCount - 1);
              repeticionesNecesarias = PARTIDOS_POR_EQUIPO - partidosUnicosPorEquipo;
              tieneBYE = false;
            } else {
              // Para más de 16 equipos: dividir en grupos o ajustar fórmula
              partidosUnicosPorEquipo = Math.min(8, Math.floor(grupoTeamCount / 2));
              repeticionesNecesarias = PARTIDOS_POR_EQUIPO - partidosUnicosPorEquipo;
              tieneBYE = false;
              console.log(`⚠️  Grupo grande (${grupoTeamCount} equipos), considerando división`);
            }
        }
        
        console.log(`📊 Fórmula para ${grupoTeamCount} equipos:`);
        console.log(`   - Partidos únicos: ${partidosUnicosPorEquipo}`);
        console.log(`   - Repeticiones: ${repeticionesNecesarias}`);
        console.log(`   - BYE: ${tieneBYE ? 'Sí (solo para 9 equipos)' : 'No'}`);
        console.log(`   - Total jornadas: ${rondasTotales}`);
        
        // 1. GENERAR ROUND-ROBIN MEJORADO
        const partidosUnicos: Array<{homeIdx: number, awayIdx: number, round: number}> = [];
        const teamIndices = [...Array(grupoTeamCount).keys()];
        
        // Generar partidos únicos distribuidos en las primeras jornadas
        for (let round = 0; round < Math.min(partidosUnicosPorEquipo, rondasTotales); round++) {
          // Algoritmo round-robin mejorado
          for (let i = 0; i < Math.floor(grupoTeamCount / 2); i++) {
            const homeIdx = teamIndices[i];
            const awayIdx = teamIndices[grupoTeamCount - 1 - i];
            
            if (homeIdx !== undefined && awayIdx !== undefined && homeIdx !== awayIdx) {
              partidosUnicos.push({
                homeIdx,
                awayIdx,
                round: round + 1 // Jornadas del 1 al 9
              });
            }
          }
          
          // Rotación round-robin
          teamIndices.splice(1, 0, teamIndices.pop()!);
        }
        
        // 2. GENERAR REPETICIONES DISTRIBUIDAS
        const repeticiones: Array<{homeIdx: number, awayIdx: number, round: number}> = [];
        
        if (repeticionesNecesarias > 0) {
          // Crear todas las combinaciones posibles
          const todasCombinaciones: typeof partidosUnicos = [];
          for (let i = 0; i < grupoTeamCount; i++) {
            for (let j = i + 1; j < grupoTeamCount; j++) {
              todasCombinaciones.push({
                homeIdx: i,
                awayIdx: j,
                round: 1
              });
            }
          }
          
          // Filtrar los que ya están en partidosUnicos
          const partidosYaProgramados = new Set(
            partidosUnicos.map(p => `${Math.min(p.homeIdx, p.awayIdx)}-${Math.max(p.homeIdx, p.awayIdx)}`)
          );
          
          const partidosParaRepetir = todasCombinaciones.filter(p => {
            const key = `${Math.min(p.homeIdx, p.awayIdx)}-${Math.max(p.homeIdx, p.awayIdx)}`;
            return !partidosYaProgramados.has(key);
          });
          
          // Si no hay suficientes partidos para repetir, repetir algunos ya existentes
          const partidosDisponibles = [
            ...partidosParaRepetir,
            ...partidosUnicos.map(p => ({...p, round: 1}))
          ];
          
          // Distribuir repeticiones en las jornadas restantes
          let repeticionRound = Math.min(partidosUnicosPorEquipo, rondasTotales) + 1;
          let repeticionesAsignadas = 0;
          const repeticionesTotales = repeticionesNecesarias * Math.floor(grupoTeamCount / 2);
          
          while (repeticionesAsignadas < repeticionesTotales && repeticionRound <= rondasTotales) {
            // Tomar partidos para esta ronda
            const inicio = repeticionesAsignadas % partidosDisponibles.length;
            const partidosEstaRonda = [];
            
            for (let i = 0; i < Math.floor(grupoTeamCount / 2) && partidosEstaRonda.length < repeticionesTotales - repeticionesAsignadas; i++) {
              const partido = partidosDisponibles[(inicio + i) % partidosDisponibles.length];
              partidosEstaRonda.push({
                ...partido,
                round: repeticionRound
              });
              repeticionesAsignadas++;
            }
            
            repeticiones.push(...partidosEstaRonda);
            repeticionRound++;
          }
        }
        
        // 3. COMBINAR Y ORGANIZAR
        const todosLosPartidos = [...partidosUnicos, ...repeticiones];
        const partidosPorJornada: Record<number, typeof todosLosPartidos> = {};
        
        todosLosPartidos.forEach(partido => {
          if (!partidosPorJornada[partido.round]) {
            partidosPorJornada[partido.round] = [];
          }
          partidosPorJornada[partido.round].push(partido);
        });
        
        // 4. ASIGNAR FECHAS Y HORARIOS
        const fechaBase = new Date(fechaInicioGrupo);
        fechaBase.setHours(0, 0, 0, 0);
        
        // Asegurar que sea domingo
        const diaSemanaBase = fechaBase.getDay();
        if (diaSemanaBase !== 0) {
          const ajuste = (0 - diaSemanaBase + 7) % 7;
          fechaBase.setDate(fechaBase.getDate() + ajuste);
        }
        
        // 5. CREAR PARTIDOS PARA EL GRUPO
        for (let jornada = 1; jornada <= rondasTotales; jornada++) {
          const partidosJornada = partidosPorJornada[jornada] || [];
          
          if (partidosJornada.length === 0) {
            if (tieneBYE && grupoTeamCount === 9) {
              console.log(`   Jornada ${jornada}: BYE para un equipo del grupo`);
            }
            continue;
          }
          
          const fechaPartido = new Date(fechaBase);
          fechaPartido.setDate(fechaBase.getDate() + ((jornada - 1) * 7));
          
          // Organizar partidos por horario
          const horariosDisponibles = [...horarios];
          let horarioIndex = 0;
          
          for (const [indexPartido, partido] of partidosJornada.entries()) {
            const homeTeam = grupo[partido.homeIdx];
            const awayTeam = grupo[partido.awayIdx];
            
            // Asignar horario rotativo
            const horario = horariosDisponibles[horarioIndex % horariosDisponibles.length];
            horarioIndex++;
            
            // Asignar campo (distribuir entre Cuemanco y Zague)
            const camposCuemanco = fields.filter(f => f.name.includes('Cuemanco'));
            const camposZague = fields.filter(f => f.name.includes('Zague'));
            let field: any;
            
            if (camposCuemanco.length > 0 && camposZague.length > 0) {
              // Alternar entre Cuemanco y Zague por horario
              const useCuemanco = (horarioIndex % 2) === 0;
              const camposElegidos = useCuemanco ? camposCuemanco : camposZague;
              const fieldIndex = jornada % camposElegidos.length;
              field = camposElegidos[fieldIndex];
              console.log(`   Campo asignado: ${field.name} (${useCuemanco ? 'Cuemanco' : 'Zague'})`);
            } else {
              // Fallback: usar cualquier campo disponible
              const fieldIndex = (grupoNumero + jornada + indexPartido) % fields.length;
              field = fields[fieldIndex];
            }
            
            // Asignar árbitro
            let refereeId: string | undefined = undefined;
            let refereeName: string | undefined = undefined;
            
            if (referees.length > 0) {
              const refereeIndex = (jornada + indexPartido) % referees.length;
              const referee = referees[refereeIndex];
              refereeId = referee.id;
              refereeName = referee.fullName || `${referee.firstName} ${referee.lastName}`;
            }
            
            // Datos del partido
            const matchData: Omit<Match, 'id' | 'createdAt' | 'updatedAt' | 'homeTeam' | 'awayTeam'> = {
              seasonId,
              divisionId,
              categoryId: homeTeam.categoryId || categoryId,
              fieldId: field.id,
              homeTeamId: homeTeam.id,
              awayTeamId: awayTeam.id,
              matchDate: fechaPartido,
              matchTime: horario,
              round: jornada,
              isPlayoff: false,
              status: 'scheduled' as const,
              ...(refereeId && { refereeId }),
              ...(refereeName && { refereeName }),
              notes: `Jornada ${jornada} - ${field.name} (${horario})`,
              createdBy: user?.uid || 'system',
              updatedBy: user?.uid || 'system',
            };
            
            try {
              const matchId = await this.createMatch(matchData);
              const match = await this.getMatchById(matchId);
              if (match) {
                grupoMatches.push(match);
              }
            } catch (error) {
              console.error(`     ❌ Error creando partido:`, error);
            }
          }
        }
        
        // 6. VALIDACIÓN DEL GRUPO
        const partidosPorEquipoGrupo: Record<string, number> = {};
        grupo.forEach((team, idx) => {
          const partidosCount = todosLosPartidos.filter(p => 
            p.homeIdx === idx || p.awayIdx === idx
          ).length;
          partidosPorEquipoGrupo[team.name] = partidosCount;
        });
        
        console.log(`✅ Grupo ${grupoNumero} completado:`);
        console.log(`   - Partidos creados: ${grupoMatches.length}`);
        console.log(`   - Partidos por equipo:`, partidosPorEquipoGrupo);
        
        // Verificar que todos tengan 8 partidos
        const equiposConMenos = Object.entries(partidosPorEquipoGrupo)
          .filter(([_, count]) => count < 8)
          .map(([name]) => name);
        
        if (equiposConMenos.length > 0) {
          console.warn(`   ⚠️  Equipos con menos de 8 partidos: ${equiposConMenos.join(', ')}`);
        }
        
        return grupoMatches;
      };
      
      // ====== EJECUTAR PARA CADA GRUPO ======
      console.log(`\n🏁 INICIANDO GENERACIÓN DE CALENDARIO COMPLETO`);
      console.log(`===============================================`);
      console.log(`Total de equipos: ${teamCount}`);
      console.log(`Número de grupos: ${grupos.length}`);
      console.log(`Fecha de inicio: ${startDate.toLocaleDateString()}`);
      console.log(`Usar grupos: ${useGroups ? 'Sí' : 'No'}`);
      console.log(`Generar por jornada: ${generateByRound ? 'Sí (solo una fecha)' : 'No (9 jornadas)'}`);
      
      // NOTA: No escalonar fechas - cada grupo empieza el mismo día
      // (esto es lo que solicitaste - independiente por grupo)
      for (let i = 0; i < grupos.length; i++) {
        const grupo = grupos[i];
        const grupoMatches = await generarCalendarioParaGrupo(grupo, i + 1, startDate);
        createdMatches.push(...grupoMatches);
      }
      
      // ====== VALIDACIÓN FINAL ======
      console.log(`\n📊 RESUMEN FINAL DEL CALENDARIO:`);
      console.log(`✅ Total de partidos creados: ${createdMatches.length}`);
      console.log(`✅ Total de grupos: ${grupos.length}`);
      console.log(`✅ Total de jornadas: ${TOTAL_JORNADAS}`);
      console.log(`✅ Fecha de inicio para todos: ${startDate.toLocaleDateString()}`);
      
      // Estadísticas por grupo
      grupos.forEach((grupo, index) => {
        const grupoTeams = grupo.length;
        const totalPartidosGrupo = Math.floor(grupoTeams * PARTIDOS_POR_EQUIPO / 2);
        
        console.log(`\n📋 Grupo ${index + 1}:`);
        console.log(`   - Equipos: ${grupoTeams}`);
        console.log(`   - Partidos por equipo: ${PARTIDOS_POR_EQUIPO}`);
        console.log(`   - Total partidos: ${totalPartidosGrupo}`);
        console.log(`   - Categorías únicas: ${[...new Set(grupo.map(t => t.categoryId))].length}`);
      });
      
      return createdMatches;
      
    } catch (error) {
      console.error('❌ Error generando calendario:', error);
      throw error;
    }
  },

  // ====== NUEVA FUNCIÓN: GENERAR POR JORNADA ======
  async generateRoundCalendar(
    seasonId: string,
    divisionId: string,
    teams: Team[],
    roundDate: Date,
    fields: any[],
    referees: any[],
    useGroups: boolean,
    groupSize: number,
    user: any
  ): Promise<Match[]> {
    console.log(`🎯 Generando partidos para jornada específica`);
    
    const createdMatches: Match[] = [];
    const horarios = ['07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00'];
    
    // Obtener categoría de la división para usar como fallback
    const categories = await categoriesService.getCategoriesByDivision(divisionId);
    const defaultCategoryId = categories.length > 0 ? categories[0].id : 'default';
    
    // Determinar número de jornada basado en fecha (1-9)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const roundDateCopy = new Date(roundDate);
    roundDateCopy.setHours(0, 0, 0, 0);
    
    // Calcular diferencia en semanas desde hoy
    const diffTime = roundDateCopy.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const roundNumber = Math.min(9, Math.max(1, Math.floor(diffDays / 7) + 1));
    
    console.log(`📅 Jornada calculada: ${roundNumber} para fecha ${roundDate.toLocaleDateString()}`);
    console.log(`📅 Diferencia en días: ${diffDays}, semanas: ${Math.floor(diffDays / 7)}`);
    
    // Agrupar equipos por categoría
    const teamsByCategory: Record<string, Team[]> = {};
    teams.forEach(team => {
      const catId = team.categoryId || defaultCategoryId;
      if (!teamsByCategory[catId]) {
        teamsByCategory[catId] = [];
      }
      teamsByCategory[catId].push(team);
    });
    
    console.log(`📊 Equipos agrupados por ${Object.keys(teamsByCategory).length} categorías`);
    
    // Generar partidos para cada categoría/grupo
    for (const [catId, categoryTeams] of Object.entries(teamsByCategory)) {
      let gruposEnCategoria: Team[][] = [];
      
      if (useGroups && categoryTeams.length > groupSize) {
        // Dividir en grupos
        for (let i = 0; i < categoryTeams.length; i += groupSize) {
          gruposEnCategoria.push(categoryTeams.slice(i, i + groupSize));
        }
        console.log(`   Categoría ${catId}: ${categoryTeams.length} equipos → ${gruposEnCategoria.length} grupos`);
      } else {
        gruposEnCategoria = [categoryTeams];
        console.log(`   Categoría ${catId}: ${categoryTeams.length} equipos (un solo grupo)`);
      }
      
      // Para cada grupo en esta categoría
      for (let grupoIndex = 0; grupoIndex < gruposEnCategoria.length; grupoIndex++) {
        const grupo = gruposEnCategoria[grupoIndex];
        if (grupo.length < 2) {
          console.log(`   ⚠️  Grupo ${grupoIndex + 1} tiene menos de 2 equipos, se omite`);
          continue;
        }
        
        console.log(`   🏆 Grupo ${grupoIndex + 1}: ${grupo.length} equipos`);
        
        // Generar emparejamientos para esta jornada
        const partidosJornada = this.generatePairingsForRound(grupo, roundNumber);
        
        console.log(`   🤝 ${partidosJornada.length} partidos generados para este grupo`);
        
        // Asignar horarios y campos
        let horarioIndex = 0;
        const camposCuemanco = fields.filter(f => f.name.includes('Cuemanco'));
        const camposZague = fields.filter(f => f.name.includes('Zague'));
        
        console.log(`   ⚽ Campos disponibles: ${fields.length} total, ${camposCuemanco.length} Cuemanco, ${camposZague.length} Zague`);
        
        for (const partido of partidosJornada) {
          if (horarioIndex >= horarios.length) {
            console.warn('   ⚠️  No hay más horarios disponibles para esta jornada');
            break;
          }
          
          const horario = horarios[horarioIndex];
          horarioIndex++;
          
          // Alternar entre Cuemanco y Zague
          let field: any;
          if (camposCuemanco.length > 0 && camposZague.length > 0) {
            const useCuemanco = (horarioIndex % 2) === 0;
            const camposElegidos = useCuemanco ? camposCuemanco : camposZague;
            const fieldIdx = (roundNumber + grupoIndex) % camposElegidos.length;
            field = camposElegidos[fieldIdx];
            console.log(`   🏟️  Campo asignado: ${field.name} (${useCuemanco ? 'Cuemanco' : 'Zague'}) - ${horario}`);
          } else {
            const fieldIdx = (roundNumber + grupoIndex + horarioIndex) % fields.length;
            field = fields[fieldIdx];
            console.log(`   🏟️  Campo asignado: ${field.name} - ${horario}`);
          }
          
          // Árbitro
          let refereeId: string | undefined = undefined;
          let refereeName: string | undefined = undefined;
          if (referees.length > 0) {
            const refereeIdx = (roundNumber + horarioIndex) % referees.length;
            const referee = referees[refereeIdx];
            refereeId = referee.id;
            refereeName = referee.fullName || `${referee.firstName} ${referee.lastName}`;
            console.log(`   👨‍⚖️  Árbitro asignado: ${refereeName}`);
          }
          
          // Crear partido
          const matchData: Omit<Match, 'id' | 'createdAt' | 'updatedAt' | 'homeTeam' | 'awayTeam'> = {
            seasonId,
            divisionId,
            categoryId: catId,
            fieldId: field.id,
            homeTeamId: partido.homeTeam.id,
            awayTeamId: partido.awayTeam.id,
            matchDate: roundDate,
            matchTime: horario,
            round: roundNumber,
            isPlayoff: false,
            status: 'scheduled' as const,
            ...(refereeId && { refereeId }),
            ...(refereeName && { refereeName }),
            notes: `Jornada ${roundNumber} - ${field.name} (${horario})`,
            createdBy: user?.uid || 'system',
            updatedBy: user?.uid || 'system',
          };
          
          try {
            const matchId = await this.createMatch(matchData);
            const match = await this.getMatchById(matchId);
            if (match) {
              createdMatches.push(match);
            }
          } catch (error) {
            console.error('   ❌ Error creando partido:', error);
          }
        }
      }
    }
    
    console.log(`\n✅ Jornada ${roundNumber} generada exitosamente:`);
    console.log(`   - Total partidos creados: ${createdMatches.length}`);
    console.log(`   - Fecha: ${roundDate.toLocaleDateString()}`);
    console.log(`   - Categorías procesadas: ${Object.keys(teamsByCategory).length}`);
    
    return createdMatches;
  },

  // ====== FUNCIÓN AUXILIAR: GENERAR EMPAREJAMIENTOS POR JORNADA ======
  generatePairingsForRound(teams: Team[], roundNumber: number): Array<{homeTeam: Team, awayTeam: Team}> {
    const pairings: Array<{homeTeam: Team, awayTeam: Team}> = [];
    
    if (teams.length < 2) return pairings;
    
    // Crear una copia de los equipos
    const teamsCopy = [...teams];
    
    // Si número impar, el último equipo tiene descanso (BYE)
    if (teamsCopy.length % 2 !== 0) {
      const byeTeam = teamsCopy[teamsCopy.length - 1];
      console.log(`   ⏸️  ${byeTeam.name} tiene BYE esta jornada`);
      teamsCopy.pop(); // Remover el equipo que tendrá BYE
    }
    
    // Algoritmo round-robin simple para emparejar
    const n = teamsCopy.length;
    
    for (let i = 0; i < n / 2; i++) {
      // Calcular índices usando algoritmo round-robin
      const homeIdx = i;
      const awayIdx = (n - 1 - i + roundNumber - 1) % (n - 1);
      
      if (homeIdx !== awayIdx && 
          teamsCopy[homeIdx] && teamsCopy[awayIdx] && 
          teamsCopy[homeIdx].id && teamsCopy[awayIdx].id) {
        
        // Alternar localía basado en jornada
        const isHome = (roundNumber + i) % 2 === 0;
        
        pairings.push({
          homeTeam: isHome ? teamsCopy[homeIdx] : teamsCopy[awayIdx],
          awayTeam: isHome ? teamsCopy[awayIdx] : teamsCopy[homeIdx]
        });
      }
    }
    
    // Si hay un número impar original, asegurarse de que todos jueguen
    if (teams.length % 2 !== 0 && pairings.length < Math.floor(teams.length / 2)) {
      // Añadir un partido extra si es necesario
      const remainingTeams = teamsCopy.filter(team => 
        !pairings.some(p => p.homeTeam.id === team.id || p.awayTeam.id === team.id)
      );
      
      if (remainingTeams.length >= 2) {
        pairings.push({
          homeTeam: remainingTeams[0],
          awayTeam: remainingTeams[1]
        });
      }
    }
    
    return pairings;
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
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: parseFirestoreDate(doc.data().date),
        paidDate: parseFirestoreDate(doc.data().paidDate),
        createdAt: parseFirestoreDate(doc.data().createdAt),
        updatedAt: parseFirestoreDate(doc.data().updatedAt),
      } as Payment));
    } catch (error) {
      console.error('Error fetching payments:', error);
      throw error;
    }
  },

  // ✅ Asegúrate de que este método exista
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

  // Obtener pago por ID
  async getPaymentById(id: string): Promise<Payment | null> {
    try {
      const paymentRef = doc(db, 'payments', id);
      const paymentDoc = await getDoc(paymentRef);
      
      if (paymentDoc.exists()) {
        return {
          id: paymentDoc.id,
          ...paymentDoc.data(),
          date: parseFirestoreDate(paymentDoc.data().date),
          paidDate: parseFirestoreDate(paymentDoc.data().paidDate),
          createdAt: parseFirestoreDate(paymentDoc.data().createdAt),
          updatedAt: parseFirestoreDate(paymentDoc.data().updatedAt),
        } as Payment;
      }
      return null;
    } catch (error) {
      console.error('Error fetching payment:', error);
      throw error;
    }
  },

  // Obtener resumen de pagos
  async getPaymentSummary(teamId: string): Promise<{
    total: number;
    paid: number;
    pending: number;
    overdue: number;
  }> {
    try {
      const payments = await this.getPaymentsByTeam(teamId);
      
      const total = payments.reduce((sum, payment) => sum + payment.amount, 0);
      const paid = payments
        .filter(p => p.status === 'paid')
        .reduce((sum, payment) => sum + payment.amount, 0);
      const pending = payments
        .filter(p => p.status === 'pending')
        .reduce((sum, payment) => sum + payment.amount, 0);
      const overdue = payments
        .filter(p => p.status === 'overdue')
        .reduce((sum, payment) => sum + payment.amount, 0);
      
      return { total, paid, pending, overdue };
    } catch (error) {
      console.error('Error getting payment summary:', error);
      throw error;
    }
  },
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