<script setup lang="ts">
import { RouterLink } from 'vue-router'
import Card from 'primevue/card'
import Button from 'primevue/button'
import Tag from 'primevue/tag'
import { useAuthStore } from '@/stores/auth'
import { useCancelMembership } from '@/composables/useCancelMembership'

const auth = useAuthStore()
const { requestCancel, cancelling } = useCancelMembership()

const formatDate = (value: unknown) => (value ? new Date(value as string).toLocaleDateString() : '')
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

      <Card class="profile-card membership-card">
        <template #title>
          <span class="card-title">Membership</span>
        </template>
        <template #content>
          <div v-if="auth.hasMembership" class="membership-active">
            <div class="info-grid">
              <div class="info-item">
                <span class="label">Plan</span>
                <span class="value">{{ auth.membership?.PlanName }}</span>
              </div>
              <div class="info-item">
                <span class="label">Status</span>
                <span class="value">
                  <Tag
                    :value="auth.membership?.Status"
                    :severity="auth.membership?.Status === 'active' ? 'success' : 'secondary'"
                    class="status-tag"
                  />
                </span>
              </div>
              <div class="info-item">
                <span class="label">Valid Until</span>
                <span class="value">{{ formatDate(auth.membership?.EndDate) }}</span>
              </div>
            </div>
            <Button
              v-if="auth.membership?.Status === 'active'"
              label="Cancel membership"
              icon="pi pi-times"
              severity="danger"
              outlined
              :loading="cancelling"
              class="cancel-btn"
              @click="requestCancel(auth.membership)"
            />
          </div>
          <div v-else class="membership-empty">
            <p>You don't have an active membership.</p>
            <RouterLink to="/plans">
              <Button label="View plans" icon="pi pi-credit-card" />
            </RouterLink>
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

.membership-card {
  margin-top: 1.5rem;
}

.card-title {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--gym-text);
}

.status-tag {
  text-transform: capitalize;
}

.cancel-btn {
  margin-top: 1.25rem;
}

.membership-empty {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 1rem;
}

.membership-empty p {
  color: var(--gym-text-muted);
}

@media (max-width: 480px) {
  .info-grid { grid-template-columns: 1fr; }
}
</style>
