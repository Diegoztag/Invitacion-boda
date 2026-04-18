const { getDbConnection } = require('./sqlite-connection');

/**
 * Inicializa el esquema de la base de datos
 */
async function initDatabase() {
    const db = await getDbConnection();

    try {
        console.log('Inicializando esquema de base de datos...');

        // Crear tabla de invitaciones
        await db.exec(`
      CREATE TABLE IF NOT EXISTS invitations (
        code TEXT PRIMARY KEY,
        guestNames TEXT NOT NULL,
        numberOfPasses INTEGER NOT NULL,
        phone TEXT,
        createdAt TEXT NOT NULL,
        confirmedPasses INTEGER DEFAULT 0,
        confirmationDate TEXT,
        adultPasses INTEGER DEFAULT 0,
        childPasses INTEGER DEFAULT 0,
        staffPasses INTEGER DEFAULT 0,
        tableNumber INTEGER,
        status TEXT NOT NULL DEFAULT 'active',
        cancelledAt TEXT,
        cancelledBy TEXT,
        cancellationReason TEXT,
        attendingNames TEXT,
        dietaryRestrictionsNames TEXT,
        dietaryRestrictionsDetails TEXT,
        generalMessage TEXT
      );
    `);

        // Crear tabla de confirmaciones (para mantener el historial o detalles adicionales si es necesario)
        // Aunque la entidad Invitation ya guarda la confirmación, mantenemos la tabla por si se requiere
        // un registro separado de confirmaciones como en el CSV original.
        await db.exec(`
      CREATE TABLE IF NOT EXISTS confirmations (
        code TEXT PRIMARY KEY,
        willAttend INTEGER NOT NULL DEFAULT 0,
        attendingGuests INTEGER NOT NULL DEFAULT 0,
        attendingNames TEXT,
        phone TEXT,
        dietaryRestrictions TEXT,
        message TEXT,
        confirmedAt TEXT NOT NULL,
        FOREIGN KEY (code) REFERENCES invitations (code) ON DELETE CASCADE
      );
    `);

        // Crear índices para mejorar el rendimiento
        await db.exec(`
      CREATE INDEX IF NOT EXISTS idx_invitations_status ON invitations(status);
      CREATE INDEX IF NOT EXISTS idx_confirmations_willAttend ON confirmations(willAttend);
    `);

        console.log('Esquema de base de datos inicializado correctamente.');
    } catch (error) {
        console.error('Error al inicializar la base de datos:', error);
        throw error;
    }
}

// Si se ejecuta directamente
if (require.main === module) {
    initDatabase()
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
}

module.exports = {
    initDatabase
};
