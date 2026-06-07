import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

import HomePage         from '@/pages/HomePage.vue'
import AuthPage         from '@/pages/AuthPage.vue'
import ClassesPage      from '@/pages/ClassesPage.vue'
import AboutPage        from '@/pages/AboutPage.vue'
import ProfilePage      from '@/pages/ProfilePage.vue'
import BookingsPage     from '@/pages/BookingsPage.vue'
import MyClassesPage    from '@/pages/trainer/MyClassesPage.vue'
import AdminPage        from '@/pages/admin/AdminPage.vue'
import MembersPage      from '@/pages/admin/MembersPage.vue'
import UnauthorizedPage from '@/pages/UnauthorizedPage.vue'
import AdminDashboardPage from '@/pages/AdminDashboardPage.vue'

declare module 'vue-router' {
  interface RouteMeta {
    requiresAuth?: boolean
    roles?: string[]
  }
}

const router = createRouter({
  history: createWebHistory(),
  routes: [
    // Public
    { path: '/',             redirect: '/home' },
    { path: '/home',         component: HomePage },
    { path: '/classes',      component: ClassesPage },
    { path: '/about',        component: AboutPage },
    { path: '/login',        component: AuthPage },
    { path: '/unauthorized', component: UnauthorizedPage },

    // Member + Trainer + Admin
    {
      path: '/profile',
      component: ProfilePage,
      meta: { requiresAuth: true },
    },

    // Member + Admin
    {
      path: '/bookings',
      component: BookingsPage,
      meta: { requiresAuth: true, roles: ['member', 'admin'] },
    },

    // Trainer + Admin
    {
      path: '/trainer/classes',
      component: MyClassesPage,
      meta: { requiresAuth: true, roles: ['trainer', 'admin'] },
    },

    // Admin only
    {
      path: '/admin',
      component: AdminPage,
      meta: { requiresAuth: true, roles: ['admin'] },
    },
    {
      path: '/admin/members',
      component: MembersPage,
      meta: { requiresAuth: true, roles: ['admin'] },
    },
    { path: '/admin-dashboard', component: AdminDashboardPage },
  ],
})

router.beforeEach(async (to) => {
  const auth = useAuthStore()

  if (!auth.initialized) await auth.init()

  if (to.path === '/login' && auth.user) return '/home'

  if (to.meta.requiresAuth && !auth.user) return '/login'

  if (to.meta.roles && auth.user) {
    if (!to.meta.roles.includes(auth.user.Role)) return '/unauthorized'
  }
})

export default router
