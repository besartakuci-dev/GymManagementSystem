<script setup lang="ts">
<<<<<<< HEAD
import { computed, onMounted, ref } from 'vue'
import Card from 'primevue/card'
import Button from 'primevue/button'
import Textarea from 'primevue/textarea'
import InputText from 'primevue/inputtext'
import Toast from 'primevue/toast'
import { useToast } from 'primevue/usetoast'
import { useAuthStore } from '@/stores/auth'
import api from '@/api/axios'

interface TrainerProfile {
  TrainerID: number
  UserID: number
  FirstName: string
  LastName: string
  Email: string
  Specialization: string
  Bio: string
}

const auth = useAuthStore()
const toast = useToast()

const isTrainer = computed(() => auth.user?.Role === 'trainer')

const loading = ref(false)
const saving = ref(false)

const trainerForm = ref({
  specialization: '',
  bio: '',
})

async function loadTrainerProfile() {
  if (!isTrainer.value) return

  try {
    loading.value = true
    const response = await api.get('/trainers/me/profile')
    const profile: TrainerProfile = response.data.data.profile

    trainerForm.value.specialization = profile.Specialization ?? ''
    trainerForm.value.bio = profile.Bio ?? ''
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to load trainer profile.',
      life: 3000,
    })
  } finally {
    loading.value = false
  }
}

async function saveTrainerProfile() {
  try {
    saving.value = true

    await api.put('/trainers/me/profile', {
      specialization: trainerForm.value.specialization,
      bio: trainerForm.value.bio,
    })

    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: 'Trainer profile updated successfully.',
      life: 3000,
    })
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to update trainer profile.',
      life: 3000,
    })
  } finally {
    saving.value = false
  }
}

function formatDate(value?: string) {
  if (!value) return '-'
  return new Date(value).toLocaleDateString()
}

onMounted(() => {
  loadTrainerProfile()
})
=======
import { RouterLink } from 'vue-router'
import Card from 'primevue/card'
import Button from 'primevue/button'
import Tag from 'primevue/tag'
import { useAuthStore } from '@/stores/auth'
import { useCancelMembership } from '@/composables/useCancelMembership'

const auth = useAuthStore()
const { requestCancel, cancelling } = useCancelMembership()

const formatDate = (value: unknown) => (value ? new Date(value as string).toLocaleDateString() : '')
>>>>>>> c2414002c786a360498184c8b29ca26b330d6afb
</script>

<template>
  <main class="page">
    <Toast />

    <div class="container">
      <div class="page-header">
        <p class="eyebrow">Account</p>
        <h1>My Profile</h1>
        <p>Manage your account information and trainer biography.</p>
      </div>

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
              <span class="value">{{ formatDate(auth.user.DateOfBirth) }}</span>
            </div>

            <div class="info-item">
              <span class="label">Member Since</span>
              <span class="value">{{ formatDate(auth.user?.JoinDate) }}</span>
            </div>
          </div>
        </template>
      </Card>

<<<<<<< HEAD
      <Card v-if="isTrainer" class="trainer-card">
        <template #content>
          <div class="trainer-header">
            <div>
              <p class="eyebrow">Trainer Profile</p>
              <h2>Professional Information</h2>
              <p>Update your specialization and biography. This information is displayed on the homepage.</p>
            </div>

            <span class="trainer-badge">Trainer</span>
          </div>

          <div v-if="loading" class="loading">
            Loading trainer profile...
          </div>

          <div v-else class="trainer-form">
            <div class="form-group">
              <label>Specialization</label>
              <InputText
                v-model="trainerForm.specialization"
                placeholder="Example: Yoga & Pilates"
              />
            </div>

            <div class="form-group">
              <label>Biography</label>
              <Textarea
                v-model="trainerForm.bio"
                rows="6"
                autoResize
                placeholder="Write your professional biography..."
              />
            </div>

            <div class="preview-box">
              <span>Homepage Preview</span>
              <h3>{{ auth.user?.FirstName }} {{ auth.user?.LastName }}</h3>
              <strong>{{ trainerForm.specialization || 'Your specialization' }}</strong>
              <p>{{ trainerForm.bio || 'Your biography will appear here.' }}</p>
            </div>

            <Button
              label="Save Changes"
              icon="pi pi-save"
              :loading="saving"
              @click="saveTrainerProfile"
            />
          </div>
