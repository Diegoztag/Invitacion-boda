const IInvitationRepository = require('../../core/repositories/IInvitationRepository');
const Invitation = require('../../core/entities/Invitation');
const { getDbConnection } = require('../database/sqlite-connection');

class SqliteInvitationRepository extends IInvitationRepository {
    constructor() {
        super();
    }

    /**
     * Mapea una fila de la base de datos a una entidad Invitation
     * @param {Object} row
     * @returns {Invitation}
     */
    _mapRowToEntity(row) {
        if (!row) {
            return null;
        }

        return new Invitation({
            code: row.code,
            guestNames: JSON.parse(row.guestNames || '[]'),
            numberOfPasses: row.numberOfPasses,
            phone: row.phone,
            createdAt: row.createdAt,
            confirmedPasses: row.confirmedPasses,
            confirmationDate: row.confirmationDate,
            adultPasses: row.adultPasses,
            childPasses: row.childPasses,
            staffPasses: row.staffPasses,
            tableNumber: row.tableNumber,
            status: row.status,
            cancelledAt: row.cancelledAt,
            cancelledBy: row.cancelledBy,
            cancellationReason: row.cancellationReason,
            attendingNames: JSON.parse(row.attendingNames || '[]'),
            dietaryRestrictionsNames: row.dietaryRestrictionsNames,
            dietaryRestrictionsDetails: row.dietaryRestrictionsDetails,
            generalMessage: row.generalMessage
        });
    }

    /**
     * Mapea una entidad Invitation a un objeto para la base de datos
     * @param {Invitation} entity
     * @returns {Object}
     */
    _mapEntityToRow(entity) {
        return {
            $code: entity.code,
            $guestNames: JSON.stringify(entity.guestNames),
            $numberOfPasses: entity.numberOfPasses,
            $phone: entity.phone,
            $createdAt: entity.createdAt,
            $confirmedPasses: entity.confirmedPasses,
            $confirmationDate: entity.confirmationDate,
            $adultPasses: entity.adultPasses,
            $childPasses: entity.childPasses,
            $staffPasses: entity.staffPasses,
            $tableNumber: entity.tableNumber,
            $status: entity.status,
            $cancelledAt: entity.cancelledAt,
            $cancelledBy: entity.cancelledBy,
            $cancellationReason: entity.cancellationReason,
            $attendingNames: JSON.stringify(entity.attendingNames),
            $dietaryRestrictionsNames: entity.dietaryRestrictionsNames,
            $dietaryRestrictionsDetails: entity.dietaryRestrictionsDetails,
            $generalMessage: entity.generalMessage
        };
    }

    async save(invitation) {
        const db = await getDbConnection();
        const row = this._mapEntityToRow(invitation);
        console.log('save', row);

        await db.run(
            `
      INSERT INTO invitations (
        code, guestNames, numberOfPasses, phone, createdAt, 
        confirmedPasses, confirmationDate, adultPasses, childPasses, staffPasses, 
        tableNumber, status, cancelledAt, cancelledBy, cancellationReason, 
        attendingNames, dietaryRestrictionsNames, dietaryRestrictionsDetails, generalMessage
      ) VALUES (
        $code, $guestNames, $numberOfPasses, $phone, $createdAt, 
        $confirmedPasses, $confirmationDate, $adultPasses, $childPasses, $staffPasses, 
        $tableNumber, $status, $cancelledAt, $cancelledBy, $cancellationReason, 
        $attendingNames, $dietaryRestrictionsNames, $dietaryRestrictionsDetails, $generalMessage
      )
    `,
            row
        );

        return invitation;
    }

    async findByCode(code) {
        const db = await getDbConnection();
        const row = await db.get('SELECT * FROM invitations WHERE code = ?', [code]);
        console.log('findByCode', code, row);
        return this._mapRowToEntity(row);
    }

    async findAll(filters = {}) {
        const db = await getDbConnection();
        let query = 'SELECT * FROM invitations WHERE 1=1';
        const params = [];

        if (filters.status) {
            query += ' AND status = ?';
            params.push(filters.status);
        }

        if (filters.confirmed !== undefined) {
            if (filters.confirmed) {
                query += ' AND confirmationDate IS NOT NULL';
            } else {
                query += ' AND confirmationDate IS NULL';
            }
        }

        const rows = await db.all(query, params);
        return rows.map(row => this._mapRowToEntity(row));
    }

    async update(code, invitation) {
        const db = await getDbConnection();
        const row = this._mapEntityToRow(invitation);

        // Asegurarse de que el código coincida
        row.$code = code;

        // Eliminar createdAt ya que no se actualiza y causaría SQLITE_RANGE
        delete row.$createdAt;

        await db.run(
            `
      UPDATE invitations SET
        guestNames = $guestNames,
        numberOfPasses = $numberOfPasses,
        phone = $phone,
        confirmedPasses = $confirmedPasses,
        confirmationDate = $confirmationDate,
        adultPasses = $adultPasses,
        childPasses = $childPasses,
        staffPasses = $staffPasses,
        tableNumber = $tableNumber,
        status = $status,
        cancelledAt = $cancelledAt,
        cancelledBy = $cancelledBy,
        cancellationReason = $cancellationReason,
        attendingNames = $attendingNames,
        dietaryRestrictionsNames = $dietaryRestrictionsNames,
        dietaryRestrictionsDetails = $dietaryRestrictionsDetails,
        generalMessage = $generalMessage
      WHERE code = $code
    `,
            row
        );

        return invitation;
    }

