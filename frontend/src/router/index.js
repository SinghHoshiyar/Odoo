import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

// Import views
import HomeView from '@/views/HomeView.vue'
import LoginView from '@/views/LoginView.vue'
import RegisterView from '@/views/RegisterView.vue'
import DashboardView from '@/views/DashboardView.vue'
import ProfileView from '@/views/ProfileView.vue'
import SkillsView from '@/views/SkillsView.vue'
import SwapsView from '@/views/SwapsView.vue'
import UserDetailView from '@/views/UserDetailView.vue'
import AdminDashboardView from '@/views/AdminDashboardView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
      meta: { requiresAuth: false }
    },
    {
      path: '/login',
      name: 'login',
      component: LoginView,
      meta: { requiresAuth: false, redirectIfAuth: true }
    },
    {
      path: '/register',
      name: 'register',
      component: RegisterView,
      meta: { requiresAuth: false, redirectIfAuth: true }
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: DashboardView,
      meta: { requiresAuth: true }
    },
    {
      path: '/profile',
      name: 'profile',
      component: ProfileView,
      meta: { requiresAuth: true }
    },
    {
      path: '/skills',
      name: 'skills',
      component: SkillsView,
      meta: { requiresAuth: false }
    },
    {
      path: '/swaps',
      name: 'swaps',
      component: SwapsView,
      meta: { requiresAuth: true }
    },
    {
      path: '/user/:id',
      name: 'user-detail',
      component: UserDetailView,
      meta: { requiresAuth: false }
    },
    {
      path: '/admin',
      name: 'admin',
      component: AdminDashboardView,
      meta: { requiresAuth: true, requiresAdmin: true }
    },
    // Catch all 404
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('@/views/NotFoundView.vue')
    }
  ]
})

// Navigation guards
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()
  
  // Check if route requires authentication
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next({ name: 'login', query: { redirect: to.fullPath } })
    return
  }
  
  // Check if route requires admin access
  if (to.meta.requiresAdmin && !authStore.isAdmin) {
    next({ name: 'dashboard' })
    return
  }
  
  // Redirect authenticated users away from auth pages
  if (to.meta.redirectIfAuth && authStore.isAuthenticated) {
    next({ name: 'dashboard' })
    return
  }
  
  next()
})

export default router
