<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  bookClass,
  cancelClass as cancelClassApi,
  createClass,
  deleteClass,
  getClasses,
  updateClass,
  type ClassPayload,
} from '@/api/classes'
import { useAuthStore } from '@/stores/auth'

type Role = 'admin' | 'trainer' | 'member'
type Category = 'Yoga' | 'Pilates'
type RawStatus = 'scheduled' | 'cancelled' | 'completed'
type DisplayStatus = 'Active' | 'Cancelled' | 'Completed'

interface GymClass {
  ClassID: number
  id: number
  Name?: string
  name: string
  Category?: string
  category: Category
  TrainerID: number
  TrainerUserID: number
  TrainerName: string
  trainerName: string
  date: string
  startTime: string
  endTime: string
  Room?: string
  room: string
  MaxCapacity: number
  maxCapacity: number
  BookedCount: number
  bookedCount: number
  SpotsLeft: number
  spotsLeft: number
  Status: RawStatus
  status: DisplayStatus
  IsBookedByCurrentUser?: boolean
}

interface Trainer {
  TrainerID: number
  UserID: number
  TrainerName: string
}

const auth = useAuthStore()
const router = useRouter()

const classes = ref<GymClass[]>([])
const trainers = ref<Trainer[]>([])
const loading = ref(false)
const saving = ref(false)
const bookingId = ref<number | null>(null)
const error = ref('')
const notice = ref('')
const editingId = ref<number | null>(null)
const cancelTarget = ref<GymClass | null>(null)
const deleteMode = ref(false)
const formErrors = reactive<Record<string, string>>({})

const form = reactive({
  name: '',
  category: 'Yoga' as Category,
  date: '',
  startTime: '',
  endTime: '',
  room: '',
  maxCapacity: 20,
  trainerId: '',
})

const role = computed<Role | 'public'>(() => auth.user?.Role || 'public')
const isAdmin = computed(() => role.value === 'admin')
const isTrainer = computed(() => role.value === 'trainer')
const isMember = computed(() => role.value === 'member')
const canManage = computed(() => isAdmin.value || isTrainer.value)
const isEditing = computed(() => editingId.value !== null)

const stats = computed(() => ({
  total: classes.value.length,
  active: classes.value.filter((c) => c.Status === 'scheduled').length,
  cancelled: classes.value.filter((c) => c.Status === 'cancelled').length,
  full: classes.value.filter((c) => Number(c.spotsLeft) <= 0).length,
}))

function setServerErrors(details: Record<string, string[]> | undefined) {
  for (const key of Object.keys(formErrors)) delete formErrors[key]
  if (!details) return
  for (const [key, messages] of Object.entries(details)) {
    if (messages?.[0]) formErrors[key] = messages[0]
  }
}

function validateForm() {
  for (const key of Object.keys(formErrors)) delete formErrors[key]
  const start = new Date(`${form.date}T${form.startTime}:00`)
  const end = new Date(`${form.date}T${form.endTime}:00`)
  const editingClass = classes.value.find((gymClass) => gymClass.id === editingId.value)

  if (!form.name.trim()) formErrors.name = 'Name is required.'
  else if (form.name.trim().length < 3) formErrors.name = 'Name must be at least 3 characters.'
  else if (form.name.trim().length > 100) formErrors.name = 'Name cannot exceed 100 characters.'

  if (!['Yoga', 'Pilates'].includes(form.category)) formErrors.category = 'Choose Yoga or Pilates.'
  if (!form.date) formErrors.date = 'Date is required.'
  if (!form.startTime) formErrors.startTime = 'Start time is required.'
  if (!form.endTime) formErrors.endTime = 'End time is required.'
  if (form.date && form.startTime && start < new Date()) formErrors.date = 'Class date and time cannot be in the past.'
  if (form.startTime && form.endTime && end <= start) formErrors.endTime = 'End time must be after start time.'

  if (!form.room.trim()) formErrors.room = 'Room is required.'
  else if (form.room.trim().length > 50) formErrors.room = 'Room cannot exceed 50 characters.'

  if (!Number.isInteger(Number(form.maxCapacity))) formErrors.maxCapacity = 'Capacity must be a whole number.'
  else if (Number(form.maxCapacity) < 1) formErrors.maxCapacity = 'Capacity must be at least 1.'
  else if (Number(form.maxCapacity) > 100) formErrors.maxCapacity = 'Capacity cannot exceed 100.'
  else if (editingClass && Number(form.maxCapacity) < Number(editingClass.bookedCount)) {
    formErrors.maxCapacity = 'Capacity cannot be lower than existing bookings.'
  }

  if (isAdmin.value && !form.trainerId) formErrors.trainerId = 'Trainer is required.'
  return Object.keys(formErrors).length === 0
}

