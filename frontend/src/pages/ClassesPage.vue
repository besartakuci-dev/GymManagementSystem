<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import api from '@/api/axios'
import { useAuthStore } from '@/stores/auth'

type Role = 'admin' | 'trainer' | 'member'
type ClassStatus = 'scheduled' | 'cancelled' | 'completed'

interface GymClass {
  ClassID: number
  ClassTypeID: number
  ClassTypeName: string
  Category: string
  TrainerID: number
  TrainerUserID: number
  TrainerName: string
  dayOfWeek: string
  startTime: string
  StartDateTime: string
  EndDateTime: string
  MaxCapacity: number
  Price: number | string
  Status: ClassStatus
  BookedCount: number
  IsBookedByCurrentUser?: boolean
}

interface ClassType {
  ClassTypeID: number
  TypeName: string
  Category: string
  Price?: number | string
}

interface Trainer {
  TrainerID: number
  UserID: number
  TrainerName: string
}

const auth = useAuthStore()
const router = useRouter()

const classes = ref<GymClass[]>([])
const classTypes = ref<ClassType[]>([])
const trainers = ref<Trainer[]>([])
const loading = ref(false)
const saving = ref(false)
const error = ref('')
const notice = ref('')
const editingId = ref<number | null>(null)
const paymentMethod = reactive<Record<number, string>>({})

const form = reactive({
  classTypeId: '',
  trainerId: '',
  startDateTime: '',
  endDateTime: '',
  maxCapacity: 20,
  price: 0,
  status: 'scheduled' as ClassStatus,
})

const role = computed<Role | 'public'>(() => auth.user?.Role || 'public')
const isAdmin = computed(() => role.value === 'admin')
const isTrainer = computed(() => role.value === 'trainer')
const isMember = computed(() => role.value === 'member')
const canManage = computed(() => isAdmin.value || isTrainer.value)
const isEditing = computed(() => editingId.value !== null)

const stats = computed(() => ({
  total: classes.value.length,
  scheduled: classes.value.filter((c) => c.Status === 'scheduled').length,
  cancelled: classes.value.filter((c) => c.Status === 'cancelled').length,
  completed: classes.value.filter((c) => c.Status === 'completed').length,
}))

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

function toDateTimeLocal(value: string) {
  const date = new Date(value)
  const offset = date.getTimezoneOffset() * 60000
  return new Date(date.getTime() - offset).toISOString().slice(0, 16)
}

function formatMoney(value: number | string) {
  return new Intl.NumberFormat('en', { style: 'currency', currency: 'EUR' }).format(Number(value))
}

async function loadClasses() {
  loading.value = true
  error.value = ''
  try {
    const { data } = await api.get('/classes')
    classes.value = data.data.classes ?? []
    classTypes.value = data.data.classTypes ?? []
    trainers.value = data.data.trainers ?? []
    if (!form.classTypeId && classTypes.value[0]) {
      form.classTypeId = String(classTypes.value[0].ClassTypeID)
      form.price = Number(classTypes.value[0].Price || 0)
    }
    if (!form.trainerId && trainers.value[0]) {
      form.trainerId = String(trainers.value[0].TrainerID)
    }
  } catch (e: any) {
    if (e.response?.status === 401) {
      router.push('/login')
      return
    }
    error.value = e.response?.data?.message || 'Could not load classes'
  } finally {
    loading.value = false
  }
}

function resetForm() {
  editingId.value = null
  form.classTypeId = classTypes.value[0] ? String(classTypes.value[0].ClassTypeID) : ''
  form.trainerId = trainers.value[0] ? String(trainers.value[0].TrainerID) : ''
  form.startDateTime = ''
  form.endDateTime = ''
  form.maxCapacity = 20
  form.price = classTypes.value[0] ? Number(classTypes.value[0].Price || 0) : 0
  form.status = 'scheduled'
}

function editClass(gymClass: GymClass) {
  editingId.value = gymClass.ClassID
  form.classTypeId = String(gymClass.ClassTypeID)
  form.trainerId = String(gymClass.TrainerID)
  form.startDateTime = toDateTimeLocal(gymClass.StartDateTime)
  form.endDateTime = toDateTimeLocal(gymClass.EndDateTime)
  form.maxCapacity = gymClass.MaxCapacity
  form.price = Number(gymClass.Price || 0)
  form.status = gymClass.Status
}

