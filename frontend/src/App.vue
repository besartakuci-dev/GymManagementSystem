<script setup lang="ts">

import { computed, onMounted, reactive, ref } from 'vue'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'

type Role = 'admin' | 'trainer' | 'member' | 'public'

interface GymClass {
  ClassID: number
  ClassTypeID: number
  ClassTypeName: string
  Category: string
  TrainerID: number
  TrainerUserID: number
  TrainerName: string
  StartDateTime: string
  EndDateTime: string
  MaxCapacity: number
  Status: 'scheduled' | 'cancelled' | 'completed'
  BookedCount: number
}

interface ClassType {
  ClassTypeID: number
  TypeName: string
  Category: string
  Description: string
  IsActive?: number | boolean
}

interface Trainer {
  TrainerID: number
  UserID: number
  TrainerName: string
  Specialization: string
}

interface CurrentUser {
  UserID: number
  Role: Role
  FirstName: string
  LastName: string
}

const classes = ref<GymClass[]>([])
const classTypes = ref<ClassType[]>([])
const allClassTypes = ref<ClassType[]>([])
const trainers = ref<Trainer[]>([])
const token = ref(localStorage.getItem('gymToken') || '')
const currentUser = ref<CurrentUser | null>(null)
const loading = ref(false)
const saving = ref(false)
const error = ref('')
const notice = ref('')
const editingId = ref<number | null>(null)
const editingClassTypeId = ref<number | null>(null)

const form = reactive({
  classTypeId: '',
  trainerId: '',
  startDateTime: '',
  endDateTime: '',
  maxCapacity: 20,
  status: 'scheduled',
})

const classTypeForm = reactive({
  typeName: '',
  category: '',
  description: '',
  isActive: true,
})

const role = computed<Role>(() => currentUser.value?.Role || 'public')
const canManage = computed(() => role.value === 'admin' || role.value === 'trainer')
const isEditing = computed(() => editingId.value !== null)
const isClassTypeEditing = computed(() => editingClassTypeId.value !== null)

function authHeaders(): Record<string, string> {
  return token.value ? { Authorization: `Bearer ${token.value}` } : {}
}

function toDateTimeLocal(value: string) {
  const date = new Date(value)
  const offset = date.getTimezoneOffset() * 60000
  return new Date(date.getTime() - offset).toISOString().slice(0, 16)
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat('en', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

async function request(path: string, options: RequestInit = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  })
  const payload = await response.json()
  if (!response.ok) {
    throw new Error(payload.message || 'Request failed')
  }
  return payload
}

async function loadClasses() {
  loading.value = true
  error.value = ''
  try {
    const payload = await request('/classes')
    classes.value = payload.data.classes
    classTypes.value = payload.data.classTypes
    trainers.value = payload.data.trainers
    if (!allClassTypes.value.length) allClassTypes.value = payload.data.classTypes

    if (!form.classTypeId && classTypes.value[0]) form.classTypeId = String(classTypes.value[0].ClassTypeID)
    if (!form.trainerId && trainers.value[0]) form.trainerId = String(trainers.value[0].TrainerID)
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Could not load classes'
  } finally {
    loading.value = false
  }
}

async function loadClassTypeCatalog() {
  try {
    const payload = await request('/class-types')
    allClassTypes.value = payload.data.classTypes
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Could not load class types'
  }
}

async function loadProfile() {
  if (!token.value) {
    currentUser.value = null
    return
  }

  try {
    const payload = await request('/auth/me', { headers: authHeaders() })
    currentUser.value = payload.data.user
    localStorage.setItem('gymToken', token.value)
    if (currentUser.value?.Role === 'admin') await loadClassTypeCatalog()
  } catch {
    currentUser.value = null
    localStorage.removeItem('gymToken')
  }
}

async function sampleLogin(email: string) {
  error.value = ''
  notice.value = ''
  try {
    const payload = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password: 'password123' }),
    })
    token.value = payload.data.token
    await loadProfile()
    if (currentUser.value?.Role === 'admin') await loadClassTypeCatalog()
    notice.value = `Signed in as ${payload.data.user.FirstName} ${payload.data.user.LastName}`
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Login failed'
  }
}

