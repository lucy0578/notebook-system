import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src') // 确保路径别名配置
    }
  },
  server: {
    host: '0.0.0.0', // 允许局域网访问
    port: 5173,      // 指定端口（可选）
    proxy: {
      // HTTP API 代理
      '/api': {
        // target: 'http://localhost:8080/',
        target: 'http://10.252.146.204:8080',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
        // 可选：添加更多请求头
        headers: {
          'Proxy-Connection': 'keep-alive'
        },
        // 增加代理超时设置
        timeout: 30000, // 30秒超时
        proxyTimeout: 30000,
        configure: (proxy, options) => {
          proxy.on('error', (err, req, res) => {
            console.error('代理错误:', err);
          });
          proxy.on('proxyReq', (proxyReq, req, res) => {
            console.log('正在代理请求:', req.method, req.url);
          });
          proxy.on('proxyRes', (proxyRes, req, res) => {
            console.log('收到代理响应:', proxyRes.statusCode, req.url);
          });
        }
      },
      // 添加 /common 路径的代理
      '/common': {
        target: 'http://10.252.146.204:8080',
        changeOrigin: true,
        // 增加代理超时设置
        timeout: 30000, // 30秒超时
        proxyTimeout: 30000
      },
      // WebSocket 代理
      '/ws': {
        target: 'ws://10.252.146.204:8080',
        //target: 'http://localhost:8080/',
        ws: true,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/ws/, ''),
        // 关键：WebSocket 需要特殊头部
        headers: {
          Connection: 'Upgrade',
          Upgrade: 'websocket'
        }
      }
    }
  },
  // 生产环境配置（可选）
  build: {
    outDir: 'dist',
    assetsDir: 'static'
  }
})