function canManageClass(gymClass: GymClass) {
  if (isAdmin.value) return true
  return isTrainer.value && gymClass.TrainerUserID === auth.user?.UserID
}

function isFull(gymClass: GymClass) {
  return Number(gymClass.BookedCount) >= Number(gymClass.MaxCapacity)
}

function memberActionLabel(gymClass: GymClass) {
  if (gymClass.IsBookedByCurrentUser) return 'Booked'
  if (gymClass.Status === 'cancelled') return 'Cancelled'
  if (gymClass.Status === 'completed') return 'Completed'
  if (isFull(gymClass)) return 'Full'
  return isMember.value ? 'Pay & Enroll' : 'Login to Enroll'
}

async function saveClass() {
  saving.value = true
  error.value = ''
  notice.value = ''
  try {
    const payload: Record<string, string | number> = {
      classTypeId: Number(form.classTypeId),
      startDateTime: form.startDateTime,
      endDateTime: form.endDateTime,
      maxCapacity: Number(form.maxCapacity),
      price: Number(form.price),
      status: form.status,
    }
    if (isAdmin.value) payload.trainerId = Number(form.trainerId)

    if (isEditing.value) {
      await api.put(`/classes/${editingId.value}`, payload)
      notice.value = 'Class updated.'
    } else {
      await api.post('/classes', payload)
      notice.value = 'Class created.'
    }
    resetForm()
    await loadClasses()
  } catch (e: any) {
    error.value = e.response?.data?.message || 'Could not save class'
  } finally {
    saving.value = false
  }
}

async function cancelClass(gymClass: GymClass) {
  if (gymClass.Status === 'cancelled') return
  if (!confirm(`Cancel ${gymClass.ClassTypeName} with ${gymClass.TrainerName}?`)) return
  error.value = ''
  notice.value = ''
  try {
    await api.delete(`/classes/${gymClass.ClassID}`)
    notice.value = 'Class cancelled.'
    await loadClasses()
  } catch (e: any) {
    error.value = e.response?.data?.message || 'Could not cancel class'
  }
}

async function enroll(gymClass: GymClass) {
  if (!isMember.value) {
    router.push('/login')
    return
  }
  error.value = ''
  notice.value = ''
  try {
    await api.post(`/classes/${gymClass.ClassID}/join`, {
      paymentMethod: paymentMethod[gymClass.ClassID] || 'card',
    })
    notice.value = `Payment complete. You enrolled in ${gymClass.ClassTypeName}.`
    await loadClasses()
  } catch (e: any) {
    error.value = e.response?.data?.message || 'Could not enroll in class'
  }
}

onMounted(async () => {
  await auth.init()
  if (!auth.user) {
    router.push('/login')
    return
  }
  await loadClasses()
})
</script>

