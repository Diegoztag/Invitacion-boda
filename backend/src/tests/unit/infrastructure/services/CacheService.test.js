const CacheService = require('../../../../infrastructure/services/CacheService');
const NodeCache = require('node-cache');

jest.mock('node-cache');

describe('CacheService', () => {
    let cacheService;
    let mockLogger;
    let mockNodeCacheInstance;

    beforeEach(() => {
        mockLogger = {
            debug: jest.fn(),
            info: jest.fn()
        };

        mockNodeCacheInstance = {
            get: jest.fn(),
            set: jest.fn(),
            del: jest.fn(),
            keys: jest.fn(),
            flushAll: jest.fn(),
            getStats: jest.fn()
        };

        NodeCache.mockImplementation(() => mockNodeCacheInstance);

        cacheService = new CacheService(mockLogger);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('constructor', () => {
        it('should initialize NodeCache with default TTL', () => {
            expect(NodeCache).toHaveBeenCalledWith({
                stdTTL: 300,
                checkperiod: 60,
                useClones: false
            });
        });

        it('should initialize NodeCache with custom TTL', () => {
            new CacheService(mockLogger, 600);
            expect(NodeCache).toHaveBeenCalledWith({
                stdTTL: 600,
                checkperiod: 120,
                useClones: false
            });
        });
    });

    describe('get', () => {
        it('should return value and log hit if key exists', () => {
            mockNodeCacheInstance.get.mockReturnValue('test_value');

            const result = cacheService.get('test_key');

            expect(result).toBe('test_value');
            expect(mockNodeCacheInstance.get).toHaveBeenCalledWith('test_key');
            expect(mockLogger.debug).toHaveBeenCalledWith('Cache hit for key: test_key');
        });

        it('should return undefined and log miss if key does not exist', () => {
            mockNodeCacheInstance.get.mockReturnValue(undefined);

            const result = cacheService.get('test_key');

            expect(result).toBeUndefined();
            expect(mockNodeCacheInstance.get).toHaveBeenCalledWith('test_key');
            expect(mockLogger.debug).toHaveBeenCalledWith('Cache miss for key: test_key');
        });
    });

    describe('set', () => {
        it('should set value without TTL', () => {
            mockNodeCacheInstance.set.mockReturnValue(true);

            const result = cacheService.set('test_key', 'test_value');

            expect(result).toBe(true);
            expect(mockNodeCacheInstance.set).toHaveBeenCalledWith('test_key', 'test_value');
            expect(mockLogger.debug).toHaveBeenCalledWith('Setting cache for key: test_key');
        });

        it('should set value with TTL', () => {
            mockNodeCacheInstance.set.mockReturnValue(true);

            const result = cacheService.set('test_key', 'test_value', 100);

            expect(result).toBe(true);
            expect(mockNodeCacheInstance.set).toHaveBeenCalledWith('test_key', 'test_value', 100);
            expect(mockLogger.debug).toHaveBeenCalledWith('Setting cache for key: test_key');
        });
    });

    describe('del', () => {
        it('should delete key', () => {
            mockNodeCacheInstance.del.mockReturnValue(1);

            const result = cacheService.del('test_key');

            expect(result).toBe(1);
            expect(mockNodeCacheInstance.del).toHaveBeenCalledWith('test_key');
            expect(mockLogger.debug).toHaveBeenCalledWith('Deleting cache for keys: test_key');
        });

        it('should delete multiple keys', () => {
            mockNodeCacheInstance.del.mockReturnValue(2);

            const result = cacheService.del(['key1', 'key2']);

            expect(result).toBe(2);
            expect(mockNodeCacheInstance.del).toHaveBeenCalledWith(['key1', 'key2']);
            expect(mockLogger.debug).toHaveBeenCalledWith('Deleting cache for keys: key1,key2');
        });
    });

    describe('deletePattern', () => {
        it('should delete keys matching pattern', () => {
            mockNodeCacheInstance.keys.mockReturnValue(['stats_1', 'stats_2', 'other_key']);
            mockNodeCacheInstance.del.mockReturnValue(2);

            const result = cacheService.deletePattern('stats_*');

            expect(result).toBe(2);
            expect(mockNodeCacheInstance.keys).toHaveBeenCalled();
            expect(mockNodeCacheInstance.del).toHaveBeenCalledWith(['stats_1', 'stats_2']);
            expect(mockLogger.debug).toHaveBeenCalledWith('Deleting cache for pattern: stats_*');
        });

        it('should return 0 if no keys match pattern', () => {
            mockNodeCacheInstance.keys.mockReturnValue(['other_key1', 'other_key2']);

            const result = cacheService.deletePattern('stats_*');

            expect(result).toBe(0);
            expect(mockNodeCacheInstance.keys).toHaveBeenCalled();
            expect(mockNodeCacheInstance.del).not.toHaveBeenCalled();
            expect(mockLogger.debug).toHaveBeenCalledWith('Deleting cache for pattern: stats_*');
        });
    });

    describe('flush', () => {
        it('should flush all cache', () => {
            cacheService.flush();

            expect(mockNodeCacheInstance.flushAll).toHaveBeenCalled();
            expect(mockLogger.info).toHaveBeenCalledWith('Flushing entire cache');
        });
    });

    describe('getStats', () => {
        it('should return cache stats', () => {
            const mockStats = { hits: 10, misses: 5 };
            mockNodeCacheInstance.getStats.mockReturnValue(mockStats);

            const result = cacheService.getStats();

            expect(result).toBe(mockStats);
            expect(mockNodeCacheInstance.getStats).toHaveBeenCalled();
        });
    });
});
