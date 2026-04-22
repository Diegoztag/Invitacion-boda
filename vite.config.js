import { defineConfig } from 'vite';
import { resolve } from 'path';
import { ViteImageOptimizer } from 'vite-plugin-image-optimizer';

export default defineConfig({
    plugins: [
        ViteImageOptimizer({
            png: {
                quality: 80
            },
            jpeg: {
                quality: 80
            },
            jpg: {
                quality: 80
            },
            webp: {
                quality: 80
            },
            avif: {
                quality: 70
            }
        })
    ],
    root: 'frontend',
    build: {
        outDir: '../dist',
        emptyOutDir: true,
        rollupOptions: {
            input: {
                main: resolve(__dirname, 'frontend/landing/index.html'),
                invitation: resolve(__dirname, 'frontend/invitation/index.html'),
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
