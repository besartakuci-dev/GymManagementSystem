<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import Button from 'primevue/button'
import Avatar from 'primevue/avatar'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const router = useRouter()
const userRole = computed(() => String(auth.user?.Role || '').toLowerCase())

function handleLogout() {
  auth.logout()
  router.push('/home')
}

function initials() {
  if (!auth.user) return ''
  return `${auth.user.FirstName[0]}${auth.user.LastName[0]}`.toUpperCase()
}
</script>

<template>
  <nav class="navbar">
    <RouterLink to="/home" class="brand">BBros Gym</RouterLink>

    <div class="links">
      <RouterLink to="/home">Home</RouterLink>
      <RouterLink to="/classes">Classes</RouterLink>
      <RouterLink to="/about">About Us</RouterLink>

      <template v-if="userRole === 'member'">
        <RouterLink to="/bookings">My Bookings</RouterLink>
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
        <Button label="Logout" severity="secondary" size="small" @click="handleLogout" />
      </template>
      <template v-else>
        <RouterLink to="/login">
          <Button label="Login" size="small" />
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
  color: var(--gym-text-muted);
  text-decoration: none;
  font-size: 0.9rem;
  transition: color 0.15s;
}

.links a:hover,
.links a.router-link-active {
  color: var(--gym-text);
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
  transition: opacity 0.15s;
}

.profile-link:hover {
  opacity: 0.85;
}

.avatar {
  background: var(--gym-orange) !important;
  color: #000 !important;
  font-weight: 700 !important;
  font-size: 0.75rem !important;
  width: 34px !important;
  height: 34px !important;
  cursor: pointer;
}

.username {
  font-size: 0.9rem;
  color: var(--gym-text-muted);
}
</style>
