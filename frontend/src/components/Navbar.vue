<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import Button from 'primevue/button'
import Avatar from 'primevue/avatar'
import { useAuthStore } from '@/stores/auth'
import { smoothScrollTo } from '@/composables/useMotion'

const auth = useAuthStore()
const router = useRouter()
const route = useRoute()
const userRole = computed(() => String(auth.user?.Role || '').toLowerCase())

function handleLogout() {
  auth.logout()
  router.push('/home')
}

// Smooth-scroll to a section on the home page. If we're on another route, go to
// /home first, then scroll. Honors prefers-reduced-motion. Navigation only — no
// state/data changes; the /home route and its sections are unchanged.
async function goToSection(id: string) {
  if (route.path !== '/home') {
    await router.push('/home')
    await nextTick()
  }
  smoothScrollTo(document.getElementById(id))
}

function initials() {
  if (!auth.user) return ''
  return `${auth.user.FirstName[0]}${auth.user.LastName[0]}`.toUpperCase()
}

// presentation only: condensed glass header once the page scrolls
const scrolled = ref(false)

function onScroll() {
  scrolled.value = window.scrollY > 50
}

onMounted(() => {
  onScroll()
  window.addEventListener('scroll', onScroll, { passive: true })
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', onScroll)
})
</script>

<template>
  <nav class="navbar" :class="{ scrolled }">
    <RouterLink to="/home" class="brand">GymCore</RouterLink>

    <div class="links">
      <RouterLink to="/home">Home</RouterLink>
      <a href="#about" @click.prevent="goToSection('about')">About</a>
      <a href="#programs" @click.prevent="goToSection('programs')">Programs</a>
      <a href="#contact" @click.prevent="goToSection('contact')">Contact</a>

      <template v-if="userRole === 'member'">
        <RouterLink to="/bookings">My Schedule</RouterLink>
      </template>

      <template v-if="userRole === 'trainer'">
        <RouterLink to="/trainer/classes">My Classes</RouterLink>
      </template>

      <template v-if="userRole === 'admin'">
        <RouterLink to="/admin">Dashboard</RouterLink>
      </template>
    </div>

    <div class="actions">
      <template v-if="auth.user">
        <RouterLink to="/profile" class="profile-link">
          <Avatar :label="initials()" shape="circle" class="avatar" />
          <span class="username">{{ auth.user.FirstName }}</span>
        </RouterLink>
        <Button label="Logout" outlined class="gym-btn-outline" size="small" @click="handleLogout" />
      </template>
      <template v-else>
        <RouterLink to="/login">
          <Button label="Login" outlined class="gym-btn-outline" size="small" />
        </RouterLink>
      </template>
    </div>
  </nav>
</template>

<style scoped>
.navbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 2rem;
  height: 64px;
  background: var(--gym-surface);
  border-bottom: 1px solid var(--gym-border);
  position: sticky;
  top: 0;
  z-index: 100;
  transition: var(--gym-transition);
}

.navbar.scrolled {
  height: 56px;
  background: rgba(10, 10, 10, 0.95);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  box-shadow: var(--gym-shadow-header);
}

.brand {
  font-size: 1.2rem;
  font-weight: 700;
  color: var(--gym-orange);
  text-decoration: none;
  letter-spacing: 0.03em;
}

.links {
  display: flex;
  gap: 2rem;
}

.links a {
  position: relative;
  padding: 0.5rem 0.25rem;
  color: var(--gym-text-muted);
  text-decoration: none;
  font-size: 0.9rem;
  transition: var(--gym-transition);
}

/* center-growing orange underline */
.links a::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  width: 0;
  height: 2px;
  transform: translateX(-50%);
  background: var(--gym-orange);
  border-radius: 2px;
  transition: var(--gym-transition);
}

.links a:hover,
.links a.router-link-active {
  color: var(--gym-text);
}

.links a:hover::after,
.links a.router-link-active::after {
  width: 60%;
}

.actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.profile-link {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  text-decoration: none;
  transition: var(--gym-transition);
}

.profile-link:hover {
  transform: translateY(-1px);
}

.profile-link:hover .username {
  color: var(--gym-text);
}

.profile-link:hover .avatar {
  box-shadow: 0 4px 14px var(--gym-orange-glow);
}

.avatar {
  background: var(--gym-orange) !important;
  color: #000 !important;
  font-weight: 700 !important;
  font-size: 0.75rem !important;
  width: 34px !important;
  height: 34px !important;
  cursor: pointer;
  transition: var(--gym-transition);
}

.username {
  font-size: 0.9rem;
  color: var(--gym-text-muted);
  transition: var(--gym-transition);
}
</style>
