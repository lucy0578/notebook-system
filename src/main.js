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
axios.defaults.timeout = 5000

// 请求拦截器
axios.interceptors.request.use(config => {
  const token = store.getters.token
  if (token) {
    config.headers.token = token;
  }
  return config;
}, error => {
  return Promise.reject(error);
});

// 响应拦截器
axios.interceptors.response.use(
  response => {
    console.log('Response received:', response.status, response.config.url)
    return response
  },
  error => {
    console.error('Response error:', {
      status: error.response?.status,
      url: error.config?.url,
      message: error.message
    })
    
    if (error.code === 'ECONNREFUSED') {
      ElMessage.error('无法连接到服务器，请检查服务器是否运行')
    } else if (error.response?.status === 500) {
      ElMessage.error('服务器内部错误')
    } else if (error.response?.status === 401) {
      store.commit('logout')
      router.push('/login')
    }
    
    return Promise.reject(error)
  }
)

const app = createApp(App)
app.use(ElementPlus, { locale: zhCn })
app.use(router)
app.use(store)

// 设置路由守卫
setupAuthGuard(router)

app.mount('#app')
