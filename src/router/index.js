import { createRouter, createWebHistory } from 'vue-router'
import Home from '@/pages/Home.vue'
import EditNote from '@/pages/EditNote.vue'
import RecycleBin from '@/pages/RecycleBin.vue'
import Welcome from '@/pages/Welcome.vue'
import Login from '@/pages/Login.vue'
import Register from '@/pages/Register.vue'

const routes = [
  { path: '/', name: 'Welcome', component: Welcome },
  { path: '/home', name: 'Home', component: Home },
  { path: '/login', name: 'Login', component: Login },
  { path: '/register', name: 'Register', component: Register },
  { path: '/edit/:id', name: 'EditNote', component: EditNote },
  { path: '/recycle', name: 'RecycleBin', component: RecycleBin }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router 