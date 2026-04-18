const IConfirmationRepository = require('../../core/repositories/IConfirmationRepository');
const Confirmation = require('../../core/entities/Confirmation');
const { getDbConnection } = require('../database/sqlite-connection');

class SqliteConfirmationRepository extends IConfirmationRepository {
    constructor() {
        super();
    }

    /**
     * Mapea una fila de la base de datos a una entidad Confirmation
     * @param {Object} row
     * @returns {Confirmation}
     */
    _mapRowToEntity(row) {
        if (!row) {
            return null;
        }

        return new Confirmation({
            code: row.code,
            willAttend: Boolean(row.willAttend),
            attendingGuests: row.attendingGuests,
            attendingNames: JSON.parse(row.attendingNames || '[]'),
            phone: row.phone,
            dietaryRestrictions: row.dietaryRestrictions,
            message: row.message,
            confirmedAt: row.confirmedAt
        });
    }

    /**
     * Mapea una entidad Confirmation a un objeto para la base de datos
     * @param {Confirmation} entity
     * @returns {Object}
     */
    _mapEntityToRow(entity) {
        return {
            $code: entity.code,
            $willAttend: entity.willAttend ? 1 : 0,
            $attendingGuests: entity.attendingGuests,
            $attendingNames: JSON.stringify(entity.attendingNames),
            $phone: entity.phone,
            $dietaryRestrictions: entity.dietaryRestrictions,
            $message: entity.message,
            $confirmedAt: entity.confirmedAt
        };
    }

    async save(confirmation) {
        const db = await getDbConnection();
        const row = this._mapEntityToRow(confirmation);

        await db.run(
            `
      INSERT INTO confirmations (
        code, willAttend, attendingGuests, attendingNames, 
        phone, dietaryRestrictions, message, confirmedAt
      ) VALUES (
        $code, $willAttend, $attendingGuests, $attendingNames, 
        $phone, $dietaryRestrictions, $message, $confirmedAt
      )
      ON CONFLICT(code) DO UPDATE SET
        willAttend = $willAttend,
        attendingGuests = $attendingGuests,
        attendingNames = $attendingNames,
        phone = $phone,
        dietaryRestrictions = $dietaryRestrictions,
        message = $message,
        confirmedAt = $confirmedAt
    `,
            row
        );

        return confirmation;
    }

    async findByCode(code) {
        const db = await getDbConnection();
        const row = await db.get('SELECT * FROM confirmations WHERE code = ?', [code]);
        return this._mapRowToEntity(row);
    }

    async findAll(filters = {}) {
        const db = await getDbConnection();
        let query = 'SELECT * FROM confirmations WHERE 1=1';
        const params = [];

        if (filters.willAttend !== undefined) {
            query += ' AND willAttend = ?';
            params.push(filters.willAttend ? 1 : 0);
        }

        if (filters.confirmedAfter) {
            query += ' AND confirmedAt >= ?';
            params.push(filters.confirmedAfter.toISOString());
        }

        if (filters.confirmedBefore) {
            query += ' AND confirmedAt <= ?';
            params.push(filters.confirmedBefore.toISOString());
        }

        const rows = await db.all(query, params);
        return rows.map(row => this._mapRowToEntity(row));
    }

    async update(code, confirmation) {
        return this.save(confirmation); // save usa UPSERT (ON CONFLICT DO UPDATE)
    }

    async delete(code) {
        const db = await getDbConnection();
        const result = await db.run('DELETE FROM confirmations WHERE code = ?', [code]);
        return result.changes > 0;
    }

    async findByPhone(phone) {
        const db = await getDbConnection();
        const rows = await db.all('SELECT * FROM confirmations WHERE phone LIKE ?', [`%${phone}%`]);
        return rows.map(row => this._mapRowToEntity(row));
    }

    async findByGuestName(guestName) {
        const db = await getDbConnection();
        const rows = await db.all('SELECT * FROM confirmations WHERE attendingNames LIKE ?', [
            `%${guestName}%`
        ]);
        return rows.map(row => this._mapRowToEntity(row));
    }

    async findPositiveConfirmations() {
        return this.findAll({ willAttend: true });
    }

    async findNegativeConfirmations() {
        return this.findAll({ willAttend: false });
    }

    async findWithDietaryRestrictions() {
        const db = await getDbConnection();
        const rows = await db.all(
            'SELECT * FROM confirmations WHERE dietaryRestrictions IS NOT NULL AND dietaryRestrictions != ""'
        );
        return rows.map(row => this._mapRowToEntity(row));
    }