function resetClassTypeForm() {
  editingClassTypeId.value = null
  classTypeForm.typeName = ''
  classTypeForm.category = ''
  classTypeForm.description = ''
  classTypeForm.isActive = true
}

function editClassType(classType: ClassType) {
  editingClassTypeId.value = classType.ClassTypeID
  classTypeForm.typeName = classType.TypeName
  classTypeForm.category = classType.Category || ''
  classTypeForm.description = classType.Description || ''
  classTypeForm.isActive = classType.IsActive === true || classType.IsActive === 1
}

async function saveClassType() {
  saving.value = true
  error.value = ''
  notice.value = ''

  const payload: Record<string, string | boolean> = {
    typeName: classTypeForm.typeName,
    category: classTypeForm.category,
    description: classTypeForm.description,
  }

  if (isClassTypeEditing.value) {
    payload.isActive = classTypeForm.isActive
  }

  try {
    const path = isClassTypeEditing.value ? `/class-types/${editingClassTypeId.value}` : '/class-types'
    await request(path, {
      method: isClassTypeEditing.value ? 'PUT' : 'POST',
      headers: authHeaders(),
      body: JSON.stringify(payload),
    })
    notice.value = isClassTypeEditing.value ? 'Class type updated.' : 'Class type added.'
    resetClassTypeForm()
    await Promise.all([loadClasses(), loadClassTypeCatalog()])
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Could not save class type'
  } finally {
    saving.value = false
  }
}

async function deleteClassType(classType: ClassType) {
  if (!window.confirm(`Deactivate ${classType.TypeName}?`)) return

  error.value = ''
  notice.value = ''
  try {
    await request(`/class-types/${classType.ClassTypeID}`, {
      method: 'DELETE',
      headers: authHeaders(),
    })
    notice.value = 'Class type deactivated.'
    await Promise.all([loadClasses(), loadClassTypeCatalog()])
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Could not deactivate class type'
  }
}

function resetForm() {
  editingId.value = null
  form.classTypeId = classTypes.value[0] ? String(classTypes.value[0].ClassTypeID) : ''
  form.trainerId = trainers.value[0] ? String(trainers.value[0].TrainerID) : ''
  form.startDateTime = ''
  form.endDateTime = ''
  form.maxCapacity = 20
  form.status = 'scheduled'
}

function editClass(gymClass: GymClass) {
  editingId.value = gymClass.ClassID
  form.classTypeId = String(gymClass.ClassTypeID)
  form.trainerId = String(gymClass.TrainerID)
  form.startDateTime = toDateTimeLocal(gymClass.StartDateTime)
  form.endDateTime = toDateTimeLocal(gymClass.EndDateTime)
  form.maxCapacity = gymClass.MaxCapacity
  form.status = gymClass.Status
}

function canManageClass(gymClass: GymClass) {
  if (role.value === 'admin') return true
  return role.value === 'trainer' && gymClass.TrainerUserID === currentUser.value?.UserID
}

async function saveClass() {
  saving.value = true
  error.value = ''
  notice.value = ''

  const payload: Record<string, string | number> = {
    classTypeId: Number(form.classTypeId),
    startDateTime: form.startDateTime,
    endDateTime: form.endDateTime,
    maxCapacity: Number(form.maxCapacity),
    status: form.status,
  }

  if (role.value === 'admin') {
    payload.trainerId = Number(form.trainerId)
  }

  try {
    const path = isEditing.value ? `/classes/${editingId.value}` : '/classes'
    await request(path, {
      method: isEditing.value ? 'PUT' : 'POST',
      headers: authHeaders(),
      body: JSON.stringify(payload),
    })
    notice.value = isEditing.value ? 'Class updated.' : 'Class added.'
    resetForm()
    await loadClasses()
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Could not save class'
  } finally {
    saving.value = false
  }
}

