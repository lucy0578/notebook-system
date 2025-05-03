import { createRouter, createWebHistory } from 'vue-router'
import Home from '../pages/Home.vue'
import EditNote from '../pages/EditNote.vue'

const routes = [
  { path: '/', name: 'Home', component: Home },
  { path: '/edit/:id', name: 'EditNote', component: EditNote }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router 