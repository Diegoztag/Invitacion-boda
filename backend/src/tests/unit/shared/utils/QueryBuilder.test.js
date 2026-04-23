const QueryBuilder = require('../../../../shared/utils/QueryBuilder');

describe('QueryBuilder', () => {
    describe('buildFromRequest', () => {
        it('should build query with default values', () => {
            const query = {};
            const result = QueryBuilder.buildFromRequest(query);

            expect(result).toEqual({
                page: 1,
                limit: 10,
                filters: {},
                sort: {
                    field: 'createdAt',
                    direction: 'desc'
                },
                includeInactive: false
            });
        });

        it('should use config default limit if provided', () => {
            const query = {};
            const config = { validation: { pagination: { defaultLimit: 20 } } };
            const result = QueryBuilder.buildFromRequest(query, config);

            expect(result.limit).toBe(20);
        });

        it('should parse pagination and sorting parameters', () => {
            const query = {
                page: '2',
                limit: '15',
                sortBy: 'name',
                sortOrder: 'asc',
                includeInactive: 'true'
            };
            const result = QueryBuilder.buildFromRequest(query);

            expect(result).toEqual({
                page: 2,
                limit: 15,
                filters: {},
                sort: {
                    field: 'name',
                    direction: 'asc'
                },
                includeInactive: true
            });
        });

        it('should handle invalid pagination parameters gracefully', () => {
            const query = {
                page: 'invalid',
                limit: 'invalid'
            };
            const result = QueryBuilder.buildFromRequest(query);

            expect(result.page).toBe(1);
            expect(result.limit).toBe(10);
        });

        it('should parse filters correctly', () => {
            const query = {
                status: 'active',
                isActive: 'true',
                isDeleted: 'false',
                age: '30',
                phone: '1234567890',
                search: '123',
                empty: '',
                nullValue: null,
                undefinedValue: undefined
            };
            const result = QueryBuilder.buildFromRequest(query);

            expect(result.filters).toEqual({
                status: 'active',
                isActive: true,
                isDeleted: false,
                age: 30,
                phone: '1234567890', // Should not be converted to number
                search: '123' // Should not be converted to number
            });
        });
    });

    describe('_parseFilters', () => {
        it('should ignore empty, null, or undefined values', () => {
            const rawFilters = {
                valid: 'value',
                empty: '',
                nullValue: null,
                undefinedValue: undefined
            };
            const result = QueryBuilder._parseFilters(rawFilters);

            expect(result).toEqual({ valid: 'value' });
        });

        it('should convert boolean strings to booleans', () => {
            const rawFilters = {
                isTrue: 'true',
                isFalse: 'false'
            };
            const result = QueryBuilder._parseFilters(rawFilters);

            expect(result).toEqual({
                isTrue: true,
                isFalse: false
            });
        });

        it('should convert numeric strings to numbers except for specific fields', () => {
            const rawFilters = {
                age: '25',
                count: '100',
                phone: '1234567890',
                search: '404'
            };
            const result = QueryBuilder._parseFilters(rawFilters);

            expect(result).toEqual({
                age: 25,
                count: 100,
                phone: '1234567890',
                search: '404'
            });
        });

        it('should keep regular strings as strings', () => {
            const rawFilters = {
                name: 'John',
                status: 'pending'
            };
            const result = QueryBuilder._parseFilters(rawFilters);

            expect(result).toEqual({
                name: 'John',
                status: 'pending'
            });
        });
    });
});
