import { createStore } from 'vuex'
import { ElMessage } from 'element-plus'

const store = createStore({
  state: {
    user: null,
    token: localStorage.getItem('token') || null
  },

  mutations: {
    login(state, data) {
      state.user = data.user
      state.token = data.token
      localStorage.setItem('token', data.token)
    },

    logout(state) {
      state.user = null
      state.token = null
      localStorage.removeItem('token')
    },

    updateUser(state, user) {
      state.user = user
    }
  },

  actions: {
    async checkAuth({ state, commit }) {
      if (!state.token) return false

      try {
        const response = await fetch('/api/user/profile', {
          headers: {
            'Authorization': `Bearer ${state.token}`
          }
        })

        if (response.ok) {
          const data = await response.json()
          commit('updateUser', data.user)
          return true
        } else {
          commit('logout')
          return false
        }
      } catch (error) {
        console.error('Auth check failed:', error)
        ElMessage.error('身份验证失败')
        commit('logout')
        return false
      }
    },

    async logout({ commit }) {
      try {
        await fetch('/api/logout', {
          method: 'POST'
        })
      } catch (error) {
        console.error('Logout failed:', error)
      } finally {
        commit('logout')
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
    const requiresAuth = to.matched.some(record => record.meta.requiresAuth)
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

    if (requiresAuth && store.getters.isAuthenticated) {
      const isAuthed = await store.dispatch('checkAuth')
      if (!isAuthed) {
        next({
          path: '/login',
          query: { redirect: to.fullPath }
        })
        return
      }
    }

    next()
  })
}

export default store
