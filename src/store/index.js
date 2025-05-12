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
        const response = await axios.post('/login', credentials)
        if (response.data) {
          commit('login', response.data)
          // 登录成功后跳转到 home 页面
          router.push('/home')
          return true
        }
        return false
      } catch (error) {
        console.error('Login failed:', error)
        if (error.response?.status === 401) {
          ElMessage.error('用户名或密码错误')
        } else {
          ElMessage.error('登录失败，请稍后重试')
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
