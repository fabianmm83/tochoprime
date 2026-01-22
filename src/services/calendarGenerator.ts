import { 
  collection, 
  addDoc, 
  doc, 
  getDocs, 
  query,
  writeBatch,
  serverTimestamp
} from 'firebase/firestore';
import { db, auth } from './firebase';
import type { Match, Team, Field } from '../types';

// Función helper para convertir fechas
const parseFirestoreDate = (dateValue: any): Date | string => {
  if (!dateValue) return new Date();
  
  if (dateValue && typeof dateValue.toDate === 'function') {
    return dateValue.toDate();
  }
  
  if (dateValue instanceof Date) {
    return dateValue;
  }
  
  if (typeof dateValue === 'string' && dateValue.includes('T')) {
    return new Date(dateValue);
  }
  
  return dateValue;
};

export const calendarGeneratorService = {
  /**
   * Genera calendario round-robin para una categoría
   */
  async generateSeasonCalendar(
    seasonId: string,
    divisionId: string,
    categoryId: string,
    teams: Team[],
    isDoubleRoundRobin: boolean = false,
    startDate: Date = new Date()
  ): Promise<{ matches: Match[], message: string }> {
    
    try {
      // Validaciones
      if (teams.length < 2 || teams.length > 8) {
        throw new Error('Se requieren entre 2 y 8 equipos para generar el calendario');
      }

      // 1. Obtener campos disponibles
      const fields = await this.getAvailableFields();
      if (fields.length === 0) {
        throw new Error('No hay campos disponibles. Configure campos primero.');
      }

      // 2. Generar fixture round-robin
      const fixtures = this.generateRoundRobin(teams);
      
      // 3. Asignar fechas y campos
      const scheduledMatches = this.scheduleMatches(
        fixtures,
        seasonId,
        divisionId,
        categoryId,
        fields,
        startDate,
        isDoubleRoundRobin
      );

      // 4. Guardar en Firestore
      await this.saveMatchesToFirestore(scheduledMatches);

      return {
        matches: scheduledMatches,
        message: `Calendario generado exitosamente: ${scheduledMatches.length} partidos creados`
      };

    } catch (error) {
      console.error('Error generando calendario:', error);
      throw error;
    }
  },

  /**
   * Algoritmo round-robin
   */
  generateRoundRobin(teams: Team[]): Array<{ home: Team, away: Team }> {
    const fixtures: Array<{ home: Team, away: Team }> = [];
    
    let participants = [...teams];
    if (participants.length % 2 !== 0) {
      participants.push({ 
        id: 'BYE', 
        name: 'Descanso',
        categoryId: '',
        seasonId: '',
        divisionId: '',
        primaryColor: '#cccccc',
        playerCount: 0,
        registrationDate: new Date(),
        status: 'active',
        paymentStatus: 'paid',
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: ''
      } as Team);
    }

    const numTeams = participants.length;
    const numRounds = numTeams - 1;
    const half = numTeams / 2;

    let teamsList = participants.map(team => team.id);

    for (let round = 0; round < numRounds; round++) {
      for (let i = 0; i < half; i++) {
        const homeIdx = i;
        const awayIdx = numTeams - 1 - i;

        if (teamsList[homeIdx] !== 'BYE' && teamsList[awayIdx] !== 'BYE') {
          const homeTeam = participants.find(t => t.id === teamsList[homeIdx])!;
          const awayTeam = participants.find(t => t.id === teamsList[awayIdx])!;
          
          fixtures.push({ home: homeTeam, away: awayTeam });
        }
      }

      teamsList = [teamsList[0], teamsList[numTeams - 1], ...teamsList.slice(1, numTeams - 1)];
    }

    return fixtures;
  },

  /**
   * Programa los partidos
   */
  scheduleMatches(
    fixtures: Array<{ home: Team, away: Team }>,
    seasonId: string,
    divisionId: string,
    categoryId: string,
    fields: Field[],
    startDate: Date,
    isDoubleRoundRobin: boolean
  ): Match[] {
    const matches: Match[] = [];
    let currentDate = new Date(startDate);
    
    currentDate = this.nextSaturday(currentDate);
    
    const teamsCount = new Set(fixtures.map(f => f.home.id).concat(fixtures.map(f => f.away.id))).size;
    const matchesPerRound = Math.floor(teamsCount / 2);
    
    let allFixtures = [...fixtures];
    if (isDoubleRoundRobin) {
      const secondLeg = fixtures.map(f => ({ home: f.away, away: f.home }));
      allFixtures = [...fixtures, ...secondLeg];
    }

    const rounds: Array<typeof fixtures> = [];
    for (let i = 0; i < allFixtures.length; i += matchesPerRound) {
      rounds.push(allFixtures.slice(i, i + matchesPerRound));
    }

    let fieldIndex = 0;
    const timeSlots = ['09:00', '11:00', '13:00', '15:00'];
    
    rounds.forEach((round, roundIndex) => {
      const roundDate = new Date(currentDate);
      roundDate.setDate(roundDate.getDate() + (7 * roundIndex));
      
      round.forEach((fixture, matchIndex) => {
        const matchDate = new Date(roundDate);
        const [hours, minutes] = timeSlots[matchIndex % timeSlots.length].split(':').map(Number);
        matchDate.setHours(hours, minutes, 0, 0);
        
        const field = fields[fieldIndex % fields.length];
        fieldIndex++;
        
        const match: Omit<Match, 'id' | 'createdAt' | 'updatedAt'> = {
          seasonId,
          divisionId,
          categoryId,
          homeTeamId: fixture.home.id,
          awayTeamId: fixture.away.id,
          fieldId: field.id,
          matchDate: parseFirestoreDate(matchDate),
          matchTime: timeSlots[matchIndex % timeSlots.length],
          round: roundIndex + 1,
          isPlayoff: false,
          status: 'scheduled',
          homeScore: 0,
          awayScore: 0,
          winner: undefined,
          resultDetails: undefined,
          notes: '',
          spectators: 0,
          statsSubmitted: false,
          createdBy: auth.currentUser?.uid || '',
          updatedBy: auth.currentUser?.uid || '',
        };
        
        matches.push(match as Match);
      });
    });

    return matches;
  },

  /**
   * Encuentra próximo sábado
   */
  nextSaturday(date: Date): Date {
    const result = new Date(date);
    const day = result.getDay();
    const daysUntilSaturday = day === 6 ? 7 : (6 - day) % 7;
    result.setDate(result.getDate() + daysUntilSaturday);
    return result;
  },

  /**
   * Obtiene campos disponibles
   */
  async getAvailableFields(): Promise<Field[]> {
    try {
      const fieldsRef = collection(db, 'fields');
      const snapshot = await getDocs(fieldsRef);
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Field));
    } catch (error) {
      console.error('Error obteniendo campos:', error);
      return [];
    }
  },

  /**
   * Guarda partidos en Firestore
   */
  async saveMatchesToFirestore(matches: Match[]): Promise<void> {
    if (matches.length === 0) return;
    
    const batch = writeBatch(db);
    const matchesRef = collection(db, 'matches');
    const user = auth.currentUser;
    
    matches.forEach(match => {
      const matchRef = doc(matchesRef);
      const matchWithTimestamps = {
        ...match,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      batch.set(matchRef, matchWithTimestamps);
    });
    
    await batch.commit();
    console.log(`${matches.length} partidos guardados exitosamente`);
  }
};