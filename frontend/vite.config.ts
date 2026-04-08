import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    host: true, // Allow connections from nginx
    allowedHosts: true, // Allow all hosts (*.localhost)
    cors: true, // Enable CORS
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: false,
      },
    },
  },
  preview: {
    port: 3000,
    host: true,
    allowedHosts: ['localhost', '127.0.0.1', '*.digitaljamath.com', '.localhost', '.127.0.0.1', '.digitaljamath.com', '.*.digitaljamath.com', 'digitaljamath.com'],
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: false,
      },
    },
  }
})
