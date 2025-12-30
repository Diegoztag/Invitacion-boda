// Script para probar la conexión con Google Sheets
require('dotenv').config();
const googleSheetsService = require('./services/googleSheets');

async function testConnection() {
    console.log('🔍 Probando conexión con Google Sheets...\n');
    console.log('📋 ID de Google Sheets:', process.env.GOOGLE_SHEETS_ID);
    
    // Esperar un momento para que el servicio se inicialice
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('\n📊 Estado de conexión:', googleSheetsService.isConnected() ? '✅ Conectado' : '❌ No conectado');
    
    if (!googleSheetsService.isConnected()) {
        console.log('\n⚠️  Para que funcione Google Sheets:');
        console.log('1. Abre tu hoja de Google Sheets');
        console.log('2. Click en "Compartir" (arriba a la derecha)');
        console.log('3. En "Acceso general", selecciona "Cualquier persona con el enlace"');
        console.log('4. IMPORTANTE: Cambia de "Lector" a "Editor"');
        console.log('5. Click en "Listo"\n');
        console.log('Tu ID de Google Sheets es:', process.env.GOOGLE_SHEETS_ID);
        console.log('URL completa: https://docs.google.com/spreadsheets/d/' + process.env.GOOGLE_SHEETS_ID);
    } else {
        console.log('\n✅ ¡Conexión exitosa! Puedes crear invitaciones.');
    }
}

testConnection().catch(console.error);
