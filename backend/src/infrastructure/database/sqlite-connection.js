const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const path = require('path');
const config = require('../../config');

let dbInstance = null;

/**
 * Obtiene la conexión a la base de datos SQLite
 * @returns {Promise<import('sqlite').Database>}
 */
async function getDbConnection() {
    if (dbInstance) {
        return dbInstance;
    }

    const dbPath =
        config.database?.sqlitePath || path.join(__dirname, '../../../../data/database.sqlite');

    dbInstance = await open({
        filename: dbPath,
        driver: sqlite3.Database
    });

    // Habilitar claves foráneas
    await dbInstance.exec('PRAGMA foreign_keys = ON;');

    return dbInstance;
}

/**
 * Cierra la conexión a la base de datos
 */
async function closeDbConnection() {
    if (dbInstance) {
        await dbInstance.close();
        dbInstance = null;
    }
}

module.exports = {
    getDbConnection,
    closeDbConnection
};
