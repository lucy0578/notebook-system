import { createRouter, createWebHistory } from 'vue-router'
import Home from '@/pages/Home.vue'
import EditNote from '@/pages/EditNote.vue'
import RecycleBin from '@/pages/RecycleBin.vue'
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
    path: '/bookshelf',
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
    path: '/recycle', 
    name: 'RecycleBin', 
    component: RecycleBin,
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

// 添加全局前置守卫
router.beforeEach((to, from, next) => {
  console.log('Route navigation:', { 
    to: to.path,
    from: from.path,
    requiresAuth: to.meta.requiresAuth,
    isAuthenticated: !!localStorage.getItem('token')
  })
  
  if (to.meta.requiresAuth && !localStorage.getItem('token')) {
    next('/login')
  } else {
    next()
  }
})

export default router 