<template>
  <main class="classes-page">
    <section class="hero">
      <p class="eyebrow">GROUP CLASSES</p>
      <h1>{{ isAdmin ? 'Class Control' : isTrainer ? 'My Classes' : 'Book Your Class' }}</h1>
      <p>
        {{
          isMember
            ? 'Choose a Yoga or Pilates session, pay, and reserve your spot.'
            : 'Manage schedule, capacity, status, and class availability.'
        }}
      </p>
    </section>

    <section v-if="isAdmin" class="stats-grid">
      <div class="stat-card">
        <span>Total Classes</span>
        <strong>{{ stats.total }}</strong>
      </div>
      <div class="stat-card">
        <span>Scheduled</span>
        <strong>{{ stats.scheduled }}</strong>
      </div>
      <div class="stat-card">
        <span>Cancelled</span>
        <strong>{{ stats.cancelled }}</strong>
      </div>
      <div class="stat-card">
        <span>Completed</span>
        <strong>{{ stats.completed }}</strong>
      </div>
    </section>

    <section v-if="canManage" class="manager-grid">
      <form class="panel" @submit.prevent="saveClass">
        <div class="panel-head">
          <p class="eyebrow">{{ isEditing ? 'EDIT' : 'CREATE' }}</p>
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

        <label v-if="isAdmin">
          Trainer
          <select v-model="form.trainerId" required>
            <option v-for="trainer in trainers" :key="trainer.TrainerID" :value="trainer.TrainerID">
              {{ trainer.TrainerName }}
            </option>
          </select>
        </label>

        <div class="split">
          <label>
            Start
            <input v-model="form.startDateTime" type="datetime-local" required />
          </label>
          <label>
            End
            <input v-model="form.endDateTime" type="datetime-local" required />
          </label>
        </div>

        <div class="split">
          <label>
            Capacity
            <input v-model.number="form.maxCapacity" min="1" type="number" required />
          </label>
          <label>
            Price
            <input v-model.number="form.price" min="0" step="0.01" type="number" required />
          </label>
        </div>

        <label>
          Status
          <select v-model="form.status">
            <option value="scheduled">Scheduled</option>
            <option value="cancelled">Cancelled</option>
            <option value="completed">Completed</option>
          </select>
        </label>

        <div class="actions">
          <button class="primary" :disabled="saving">{{ saving ? 'Saving...' : isEditing ? 'Update' : 'Create' }}</button>
          <button v-if="isEditing" class="ghost" type="button" @click="resetForm">Cancel Edit</button>
        </div>
      </form>

      <div v-if="isAdmin" class="panel table-panel">
        <div class="panel-head">
          <p class="eyebrow">ADMIN</p>
          <h2>Class Status</h2>
        </div>
        <div v-for="gymClass in classes" :key="gymClass.ClassID" class="admin-row">
          <div>
            <strong>{{ gymClass.ClassTypeName }}</strong>
            <span>{{ gymClass.TrainerName }} &middot; {{ formatDate(gymClass.StartDateTime) }}</span>
          </div>
          <span class="pill">{{ gymClass.Status }}</span>
          <span>{{ gymClass.BookedCount }}/{{ gymClass.MaxCapacity }}</span>
          <button class="ghost" @click="editClass(gymClass)">Edit</button>
          <button class="danger" :disabled="gymClass.Status === 'cancelled'" @click="cancelClass(gymClass)">
            Cancel
          </button>
        </div>
      </div>
    </section>

    <section class="alerts">
      <div v-if="error" class="alert error">{{ error }}</div>
      <div v-if="notice" class="alert success">{{ notice }}</div>
    </section>

    <section class="class-grid">
      <article v-for="gymClass in classes" :key="gymClass.ClassID" class="class-card">
        <div class="card-top">
          <span class="pill">{{ gymClass.Category }}</span>
          <span class="pill">{{ gymClass.Status }}</span>
        </div>
        <h3>{{ gymClass.ClassTypeName }}</h3>
        <p>{{ gymClass.TrainerName }}</p>
        <strong class="price">{{ formatMoney(gymClass.Price) }}</strong>
        <div class="info">
          <span>{{ gymClass.dayOfWeek }} at {{ gymClass.startTime }}</span>
          <span>{{ formatDate(gymClass.StartDateTime) }}</span>
          <span>{{ gymClass.BookedCount }} / {{ gymClass.MaxCapacity }} booked</span>
        </div>

        <div v-if="canManageClass(gymClass)" class="actions">
          <button class="ghost" @click="editClass(gymClass)">Edit</button>
          <button class="danger" :disabled="gymClass.Status === 'cancelled'" @click="cancelClass(gymClass)">
            Cancel
          </button>
        </div>

        <div v-else class="actions enroll-actions">
          <select v-if="isMember" v-model="paymentMethod[gymClass.ClassID]">
            <option value="card">Card</option>
            <option value="cash">Cash</option>
            <option value="bank_transfer">Bank Transfer</option>
          </select>
          <button
            class="primary"
            :disabled="gymClass.Status !== 'scheduled' || isFull(gymClass) || gymClass.IsBookedByCurrentUser"
            @click="enroll(gymClass)"
          >
            {{ memberActionLabel(gymClass) }}
          </button>
        </div>
      </article>
    </section>

    <p v-if="loading" class="empty">Loading classes...</p>
    <p v-else-if="classes.length === 0" class="empty">No upcoming classes.</p>
  </main>
</template>