    async findWithMessages() {
        const db = await getDbConnection();
        const rows = await db.all(
            'SELECT * FROM confirmations WHERE message IS NOT NULL AND message != ""'
        );
        return rows.map(row => this._mapRowToEntity(row));
    }

    async getStats() {
        const db = await getDbConnection();

        const total = await db.get('SELECT COUNT(*) as count FROM confirmations');
        const positive = await db.get(
            'SELECT COUNT(*) as count FROM confirmations WHERE willAttend = 1'
        );
        const negative = await db.get(
            'SELECT COUNT(*) as count FROM confirmations WHERE willAttend = 0'
        );
        const totalGuests = await db.get(
            'SELECT SUM(attendingGuests) as sum FROM confirmations WHERE willAttend = 1'
        );
        const withDietary = await db.get(
            'SELECT COUNT(*) as count FROM confirmations WHERE dietaryRestrictions IS NOT NULL AND dietaryRestrictions != ""'
        );
        const withMessages = await db.get(
            'SELECT COUNT(*) as count FROM confirmations WHERE message IS NOT NULL AND message != ""'
        );

        return {
            totalConfirmations: total.count || 0,
            positiveConfirmations: positive.count || 0,
            negativeConfirmations: negative.count || 0,
            totalConfirmedGuests: totalGuests.sum || 0,
            confirmationsWithDietaryRestrictions: withDietary.count || 0,
            confirmationsWithMessages: withMessages.count || 0
        };
    }

    async exists(code) {
        const db = await getDbConnection();
        const row = await db.get('SELECT 1 FROM confirmations WHERE code = ?', [code]);
        return !!row;
    }

    async count(filters = {}) {
        const db = await getDbConnection();
        let query = 'SELECT COUNT(*) as count FROM confirmations WHERE 1=1';
        const params = [];

        if (filters.willAttend !== undefined) {
            query += ' AND willAttend = ?';
            params.push(filters.willAttend ? 1 : 0);
        }

        const row = await db.get(query, params);
        return row.count;
    }

    async findPaginated(page = 1, limit = 10, filters = {}, sort = {}) {
        const db = await getDbConnection();
        const offset = (page - 1) * limit;

        let query = 'SELECT * FROM confirmations WHERE 1=1';
        let countQuery = 'SELECT COUNT(*) as count FROM confirmations WHERE 1=1';
        const params = [];

        if (filters.willAttend !== undefined) {
            query += ' AND willAttend = ?';
            countQuery += ' AND willAttend = ?';
            params.push(filters.willAttend ? 1 : 0);
        }

        // Ordenamiento
        if (sort.field) {
            const direction = sort.direction === 'desc' ? 'DESC' : 'ASC';
            const validFields = ['code', 'confirmedAt', 'attendingGuests'];
            if (validFields.includes(sort.field)) {
                query += ` ORDER BY ${sort.field} ${direction}`;
            }
        } else {
            query += ' ORDER BY confirmedAt DESC';
        }

        query += ' LIMIT ? OFFSET ?';
        const queryParams = [...params, limit, offset];

        const [rows, countRow] = await Promise.all([
            db.all(query, queryParams),
            db.get(countQuery, params)
        ]);

        const total = countRow.count;
        const totalPages = Math.ceil(total / limit);

        return {
            data: rows.map(row => this._mapRowToEntity(row)),
            pagination: {
                total,
                page,
                limit,
                totalPages,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1
            }
        };
    }

    async exportAll(options = {}) {
        const confirmations = await this.findAll();
        return confirmations.map(conf => conf.toObject());
    }

    async getTotalConfirmedGuests() {
        const db = await getDbConnection();
        const row = await db.get(
            'SELECT SUM(attendingGuests) as sum FROM confirmations WHERE willAttend = 1'
        );
        return row.sum || 0;
    }

    async findRecent(hours = 24) {
        const db = await getDbConnection();
        const date = new Date();
        date.setHours(date.getHours() - hours);

        const rows = await db.all(
            'SELECT * FROM confirmations WHERE confirmedAt >= ? ORDER BY confirmedAt DESC',
            [date.toISOString()]
        );
        return rows.map(row => this._mapRowToEntity(row));
    }

    async findByDateRange(startDate, endDate) {
        const db = await getDbConnection();
        const rows = await db.all(
            'SELECT * FROM confirmations WHERE confirmedAt >= ? AND confirmedAt <= ? ORDER BY confirmedAt DESC',
            [startDate.toISOString(), endDate.toISOString()]
        );
        return rows.map(row => this._mapRowToEntity(row));
    }
}

module.exports = SqliteConfirmationRepository;
