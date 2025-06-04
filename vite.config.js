import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src') // Ensure path alias configuration
    }
  },
  server: {
    host: '0.0.0.0', // Allow LAN access
    port: 5173,      // Specify port (optional)
    proxy: {
      // HTTP API proxy
      '/api': {
        target: 'http://10.252.146.143:8080',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
        // Optional: add more request headers
        headers: {
          'Proxy-Connection': 'keep-alive'
        },
        // Add proxy timeout settings
        timeout: 30000, // 30s timeout
        proxyTimeout: 30000
      },
      // WebSocket proxy
      '/ws': {
        target: 'ws://10.252.146.143:8080',
        ws: true,
        changeOrigin: true,
        // Remove the rewrite to keep the /ws path
        // rewrite: (path) => path.replace(/^\/ws/, ''),
        // Key: WebSocket needs special headers
        configure: (proxy, options) => {
          proxy.on('error', (err, req, res) => {
            console.log('WebSocket proxy error:', err);
          });
          proxy.on('proxyReq', (proxyReq, req, res) => {
            console.log('WebSocket proxy request:', req.url);
          });
          proxy.on('open', (proxySocket) => {
            console.log('WebSocket proxy connection opened');
          });
          proxy.on('close', (res, socket, head) => {
            console.log('WebSocket proxy connection closed');
          });
        }
      }
    }
  },
  // Production environment configuration (optional)
  build: {
    outDir: 'dist',
    assetsDir: 'static'
  }
})