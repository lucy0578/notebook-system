import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import zhCn from 'element-plus/dist/locale/zh-cn.mjs'
import router from './router'
import { ElMessage } from 'element-plus'
import store, { setupAuthGuard } from './store'
import axios from 'axios'

// Set axios default configuration
axios.defaults.baseURL = '/api'
axios.defaults.timeout = 120000  // Increase to 2min
axios.defaults.headers.common['Cache-Control'] = 'no-cache'  // Add no-cache header

// Request interceptor
axios.interceptors.request.use(config => {
  const token = store.getters.token
  if (token) {
    config.headers.token = token
  }
  return config
}, error => {
  console.error('Request interceptor error:', error)
  return Promise.reject(error)
})

// Response interceptor
axios.interceptors.response.use(
  response => {
    return response
  },
  error => {
    // Create error description object
    const errorInfo = {
      url: error.config?.url,
      method: error.config?.method,
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      timestamp: new Date().toISOString()
    }
  
    
    if (axios.isCancel(error)) {
      // Canceled requests usually don't need error messages
    } else if (error.code === 'ECONNABORTED' && error.message.includes('timeout')) {
      ElMessage.error('Request timeout, please check network connection or server status')
    } else if (error.response) {
      switch (error.response.status) {
        case 401:
          ElMessage.error('Unauthorized, please login again')
          router.push('/login')
          break
        case 403:
          ElMessage.error('Access denied')
          break
        case 404:
          ElMessage.error('Request error, resource not found')
          break
        case 500:
          ElMessage.error('Server error')
          break
        default:
          ElMessage.error(error.response.data?.message || 'Unknown error')
      }
    } else {
      ElMessage.error('Network error, please check network connection')
    }
    return Promise.reject(error)
  }
)

const app = createApp(App)

app.use(ElementPlus, {
  locale: zhCn
})
app.use(router)
app.use(store)

// Setup route guard
setupAuthGuard(router)

app.mount('#app')
