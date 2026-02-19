import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    build: {
        rollupOptions: {
            input: {
                popup: resolve(__dirname, 'popup.html'),
                sidepanel: resolve(__dirname, 'sidepanel.html'),
                content: resolve(__dirname, 'src/content/index.tsx'),
                background: resolve(__dirname, 'src/background/index.ts'),
            },
            output: {
                entryFileNames: 'dist/[name].js',
                chunkFileNames: 'dist/[name].js',
                assetFileNames: 'dist/[name].[ext]'
            }
        },
        outDir: 'dist',
        emptyOutDir: false // Don't empty as we might be building multiple targets
    }
})