async function cancelClass(gymClass: GymClass) {
  if (!window.confirm(`Cancel ${gymClass.ClassTypeName} with ${gymClass.TrainerName}?`)) return

  error.value = ''
  notice.value = ''
  try {
    await request(`/classes/${gymClass.ClassID}`, {
      method: 'DELETE',
      headers: authHeaders(),
    })
    notice.value = 'Class cancelled.'
    await loadClasses()
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Could not cancel class'
  }
}

onMounted(async () => {
  await Promise.all([loadClasses(), loadProfile()])
})
</script>

<template>
  <main class="page-shell">
    <section class="hero-band">
      <nav class="top-nav">
        <div class="brand">IRON<span>FORGE</span></div>
        <div class="nav-links">
          <a href="#">Home</a>
          <a href="#">Programs</a>
          <a href="#">Trainers</a>
          <a class="active" href="#">Classes</a>
        </div>
      </nav>

      <div class="hero-content">
        <p class="eyebrow">GROUP TRAINING</p>
        <h1>Upcoming <span>Classes</span></h1>
        <p class="lede">Choose your class type, trainer, and time. Every session is scheduled and capacity controlled.</p>
      </div>
    </section>

    <section class="content-grid">
      <aside class="panel auth-panel">
        <div class="panel-heading">
          <p class="eyebrow">ACCESS</p>
          <h2>{{ role === 'public' ? 'Public View' : `${role} mode` }}</h2>
        </div>

        <div v-if="currentUser" class="signed-user">
          {{ currentUser.FirstName }} {{ currentUser.LastName }}
        </div>

        <div class="token-row">
          <input v-model="token" type="password" placeholder="Paste JWT token" @change="loadProfile" />
          <button class="ghost-button" type="button" @click="loadProfile">Use</button>
        </div>

        <div class="quick-logins">
          <button type="button" @click="sampleLogin('admin@bbrosgym.com')">Admin</button>
          <button type="button" @click="sampleLogin('petrit.maliqi@bbrosgym.com')">Trainer</button>
        </div>

        <p class="hint">No token is needed to view scheduled classes.</p>
      </aside>

      <form v-if="canManage" class="panel class-form" @submit.prevent="saveClass">
        <div class="panel-heading">
          <p class="eyebrow">{{ isEditing ? 'EDIT SESSION' : 'NEW SESSION' }}</p>
          <h2>{{ isEditing ? 'Update Class' : 'Add Class' }}</h2>
        </div>

        <label>
          Class Type
          <select v-model="form.classTypeId" required>
            <option v-for="type in classTypes" :key="type.ClassTypeID" :value="type.ClassTypeID">
              {{ type.TypeName }}
            </option>
          </select>
        </label>

        <label v-if="role === 'admin'">
          Trainer
          <select v-model="form.trainerId" required>
            <option v-for="trainer in trainers" :key="trainer.TrainerID" :value="trainer.TrainerID">
              {{ trainer.TrainerName }}
            </option>
          </select>
        </label>

        <div class="form-split">
          <label>
            Starts
            <input v-model="form.startDateTime" type="datetime-local" required />
          </label>
          <label>
            Ends
            <input v-model="form.endDateTime" type="datetime-local" required />
          </label>
        </div>

        <div class="form-split">
          <label>
            Capacity
            <input v-model.number="form.maxCapacity" min="1" type="number" required />
          </label>
          <label>
            Status
            <select v-model="form.status">
              <option value="scheduled">Scheduled</option>
              <option value="cancelled">Cancelled</option>
              <option value="completed">Completed</option>
            </select>
          </label>
        </div>

        <div class="form-actions">
          <button class="primary-button" type="submit" :disabled="saving">
            {{ saving ? 'Saving...' : isEditing ? 'Save Changes' : 'Add Class' }}
          </button>
          <button v-if="isEditing" class="ghost-button" type="button" @click="resetForm">Cancel Edit</button>
        </div>
      </form>
    </section>

    <section v-if="role === 'admin'" class="type-manager">
      <form class="panel type-form" @submit.prevent="saveClassType">
        <div class="panel-heading">
          <p class="eyebrow">{{ isClassTypeEditing ? 'EDIT TYPE' : 'NEW TYPE' }}</p>
          <h2>{{ isClassTypeEditing ? 'Update Class Type' : 'Add Class Type' }}</h2>
        </div>

        <div class="form-split">
          <label>
            Type Name
            <input v-model="classTypeForm.typeName" maxlength="100" required placeholder="Yoga" />
          </label>
          <label>
            Category
            <input v-model="classTypeForm.category" maxlength="60" placeholder="Flexibility" />
          </label>
        </div>

        <label>
          Description
          <input v-model="classTypeForm.description" maxlength="1000" placeholder="Core, mobility, and recovery work" />
        </label>

        <label v-if="isClassTypeEditing" class="check-row">
          <input v-model="classTypeForm.isActive" type="checkbox" />
          Active
        </label>

        <div class="form-actions">
          <button class="primary-button" type="submit" :disabled="saving">
            {{ saving ? 'Saving...' : isClassTypeEditing ? 'Save Type' : 'Add Type' }}
          </button>
          <button v-if="isClassTypeEditing" class="ghost-button" type="button" @click="resetClassTypeForm">
            Cancel Edit
          </button>
        </div>
      </form>

      <div class="panel type-list">
        <div class="panel-heading">
          <p class="eyebrow">CATALOG</p>
          <h2>Class Types</h2>
        </div>

        <div class="type-table">
          <div v-for="classType in allClassTypes" :key="classType.ClassTypeID" class="type-row">
            <div>
              <strong>{{ classType.TypeName }}</strong>
              <span>{{ classType.Category || 'Uncategorized' }}</span>
            </div>
            <span class="status-pill">{{ classType.IsActive === false || classType.IsActive === 0 ? 'inactive' : 'active' }}</span>
            <div class="type-actions">
              <button class="ghost-button" type="button" @click="editClassType(classType)">Edit</button>
              <button
                class="danger-button"
                type="button"
                :disabled="classType.IsActive === false || classType.IsActive === 0"
                @click="deleteClassType(classType)"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="classes-section">
      <div class="section-heading">
        <p class="eyebrow">SCHEDULE</p>
        <h2>Upcoming Classes</h2>
      </div>

      <div v-if="error" class="alert error">{{ error }}</div>
      <div v-if="notice" class="alert success">{{ notice }}</div>

      <div class="class-grid">
        <article v-for="gymClass in classes" :key="gymClass.ClassID" class="class-card">
          <div class="card-top">
            <span class="category-pill">{{ gymClass.Category }}</span>
            <span class="status-pill">{{ gymClass.Status }}</span>
          </div>
          <h3>{{ gymClass.ClassTypeName }}</h3>
          <p class="trainer">{{ gymClass.TrainerName }}</p>
          <div class="time-block">
            <strong>{{ formatDate(gymClass.StartDateTime) }}</strong>
            <span>Until {{ formatTime(gymClass.EndDateTime) }}</span>
          </div>
          <div class="capacity">
            <span>{{ gymClass.BookedCount }} / {{ gymClass.MaxCapacity }}</span>
            <div class="capacity-track">
              <div
                class="capacity-fill"
                :style="{ width: `${Math.min(100, (gymClass.BookedCount / gymClass.MaxCapacity) * 100)}%` }"
              ></div>
            </div>
          </div>
          <div v-if="canManageClass(gymClass)" class="card-actions">
            <button class="ghost-button" type="button" @click="editClass(gymClass)">Edit</button>
            <button class="danger-button" type="button" @click="cancelClass(gymClass)">Cancel</button>
          </div>
        </article>
      </div>

      <div v-if="!loading && classes.length === 0" class="empty-state">No upcoming scheduled classes.</div>
      <div v-if="loading" class="empty-state">Loading classes...</div>
    </section>
  </main>
