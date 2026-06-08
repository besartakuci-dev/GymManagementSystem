<script setup lang="ts">
import { RouterLink, useRouter } from 'vue-router'
import Button from 'primevue/button'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const router = useRouter()

function handleLogout() {
  auth.logout()
  router.push('/home')
}
</script>

<template>
  <nav class="navbar">
    <RouterLink to="/home" class="brand">GymCore</RouterLink>

    <div class="links">
      <RouterLink to="/home">Home</RouterLink>
      <RouterLink to="/about">About Us</RouterLink>

      <!-- Member -->
      <template v-if="auth.user?.Role === 'member'">
        <RouterLink to="/bookings">My Bookings</RouterLink>
      </template>

      <!-- Trainer -->
      <template v-if="auth.user?.Role === 'trainer'">
        <RouterLink to="/trainer/classes">My Classes</RouterLink>
      </template>

      <!-- Admin -->
      <template v-if="auth.user?.Role === 'admin'">
        <RouterLink to="/admin">Admin</RouterLink>
      </template>
    </div>

    <div class="actions">
      <template v-if="auth.user">
        <RouterLink to="/profile" class="username">{{ auth.user.FirstName }}</RouterLink>
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

.username {
  font-size: 0.9rem;
  color: var(--gym-text-muted);
  text-decoration: none;
  transition: color 0.15s;
}

.username:hover {
  color: var(--gym-orange);
}
</style>
