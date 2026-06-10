import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

import HomePage         from '@/pages/HomePage.vue'
import AuthPage         from '@/pages/AuthPage.vue'
import ClassesPage      from '@/pages/ClassesPage.vue'
import AboutPage        from '@/pages/AboutPage.vue'
import ProfilePage      from '@/pages/ProfilePage.vue'
import BookingsPage     from '@/pages/BookingsPage.vue'
import MyClassesPage    from '@/pages/trainer/MyClassesPage.vue'
import UnauthorizedPage  from '@/pages/UnauthorizedPage.vue'
import AdminLayout      from '@/layouts/AdminLayout.vue'
import AdminDashboard   from '@/pages/admin/AdminDashboard.vue'
import MembersPage      from '@/pages/admin/MembersPage.vue'
import CreateUserPage   from '@/pages/admin/CreateUserPage.vue'
import AdminClassesPage from '@/pages/admin/ClassesPage.vue'

declare module 'vue-router' {
  interface RouteMeta {
    requiresAuth?: boolean
    roles?: string[]
    hideShell?: boolean
  }
}

const router = createRouter({
  history: createWebHistory(),
  routes: [
    // Public
    { path: '/',             redirect: '/home' },
    { path: '/home',         component: HomePage },
    { path: '/classes/:type?', name: 'class-schedule', component: ClassesPage },
    { path: '/about',        component: AboutPage },
    { path: '/login',        component: AuthPage },
    { path: '/unauthorized', component: UnauthorizedPage, meta: { hideShell: true } },
    { path: '/dashboard',   redirect: '/admin' },

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
      component: ClassesPage,
      meta: { requiresAuth: true, roles: ['trainer', 'admin'] },
    },

    // Admin — nested under AdminLayout (sidebar)
    {
      path: '/admin',
      component: AdminLayout,
      meta: { requiresAuth: true, roles: ['admin'] },
      children: [
        { path: '',             component: AdminDashboard },
        { path: 'classes',      component: AdminClassesPage },
        { path: 'members',      component: MembersPage },
        { path: 'users/create', component: CreateUserPage },
        { path: 'classes',      component: AdminClassesPage },
      ],
    },
  ],
})

router.beforeEach(async (to) => {
  const auth = useAuthStore()

  await auth.init()

  if (to.path === '/login' && auth.user) return '/home'

  if (to.meta.requiresAuth && !auth.user) return '/login'

  if (to.meta.roles && auth.user) {
    const role = String(auth.user.Role || '').toLowerCase()
    if (!to.meta.roles.includes(role)) return '/unauthorized'
  }
})

export default router