=======
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
>>>>>>> c2414002c786a360498184c8b29ca26b330d6afb
        </template>
      </Card>
    </div>
  </main>
</template>

<style scoped>
.page {
  min-height: calc(100vh - 64px);
  background:
    radial-gradient(circle at top right, rgba(255, 122, 24, 0.12), transparent 35%),
    var(--gym-bg);
  padding: 4rem 2rem;
}

.container {
  max-width: 900px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 2rem;
}

.eyebrow {
  color: var(--gym-orange);
  text-transform: uppercase;
  letter-spacing: 0.16em;
  font-size: 0.78rem;
  font-weight: 900;
  margin-bottom: 0.5rem;
}

h1 {
  font-size: 2.4rem;
  font-weight: 900;
  color: var(--gym-text);
  margin-bottom: 0.5rem;
}

.page-header p {
  color: var(--gym-text-muted);
}

.profile-card,
.trainer-card {
  background: var(--gym-surface) !important;
  border: 1px solid var(--gym-border) !important;
  margin-bottom: 1.5rem;
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
  font-weight: 700;
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
  font-weight: 700;
  text-transform: capitalize;
}

<<<<<<< HEAD
.trainer-header {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.5rem;
=======
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
>>>>>>> c2414002c786a360498184c8b29ca26b330d6afb
}

.trainer-header h2 {
  color: var(--gym-text);
  margin-bottom: 0.5rem;
}

.trainer-header p {
  color: var(--gym-text-muted);
  line-height: 1.6;
}

.trainer-badge {
  height: fit-content;
  background: rgba(255, 122, 24, 0.12);
  color: var(--gym-orange);
  border: 1px solid rgba(255, 122, 24, 0.35);
  border-radius: 999px;
  padding: 0.45rem 0.9rem;
  font-weight: 800;
}

.loading {
  color: var(--gym-text-muted);
}

.trainer-form {
  display: grid;
  gap: 1.2rem;
}

.form-group {
  display: grid;
  gap: 0.5rem;
}

.form-group label {
  color: var(--gym-text);
  font-weight: 700;
}

:deep(.p-inputtext),
:deep(.p-textarea) {
  background: #0b0b0b;
  color: var(--gym-text);
  border: 1px solid var(--gym-border);
}

:deep(.p-inputtext:focus),
:deep(.p-textarea:focus) {
  border-color: var(--gym-orange);
  box-shadow: 0 0 0 1px var(--gym-orange);
}

.preview-box {
  background: rgba(255, 122, 24, 0.06);
  border: 1px solid rgba(255, 122, 24, 0.18);
  border-radius: 16px;
  padding: 1.2rem;
}

.preview-box span {
  color: var(--gym-orange);
  text-transform: uppercase;
  letter-spacing: 0.12em;
  font-size: 0.75rem;
  font-weight: 900;
}

.preview-box h3 {
  color: var(--gym-text);
  margin: 0.6rem 0 0.3rem;
}

.preview-box strong {
  color: var(--gym-orange);
}

.preview-box p {
  color: var(--gym-text-muted);
  line-height: 1.6;
  margin-top: 0.7rem;
}

:deep(.p-button) {
  background: var(--gym-orange);
  border: none;
  color: #000;
  font-weight: 800;
  width: fit-content;
}

@media (max-width: 600px) {
  .info-grid {
    grid-template-columns: 1fr;
  }

  .trainer-header {
    flex-direction: column;
  }
}
</style>