function buildPayload(): ClassPayload {
  const payload: ClassPayload = {
    name: form.name.trim(),
    category: form.category,
    date: form.date,
    startTime: form.startTime,
    endTime: form.endTime,
    room: form.room.trim(),
    maxCapacity: Number(form.maxCapacity),
  }
  if (isAdmin.value) payload.trainerId = Number(form.trainerId)
  return payload
}

function resetForm() {
  editingId.value = null
  form.name = ''
  form.category = 'Yoga'
  form.date = ''
  form.startTime = ''
  form.endTime = ''
  form.room = ''
  form.maxCapacity = 20
  form.trainerId = trainers.value[0] ? String(trainers.value[0].TrainerID) : ''
  for (const key of Object.keys(formErrors)) delete formErrors[key]
}

function editClass(gymClass: GymClass) {
  editingId.value = gymClass.id
  form.name = gymClass.name
  form.category = gymClass.category
  form.date = gymClass.date
  form.startTime = gymClass.startTime
  form.endTime = gymClass.endTime
  form.room = gymClass.room
  form.maxCapacity = gymClass.maxCapacity
  form.trainerId = String(gymClass.TrainerID)
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function canManageClass(gymClass: GymClass) {
  if (isAdmin.value) return true
  return isTrainer.value && gymClass.TrainerUserID === auth.user?.UserID
}

function canBook(gymClass: GymClass) {
  return gymClass.Status === 'scheduled' && Number(gymClass.spotsLeft) > 0 && !gymClass.IsBookedByCurrentUser
}

function actionLabel(gymClass: GymClass) {
  if (gymClass.IsBookedByCurrentUser) return 'Booked'
  if (gymClass.Status === 'cancelled') return 'Cancelled'
  if (gymClass.Status === 'completed') return 'Completed'
  if (Number(gymClass.spotsLeft) <= 0) return 'Full'
  return 'Book'
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }).format(new Date(`${value}T00:00:00`))
}

async function loadClasses() {
  loading.value = true
  error.value = ''
  try {
    const { data } = await getClasses()
    classes.value = data.data.classes ?? []
    trainers.value = data.data.trainers ?? []
    if (!form.trainerId && trainers.value[0]) form.trainerId = String(trainers.value[0].TrainerID)
  } catch (e: any) {
    if (e.response?.status === 401) {
      router.push('/login')
      return
    }
    error.value = e.response?.data?.message || 'Could not load classes.'
  } finally {
    loading.value = false
  }
}

async function saveClass() {
  error.value = ''
  notice.value = ''
  setServerErrors(undefined)
  if (!validateForm()) return

  saving.value = true
  try {
    if (isEditing.value && editingId.value !== null) {
      await updateClass(editingId.value, buildPayload())
      notice.value = 'Class updated.'
    } else {
      await createClass(buildPayload())
      notice.value = 'Class created.'
    }
    resetForm()
    await loadClasses()
  } catch (e: any) {
    setServerErrors(e.response?.data?.details)
    error.value = e.response?.data?.message || 'Could not save class.'
  } finally {
    saving.value = false
  }
}

function openCancelModal(gymClass: GymClass, asDelete = false) {
  cancelTarget.value = gymClass
  deleteMode.value = asDelete
}

function closeCancelModal() {
  cancelTarget.value = null
  deleteMode.value = false
}

async function confirmCancel() {
  if (!cancelTarget.value) return
  error.value = ''
  notice.value = ''
  try {
    if (deleteMode.value) await deleteClass(cancelTarget.value.id)
    else await cancelClassApi(cancelTarget.value.id)
    notice.value = deleteMode.value ? 'Class cancelled by delete action.' : 'Class cancelled.'
    closeCancelModal()
    await loadClasses()
  } catch (e: any) {
    error.value = e.response?.data?.message || 'Could not cancel class.'
  }
}

