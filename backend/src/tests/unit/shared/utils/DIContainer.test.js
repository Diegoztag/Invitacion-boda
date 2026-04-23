const DIContainer = require('../../../../shared/utils/DIContainer');

describe('DIContainer', () => {
    let container;

    beforeEach(() => {
        container = new DIContainer();
    });

    describe('register', () => {
        it('should register a dependency successfully', () => {
            const factory = () => ({ id: 1 });
            container.register('testService', factory);

            expect(container.has('testService')).toBe(true);
        });

        it('should throw an error if name is not a string', () => {
            expect(() => {
                container.register(123, () => {});
            }).toThrow('Dependency name must be a string');
        });

        it('should throw an error if factory is not a function', () => {
            expect(() => {
                container.register('testService', {});
            }).toThrow('Factory must be a function');
        });
    });

    describe('resolve', () => {
        it('should resolve a registered dependency', () => {
            const factory = () => ({ id: 1 });
            container.register('testService', factory);

            const instance = container.resolve('testService');
            expect(instance).toEqual({ id: 1 });
        });

        it('should throw an error if dependency is not found', () => {
            expect(() => {
                container.resolve('nonExistentService');
            }).toThrow("Dependency 'nonExistentService' not found in container");
        });

        it('should create a new instance each time if not singleton', () => {
            let counter = 0;
            const factory = () => ({ id: ++counter });
            container.register('testService', factory, { singleton: false });

            const instance1 = container.resolve('testService');
            const instance2 = container.resolve('testService');

            expect(instance1.id).toBe(1);
            expect(instance2.id).toBe(2);
            expect(instance1).not.toBe(instance2);
        });

        it('should return the same instance if singleton', () => {
            let counter = 0;
            const factory = () => ({ id: ++counter });
            container.register('testService', factory, { singleton: true });

            const instance1 = container.resolve('testService');
            const instance2 = container.resolve('testService');

            expect(instance1.id).toBe(1);
            expect(instance2.id).toBe(1);
            expect(instance1).toBe(instance2);
        });
    });

    describe('remove', () => {
        it('should remove a registered dependency', () => {
            container.register('testService', () => ({}));
            expect(container.has('testService')).toBe(true);

            container.remove('testService');
            expect(container.has('testService')).toBe(false);
        });

        it('should remove singleton instance when removing dependency', () => {
            container.register('testService', () => ({}), { singleton: true });
            container.resolve('testService'); // Instantiate

            container.remove('testService');

            expect(() => {
                container.resolve('testService');
            }).toThrow();
        });
    });

    describe('clear', () => {
        it('should remove all dependencies', () => {
            container.register('service1', () => ({}));
            container.register('service2', () => ({}));

            container.clear();

            expect(container.has('service1')).toBe(false);
            expect(container.has('service2')).toBe(false);
        });
    });

    describe('getRegisteredDependencies', () => {
        it('should return an array of registered dependency names', () => {
            container.register('service1', () => ({}));
            container.register('service2', () => ({}));

            const deps = container.getRegisteredDependencies();
            expect(deps).toContain('service1');
            expect(deps).toContain('service2');
            expect(deps.length).toBe(2);
        });
    });

    describe('getDependencyInfo', () => {
        it('should return info for a registered dependency', () => {
            container.register('testService', () => ({}), { singleton: true });

            const info = container.getDependencyInfo('testService');
            expect(info).toEqual({
                name: 'testService',
                singleton: true,
                isInstantiated: false
            });
        });

        it('should return isInstantiated true after resolving a singleton', () => {
            container.register('testService', () => ({}), { singleton: true });
            container.resolve('testService');

            const info = container.getDependencyInfo('testService');
            expect(info.isInstantiated).toBe(true);
        });

        it('should return null for non-existent dependency', () => {
            const info = container.getDependencyInfo('nonExistentService');
            expect(info).toBeNull();
        });
    });
});