</template>

<style scoped>
:global(*) {
  box-sizing: border-box;
}

:global(body) {
  margin: 0;
  min-width: 320px;
  background: #050505;
  color: #f5f5f5;
  font-family:
    Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}

:global(button),
:global(input),
:global(select) {
  font: inherit;
}

.page-shell {
  min-height: 100vh;
  background:
    linear-gradient(180deg, rgba(5, 5, 5, 0.3), #050505 72%),
    radial-gradient(circle at 50% 0%, rgba(255, 58, 58, 0.15), transparent 34%),
    #050505;
}

.hero-band {
  min-height: 420px;
  padding: 28px clamp(20px, 7vw, 120px) 64px;
  background:
    linear-gradient(90deg, rgba(5, 5, 5, 0.88), rgba(5, 5, 5, 0.55)),
    url('https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1800&q=80');
  background-position: center;
  background-size: cover;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.top-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
}

.brand {
  color: #f6f6f6;
  font-size: 30px;
  font-weight: 900;
  letter-spacing: 4px;
}

.brand span,
.hero-content span {
  color: #ff3838;
}

.nav-links {
  display: flex;
  gap: clamp(16px, 3vw, 42px);
}

.nav-links a {
  color: #b9b9b9;
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 1px;
  text-decoration: none;
}

.nav-links .active {
  color: #ffffff;
}

.hero-content {
  max-width: 760px;
  padding-top: 98px;
}

.eyebrow {
  display: inline-flex;
  margin: 0 0 16px;
  padding: 8px 16px;
  border: 1px solid rgba(255, 56, 56, 0.35);
  border-radius: 999px;
  background: rgba(255, 56, 56, 0.1);
  color: #ff4a4a;
  font-size: 12px;
  font-weight: 900;
  letter-spacing: 4px;
  text-transform: uppercase;
}

h1,
h2,
h3 {
  margin: 0;
  font-family: Impact, Haettenschweiler, "Arial Narrow Bold", sans-serif;
  letter-spacing: 2px;
  text-transform: uppercase;
}

h1 {
  max-width: 700px;
  color: #f4f4f4;
  font-size: clamp(54px, 9vw, 104px);
  line-height: 0.95;
}

.lede {
  max-width: 620px;
  color: #c7c7c7;
  font-size: 18px;
  line-height: 1.7;
}

.content-grid,
.classes-section {
  width: min(1380px, calc(100% - 40px));
  margin: 0 auto;
}

.content-grid {
  display: grid;
  grid-template-columns: minmax(280px, 0.8fr) minmax(320px, 1.2fr);
  gap: 24px;
  margin-top: -48px;
}

.panel,
.class-card {
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  background: #111111;
  box-shadow: 0 22px 50px rgba(0, 0, 0, 0.28);
}

.panel {
  padding: 28px;
}

.panel-heading {
  margin-bottom: 22px;
}

.panel-heading .eyebrow,
.section-heading .eyebrow {
  margin-bottom: 10px;
}

.panel h2,
.section-heading h2 {
  color: #f8f8f8;
  font-size: 30px;
}

.signed-user {
  margin-bottom: 16px;
  color: #ffffff;
  font-weight: 800;
}

.token-row,
.form-split,
.form-actions,
.quick-logins,
.card-actions {
  display: flex;
  gap: 12px;
}

.token-row input {
  min-width: 0;
  flex: 1;
}

label {
  display: grid;
  gap: 8px;
  margin-bottom: 16px;
  color: #a8a8a8;
  font-size: 13px;
  font-weight: 800;
  letter-spacing: 1px;
  text-transform: uppercase;
}

input,
select {
  width: 100%;
  min-height: 48px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 6px;
  background: #090909;
  color: #ffffff;
  padding: 0 14px;
  outline: none;
}

input:focus,
select:focus {
  border-color: #ff3838;
}

button {
  min-height: 46px;
  border-radius: 6px;
  border: 0;
  cursor: pointer;
  font-size: 12px;
  font-weight: 900;
  letter-spacing: 2px;
  text-transform: uppercase;
}

button:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

.primary-button {
  flex: 1;
  background: linear-gradient(135deg, #ff3434, #d92a2a);
  color: #ffffff;
}

.ghost-button,
.quick-logins button {
  border: 1px solid rgba(255, 255, 255, 0.28);
  background: transparent;
  color: #ffffff;
  padding: 0 18px;
}

.danger-button {
  border: 1px solid rgba(255, 56, 56, 0.5);
  background: rgba(255, 56, 56, 0.12);
  color: #ff5b5b;
  padding: 0 18px;
}

.hint {
  margin: 16px 0 0;
  color: #858585;
  line-height: 1.6;
}

.classes-section {
  padding: 58px 0 80px;
}

.type-manager {
  display: grid;
  grid-template-columns: minmax(320px, 0.9fr) minmax(360px, 1.1fr);
  gap: 24px;
  width: min(1380px, calc(100% - 40px));
  margin: 24px auto 0;
}

.check-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.check-row input {
  width: 18px;
  min-height: 18px;
  accent-color: #ff3838;
}

.type-table {
  display: grid;
  gap: 12px;
}

.type-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto auto;
  align-items: center;
  gap: 14px;
  min-height: 72px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  padding-top: 12px;
}

.type-row:first-child {
  border-top: 0;
  padding-top: 0;
}

.type-row strong,
.type-row span {
  display: block;
}

.type-row strong {
  color: #ffffff;
  font-size: 17px;
}

.type-row span {
  color: #8e8e8e;
  margin-top: 4px;
}

.type-row .status-pill {
  display: inline-flex;
  margin-top: 0;
  color: #bdbdbd;
}

.type-actions {
  display: flex;
  gap: 10px;
}

.section-heading {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 24px;
}

.alert {
  margin-bottom: 16px;
  border-radius: 6px;
  padding: 14px 16px;
  font-weight: 700;
}

.alert.error {
  border: 1px solid rgba(255, 56, 56, 0.45);
  background: rgba(255, 56, 56, 0.1);
  color: #ff8484;
}

.alert.success {
  border: 1px solid rgba(73, 199, 124, 0.35);
  background: rgba(73, 199, 124, 0.1);
  color: #95e5b5;
}

.class-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 24px;
}

