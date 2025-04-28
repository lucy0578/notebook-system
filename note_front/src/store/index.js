import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

const store = new Vuex.Store({
  state: {
    currentUser: (() => {
      try {
        const user = window.localStorage.getItem('user')
        return user ? JSON.parse(user) : null
      } catch (e) {
        return null
      }
    })()
  },
  mutations: {
    login(state, userData) {
      // token过期后localstorage需要手动删除
      state.currentUser = userData;
      localStorage.setItem("user", JSON.stringify(userData));
      localStorage.setItem("token", userData.token);
    },
    // logout(state) {
    //   state.currentUser = null;
    //   localStorage.removeItem("user");
    //   localStorage.removeItem("token");
    // }
  }
})

export default store;
