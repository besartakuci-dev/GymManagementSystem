import { createRouter, createWebHistory } from 'vue-router'
import HomePage from '@/pages/HomePage.vue'
import AuthPage from '@/pages/AuthPage.vue'
import ClassesPage from '@/pages/ClassesPage.vue'
import AboutPage from '@/pages/AboutPage.vue'
import TrainerDashboardPage from '@/pages/TrainerDashboardPage.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/',        redirect: '/home' },
    { path: '/home',    component: HomePage },
    { path: '/login',   component: AuthPage },
    { path: '/classes', component: ClassesPage },
    { path: '/about',   component: AboutPage },
    {path: '/trainer-dashboard',component: TrainerDashboardPage},
  ],
})

export default router