    async delete(code, deletedBy = 'admin', reason = '') {
        const db = await getDbConnection();
        const now = new Date().toISOString();

        const result = await db.run(
            `
      UPDATE invitations 
      SET status = 'inactive', cancelledAt = ?, cancelledBy = ?, cancellationReason = ?
      WHERE code = ?
    `,
            [now, deletedBy, reason, code]
        );

        return result.changes > 0;
    }

    async restore(code) {
        const db = await getDbConnection();

        await db.run(
            `
      UPDATE invitations 
      SET status = 'active', cancelledAt = NULL, cancelledBy = NULL, cancellationReason = NULL
      WHERE code = ?
    `,
            [code]
        );

        return this.findByCode(code);
    }

    async findByGuestName(guestName) {
        const db = await getDbConnection();
        // Búsqueda simple en el JSON string
        const rows = await db.all('SELECT * FROM invitations WHERE guestNames LIKE ?', [
            `%${guestName}%`
        ]);
        return rows.map(row => this._mapRowToEntity(row));
    }

    async findByPhone(phone) {
        const db = await getDbConnection();
        const rows = await db.all('SELECT * FROM invitations WHERE phone LIKE ?', [`%${phone}%`]);
        return rows.map(row => this._mapRowToEntity(row));
    }

    async findByTable(tableNumber) {
        const db = await getDbConnection();
        const rows = await db.all('SELECT * FROM invitations WHERE tableNumber = ?', [tableNumber]);
        return rows.map(row => this._mapRowToEntity(row));
    }

    async getStats() {
        const db = await getDbConnection();

        const totalInvitations = await db.get('SELECT COUNT(*) as count FROM invitations');
        const activeInvitations = await db.get(
            'SELECT COUNT(*) as count FROM invitations WHERE status != "inactive"'
        );
        const inactiveInvitations = await db.get(
            'SELECT COUNT(*) as count FROM invitations WHERE status = "inactive"'
        );

        const totalPasses = await db.get(
            'SELECT SUM(numberOfPasses) as sum FROM invitations WHERE status != "inactive"'
        );
        const confirmedPasses = await db.get(
            'SELECT SUM(confirmedPasses) as sum FROM invitations WHERE status != "inactive"'
        );

        const occupiedPasses = await db.get(
            `SELECT SUM(
                CASE 
                    WHEN status IN ('confirmed', 'partial') THEN confirmedPasses 
                    WHEN status IN ('pending', 'active', '') OR status IS NULL THEN numberOfPasses 
                    ELSE 0 
                END
            ) as sum FROM invitations WHERE status != 'inactive'`
        );

        const confirmedInvitations = await db.get(
            'SELECT COUNT(*) as count FROM invitations WHERE status = "confirmed"'
        );
        const partialInvitations = await db.get(
            'SELECT COUNT(*) as count FROM invitations WHERE status = "partial"'
        );
        const pendingInvitations = await db.get(
            'SELECT COUNT(*) as count FROM invitations WHERE status IN ("pending", "active", "") OR status IS NULL'
        );
        const cancelledInvitations = await db.get(
            'SELECT COUNT(*) as count FROM invitations WHERE status = "cancelled"'
        );

        const activeAdultPasses = await db.get(
            'SELECT SUM(adultPasses) as sum FROM invitations WHERE status != "inactive"'
        );
        const activeChildPasses = await db.get(
            'SELECT SUM(childPasses) as sum FROM invitations WHERE status != "inactive"'
        );
        const activeStaffPasses = await db.get(
            'SELECT SUM(staffPasses) as sum FROM invitations WHERE status != "inactive"'
        );

        const confirmedAdultPasses = await db.get(
            'SELECT SUM(adultPasses) as sum FROM invitations WHERE status IN ("confirmed", "partial")'
        );
        const confirmedChildPasses = await db.get(
            'SELECT SUM(childPasses) as sum FROM invitations WHERE status IN ("confirmed", "partial")'
        );
        const confirmedStaffPasses = await db.get(
            'SELECT SUM(staffPasses) as sum FROM invitations WHERE status IN ("confirmed", "partial")'
        );

        return {
            total: totalInvitations.count || 0,
            active: activeInvitations.count || 0,
            inactive: inactiveInvitations.count || 0,
            confirmed: confirmedInvitations.count || 0,
            partial: partialInvitations.count || 0,
            pending: pendingInvitations.count || 0,
            cancelled: cancelledInvitations.count || 0,

            totalIssuedPasses: totalPasses.sum || 0,
            occupiedPasses: occupiedPasses.sum || 0,
            confirmedPasses: confirmedPasses.sum || 0,

            activeAdultPasses: activeAdultPasses.sum || 0,
            activeChildPasses: activeChildPasses.sum || 0,
            activeStaffPasses: activeStaffPasses.sum || 0,

            confirmedAdultPasses: confirmedAdultPasses.sum || 0,
            confirmedChildPasses: confirmedChildPasses.sum || 0,
            confirmedStaffPasses: confirmedStaffPasses.sum || 0
        };
    }

