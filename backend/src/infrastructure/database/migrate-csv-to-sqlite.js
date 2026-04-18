const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');
const { initDatabase } = require('./init-db');
const SqliteInvitationRepository = require('../repositories/SqliteInvitationRepository');
const SqliteConfirmationRepository = require('../repositories/SqliteConfirmationRepository');
const Invitation = require('../../core/entities/Invitation');
const Confirmation = require('../../core/entities/Confirmation');

async function migrate() {
    console.log('Iniciando migración de CSV a SQLite...');

    try {
        // 1. Inicializar la base de datos
        await initDatabase();
        console.log('Base de datos inicializada.');

        const invitationRepo = new SqliteInvitationRepository();
        const confirmationRepo = new SqliteConfirmationRepository();

        // 2. Leer y migrar invitaciones
        const invitationsCsvPath = path.join(__dirname, '../../../data/invitations.csv');
        if (fs.existsSync(invitationsCsvPath)) {
            console.log(`Leyendo invitaciones desde ${invitationsCsvPath}...`);
            const fileContent = fs.readFileSync(invitationsCsvPath, 'utf-8');

            const records = parse(fileContent, {
                columns: true,
                skip_empty_lines: true,
                trim: true
            });

            console.log(`Se encontraron ${records.length} invitaciones en el CSV.`);

            const invitationsData = records.map(record => {
                // Mapear los campos del CSV a la entidad Invitation
                return {
                    code: record.code,
                    guestNames: record.guestNames
                        ? record.guestNames.split(' y ').map(n => n.trim())
                        : [],
                    numberOfPasses: parseInt(record.numberOfPasses, 10) || 0,
                    phone: record.phone || '',
                    createdAt: record.createdAt || new Date().toISOString(),
                    confirmedPasses: parseInt(record.confirmedPasses, 10) || 0,
                    confirmationDate: record.confirmationDate || null,
                    adultPasses: parseInt(record.adultPasses, 10) || 0,
                    childPasses: parseInt(record.childPasses, 10) || 0,
                    staffPasses: parseInt(record.staffPasses, 10) || 0,
                    tableNumber: record.tableNumber ? parseInt(record.tableNumber, 10) : null,
                    status: record.status || 'active',
                    cancelledAt: record.cancelledAt || null,
                    cancelledBy: record.cancelledBy || null,
                    cancellationReason: record.cancellationReason || null,
                    attendingNames: record.attendingNames
                        ? record.attendingNames.split(' y ').map(n => n.trim())
                        : [],
                    dietaryRestrictionsNames: record.dietaryRestrictionsNames || '',
                    dietaryRestrictionsDetails: record.dietaryRestrictionsDetails || '',
                    generalMessage: record.generalMessage || ''
                };
            });

            const result = await invitationRepo.importBatch(invitationsData);
            console.log(
                `Migración de invitaciones completada: ${result.successCount} exitosas, ${result.errorCount} errores.`
            );
            if (result.errorCount > 0) {
                console.error('Errores en invitaciones:', result.errors);
            }
        } else {
            console.log(`No se encontró el archivo de invitaciones en ${invitationsCsvPath}`);
        }

        // 3. Leer y migrar confirmaciones
        const confirmationsCsvPath = path.join(__dirname, '../../../data/confirmations.csv');
        if (fs.existsSync(confirmationsCsvPath)) {
            console.log(`Leyendo confirmaciones desde ${confirmationsCsvPath}...`);
            const fileContent = fs.readFileSync(confirmationsCsvPath, 'utf-8');

            const records = parse(fileContent, {
                columns: true,
                skip_empty_lines: true,
                trim: true
            });

            console.log(`Se encontraron ${records.length} confirmaciones en el CSV.`);

            let successCount = 0;
            let errorCount = 0;

            for (const record of records) {
                try {
                    // Mapear los campos del CSV a la entidad Confirmation
                    const confirmationData = {
                        code: record.code || record.invitationId, // Soportar ambos nombres de columna
                        willAttend:
                            record.willAttend === 'true' ||
                            record.willAttend === '1' ||
                            record.status === 'confirmed',
                        attendingGuests:
                            parseInt(record.attendingGuests || record.confirmedTickets, 10) || 0,
                        attendingNames: record.attendingNames
                            ? record.attendingNames.split(' y ').map(n => n.trim())
                            : record.name
                              ? [record.name]
                              : [],
                        phone: record.phone || '',
                        dietaryRestrictions: record.dietaryRestrictions || record.allergies || '',
                        message: record.message || record.songRequests || '',
                        confirmedAt:
                            record.confirmedAt || record.createdAt || new Date().toISOString()
                    };

                    const confirmation = new Confirmation(confirmationData);
                    await confirmationRepo.save(confirmation);
                    successCount++;
                } catch (error) {
                    errorCount++;
                    console.error(
                        `Error al migrar confirmación para código ${record.code || record.invitationId}:`,
                        error.message
                    );
                }
            }

            console.log(
                `Migración de confirmaciones completada: ${successCount} exitosas, ${errorCount} errores.`
            );
        } else {
            console.log(`No se encontró el archivo de confirmaciones en ${confirmationsCsvPath}`);
        }

        console.log('Migración finalizada con éxito.');
    } catch (error) {
        console.error('Error durante la migración:', error);
        process.exit(1);
    }
}

// Si se ejecuta directamente
if (require.main === module) {
    migrate()
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
}

module.exports = {
    migrate
};
