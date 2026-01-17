import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc,
  setDoc, 
  updateDoc, 
  deleteDoc,
  query, 
  where, 
  orderBy,
  writeBatch,
  Timestamp,
  serverTimestamp,
  runTransaction,
  DocumentData
} from 'firebase/firestore';
import { db, auth, storage } from './firebase';
import { 
  Referee, 
  Match, 
  MatchEvidence, 
  MatchStats, 
  OfflineData,
  FieldDetail,
  RefereeMatchManagement,
  Field,
  Team,
  Player
} from '../types';
import { matchesService, fieldsService, teamsService, playersService } from './firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

// ========== TIPOS FALTANTES ==========
interface FieldSchedule {
  day: string;
  openingTime: string;
  closingTime: string;
  availableForMatches: boolean;
  maxMatchesPerDay: number;
}

interface BookingSlot {
  startTime: string;
  endTime: string;
  status: 'available' | 'booked' | 'maintenance';
  matchId?: string;
}

// ========== SERVICIO DE ÁRBITROS ==========
class RefereeService {
  private static instance: RefereeService;
  
  // Configuración offline
  private readonly OFFLINE_CONFIG = {
    maxRetries: 3,
    syncInterval: 30000,
    maxFileSize: 10 * 1024 * 1024,
    supportedFormats: ['jpg', 'jpeg', 'png', 'gif', 'mp4', 'mov', 'pdf', 'doc', 'docx']
  };

  private constructor() {}

  public static getInstance(): RefereeService {
    if (!RefereeService.instance) {
      RefereeService.instance = new RefereeService();
    }
    return RefereeService.instance;
  }

  /**
   * OBTENER PARTIDOS ASIGNADOS CON DETALLES COMPLETOS
   */
  async getAssignedMatchesWithDetails(refereeId: string): Promise<{
    upcoming: Match[];
    inProgress: Match[];
    completed: Match[];
    cancelled: Match[];
  }> {
    try {
      const allMatches = await matchesService.getMatches();
      const assignedMatches = allMatches.filter(match => 
        match.refereeId === refereeId || match.refereeName?.includes(refereeId)
      );

      const now = new Date();
      
      const upcoming = assignedMatches.filter(match => 
        new Date(match.matchDate) > now && match.status === 'scheduled'
      );
      
      const inProgress = assignedMatches.filter(match => 
        match.status === 'in_progress'
      );
      
      const completed = assignedMatches.filter(match => 
        match.status === 'completed'
      );
      
      const cancelled = assignedMatches.filter(match => 
        match.status === 'cancelled'
      );

      // Enriquecer con detalles de equipos
      const enrichMatches = async (matches: Match[]): Promise<Match[]> => {
        return Promise.all(
          matches.map(async (match) => {
            const [homeTeam, awayTeam] = await Promise.all([
              match.homeTeamId ? teamsService.getTeamById(match.homeTeamId) : null,
              match.awayTeamId ? teamsService.getTeamById(match.awayTeamId) : null
            ]);
            
            return {
              ...match,
              homeTeam: homeTeam || undefined,
              awayTeam: awayTeam || undefined
            };
          })
        );
      };

      return {
        upcoming: await enrichMatches(upcoming),
        inProgress: await enrichMatches(inProgress),
        completed: await enrichMatches(completed),
        cancelled: await enrichMatches(cancelled)
      };

    } catch (error) {
      console.error('Error obteniendo partidos asignados:', error);
      throw error;
    }
  }

