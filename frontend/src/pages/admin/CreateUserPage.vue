<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import InputText from 'primevue/inputtext'
import Password from 'primevue/password'
import Select from 'primevue/select'
import DatePicker from 'primevue/datepicker'
import Button from 'primevue/button'
import Message from 'primevue/message'
import { createUser } from '@/api/admin'

const router = useRouter()

const loading = ref(false)
const error = ref('')
const success = ref(false)

const roles = [
  { label: 'Member',  value: 'member' },
  { label: 'Trainer', value: 'trainer' },
  { label: 'Admin',   value: 'admin' },
]

const form = reactive({
  firstName:   '',
  lastName:    '',
  email:       '',
  password:    '',
  role:        'member',
  phone:       '',
  dateOfBirth: null as Date | null,
})

function toISODate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

async function handleSubmit() {
  error.value = ''
  success.value = false
  loading.value = true
  try {
    const payload: any = {
      firstName: form.firstName,
      lastName:  form.lastName,
      email:     form.email,
      password:  form.password,
      role:      form.role,
    }
    if (form.phone)       payload.phone = form.phone
    if (form.dateOfBirth) payload.dateOfBirth = toISODate(form.dateOfBirth)

    await createUser(payload)
    success.value = true
    Object.assign(form, { firstName: '', lastName: '', email: '', password: '', role: 'member', phone: '', dateOfBirth: null })
  } catch (e: any) {
    error.value = e.response?.data?.message ?? 'Something went wrong'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="page">

    <div class="header">
      <Button icon="pi pi-arrow-left" severity="secondary" size="small" text @click="router.push('/admin')" />
      <h1>Create User</h1>
    </div>

    <div class="card">
      <form @submit.prevent="handleSubmit">
        <div class="row">
          <div class="field">
            <label>First Name</label>
            <InputText v-model="form.firstName" placeholder="First name" fluid required />
          </div>
          <div class="field">
            <label>Last Name</label>
            <InputText v-model="form.lastName" placeholder="Last name" fluid required />
          </div>
        </div>

        <div class="field">
          <label>Email</label>
          <InputText v-model="form.email" type="email" placeholder="Email" fluid required />
        </div>

        <div class="field">
          <label>Password</label>
          <Password v-model="form.password" placeholder="Password (min 8 chars)" :feedback="false" toggleMask fluid required />
        </div>

        <div class="field">
          <label>Role</label>
          <Select v-model="form.role" :options="roles" optionLabel="label" optionValue="value" fluid />
        </div>

        <div class="row">
          <div class="field">
            <label>Phone <span class="optional">(optional)</span></label>
            <InputText v-model="form.phone" placeholder="+383XXXXXXXX" fluid />
          </div>
          <div class="field">
            <label>Date of Birth <span class="optional">(optional)</span></label>
            <DatePicker v-model="form.dateOfBirth" dateFormat="dd/mm/yy" showIcon fluid />
          </div>
        </div>

        <Message v-if="error" severity="error" :closable="false">{{ error }}</Message>
        <Message v-if="success" severity="success" :closable="false">User created successfully.</Message>

        <div class="actions">
          <Button type="submit" label="Create User" icon="pi pi-check" :loading="loading" />
          <Button label="Cancel" severity="secondary" @click="router.push('/admin')" />
        </div>
      </form>
    </div>

  </div>
</template>

<style scoped>
.page { max-width: 680px; }

.header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1.75rem;
}

h1 {
  font-size: 1.6rem;
  font-weight: 800;
  color: var(--gym-text);
}

.card {
  background: var(--gym-surface-raised);
  border: 1px solid var(--gym-border);
  border-radius: 10px;
  padding: 2rem;
}

form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

label {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--gym-text);
}

.optional {
  font-weight: 400;
  color: var(--gym-text-muted);
}

.actions {
  display: flex;
  gap: 0.75rem;
  padding-top: 0.5rem;
}

@media (max-width: 560px) {
  .row { grid-template-columns: 1fr; }
}
</style>
