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
        const response = await axios.post('/login', credentials, {
          timeout: 10000,
          cancelToken: new axios.CancelToken((cancel) => {
            window.cancelLoginRequest = cancel
          })
        })
        
        if (response.data.code === 1) {
          // Ensure correct handling of response data
          const userData = {
            ...response.data.data,
            token: response.data.data.token // Get token from data
          }
          commit('login', userData)
          router.push('/home')
          return true
        } else {
          ElMessage.error(response.data.msg || 'Login failed')
          return false
        }
      } catch (error) {
        if (axios.isCancel(error)) {
          ElMessage.warning('Login request was cancelled')
        } else if (error.response?.status === 401) {
          ElMessage.error('Invalid username or password')
        } else if (error.code === 'ECONNABORTED') {
          ElMessage.error('Login request timeout, please check network')
        } else {
          ElMessage.error(`Login failed: ${error.message}`)
        }
        return false
      }
    },

    async checkAuth({ state, commit }) {
      if (!state.token) return false

      try {
        const response = await axios.get('/user/profile')
        commit('updateUser', response.data.user)
        return true
      } catch (error) {
        ElMessage.error('Authentication failed')
        commit('logout')
        return false
      }
    },

    async logout({ commit }) {
      // 前端登出主要是清除本地状态，不需要调用后端API
      // 如果后端有logout接口并且需要调用，可以取消下面的注释
      // try {
      //   await axios.post('/logout')
      // } catch (error) {
      //   console.error('Logout API failed:', error)
      // }
      
      commit('logout')
      router.push('/login')
    }
  },

  getters: {
    isAuthenticated: state => !!state.token,
    currentUser: state => state.user,
    token: state => state.token
  }
})

// Navigation guard
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