  /**
   * OBTENER CAMPOS DISPONIBLES CON DETALLES
   */
  async getFieldsWithDetails(): Promise<FieldDetail[]> {
    try {
      const fields = await fieldsService.getFields();
      
      const enrichedFields = await Promise.all(
        fields.map(async (field) => {
          // Obtener partidos programados para hoy
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const tomorrow = new Date(today);
          tomorrow.setDate(tomorrow.getDate() + 1);
          
          const matches = await matchesService.getMatches();
          const todaysMatches = matches.filter(match => 
            match.fieldId === field.id &&
            new Date(match.matchDate) >= today &&
            new Date(match.matchDate) < tomorrow
          );
          
          // Calcular disponibilidad
          const schedule = this.generateFieldSchedule(field);
          const currentBookings = this.generateBookingSlots(todaysMatches);
          
          return {
            ...field,
            schedule,
            currentBookings,
            equipmentAvailable: this.getFieldEquipment(field),
            restrictions: this.getFieldRestrictions(field),
            photos: this.getFieldPhotos(field.id)
          } as FieldDetail;
        })
      );

      return enrichedFields;
    } catch (error) {
      console.error('Error obteniendo campos con detalles:', error);
      throw error;
    }
  }

  /**
   * SUBIR EVIDENCIA DE PARTIDO
   */
  async uploadMatchEvidence(
    matchId: string,
    file: File,
    evidenceType: MatchEvidence['type'],
    description?: string,
    relatedEventId?: string
  ): Promise<{ success: boolean; evidenceId?: string; url?: string; error?: string }> {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('Usuario no autenticado');

      // Validar archivo
      const validation = this.validateEvidenceFile(file, evidenceType);
      if (!validation.valid) {
        return { success: false, error: validation.error };
      }

      // Crear nombre único para el archivo
      const timestamp = Date.now();
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      const fileName = `evidence/${matchId}/${user.uid}_${timestamp}.${fileExtension}`;
      
      // Subir a Firebase Storage
      const storageRef = ref(storage, fileName);
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);

      // Crear registro de evidencia
      const evidenceData: Omit<MatchEvidence, 'id'> = {
        matchId,
        refereeId: user.uid,
        type: evidenceType,
        fileName: file.name,
        fileUrl: downloadURL,
        fileSize: file.size,
        description: description || '',
        uploadDate: new Date().toISOString(),
        uploadedBy: user.uid,
        tags: this.generateEvidenceTags(evidenceType, description),
        relatedEventId: relatedEventId || undefined,
        verified: false
      };

      const evidenceRef = await addDoc(collection(db, 'matchEvidence'), {
        ...evidenceData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // Guardar copia offline si está habilitado
      await this.saveOfflineData(user.uid, {
        dataType: 'evidence',
        data: { ...evidenceData, id: evidenceRef.id },
        syncStatus: 'synced'
      });

      return {
        success: true,
        evidenceId: evidenceRef.id,
        url: downloadURL
      };

    } catch (error) {
      console.error('Error subiendo evidencia:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Error desconocido' 
      };
    }
  }

