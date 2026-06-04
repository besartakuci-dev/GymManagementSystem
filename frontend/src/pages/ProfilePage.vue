<script setup lang="ts">
import Card from 'primevue/card'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
</script>

<template>
  <main class="page">
    <div class="container">
      <h1>My Profile</h1>

      <Card class="profile-card">
        <template #content>
          <div class="info-grid">
            <div class="info-item">
              <span class="label">First Name</span>
              <span class="value">{{ auth.user?.FirstName }}</span>
            </div>
            <div class="info-item">
              <span class="label">Last Name</span>
              <span class="value">{{ auth.user?.LastName }}</span>
            </div>
            <div class="info-item">
              <span class="label">Email</span>
              <span class="value">{{ auth.user?.Email }}</span>
            </div>
            <div class="info-item">
              <span class="label">Role</span>
              <span class="value role">{{ auth.user?.Role }}</span>
            </div>
            <div class="info-item" v-if="auth.user?.Phone">
              <span class="label">Phone</span>
              <span class="value">{{ auth.user?.Phone }}</span>
            </div>
            <div class="info-item" v-if="auth.user?.DateOfBirth">
              <span class="label">Date of Birth</span>
              <span class="value">{{ new Date(auth.user.DateOfBirth).toLocaleDateString() }}</span>
            </div>
            <div class="info-item">
              <span class="label">Member Since</span>
              <span class="value">{{ new Date(auth.user?.JoinDate).toLocaleDateString() }}</span>
            </div>
          </div>
        </template>
      </Card>
    </div>
  </main>
</template>

<style scoped>
.page {
  min-height: calc(100vh - 64px);
  background: var(--gym-bg);
  padding: 4rem 2rem;
}

.container {
  max-width: 640px;
  margin: 0 auto;
}

h1 {
  font-size: 2rem;
  font-weight: 800;
  color: var(--gym-text);
  margin-bottom: 2rem;
}

.profile-card {
  background: var(--gym-surface) !important;
  border: 1px solid var(--gym-border) !important;
}

.info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.label {
  font-size: 0.78rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--gym-text-muted);
}

.value {
  font-size: 1rem;
  color: var(--gym-text);
}

.role {
  color: var(--gym-orange);
  font-weight: 600;
  text-transform: capitalize;
}

@media (max-width: 480px) {
  .info-grid { grid-template-columns: 1fr; }
}
</style>
