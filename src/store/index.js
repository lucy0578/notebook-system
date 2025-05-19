import { createStore } from 'vuex'
import { ElMessage } from 'element-plus'
import axios from 'axios'
import router from '../router'

const store = createStore({
  state: {
    user: null,
    token: localStorage.getItem('token') || null
  },

  mutations: {
    login(state, userData) {
      state.user = userData
      state.token = userData.token
      localStorage.setItem("user", JSON.stringify(userData))
      localStorage.setItem("token", userData.token)
    },

    logout(state) {
      state.user = null
      state.token = null
      localStorage.removeItem('token')
      localStorage.removeItem('user')
    },

    updateUser(state, user) {
      state.user = user
    }
  },

  actions: {
    async login({ commit }, credentials) {
      try {
        console.log('开始登录请求:', credentials)
        const response = await axios.post('/login', credentials, {
          // 增加超时时间
          timeout: 10000,
          // 添加请求取消标记
          cancelToken: new axios.CancelToken((cancel) => {
            // 存储取消函数，以便在需要时可以使用
            window.cancelLoginRequest = cancel
          })
        })
        console.log('登录响应:', response.data)
        if (response.data) {
          // 确保正确处理响应数据
          const userData = {
            ...response.data.data,
            token: response.data.token
          }
          console.log('处理后的用户数据:', userData)
          commit('login', userData)
          // 登录成功后跳转到 home 页面
          router.push('/home')
          return true
        }
        return false
      } catch (error) {
        console.error('登录失败详情:', error)
        // 判断是否是取消请求导致的错误
        if (axios.isCancel(error)) {
          console.log('请求被取消:', error.message)
          ElMessage.warning('登录请求被取消')
        } else if (error.response?.status === 401) {
          ElMessage.error('用户名或密码错误')
        } else if (error.code === 'ECONNABORTED') {
          ElMessage.error('登录请求超时，请检查网络')
        } else {
          ElMessage.error(`登录失败: ${error.message}`)
        }
        return false
      }
    },

    async checkAuth({ state, commit }) {
      if (!state.token) return false

      try {
        const response = await axios.get('/user/profile')
        console.log('Auth check response:', response)
        commit('updateUser', response.data.user)
        return true
      } catch (error) {
        console.error('Auth check failed:', error)
        ElMessage.error('身份验证失败')
        commit('logout')
        return false
      }
    },

    async logout({ commit }) {
      try {
        await axios.post('/logout')
      } catch (error) {
        console.error('Logout failed:', error)
      } finally {
        commit('logout')
        router.push('/login')
      }
    }
  },

  getters: {
    isAuthenticated: state => !!state.token,
    currentUser: state => state.user,
    token: state => state.token
  }
})

// 导航守卫
export const setupAuthGuard = (router) => {
  router.beforeEach(async (to, from, next) => {
    const requiresAuth = to.meta.requiresAuth
    const isLoginPage = to.path === '/login'
    const isRegisterPage = to.path === '/register'
    const isWelcomePage = to.path === '/welcome'

    if (!requiresAuth && (isLoginPage || isRegisterPage || isWelcomePage)) {
      if (store.getters.isAuthenticated) {
        next('/home')
        return
      }
      next()
      return
    }

    if (requiresAuth && !store.getters.isAuthenticated) {
      next({
        path: '/login',
        query: { redirect: to.fullPath }
      })
      return
    }

    next()
  })
}

export default store