<style scoped>
.classes-page {
  background: var(--gym-bg);
  color: var(--gym-text);
  min-height: calc(100vh - 64px);
  padding: 4rem 2rem;
}

.hero,
.stats-grid,
.manager-grid,
.alerts,
.class-grid {
  max-width: 1180px;
  margin-left: auto;
  margin-right: auto;
}

.hero {
  margin-bottom: 2rem;
}

.eyebrow {
  color: var(--gym-orange);
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}

.hero h1,
.panel h2,
.class-card h3 {
  margin: 0;
  text-transform: uppercase;
}

.hero h1 {
  font-size: clamp(2.4rem, 6vw, 5rem);
}

.hero p {
  color: var(--gym-text-muted);
  max-width: 680px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.stat-card,
.panel,
.class-card {
  background: var(--gym-surface);
  border: 1px solid var(--gym-border);
  border-radius: 8px;
}

.stat-card {
  padding: 1.25rem;
}

.stat-card span,
.class-card p,
.info,
label,
.admin-row span {
  color: var(--gym-text-muted);
}

.stat-card strong {
  display: block;
  color: var(--gym-orange);
  font-size: 2rem;
  margin-top: 0.35rem;
}

.manager-grid {
  display: grid;
  grid-template-columns: minmax(320px, 0.9fr) minmax(420px, 1.1fr);
  gap: 1.25rem;
  margin-bottom: 1.5rem;
}

.panel,
.class-card {
  padding: 1.25rem;
}

.panel-head {
  margin-bottom: 1rem;
}

label {
  display: grid;
  gap: 0.45rem;
  margin-bottom: 0.9rem;
  font-size: 0.78rem;
  font-weight: 800;
  text-transform: uppercase;
}

input,
select {
  width: 100%;
  min-height: 42px;
  border: 1px solid var(--gym-border);
  border-radius: 6px;
  background: #090909;
  color: var(--gym-text);
  padding: 0 0.75rem;
}

.split,
.actions {
  display: flex;
  gap: 0.75rem;
}

.split > label {
  flex: 1;
}

button {
  min-height: 42px;
  border: 0;
  border-radius: 6px;
  padding: 0 1rem;
  cursor: pointer;
  font-weight: 900;
  text-transform: uppercase;
}

button:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

.primary {
  background: var(--gym-orange);
  color: #fff;
}

.ghost {
  border: 1px solid var(--gym-border);
  background: transparent;
  color: var(--gym-text);
}

.danger {
  border: 1px solid rgba(255, 64, 64, 0.45);
  background: rgba(255, 64, 64, 0.12);
  color: #ff6969;
}

.admin-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto auto auto auto;
  align-items: center;
  gap: 0.8rem;
  padding: 0.85rem 0;
  border-top: 1px solid var(--gym-border);
}

.admin-row:first-of-type {
  border-top: 0;
}

.admin-row strong,
.admin-row span {
  display: block;
}

.alerts {
  margin-bottom: 1rem;
}

.alert {
  border-radius: 6px;
  padding: 0.9rem 1rem;
  margin-bottom: 0.75rem;
}

.error {
  background: rgba(255, 64, 64, 0.12);
  color: #ff8b8b;
}

.success {
  background: rgba(46, 204, 113, 0.12);
  color: #8ff0b4;
}

.class-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.25rem;
}

.card-top {
  display: flex;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 1.2rem;
}

.pill {
  border: 1px solid rgba(255, 64, 64, 0.35);
  border-radius: 999px;
  color: var(--gym-orange);
  font-size: 0.72rem;
  font-weight: 800;
  padding: 0.35rem 0.65rem;
  text-transform: uppercase;
}

.price {
  display: block;
  color: var(--gym-orange);
  font-size: 1.5rem;
  margin: 0.75rem 0;
}

.info {
  display: grid;
  gap: 0.35rem;
  margin-bottom: 1rem;
}

.enroll-actions {
  align-items: center;
}

.empty {
  text-align: center;
  color: var(--gym-text-muted);
  margin-top: 2rem;
}

@media (max-width: 880px) {
  .stats-grid,
  .manager-grid {
    grid-template-columns: 1fr;
  }

  .admin-row {
    grid-template-columns: 1fr;
  }

  .split,
  .actions {
    flex-direction: column;
  }
}
</style>
