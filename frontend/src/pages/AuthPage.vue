<script setup lang="ts">
import { reactive, ref } from 'vue'
import coverImage from '@/assets/Login_Register_Cover.png'
import { useRouter } from 'vue-router'
import InputText from 'primevue/inputtext'
import Password from 'primevue/password'
import Button from 'primevue/button'
import DatePicker from 'primevue/datepicker'
import Message from 'primevue/message'
import { register, login } from '@/api/auth'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const auth = useAuthStore()

const view = ref<'login' | 'register'>('login')
const error = ref('')
const errorDetails = ref<Record<string, string[]>>({})
const loading = ref(false)

const form = reactive({
  email: '',
  password: '',
  firstName: '',
  lastName: '',
  phone: '',
  dateOfBirth: null as Date | null,
})

function resetForm() {
  Object.assign(form, { email: '', password: '', firstName: '', lastName: '', phone: '', dateOfBirth: null })
  error.value = ''
  errorDetails.value = {}
}

function switchView(v: 'login' | 'register') {
  view.value = v
  resetForm()
}

function toISODate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

async function handleLogin() {
  error.value = ''
  errorDetails.value = {}
  loading.value = true
  try {
    const { data } = await login({ email: form.email, password: form.password })
    localStorage.setItem('token', data.data.token)
    auth.setUser(data.data.user)
    router.push('/classes')
  } catch (e: any) {
    error.value = e.response?.data?.message ?? 'Something went wrong'
    errorDetails.value = e.response?.data?.details ?? {}
  } finally {
    loading.value = false
  }
}

async function handleRegister() {
  error.value = ''
  errorDetails.value = {}
  loading.value = true
  try {
    const payload: any = {
      email: form.email,
      password: form.password,
      firstName: form.firstName,
      lastName: form.lastName,
    }
    if (form.phone) payload.phone = form.phone
    if (form.dateOfBirth) payload.dateOfBirth = toISODate(form.dateOfBirth)

    const { data } = await register(payload)
    localStorage.setItem('token', data.data.token)
    auth.setUser(data.data.user)
    router.push('/classes')
  } catch (e: any) {
    error.value = e.response?.data?.message ?? 'Something went wrong'
    errorDetails.value = e.response?.data?.details ?? {}
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <main class="auth-page">

    <!-- Left: cover image -->
    <div class="cover">
      <img :src="coverImage" alt="BBros Gym" />
    </div>

    <!-- Right: form -->
    <div class="card">
      <div class="tabs">
        <button :class="{ active: view === 'login' }" @click="switchView('login')">Login</button>
        <button :class="{ active: view === 'register' }" @click="switchView('register')">Register</button>
      </div>

      <!-- Login -->
      <form v-if="view === 'login'" @submit.prevent="handleLogin">
        <InputText v-model="form.email" type="email" placeholder="Email" fluid />
        <Password v-model="form.password" placeholder="Password" :feedback="false" toggleMask fluid />
        <Message v-if="error" severity="error" :closable="false">
          {{ error }}
          <ul v-if="Object.keys(errorDetails).length" class="details">
            <li v-for="(msgs, field) in errorDetails" :key="field">{{ field }}: {{ msgs[0] }}</li>
          </ul>
        </Message>
        <Button type="submit" label="Login" :loading="loading" fluid />
      </form>

      <!-- Register -->
      <form v-else @submit.prevent="handleRegister">
        <InputText v-model="form.firstName" placeholder="First name" fluid />
        <InputText v-model="form.lastName" placeholder="Last name" fluid />
        <InputText v-model="form.email" type="email" placeholder="Email" fluid />
        <Password v-model="form.password" placeholder="Password (min 8 chars)" :feedback="false" toggleMask fluid />
        <InputText v-model="form.phone" placeholder="Phone — +383XXXXXXXX (optional)" fluid />
        <DatePicker v-model="form.dateOfBirth" placeholder="Date of birth (optional)" dateFormat="dd/mm/yy" showIcon fluid />
        <Message v-if="error" severity="error" :closable="false">
          {{ error }}
          <ul v-if="Object.keys(errorDetails).length" class="details">
            <li v-for="(msgs, field) in errorDetails" :key="field">{{ field }}: {{ msgs[0] }}</li>
          </ul>
        </Message>
        <Button type="submit" label="Register" :loading="loading" fluid />
      </form>
    </div>

  </main>
</template>

<style scoped>
.auth-page {
  min-height: calc(100vh - 64px);
  display: grid;
  grid-template-columns: 1fr 1fr;
  background: var(--gym-bg);
}

/* Left panel */
.cover {
  position: relative;
  overflow: hidden;
}

.cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

/* Right panel */
.card {
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 3rem 3.5rem;
  background: var(--gym-surface);
  border-left: 1px solid var(--gym-border);
}

.tabs {
  display: flex;
  margin-bottom: 1.5rem;
  border-bottom: 1px solid var(--gym-border);
}

.tabs button {
  flex: 1;
  background: none;
  border: none;
  padding: 0.65rem;
  cursor: pointer;
  font-size: 0.95rem;
  color: var(--gym-text-muted);
  box-shadow: none;
  transition: color 0.15s;
}

.tabs button.active {
  color: var(--gym-orange);
  font-weight: 600;
  border-bottom: 2px solid var(--gym-orange);
  margin-bottom: -1px;
}

form {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.details {
  margin: 0.4rem 0 0;
  padding-left: 1.2rem;
  font-size: 0.82rem;
}

/* Collapse image on small screens */
@media (max-width: 768px) {
  .auth-page {
    grid-template-columns: 1fr;
  }

  .cover {
    display: none;
  }

  .card {
    padding: 2rem;
    border-left: none;
  }
}
</style>
