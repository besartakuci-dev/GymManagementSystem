<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import Button from 'primevue/button'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const auth   = useAuthStore()

const role = computed(() => {
  const r = String(auth.user?.Role ?? '').toLowerCase()
  return r || 'guest'
})

const homeRoute = computed(() => {
  if (role.value === 'admin')   return '/admin'
  if (role.value === 'trainer') return '/trainer/classes'
  return '/home'
})

const roleLabel = computed(() => {
  const map: Record<string, string> = { admin: 'Admin', trainer: 'Trainer', member: 'Member' }
  return map[role.value] ?? 'Guest'
})
</script>

<template>
  <main class="unauth-page">
    <div class="unauth-card">
      <div class="icon-wrap">
        <i class="pi pi-lock icon" />
      </div>

      <div class="code">403</div>
      <h1 class="title">Access Denied</h1>

      <p class="desc">
        Your account (<span class="role-badge">{{ roleLabel }}</span>) doesn't have
        permission to view this page.
      </p>

      <div class="actions">
        <Button
          label="Go Back"
          icon="pi pi-arrow-left"
          severity="secondary"
          outlined
          @click="router.back()"
        />
        <Button
          label="Go to Dashboard"
          icon="pi pi-home"
          @click="router.push(homeRoute)"
        />
      </div>
    </div>
  </main>
</template>

<style scoped>
.unauth-page {
  min-height: calc(100vh - 64px);
  background: var(--gym-bg);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem 1rem;
}

.unauth-card {
  background: var(--gym-surface-raised);
  border: 1px solid var(--gym-border);
  border-radius: 1rem;
  padding: 3rem 2.5rem;
  max-width: 460px;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.25rem;
  text-align: center;
}

.icon-wrap {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: var(--gym-orange-subtle);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 0.25rem;
}

.icon {
  font-size: 2rem;
  color: var(--gym-orange);
}

.code {
  font-size: 5rem;
  font-weight: 900;
  line-height: 1;
  color: var(--gym-orange);
  letter-spacing: -2px;
}

.title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--gym-text);
  margin: 0;
}

.desc {
  color: var(--gym-text-muted);
  font-size: 0.95rem;
  line-height: 1.6;
  margin: 0;
}

.role-badge {
  background: var(--gym-orange-subtle);
  color: var(--gym-orange);
  border-radius: 4px;
  padding: 1px 8px;
  font-size: 0.85rem;
  font-weight: 600;
}

.actions {
  display: flex;
  gap: 0.75rem;
  margin-top: 0.5rem;
  flex-wrap: wrap;
  justify-content: center;
}
</style>
