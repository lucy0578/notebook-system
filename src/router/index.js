import { createRouter, createWebHistory } from 'vue-router'
import Home from '@/pages/Home.vue'
import EditNote from '@/pages/EditNote.vue'
import Welcome from '@/pages/Welcome.vue'
import Login from '@/pages/Login.vue'
import Register from '@/pages/Register.vue'
import Bookshelf from '@/components/Bookshelf/Bookshelf.vue'
import GroupManagement from '@/components/Group/GroupManagement.vue'
import Usercenter from '@/components/User/Usercenter.vue'

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
    path: '/bookshelf/:category?',
    name: 'Bookshelf',
    component: Bookshelf,
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
    path: '/groups', 
    name: 'GroupManagement', 
    component: GroupManagement,
    meta: { requiresAuth: true }
  },
  {
    path: '/usercenter',
    name: 'Usercenter',
    component: Usercenter,
    meta: { requiresAuth: true }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// Add global before guard
router.beforeEach((to, from, next) => {
  if (to.meta.requiresAuth && !localStorage.getItem('token')) {
    next('/login')
  } else {
    next()
  }
})

export default router 