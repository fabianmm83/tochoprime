// deleteMatchesSimple.ts - Script para eliminar todos los partidos
const deleteMatchesSimple = async (): Promise<void> => {
  console.log('🚀 Script de eliminación de partidos');
  console.log('⚠️  IMPORTANTE: Reemplaza las credenciales abajo con las tuyas');
  
  // ====== REEMPLAZA ESTAS CREDENCIALES CON LAS TUS ======
  // VE A: src/services/firebase.ts y COPIA los valores REALES
  const firebaseConfig = {
    apiKey: "AIzaSyBtuDCRjwjWY-fUJf3e_9q5m_abcdefghijk",  // <-- REEMPLAZA
    authDomain: "tochoprime.firebaseapp.com",              // <-- REEMPLAZA
    projectId: "tochoprime",                               // <-- REEMPLAZA
    storageBucket: "tochoprime.appspot.com",               // <-- REEMPLAZA
    messagingSenderId: "123456789012",                     // <-- REEMPLAZA
    appId: "1:123456789012:web:abcdef1234567890",          // <-- REEMPLAZA
    measurementId: "G-ABCDEFGHIJ"                          // <-- REEMPLAZA (opcional)
  };
  // ====== FIN DE CREDENCIALES ======
  
  try {
    // Importar dinámicamente para evitar errores
    const { initializeApp } = await import('firebase/app');
    const { getFirestore, collection, getDocs, deleteDoc, doc } = await import('firebase/firestore');
    
    console.log('✅ Inicializando Firebase...');
    console.log(`Proyecto: ${firebaseConfig.projectId}`);
    
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    
    console.log('🔍 Buscando partidos en Firestore...');
    const matchesRef = collection(db, 'matches');
    const snapshot = await getDocs(matchesRef);
    
    console.log(`📊 Encontrados ${snapshot.size} partidos`);
    
    if (snapshot.size === 0) {
      console.log('✅ No hay partidos para eliminar');
      return;
    }
    
    // Mostrar ejemplos de partidos
    console.log('\n📋 Ejemplos de partidos a eliminar:');
    snapshot.docs.slice(0, 3).forEach((docItem, index) => {
      const data = docItem.data();
      console.log(`${index + 1}. ${data.homeTeamId || 'Equipo A'} vs ${data.awayTeamId || 'Equipo B'}`);
      console.log(`   Fecha: ${data.matchDate || 'Sin fecha'} - ID: ${docItem.id.substring(0, 10)}...`);
      console.log('');
    });
    
    if (snapshot.size > 3) {
      console.log(`... y ${snapshot.size - 3} partidos más`);
    }
    
    // Confirmación usando readline
    const readlineModule = await import('readline');
    const readline = readlineModule.default;
    
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    // Usar una promesa para manejar la confirmación
    const confirmAnswer: string = await new Promise((resolve) => {
      rl.question(`\n⚠️  ¿Estás SEGURO de eliminar ${snapshot.size} partidos? (escribe "SI" para confirmar): `, (answer) => {
        rl.close();
        resolve(answer);
      });
    });
    
    if (confirmAnswer.toUpperCase() !== 'SI') {
      console.log('❌ Operación cancelada por el usuario');
      return;
    }
    
    console.log('\n🗑️  Eliminando partidos...');
    
    let deletedCount = 0;
    const total = snapshot.size;
    
    for (const matchDoc of snapshot.docs) {
      try {
        await deleteDoc(doc(db, 'matches', matchDoc.id));
        deletedCount++;
        
        // Mostrar progreso cada 10 eliminaciones
        if (deletedCount % 10 === 0 || deletedCount === total) {
          console.log(`  📦 Progreso: ${deletedCount}/${total}`);
        }
      } catch (error) {
        console.error(`✗ Error eliminando ${matchDoc.id}:`, error instanceof Error ? error.message : error);
      }
    }
    
    console.log(`\n🎉 ¡ELIMINACIÓN COMPLETADA!`);
    console.log(`✅ Eliminados: ${deletedCount} partidos`);
    console.log(`📊 Total procesados: ${total}`);
    
    if (deletedCount < total) {
      console.log(`⚠️  Nota: ${total - deletedCount} partidos no pudieron ser eliminados`);
    }
    
    console.log('\n💡 Ahora puedes regenerar el calendario correctamente:');
    console.log('1. Ve a http://localhost:5173/partidos');
    console.log('2. Haz clic en "Generar Calendario Automático"');
    console.log('3. ¡Listo! Los partidos nuevos serán creados correctamente.');
    
  } catch (error) {
    console.error('\n💥 ERROR CRÍTICO:', error instanceof Error ? error.message : error);
    console.log('\n🔧 POSIBLES SOLUCIONES:');
    console.log('1. Verifica que las credenciales de Firebase sean correctas');
    console.log('2. Asegúrate de que tu proyecto Firebase tenga Firestore habilitado');
    console.log('3. Verifica que tengas permisos de escritura en la colección "matches"');
    console.log('4. Revisa tu conexión a internet');
    
    console.log('\n📝 TUS CREDENCIALES ACTUALES:');
    console.log(`• apiKey: ${firebaseConfig.apiKey?.substring(0, 20)}...`);
    console.log(`• projectId: ${firebaseConfig.projectId}`);
    console.log(`• appId: ${firebaseConfig.appId?.substring(0, 20)}...`);
    
  } finally {
    // Esperar 2 segundos antes de salir
    setTimeout(() => {
      process.exit(0);
    }, 2000);
  }
};

// Ejecutar el script
deleteMatchesSimple().catch((error) => {
  console.error('Error en la ejecución:', error);
  process.exit(1);
});