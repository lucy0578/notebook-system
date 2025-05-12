import { createRouter, createWebHistory } from 'vue-router'
import Home from '@/pages/Home.vue'
import EditNote from '@/pages/EditNote.vue'
import RecycleBin from '@/pages/RecycleBin.vue'
import Welcome from '@/pages/Welcome.vue'
import Login from '@/pages/Login.vue'
import Register from '@/pages/Register.vue'

const routes = [
  { 
    path: '/', 
    name: 'Welcome', 
    component: Welcome,
    meta: { requiresAuth: false }
  },
  { 
    path: '/home', 
    name: 'Home', 
    component: Home,
    meta: { requiresAuth: true }
  },
  { 
    path: '/login', 
    name: 'Login', 
    component: Login,
    meta: { requiresAuth: false }
  },
  { 
    path: '/register', 
    name: 'Register', 
    component: Register,
    meta: { requiresAuth: false }
  },
  { 
    path: '/edit/:id', 
    name: 'EditNote', 
    component: EditNote,
    meta: { requiresAuth: true }
  },
  { 
    path: '/recycle', 
    name: 'RecycleBin', 
    component: RecycleBin,
    meta: { requiresAuth: true }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router 