  /**
   * SUBIR ESTADÍSTICAS DE PARTIDO
   */
  async uploadMatchStats(
    matchId: string,
    stats: MatchStats,
    evidenceIds?: string[]
  ): Promise<{ success: boolean; statsId?: string; error?: string }> {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('Usuario no autenticado');

      // Verificar que el árbitro esté asignado al partido
      const match = await matchesService.getMatchById(matchId);
      if (!match) throw new Error('Partido no encontrado');
      
      if (match.refereeId !== user.uid) {
        throw new Error('No estás asignado a este partido');
      }

      // Validar estadísticas para TOCHO
      const validation = this.validateMatchStats(stats);
      if (!validation.valid) {
        return { success: false, error: validation.error };
      }

      // Usar transacción para consistencia
      const result = await runTransaction(db, async (transaction) => {
        // 1. Crear documento de estadísticas
        const statsRef = doc(collection(db, 'matchStats'));
        const statsData = {
          ...stats,
          refereeId: user.uid,
          matchId,
          submittedAt: new Date().toISOString(),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        };
        
        transaction.set(statsRef, statsData);

        // 2. Actualizar gestión del partido
        const managementRef = doc(collection(db, 'refereeMatchManagement'), `${matchId}_${user.uid}`);
        transaction.set(managementRef, {
          matchId,
          refereeId: user.uid,
          status: 'reported',
          statsId: statsRef.id,
          evidenceIds: evidenceIds || [],
          reportSubmitted: true,
          reportDate: new Date().toISOString(),
          verificationStatus: 'pending',
          updatedAt: serverTimestamp()
        }, { merge: true });

        // 3. Actualizar partido
        const matchRef = doc(db, 'matches', matchId);
        transaction.update(matchRef, {
          statsSubmitted: true,
          statsSubmittedBy: user.uid,
          statsSubmittedAt: new Date().toISOString(),
          updatedAt: serverTimestamp()
        });

        return statsRef.id;
      });

      // Actualizar estadísticas de jugadores para TOCHO
      await this.updatePlayerStatsFromMatch(stats);

      // Guardar copia offline
      await this.saveOfflineData(user.uid, {
        dataType: 'stats',
        data: { ...stats, id: result },
        syncStatus: 'synced'
      });

      return { success: true, statsId: result };

    } catch (error) {
      console.error('Error subiendo estadísticas:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Error desconocido' 
      };
    }
  }

  /**
   * OBTENER EVIDENCIA DE PARTIDO
   */
  async getMatchEvidence(matchId: string): Promise<MatchEvidence[]> {
    try {
      const evidenceRef = collection(db, 'matchEvidence');
      const q = query(
        evidenceRef,
        where('matchId', '==', matchId),
        orderBy('uploadDate', 'desc')
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          matchId: data.matchId,
          refereeId: data.refereeId,
          type: data.type,
          fileName: data.fileName,
          fileUrl: data.fileUrl,
          fileSize: data.fileSize,
          description: data.description || '',
          uploadDate: data.uploadDate,
          uploadedBy: data.uploadedBy,
          tags: data.tags || [],
          relatedEventId: data.relatedEventId,
          verified: data.verified || false
        } as MatchEvidence;
      });
    } catch (error) {
      console.error('Error obteniendo evidencia:', error);
      return [];
    }
  }

  /**
   * OBTENER GESTIÓN DE PARTIDO DEL ÁRBITRO
   */
  async getRefereeMatchManagement(
    matchId: string, 
    refereeId: string
  ): Promise<RefereeMatchManagement | null> {
    try {
      const managementRef = doc(collection(db, 'refereeMatchManagement'), `${matchId}_${refereeId}`);
      const managementDoc = await getDoc(managementRef);
      
      if (managementDoc.exists()) {
        const data = managementDoc.data();
        return {
          id: managementDoc.id,
          matchId: data.matchId,
          refereeId: data.refereeId,
          status: data.status,
          preMatchChecklist: data.preMatchChecklist || {
            fieldInspection: false,
            equipmentCheck: false,
            teamRostersVerified: false,
            playerIDsChecked: false,
            safetyBriefing: false
          },
          matchLog: data.matchLog || [],
          evidenceIds: data.evidenceIds || [],
          reportSubmitted: data.reportSubmitted || false,
          verificationStatus: data.verificationStatus || 'pending'
        } as RefereeMatchManagement;
      }
      
      // Si no existe, crear una nueva
      const defaultManagement: Omit<RefereeMatchManagement, 'id'> = {
        matchId,
        refereeId,
        status: 'pre_match',
        preMatchChecklist: {
          fieldInspection: false,
          equipmentCheck: false,
          teamRostersVerified: false,
          playerIDsChecked: false,
          safetyBriefing: false
        },
        matchLog: [],
        evidenceIds: [],
        reportSubmitted: false,
        verificationStatus: 'pending'
      };
      
      await setDoc(managementRef, {
        ...defaultManagement,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }, { merge: true });
      
      return {
        id: `${matchId}_${refereeId}`,
        ...defaultManagement
      };
      
    } catch (error) {
      console.error('Error obteniendo gestión de partido:', error);
      return null;
    }
  }

  /**
   * ACTUALIZAR CHECKLIST PRE-PARTIDO
   */
  async updatePreMatchChecklist(
    matchId: string,
    checklist: Partial<RefereeMatchManagement['preMatchChecklist']>
  ): Promise<{ success: boolean; updatedChecklist?: any }> {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('Usuario no autenticado');

      const managementRef = doc(collection(db, 'refereeMatchManagement'), `${matchId}_${user.uid}`);
      
      await updateDoc(managementRef, {
        preMatchChecklist: checklist,
        updatedAt: serverTimestamp()
      });

      // Agregar al log
      await this.addToMatchLog(matchId, user.uid, 'checklist_updated', {
        checklist,
        timestamp: new Date().toISOString()
      });

      const updatedDoc = await getDoc(managementRef);
      return {
        success: true,
        updatedChecklist: updatedDoc.data()?.preMatchChecklist
      };

    } catch (error) {
      console.error('Error actualizando checklist:', error);
      return { success: false };
    }
  }

  /**
   * GENERAR REPORTE DE PARTIDO
   */
  async generateMatchReport(
    matchId: string,
    includeEvidence: boolean = true,
    includeStats: boolean = true
  ): Promise<{ success: boolean; report?: any; error?: string }> {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('Usuario no autenticado');

      // Obtener datos del partido
      const match = await matchesService.getMatchById(matchId);
      if (!match) throw new Error('Partido no encontrado');

      const [homeTeam, awayTeam, evidence, management] = await Promise.all([
        match.homeTeamId ? teamsService.getTeamById(match.homeTeamId) : null,
        match.awayTeamId ? teamsService.getTeamById(match.awayTeamId) : null,
        includeEvidence ? this.getMatchEvidence(matchId) : [],
        this.getRefereeMatchManagement(matchId, user.uid)
      ]);

      // Obtener estadísticas si están incluidas
      let stats = null;
      if (includeStats) {
        const statsRef = collection(db, 'matchStats');
        const q = query(statsRef, where('matchId', '==', matchId));
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          stats = snapshot.docs[0].data();
        }
      }

      // Construir reporte adaptado para TOCHO
      const report = {
        match: {
          id: match.id,
          date: match.matchDate,
          time: match.matchTime,
          field: match.fieldId,
          homeTeam: homeTeam ? {
            name: homeTeam.name,
            score: match.homeScore
          } : null,
          awayTeam: awayTeam ? {
            name: awayTeam.name,
            score: match.awayScore
          } : null,
          status: match.status,
          winner: match.winner
        },
        referee: {
          id: user.uid,
          name: match.refereeName
        },
        preMatchChecklist: management?.preMatchChecklist,
        evidence: includeEvidence ? evidence.map(ev => ({
          type: ev.type,
          description: ev.description,
          uploaded: ev.uploadDate,
          verified: ev.verified
        })) : [],
        stats: includeStats ? stats : null,
        matchLog: management?.matchLog || [],
        generatedAt: new Date().toISOString(),
        reportId: `REPORT_${matchId}_${Date.now()}`
      };

      // Guardar reporte generado
      const reportRef = await addDoc(collection(db, 'matchReports'), {
        ...report,
        refereeId: user.uid,
        matchId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      return {
        success: true,
        report: { ...report, id: reportRef.id }
      };

    } catch (error) {
      console.error('Error generando reporte:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error generando reporte'
      };
    }
  }

  /**
   * MODO OFFLINE: GUARDAR DATOS LOCALMENTE
   */
  async saveOfflineData(
    refereeId: string,
    data: Omit<OfflineData, 'id' | 'refereeId' | 'lastModified' | 'syncAttempts' | 'createdAt'>
  ): Promise<string> {
    try {
      // Usar IndexedDB para almacenamiento local
      if (this.isOnline()) {
        // Si está online, guardar en Firestore también
        const offlineRef = await addDoc(collection(db, 'offlineData'), {
          refereeId,
          ...data,
          syncStatus: 'synced',
          lastModified: new Date().toISOString(),
          syncAttempts: 0,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        return offlineRef.id;
      } else {
        // Guardar solo localmente
        const offlineData: OfflineData = {
          id: `local_${Date.now()}`,
          refereeId,
          ...data,
          syncStatus: 'pending',
          lastModified: new Date().toISOString(),
          syncAttempts: 0,
          createdAt: new Date().toISOString()
        };
        
        await this.saveToLocalStorage(offlineData);
        return offlineData.id;
      }
    } catch (error) {
      console.error('Error guardando datos offline:', error);
      throw error;
    }
  }

  /**
   * MODO OFFLINE: SINCRONIZAR DATOS PENDIENTES
   */
  async syncPendingOfflineData(refereeId: string): Promise<{
    synced: number;
    failed: number;
    errors: string[];
  }> {
    const errors: string[] = [];
    let synced = 0;
    let failed = 0;

    try {
      // Obtener datos pendientes del almacenamiento local
      const pendingData = await this.getPendingOfflineData(refereeId);
      
      for (const data of pendingData) {
        try {
          // Intentar sincronizar cada dato pendiente
          switch (data.dataType) {
            case 'match':
              await this.syncMatchData(data.data);
              break;
            case 'evidence':
              await this.syncEvidenceData(data.data);
              break;
            case 'stats':
              await this.syncStatsData(data.data);
              break;
          }
          
          // Marcar como sincronizado
          await this.markOfflineDataAsSynced(data.id);
          synced++;
          
        } catch (error) {
          failed++;
          errors.push(`Error sincronizando ${data.dataType}: ${error}`);
          
          // Incrementar intentos
          await this.incrementSyncAttempts(data.id);
          
          // Si hay demasiados intentos fallidos, marcar como error
          if (data.syncAttempts >= this.OFFLINE_CONFIG.maxRetries) {
            await this.markOfflineDataAsError(data.id, error instanceof Error ? error.message : 'Error desconocido');
          }
        }
      }
      
      return { synced, failed, errors };
      
    } catch (error) {
      console.error('Error en sincronización:', error);
      throw error;
    }
  }

  // ========== MÉTODOS PRIVADOS DE AYUDA ==========

  private validateEvidenceFile(file: File, type: MatchEvidence['type']): { valid: boolean; error?: string } {
    // Validar tamaño
    if (file.size > this.OFFLINE_CONFIG.maxFileSize) {
      return { 
        valid: false, 
        error: `El archivo es demasiado grande (máximo ${this.OFFLINE_CONFIG.maxFileSize / 1024 / 1024}MB)` 
      };
    }

    // Validar formato
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (!extension || !this.OFFLINE_CONFIG.supportedFormats.includes(extension)) {
      return { 
        valid: false, 
        error: `Formato no soportado. Formatos permitidos: ${this.OFFLINE_CONFIG.supportedFormats.join(', ')}` 
      };
    }

    // Validaciones específicas por tipo
    if (type === 'photo' && !['jpg', 'jpeg', 'png', 'gif'].includes(extension)) {
      return { valid: false, error: 'Para fotos use JPG, PNG o GIF' };
    }

    if (type === 'video' && !['mp4', 'mov'].includes(extension)) {
      return { valid: false, error: 'Para videos use MP4 o MOV' };
    }

    return { valid: true };
  }

  private validateMatchStats(stats: MatchStats): { valid: boolean; error?: string } {
    const errors: string[] = [];

    // ✅ CORREGIDO: Eliminar validación de posesión (no existe en tocho)
    // Las estadísticas de tocho no tienen "possession"
    
    // ✅ NUEVA VALIDACIÓN: Verificar que touchdowns + safeties = totalPoints
    const touchdownsLocal = stats.general.touchdowns[0] || 0;
    const touchdownsVisitor = stats.general.touchdowns[1] || 0;
    const safetiesLocal = stats.general.safeties[0] || 0;
    const safetiesVisitor = stats.general.safeties[1] || 0;
    
    const calculatedTotalLocal = touchdownsLocal + safetiesLocal;
    const calculatedTotalVisitor = touchdownsVisitor + safetiesVisitor;
    
    const actualTotalLocal = stats.general.totalPoints[0] || 0;
    const actualTotalVisitor = stats.general.totalPoints[1] || 0;
    
    if (calculatedTotalLocal !== actualTotalLocal) {
      errors.push(`Equipo Local: Touchdowns (${touchdownsLocal}) + Safeties (${safetiesLocal}) debe ser igual a Puntos Totales (${actualTotalLocal})`);
    }
    
    if (calculatedTotalVisitor !== actualTotalVisitor) {
      errors.push(`Equipo Visitante: Touchdowns (${touchdownsVisitor}) + Safeties (${safetiesVisitor}) debe ser igual a Puntos Totales (${actualTotalVisitor})`);
    }

    if (errors.length > 0) {
      return { valid: false, error: errors.join('; ') };
    }

    return { valid: true };
  }

  private generateFieldSchedule(field: Field): FieldSchedule[] {
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    
    return days.map(day => ({
      day: this.capitalize(day),
      openingTime: '08:00',
      closingTime: '22:00',
      availableForMatches: true,
      maxMatchesPerDay: field.priority ? 8 - field.priority : 6
    }));
  }

  private generateBookingSlots(matches: Match[]): BookingSlot[] {
    const slots: BookingSlot[] = [];
    const startHour = 8;
    const endHour = 22;
    
    // Generar slots de hora en hora
    for (let hour = startHour; hour < endHour; hour++) {
      const startTime = `${hour.toString().padStart(2, '0')}:00`;
      const endTime = `${(hour + 1).toString().padStart(2, '0')}:00`;
      
      // Verificar si hay partido en este horario
      const matchInSlot = matches.find(match => {
        const matchTime = match.matchTime || '18:00';
        const matchHour = parseInt(matchTime.split(':')[0]);
        return matchHour === hour;
      });
      
      slots.push({
        startTime,
        endTime,
        status: matchInSlot ? 'booked' : 'available',
        matchId: matchInSlot?.id
      });
    }
    
    return slots;
  }

  private getFieldEquipment(field: Field): string[] {
    const equipment: string[] = ['porterías', 'redes', 'balones'];
    
    if (field.facilities?.includes('iluminación')) equipment.push('iluminación nocturna');
    if (field.facilities?.includes('vestuarios')) equipment.push('vestuarios equipados');
    if (field.facilities?.includes('baños')) equipment.push('baños disponibles');
    
    return equipment;
  }

  private getFieldRestrictions(field: Field): string[] {
    const restrictions: string[] = [];
    
    if (field.type === 'césped') restrictions.push('No tacos largos');
    if (field.capacity && field.capacity < 150) restrictions.push('Aforo limitado');
    if (!field.facilities?.includes('iluminación')) restrictions.push('Solo diurno');
    
    return restrictions;
  }

  private getFieldPhotos(fieldId: string): string[] {
    // URLs de ejemplo
    return [
      `https://example.com/fields/${fieldId}/1.jpg`,
      `https://example.com/fields/${fieldId}/2.jpg`,
      `https://example.com/fields/${fieldId}/3.jpg`
    ];
  }

  private generateEvidenceTags(type: MatchEvidence['type'], description?: string): string[] {
    const tags: string[] = [type];
    
    if (description) {
      const keywords = description.toLowerCase().split(' ');
      tags.push(...keywords.filter(word => word.length > 3));
    }
    
    return [...new Set(tags)];
  }

  private async updatePlayerStatsFromMatch(stats: MatchStats): Promise<void> {
    try {
      const batch = writeBatch(db);
      
      for (const playerStat of stats.playerStats) {
        const playerRef = doc(db, 'players', playerStat.playerId);
        
        // Obtener estadísticas actuales
        const player = await playersService.getPlayerById(playerStat.playerId);
        const currentStats = player?.stats || {
          matchesPlayed: 0,
          // ✅ CORREGIDO: Estadísticas para TOCHO
          touchdowns: 0,
          passingTouchdowns: 0,
          interceptions: 0,
          safeties: 0,
          tackles: 0,
          penalties: 0
        };
        
        // ✅ CORREGIDO: Actualizar estadísticas para TOCHO
        batch.update(playerRef, {
          'stats.matchesPlayed': currentStats.matchesPlayed + 1,
          'stats.touchdowns': currentStats.touchdowns + (playerStat.touchdowns || 0),
          'stats.passingTouchdowns': currentStats.passingTouchdowns + (playerStat.passingTouchdowns || 0),
          'stats.interceptions': currentStats.interceptions + (playerStat.interceptions || 0),
          'stats.safeties': currentStats.safeties + (playerStat.safeties || 0),
          'stats.tackles': currentStats.tackles + (playerStat.tackles || 0),
          'stats.penalties': currentStats.penalties + (playerStat.penalties || 0),
          updatedAt: serverTimestamp()
        });
      }
      
      await batch.commit();
    } catch (error) {
      console.error('Error actualizando estadísticas de jugadores:', error);
    }
  }

  private isOnline(): boolean {
    return navigator.onLine;
  }

  private async saveToLocalStorage(data: OfflineData): Promise<void> {
    const key = `offline_${data.refereeId}_${data.dataType}_${Date.now()}`;
    localStorage.setItem(key, JSON.stringify(data));
  }

  private async getPendingOfflineData(refereeId: string): Promise<OfflineData[]> {
    const pendingData: OfflineData[] = [];
    
    // Recuperar de localStorage
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(`offline_${refereeId}`)) {
        const data = JSON.parse(localStorage.getItem(key) || '{}');
        if (data.syncStatus === 'pending') {
          pendingData.push(data);
        }
      }
    }
    
    return pendingData;
  }

  private async markOfflineDataAsSynced(localId: string): Promise<void> {
    localStorage.removeItem(localId);
  }

  private async incrementSyncAttempts(localId: string): Promise<void> {
    const data = JSON.parse(localStorage.getItem(localId) || '{}');
    data.syncAttempts = (data.syncAttempts || 0) + 1;
    localStorage.setItem(localId, JSON.stringify(data));
  }

  private async markOfflineDataAsError(localId: string, error: string): Promise<void> {
    const data = JSON.parse(localStorage.getItem(localId) || '{}');
    data.syncStatus = 'error';
    data.errorMessage = error;
    localStorage.setItem(localId, JSON.stringify(data));
  }

  private async syncMatchData(data: any): Promise<void> {
    // Implementar sincronización de datos de partido
    console.log('Sincronizando datos de partido:', data);
  }

  private async syncEvidenceData(data: any): Promise<void> {
    // Implementar sincronización de evidencia
    console.log('Sincronizando evidencia:', data);
  }

  private async syncStatsData(data: any): Promise<void> {
    // Implementar sincronización de estadísticas
    console.log('Sincronizando estadísticas:', data);
  }

  private async addToMatchLog(
    matchId: string,
    refereeId: string,
    action: string,
    details?: any
  ): Promise<void> {
    const managementRef = doc(collection(db, 'refereeMatchManagement'), `${matchId}_${refereeId}`);
    
    const currentLog = await this.getMatchLog(matchId, refereeId);
    
    await updateDoc(managementRef, {
      matchLog: [...currentLog, {
        timestamp: new Date().toISOString(),
        action,
        details,
        recordedBy: refereeId
      }],
      updatedAt: serverTimestamp()
    });
  }

  private async getMatchLog(matchId: string, refereeId: string): Promise<any[]> {
    const management = await this.getRefereeMatchManagement(matchId, refereeId);
    return management?.matchLog || [];
  }

  private capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
}

// Exportar instancia singleton
export const refereeService = RefereeService.getInstance();