.class-card {
  min-height: 320px;
  padding: 28px;
}

.card-top {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 34px;
}

.category-pill,
.status-pill {
  border-radius: 999px;
  padding: 7px 11px;
  font-size: 11px;
  font-weight: 900;
  letter-spacing: 2px;
  text-transform: uppercase;
}

.category-pill {
  border: 1px solid rgba(255, 56, 56, 0.36);
  color: #ff4747;
}

.status-pill {
  background: rgba(255, 255, 255, 0.08);
  color: #bdbdbd;
}

.class-card h3 {
  color: #ffffff;
  font-size: 31px;
}

.trainer {
  margin: 10px 0 24px;
  color: #a8a8a8;
  font-size: 17px;
}

.time-block {
  display: grid;
  gap: 6px;
  margin-bottom: 24px;
  color: #ffffff;
}

.time-block span {
  color: #8f8f8f;
}

.capacity {
  display: grid;
  gap: 10px;
  color: #d7d7d7;
  font-weight: 800;
}

.capacity-track {
  height: 8px;
  overflow: hidden;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.09);
}

.capacity-fill {
  height: 100%;
  border-radius: inherit;
  background: #ff3838;
}

.card-actions {
  margin-top: 24px;
}

.empty-state {
  border: 1px dashed rgba(255, 255, 255, 0.15);
  border-radius: 8px;
  color: #a8a8a8;
  padding: 28px;
  text-align: center;
}

@media (max-width: 980px) {
  .content-grid,
  .type-manager,
  .class-grid {
    grid-template-columns: 1fr;
  }

  .nav-links {
    display: none;
  }
}

@media (max-width: 640px) {
  .hero-band {
    min-height: 360px;
    padding-inline: 20px;
  }

  .hero-content {
    padding-top: 70px;
  }

  .content-grid,
  .type-manager,
  .classes-section {
    width: calc(100% - 28px);
  }

  .form-split,
  .form-actions,
  .token-row {
    flex-direction: column;
  }
}
</style>
=======
import { onMounted } from 'vue'
import { RouterView } from 'vue-router'
import Navbar from '@/components/Navbar.vue'
import Footer from '@/components/Footer.vue'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
onMounted(auth.init)
</script>

<template>
  <Navbar />
  <RouterView />
  <Footer />
</template>
>>>>>>> 575d9adc10a1a296b9129ab50b19280e0631897b
