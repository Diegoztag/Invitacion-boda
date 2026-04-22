const SseService = require('../../../../infrastructure/services/SseService');

describe('SseService', () => {
    let sseService;
    let mockLogger;

    beforeEach(() => {
        mockLogger = {
            info: jest.fn(),
            error: jest.fn()
        };
        sseService = new SseService(mockLogger);
    });

    describe('constructor', () => {
        it('should initialize with empty clients set', () => {
            expect(sseService.clients).toBeInstanceOf(Set);
            expect(sseService.clients.size).toBe(0);
            expect(sseService.logger).toBe(mockLogger);
        });
    });

    describe('addClient', () => {
        it('should add a client and configure response headers', () => {
            const mockReq = {
                on: jest.fn()
            };
            const mockRes = {
                writeHead: jest.fn(),
                write: jest.fn()
            };

            sseService.addClient(mockReq, mockRes);

            expect(mockRes.writeHead).toHaveBeenCalledWith(200, {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                Connection: 'keep-alive',
                'X-Accel-Buffering': 'no'
            });
            expect(mockRes.write).toHaveBeenCalledWith(': connected\n\n');
            expect(sseService.clients.size).toBe(1);
            expect(mockLogger.info).toHaveBeenCalledWith(
                expect.stringContaining('SSE Client connected'),
                expect.any(Object)
            );
            expect(mockReq.on).toHaveBeenCalledWith('close', expect.any(Function));
        });

        it('should remove client on request close', () => {
            let closeCallback;
            const mockReq = {
                on: jest.fn((event, cb) => {
                    if (event === 'close') {
                        closeCallback = cb;
                    }
                })
            };
            const mockRes = {
                writeHead: jest.fn(),
                write: jest.fn()
            };

            sseService.addClient(mockReq, mockRes);
            expect(sseService.clients.size).toBe(1);

            // Simulate connection close
            closeCallback();

            expect(sseService.clients.size).toBe(0);
            expect(mockLogger.info).toHaveBeenCalledWith(
                expect.stringContaining('SSE Client disconnected'),
                expect.any(Object)
            );
        });
    });

    describe('notify', () => {
        it('should send event to all connected clients', () => {
            const mockRes1 = { write: jest.fn() };
            const mockRes2 = { write: jest.fn() };

            sseService.clients.add({ id: 1, res: mockRes1 });
            sseService.clients.add({ id: 2, res: mockRes2 });

            const eventType = 'test_event';
            const eventData = { message: 'hello' };

            sseService.notify(eventType, eventData);

            expect(mockLogger.info).toHaveBeenCalledWith(`Broadcasting SSE event: ${eventType}`, {
                clientCount: 2
            });

            expect(mockRes1.write).toHaveBeenCalledWith(`event: ${eventType}\n`);
            expect(mockRes1.write).toHaveBeenCalledWith(`data: ${JSON.stringify(eventData)}\n\n`);

            expect(mockRes2.write).toHaveBeenCalledWith(`event: ${eventType}\n`);
            expect(mockRes2.write).toHaveBeenCalledWith(`data: ${JSON.stringify(eventData)}\n\n`);
        });

        it('should handle errors when sending to a client and remove it', () => {
            const mockRes1 = { write: jest.fn() };
            const mockRes2 = {
                write: jest.fn().mockImplementation(() => {
                    throw new Error('Write failed');
                })
            };

            const client1 = { id: 1, res: mockRes1 };
            const client2 = { id: 2, res: mockRes2 };

            sseService.clients.add(client1);
            sseService.clients.add(client2);

            sseService.notify('test', {});

            expect(mockRes1.write).toHaveBeenCalled();
            expect(mockRes2.write).toHaveBeenCalled();

            expect(mockLogger.error).toHaveBeenCalledWith(
                'Error sending SSE to client',
                expect.objectContaining({
                    clientId: 2,
                    error: 'Write failed'
                })
            );

            expect(sseService.clients.has(client1)).toBe(true);
            expect(sseService.clients.has(client2)).toBe(false);
            expect(sseService.clients.size).toBe(1);
        });
    });
});
