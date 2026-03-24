import { debounce, throttle } from '../debounce.js';

describe('debounce helper', () => {
    beforeAll(() => {
        jest.useFakeTimers();
    });

    afterAll(() => {
        jest.useRealTimers();
    });

    it('debounces function calls', () => {
        const fn = jest.fn();
        const debounced = debounce(fn, 100);

        debounced();
        debounced();
        debounced();

        expect(fn).not.toHaveBeenCalled();

        jest.advanceTimersByTime(100);

        expect(fn).toHaveBeenCalledTimes(1);
    });

    it('executes immediately when immediate is true', () => {
        const fn = jest.fn();
        const debounced = debounce(fn, 100, true);

        debounced();

        expect(fn).toHaveBeenCalledTimes(1);

        debounced();
        jest.advanceTimersByTime(100);

        expect(fn).toHaveBeenCalledTimes(1);
    });
});

describe('throttle helper', () => {
    beforeAll(() => {
        jest.useFakeTimers();
    });

    afterAll(() => {
        jest.useRealTimers();
    });

    it('throttles function calls', () => {
        const fn = jest.fn();
        const throttled = throttle(fn, 100);

        throttled();
        throttled();
        throttled();

        expect(fn).toHaveBeenCalledTimes(1);

        jest.advanceTimersByTime(100);

        throttled();
        expect(fn).toHaveBeenCalledTimes(2);
    });
});