async function book(gymClass: GymClass) {
  if (!isMember.value) {
    router.push('/login')
    return
  }
  if (!canBook(gymClass)) return

  bookingId.value = gymClass.id
  error.value = ''
  notice.value = ''
  try {
    await bookClass(gymClass.id)
    notice.value = `You booked ${gymClass.name}.`
    await loadClasses()
  } catch (e: any) {
    error.value = e.response?.data?.message || 'Could not book this class.'
  } finally {
    bookingId.value = null
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
    <section class="page-head">
      <div>
        <p class="eyebrow">Classes</p>
        <h1>{{ canManage ? 'Class Management' : 'Browse Classes' }}</h1>
      </div>
      <button v-if="canManage && isEditing" class="ghost" type="button" @click="resetForm">New Class</button>
    </section>

    <section v-if="canManage" class="stats-grid">
      <div class="stat-card">
        <span>Total</span>
        <strong>{{ stats.total }}</strong>
      </div>
      <div class="stat-card">
        <span>Active</span>
        <strong>{{ stats.active }}</strong>
      </div>
      <div class="stat-card">
        <span>Cancelled</span>
        <strong>{{ stats.cancelled }}</strong>
      </div>
      <div class="stat-card">
        <span>Full</span>
        <strong>{{ stats.full }}</strong>
      </div>
    </section>

    <section v-if="canManage" class="manager-grid">
      <form class="panel" @submit.prevent="saveClass">
        <div class="panel-head">
          <p class="eyebrow">{{ isEditing ? 'Edit' : 'Create' }}</p>
          <h2>{{ isEditing ? 'Edit Class' : 'Create Class' }}</h2>
        </div>

        <label>
          Name
          <input v-model="form.name" maxlength="100" placeholder="Morning Yoga" />
          <span v-if="formErrors.name" class="field-error">{{ formErrors.name }}</span>
        </label>

        <div class="split">
          <label>
            Category
            <select v-model="form.category">
              <option value="Yoga">Yoga</option>
              <option value="Pilates">Pilates</option>
            </select>
            <span v-if="formErrors.category" class="field-error">{{ formErrors.category }}</span>
          </label>

          <label v-if="isAdmin">
            Trainer
            <select v-model="form.trainerId">
              <option value="" disabled>Select trainer</option>
              <option v-for="trainer in trainers" :key="trainer.TrainerID" :value="trainer.TrainerID">
                {{ trainer.TrainerName }}
              </option>
            </select>
            <span v-if="formErrors.trainerId" class="field-error">{{ formErrors.trainerId }}</span>
          </label>
        </div>

        <div class="split">
          <label>
            Date
            <input v-model="form.date" type="date" />
            <span v-if="formErrors.date" class="field-error">{{ formErrors.date }}</span>
          </label>
          <label>
            Room
            <input v-model="form.room" maxlength="50" placeholder="Studio 1" />
            <span v-if="formErrors.room" class="field-error">{{ formErrors.room }}</span>
          </label>
        </div>

        <div class="split">
          <label>
            Start Time
            <input v-model="form.startTime" type="time" />
            <span v-if="formErrors.startTime" class="field-error">{{ formErrors.startTime }}</span>
          </label>
          <label>
            End Time
            <input v-model="form.endTime" type="time" />
            <span v-if="formErrors.endTime" class="field-error">{{ formErrors.endTime }}</span>
          </label>
          <label>
            Max Capacity
            <input v-model.number="form.maxCapacity" min="1" max="100" type="number" />
            <span v-if="formErrors.maxCapacity" class="field-error">{{ formErrors.maxCapacity }}</span>
          </label>
        </div>

        <div class="actions">
          <button class="primary" :disabled="saving">{{ saving ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Class' }}</button>
          <button v-if="isEditing" class="ghost" type="button" @click="resetForm">Cancel Edit</button>
        </div>
      </form>
    </section>

    <section class="alerts">
      <div v-if="error" class="alert error">{{ error }}</div>
      <div v-if="notice" class="alert success">{{ notice }}</div>
    </section>

    <section class="class-list">
      <article v-for="gymClass in classes" :key="gymClass.id" class="class-card">
        <div class="card-top">
          <span class="pill">{{ gymClass.category }}</span>
          <span v-if="canManage" class="pill">{{ gymClass.status }}</span>
        </div>

        <h3>{{ gymClass.name }}</h3>
        <p>{{ gymClass.trainerName }}</p>

        <dl>
          <div>
            <dt>Date</dt>
            <dd>{{ formatDate(gymClass.date) }}</dd>
          </div>
          <div>
            <dt>Time</dt>
            <dd>{{ gymClass.startTime }} - {{ gymClass.endTime }}</dd>
          </div>
          <div>
            <dt>Room</dt>
            <dd>{{ gymClass.room }}</dd>
          </div>
          <div>
            <dt>Capacity</dt>
            <dd>{{ gymClass.bookedCount }} / {{ gymClass.maxCapacity }}</dd>
          </div>
          <div>
            <dt>Spots Left</dt>
            <dd>{{ gymClass.spotsLeft }}</dd>
          </div>
        </dl>

        <div v-if="canManageClass(gymClass)" class="actions">
          <button class="ghost" @click="editClass(gymClass)">Edit</button>
          <button class="danger" :disabled="gymClass.Status === 'cancelled'" @click="openCancelModal(gymClass)">
            Cancel
          </button>
          <button class="danger ghost-danger" :disabled="gymClass.Status === 'cancelled'" @click="openCancelModal(gymClass, true)">
            Delete
          </button>
        </div>

        <div v-else-if="isMember" class="actions">
          <button class="primary" :disabled="!canBook(gymClass) || bookingId === gymClass.id" @click="book(gymClass)">
            {{ bookingId === gymClass.id ? 'Booking...' : actionLabel(gymClass) }}
          </button>
        </div>
      </article>
    </section>

    <p v-if="loading" class="empty">Loading classes...</p>
    <p v-else-if="classes.length === 0" class="empty">No classes found.</p>

    <div v-if="cancelTarget" class="modal-backdrop" role="presentation">
      <div class="modal" role="dialog" aria-modal="true" aria-labelledby="cancel-title">
        <h2 id="cancel-title">{{ deleteMode ? 'Delete Class' : 'Cancel Class' }}</h2>
        <p>Are you sure you want to cancel this class? This action will make the class unavailable for members.</p>
        <div class="actions modal-actions">
          <button class="ghost" type="button" @click="closeCancelModal">No, keep it</button>
          <button class="danger" type="button" @click="confirmCancel">Yes, cancel class</button>
        </div>
      </div>
    </div>
  </main>
</template>

<style scoped>
.classes-page {
  background: var(--gym-bg);
  color: var(--gym-text);
  min-height: calc(100vh - 64px);
  padding: 3rem 2rem 4rem;
}

.page-head,
.stats-grid,
.manager-grid,
.alerts,
.class-list {
  max-width: 1180px;
  margin-left: auto;
  margin-right: auto;
}

.page-head {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.eyebrow {
  color: var(--gym-orange);
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: 0.18em;
  margin: 0 0 0.35rem;
  text-transform: uppercase;
}

h1,
h2,
h3 {
  margin: 0;
  text-transform: uppercase;
}

h1 {
  font-size: clamp(2.2rem, 5vw, 4rem);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 1rem;
  margin-bottom: 1.25rem;
}

.stat-card,
.panel,
.class-card,
.modal {
  background: var(--gym-surface);
  border: 1px solid var(--gym-border);
  border-radius: 8px;
}

.stat-card,
.panel,
.class-card,
.modal {
  padding: 1.25rem;
}

.stat-card span,
label,
p,
dt,
dd {
  color: var(--gym-text-muted);
}

.stat-card strong {
  display: block;
  color: var(--gym-orange);
  font-size: 2rem;
  margin-top: 0.35rem;
}

.manager-grid {
  margin-bottom: 1.25rem;
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

.field-error {
  color: #ff8b8b;
  font-size: 0.76rem;
  font-weight: 600;
  text-transform: none;
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

.ghost-danger {
  background: transparent;
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

.class-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1rem;
}

.card-top {
  display: flex;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 1rem;
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

dl {
  display: grid;
  gap: 0.5rem;
  margin: 1rem 0;
}

dl div {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
}

dt,
dd {
  margin: 0;
}

dd {
  color: var(--gym-text);
  text-align: right;
}

.empty {
  color: var(--gym-text-muted);
  margin-top: 2rem;
  text-align: center;
}

.modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 200;
  display: grid;
  place-items: center;
  background: rgba(0, 0, 0, 0.72);
  padding: 1rem;
}

.modal {
  max-width: 440px;
  width: 100%;
}

.modal-actions {
  justify-content: flex-end;
  margin-top: 1.25rem;
}

@media (max-width: 760px) {
  .classes-page {
    padding: 2rem 1rem 3rem;
  }

  .page-head,
  .split,
  .actions,
  dl div {
    flex-direction: column;
    align-items: stretch;
  }

  .stats-grid {
    grid-template-columns: 1fr 1fr;
  }

  dd {
    text-align: left;
  }
}
</style>