    async importBatch(invitationsData) {
        const db = await getDbConnection();
        let successCount = 0;
        let errorCount = 0;
        const errors = [];

        await db.run('BEGIN TRANSACTION');

        try {
            for (const data of invitationsData) {
                try {
                    const invitation = new Invitation(data);
                    const row = this._mapEntityToRow(invitation);

                    await db.run(
                        `
            INSERT INTO invitations (
              code, guestNames, numberOfPasses, phone, createdAt, 
              confirmedPasses, confirmationDate, adultPasses, childPasses, staffPasses, 
              tableNumber, status, cancelledAt, cancelledBy, cancellationReason, 
              attendingNames, dietaryRestrictionsNames, dietaryRestrictionsDetails, generalMessage
            ) VALUES (
              $code, $guestNames, $numberOfPasses, $phone, $createdAt, 
              $confirmedPasses, $confirmationDate, $adultPasses, $childPasses, $staffPasses, 
              $tableNumber, $status, $cancelledAt, $cancelledBy, $cancellationReason, 
              $attendingNames, $dietaryRestrictionsNames, $dietaryRestrictionsDetails, $generalMessage
            )
          `,
                        row
                    );

                    successCount++;
                } catch (error) {
                    errorCount++;
                    errors.push({ data, error: error.message });
                }
            }

            await db.run('COMMIT');
        } catch (error) {
            await db.run('ROLLBACK');
            throw error;
        }

        return { successCount, errorCount, errors };
    }

    async exportAll(options = {}) {
        const invitations = await this.findAll();
        return invitations.map(inv => inv.toObject());
    }

    async exists(code) {
        const db = await getDbConnection();
        const row = await db.get('SELECT 1 FROM invitations WHERE code = ?', [code]);
        return !!row;
    }

    async count(filters = {}) {
        const db = await getDbConnection();
        let query = 'SELECT COUNT(*) as count FROM invitations WHERE 1=1';
        const params = [];

        if (filters.status) {
            query += ' AND status = ?';
            params.push(filters.status);
        }

        const row = await db.get(query, params);
        return row.count;
    }

    async findPaginated(page = 1, limit = 10, filters = {}, sort = {}) {
        const db = await getDbConnection();
        const offset = (page - 1) * limit;

        let query = 'SELECT * FROM invitations WHERE 1=1';
        let countQuery = 'SELECT COUNT(*) as count FROM invitations WHERE 1=1';
        const params = [];

        if (filters.status) {
            query += ' AND status = ?';
            countQuery += ' AND status = ?';
            params.push(filters.status);
        }

        if (filters.passes) {
            if (filters.passes === '4+') {
                query += ' AND numberOfPasses >= 4';
                countQuery += ' AND numberOfPasses >= 4';
            } else {
                query += ' AND numberOfPasses = ?';
                countQuery += ' AND numberOfPasses = ?';
                params.push(parseInt(filters.passes));
            }
        }

        if (filters.table) {
            if (filters.table === 'assigned') {
                query += ' AND tableNumber IS NOT NULL';
                countQuery += ' AND tableNumber IS NOT NULL';
            } else if (filters.table === 'unassigned') {
                query += ' AND tableNumber IS NULL';
                countQuery += ' AND tableNumber IS NULL';
            } else {
                query += ' AND tableNumber = ?';
                countQuery += ' AND tableNumber = ?';
                params.push(parseInt(filters.table));
            }
        }

        if (filters.phone) {
            if (filters.phone === 'with_phone') {
                query += ' AND phone IS NOT NULL AND phone != ""';
                countQuery += ' AND phone IS NOT NULL AND phone != ""';
            } else if (filters.phone === 'without_phone') {
                query += ' AND (phone IS NULL OR phone = "")';
                countQuery += ' AND (phone IS NULL OR phone = "")';
            }
        }

        if (filters.search) {
            query += ' AND (guestNames LIKE ? OR code LIKE ? OR phone LIKE ?)';
            countQuery += ' AND (guestNames LIKE ? OR code LIKE ? OR phone LIKE ?)';
            params.push(`%${filters.search}%`, `%${filters.search}%`, `%${filters.search}%`);
        }

        // Ordenamiento
        if (sort.field) {
            const direction = sort.direction === 'desc' ? 'DESC' : 'ASC';
            // Prevenir inyección SQL en el ORDER BY
            const validFields = [
                'code',
                'createdAt',
                'status',
                'numberOfPasses',
                'confirmedPasses'
            ];
            if (validFields.includes(sort.field)) {
                query += ` ORDER BY ${sort.field} ${direction}`;
            }
        } else {
            query += ' ORDER BY createdAt DESC';
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
}

module.exports = SqliteInvitationRepository;
