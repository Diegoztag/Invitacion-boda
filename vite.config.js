import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
    root: 'frontend',
    build: {
        outDir: '../dist',
        emptyOutDir: true,
        rollupOptions: {
            input: {
                main: resolve(__dirname, 'frontend/invitation/index.html'),
                dashboard: resolve(__dirname, 'frontend/dashboard/index.html'),
                login: resolve(__dirname, 'frontend/dashboard/login.html')
            },
            output: {
                manualChunks(id) {
                    if (id.includes('node_modules')) {
                        return 'vendor';
                    }
                    if (id.includes('frontend/shared') || id.includes('frontend/public')) {
                        return 'shared';
                    }
                }
            }
        }
    },
    esbuild: {
        drop: ['console', 'debugger']
    },
    server: {
        port: 3001,
        proxy: {
            '/api': {
                target: 'http://localhost:3000',
                changeOrigin: true
            }
        }
    }
});
