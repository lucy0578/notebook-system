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

// 设置 axios 默认配置
axios.defaults.baseURL = '/api'
axios.defaults.timeout = 120000  // 增加到15秒
axios.defaults.headers.common['Cache-Control'] = 'no-cache'  // 添加 no-cache 头部

// 请求拦截器
axios.interceptors.request.use(config => {
  console.log(`发送请求: ${config.method.toUpperCase()} ${config.url}`, config)
  const token = store.getters.token
  if (token) {
    config.headers.token = token
  }
  return config
}, error => {
  console.error('请求拦截器错误:', error)
  return Promise.reject(error)
})

// 响应拦截器
axios.interceptors.response.use(
  response => {
    console.log(`收到响应: ${response.config.url}`, response.data)
    return response
  },
  error => {
    // 创建一个错误描述对象
    const errorInfo = {
      url: error.config?.url,
      method: error.config?.method,
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      timestamp: new Date().toISOString()
    }
    
    console.error('请求错误详情:', errorInfo)
    
    if (axios.isCancel(error)) {
      console.log('请求被取消:', error.message)
      // 被取消的请求通常不需要显示错误消息
    } else if (error.code === 'ECONNABORTED' && error.message.includes('timeout')) {
      ElMessage.error('请求超时，请检查网络连接或服务器状态')
    } else if (error.response) {
      switch (error.response.status) {
        case 401:
          ElMessage.error('未授权，请重新登录')
          store.commit('logout')
          router.push('/login')
          break
        case 403:
          ElMessage.error('拒绝访问')
          break
        case 404:
          ElMessage.error('请求错误，未找到该资源')
          break
        case 500:
          ElMessage.error('服务器错误')
          break
        default:
          ElMessage.error(error.response.data?.message || '未知错误')
      }
    } else {
      ElMessage.error('网络错误，请检查网络连接')
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

// 设置路由守卫
setupAuthGuard(router)

app.mount('#app')
