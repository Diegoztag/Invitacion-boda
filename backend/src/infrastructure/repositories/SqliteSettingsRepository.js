const { getDbConnection } = require('../database/sqlite-connection');

class SqliteSettingsRepository {
    async getSettings() {
        const db = await getDbConnection();
        const rows = await db.all('SELECT key, value FROM settings');

        const settings = {};
        for (const row of rows) {
            try {
                settings[row.key] = JSON.parse(row.value);
            } catch (e) {
                settings[row.key] = row.value;
            }
        }

        return settings;
    }

    async getSetting(key) {
        const db = await getDbConnection();
        const row = await db.get('SELECT value FROM settings WHERE key = ?', [key]);

        if (!row) {
            return null;
        }

        try {
            return JSON.parse(row.value);
        } catch (e) {
            return row.value;
        }
    }

    async updateSettings(settings) {
        const db = await getDbConnection();
        const now = new Date().toISOString();

        await db.run('BEGIN TRANSACTION');

        try {
            for (const [key, value] of Object.entries(settings)) {
                const stringValue =
                    typeof value === 'object' ? JSON.stringify(value) : String(value);

                await db.run(
                    `INSERT INTO settings (key, value, updatedAt) 
                     VALUES (?, ?, ?) 
                     ON CONFLICT(key) DO UPDATE SET 
                     value = excluded.value, 
                     updatedAt = excluded.updatedAt`,
                    [key, stringValue, now]
                );
            }

            await db.run('COMMIT');
            return true;
        } catch (error) {
            await db.run('ROLLBACK');
            throw error;
        }
    }
}

module.exports = SqliteSettingsRepository;
