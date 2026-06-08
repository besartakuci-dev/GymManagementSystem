<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  cancelClass as cancelClassApi,
  createClass,
  deleteClass,
  getClassBookings,
  getClasses,
  updateClass,
  type ClassPayload,
} from '@/api/classes'
import { useAuthStore } from '@/stores/auth'

type Role = 'admin' | 'trainer' | 'member'
type RawStatus = 'scheduled' | 'cancelled' | 'completed'
type DisplayStatus = 'Active' | 'Cancelled' | 'Completed'

interface GymClass {
  ClassID: number
  id: number
  name: string
  category: ClassPayload['category']
  dayOfWeek?: string
  TrainerID: number
  TrainerUserID: number
  trainerName: string
  date: string
  startTime: string
  endTime: string
  room: string
  maxCapacity: number
  bookedCount: number
  spotsLeft: number
  Status: RawStatus
  status: DisplayStatus
}

interface Trainer {
  TrainerID: number
  UserID: number
  TrainerName?: string
  FullName?: string
  Name?: string
}

interface ClassType {
  TypeName: ClassPayload['category']
}

interface Attendee {
  BookingID: number
  UserID: number
  FirstName: string
  LastName: string
  Email: string
  BookingDate: string
  Status: string
  Amount: string | number
  PaymentMethod: 'cash' | 'card' | 'bank_transfer'
  PaymentStatus: 'pending' | 'paid' | 'refunded'
}

const DAY_ORDER = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

const auth = useAuthStore()
const router = useRouter()

const classes = ref<GymClass[]>([])
const trainers = ref<Trainer[]>([])
const classTypes = ref<ClassType[]>([])
const loading = ref(false)
const saving = ref(false)
const attendeesLoading = ref(false)
const error = ref('')
const notice = ref('')
const editingId = ref<number | null>(null)
const cancelTarget = ref<GymClass | null>(null)
const deleteMode = ref(false)
const selectedCategory = ref('')
const openMenuId = ref<number | null>(null)
const attendeesClass = ref<GymClass | null>(null)
const attendees = ref<Attendee[]>([])
const formErrors = reactive<Record<string, string>>({})

const form = reactive({
  name: '',
  category: 'Yoga' as ClassPayload['category'],
  date: '',
  startTime: '',
  endTime: '',
  room: '',
  maxCapacity: 20,
  trainerId: '',
})

const role = computed<Role | 'public'>(() => {
  const value = String(auth.user?.Role || '').toLowerCase()
  return value === 'admin' || value === 'trainer' || value === 'member' ? value : 'public'
})
const isAdmin = computed(() => role.value === 'admin')
const isTrainer = computed(() => role.value === 'trainer')
const isEditing = computed(() => editingId.value !== null)

const categoryOptions = computed<ClassPayload['category'][]>(() => {
  const names = classTypes.value.map((type) => type.TypeName).filter(Boolean)
  return names.length ? names : ['Yoga', 'Pilates']
})

const groupedClasses = computed(() => {
  const groups = new Map<ClassPayload['category'], GymClass[]>()
  for (const gymClass of classes.value) {
    if (!groups.has(gymClass.category)) groups.set(gymClass.category, [])
    groups.get(gymClass.category)?.push(gymClass)
  }

  return [...groups.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([name, sessions]) => ({
      name,
      active: sessions.filter((session) => session.Status === 'scheduled').length,
      sessions: [...sessions].sort((a, b) => {
        const dayDiff = DAY_ORDER.indexOf(a.dayOfWeek || '') - DAY_ORDER.indexOf(b.dayOfWeek || '')
        if (dayDiff !== 0) return dayDiff
        return a.startTime.localeCompare(b.startTime)
      }),
    }))
})

const selectedGroup = computed(() => {
  if (!selectedCategory.value) return groupedClasses.value[0] ?? null
  return groupedClasses.value.find((group) => group.name === selectedCategory.value) ?? null
})

const selectedSessions = computed(() => selectedGroup.value?.sessions ?? [])

const pageTitle = computed(() => (isAdmin.value ? 'Class Management' : 'My Classes'))
const pageSubtitle = computed(() =>
  isAdmin.value
    ? 'Create schedules and manage every class by type.'
    : 'Create and manage the class sessions assigned to you.'
)

const stats = computed(() => ({
  total: classes.value.length,
  active: classes.value.filter((c) => c.Status === 'scheduled').length,
  cancelled: classes.value.filter((c) => c.Status === 'cancelled').length,
  full: classes.value.filter((c) => Number(c.spotsLeft) <= 0).length,
}))

function trainerLabel(trainer: Trainer) {
  return trainer.TrainerName || trainer.FullName || trainer.Name || `Trainer ${trainer.TrainerID}`
}

function clearFormErrors() {
  for (const key of Object.keys(formErrors)) delete formErrors[key]
}

function setServerErrors(details: Record<string, string[]> | undefined) {
  clearFormErrors()
  if (!details) return
  for (const [key, messages] of Object.entries(details)) {
    if (messages?.[0]) formErrors[key] = messages[0]
  }
}

function validateForm() {
  clearFormErrors()
  const start = new Date(`${form.date}T${form.startTime}:00`)
  const end = new Date(`${form.date}T${form.endTime}:00`)
  const editingClass = classes.value.find((gymClass) => gymClass.id === editingId.value)

  if (!form.name.trim()) formErrors.name = 'Name is required.'
  else if (form.name.trim().length < 3) formErrors.name = 'Name must be at least 3 characters.'
  else if (form.name.trim().length > 100) formErrors.name = 'Name cannot exceed 100 characters.'

  if (!categoryOptions.value.includes(form.category)) formErrors.category = 'Choose a valid category.'
  if (!form.date) formErrors.date = 'Date is required.'
  if (!form.startTime) formErrors.startTime = 'Start time is required.'
  if (!form.endTime) formErrors.endTime = 'End time is required.'
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
  form.category = (selectedGroup.value?.name ?? categoryOptions.value[0] ?? 'Yoga') as ClassPayload['category']
  form.date = ''
  form.startTime = ''
  form.endTime = ''
  form.room = ''
  form.maxCapacity = 20
  form.trainerId = trainers.value[0] ? String(trainers.value[0].TrainerID) : ''
  clearFormErrors()
}

function selectCategory(category: string) {
  selectedCategory.value = category
  form.category = category as ClassPayload['category']
  openMenuId.value = null
}

function toggleMenu(classId: number) {
  openMenuId.value = openMenuId.value === classId ? null : classId
}

function editClass(gymClass: GymClass) {
  if (!canManageClass(gymClass)) return
  openMenuId.value = null
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

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }).format(new Date(`${value}T00:00:00`))
}

function paymentMethodLabel(value: string) {
  if (value === 'bank_transfer') return 'Bank transfer'
  return value.charAt(0).toUpperCase() + value.slice(1)
}

async function openAttendeesModal(gymClass: GymClass) {
  if (!canManageClass(gymClass)) return
  openMenuId.value = null
  attendeesClass.value = gymClass
  attendees.value = []
  attendeesLoading.value = true
  error.value = ''

  try {
    const { data } = await getClassBookings(gymClass.id)
    attendees.value = data.data.bookings ?? []
  } catch (e: any) {
    error.value = e.response?.data?.message || 'Could not load class members.'
    attendeesClass.value = null
  } finally {
    attendeesLoading.value = false
  }
}

function closeAttendeesModal() {
  attendeesClass.value = null
  attendees.value = []
}

async function loadClasses() {
  loading.value = true
  error.value = ''
  try {
    const { data } = await getClasses()
    classes.value = data.data.classes ?? []
    trainers.value = data.data.trainers ?? []
    classTypes.value = data.data.classTypes ?? []
    if (!selectedCategory.value && groupedClasses.value[0]) selectedCategory.value = groupedClasses.value[0].name
    if (!categoryOptions.value.includes(form.category)) form.category = categoryOptions.value[0] ?? 'Yoga'
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
  if (!isAdmin.value && !isTrainer.value) {
    error.value = 'Unauthorized'
    return
  }
  if (!validateForm()) return

  saving.value = true
  try {
    if (isEditing.value && editingId.value !== null) {
      await updateClass(editingId.value, buildPayload())
      notice.value = 'Class updated.'
    } else {
      await createClass(buildPayload())
      notice.value = 'Class created.'
      selectedCategory.value = form.category
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
  if (!canManageClass(gymClass)) return
  openMenuId.value = null
  cancelTarget.value = gymClass
  deleteMode.value = asDelete
}

function closeCancelModal() {
  cancelTarget.value = null
  deleteMode.value = false
}

async function confirmCancel() {
  if (!cancelTarget.value) return
  if (!canManageClass(cancelTarget.value)) {
    error.value = 'Unauthorized'
    closeCancelModal()
    return
  }
  error.value = ''
  notice.value = ''
  try {
    if (deleteMode.value) await deleteClass(cancelTarget.value.id)
    else await cancelClassApi(cancelTarget.value.id)
    notice.value = deleteMode.value ? 'Class deleted.' : 'Class cancelled.'
    closeCancelModal()
    await loadClasses()
  } catch (e: any) {
    error.value = e.response?.data?.message || 'Could not update class.'
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
  <main class="page">
    <section class="classes">
      <div class="section-header">
        <p class="eyebrow">Classes</p>
        <h1>{{ pageTitle }}</h1>
        <p>{{ pageSubtitle }}</p>
      </div>

      <section class="stats-grid">
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

      <form class="manager-panel" @submit.prevent="saveClass">
        <div class="panel-head">
          <div>
            <p class="eyebrow">{{ isEditing ? 'Edit schedule' : 'New schedule' }}</p>
            <h2>{{ isEditing ? 'Edit Class' : 'Create Class' }}</h2>
          </div>
          <button v-if="isEditing" class="ghost icon-text" type="button" @click="resetForm">
            <i class="pi pi-plus" />
            New
          </button>
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
              <option v-for="category in categoryOptions" :key="category" :value="category">{{ category }}</option>
            </select>
            <span v-if="formErrors.category" class="field-error">{{ formErrors.category }}</span>
          </label>

          <label v-if="isAdmin">
            Trainer
            <select v-model="form.trainerId">
              <option value="" disabled>Select trainer</option>
              <option v-for="trainer in trainers" :key="trainer.TrainerID" :value="trainer.TrainerID">
                {{ trainerLabel(trainer) }}
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
          <button class="primary icon-text" :disabled="saving">
            <i class="pi pi-save" />
            {{ saving ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Class' }}
          </button>
          <button v-if="isEditing" class="ghost" type="button" @click="resetForm">Cancel Edit</button>
        </div>
      </form>

      <section class="alerts">
        <div v-if="error" class="alert error">{{ error }}</div>
        <div v-if="notice" class="alert success">{{ notice }}</div>
      </section>

      <p v-if="loading" class="status">Loading classes...</p>
      <p v-else-if="classes.length === 0" class="status">No classes found.</p>

      <div v-else class="type-grid">
        <button
          v-for="group in groupedClasses"
          :key="group.name"
          class="type-card"
          :class="{ active: selectedGroup?.name === group.name }"
          type="button"
          @click="selectCategory(group.name)"
        >
          <span class="type-count">{{ group.sessions.length }} sessions</span>
          <strong>{{ group.name }}</strong>
          <small>{{ group.active }} active</small>
        </button>
      </div>

      <section v-if="selectedGroup" class="schedule-panel">
        <div class="table-header">
          <div>
            <p class="eyebrow">Selected type</p>
            <h2>{{ selectedGroup.name }} Classes</h2>
          </div>
          <span class="selected-pill">{{ selectedSessions.length }} sessions</span>
        </div>

        <ul class="session-list">
          <li v-for="session in selectedSessions" :key="session.id" class="session">
            <div class="session-main">
              <span class="session-title">{{ session.name }}</span>
              <span class="session-subtitle">{{ session.trainerName }}</span>
            </div>
            <span class="session-chip"><i class="pi pi-calendar" />{{ session.dayOfWeek || formatDate(session.date) }}</span>
            <span class="session-chip time"><i class="pi pi-clock" />{{ session.startTime }} - {{ session.endTime }}</span>
            <span class="session-chip"><i class="pi pi-map-marker" />{{ session.room }}</span>
            <span class="session-chip"><i class="pi pi-users" />{{ session.bookedCount }} / {{ session.maxCapacity }}</span>
            <span class="status-pill" :class="session.Status">{{ session.status }}</span>

            <div v-if="canManageClass(session)" class="menu-wrap">
              <button class="menu-button" type="button" :aria-label="`Manage ${session.name}`" @click="toggleMenu(session.id)">
                <i class="pi pi-ellipsis-v" />
              </button>
              <div v-if="openMenuId === session.id" class="action-menu">
                <button type="button" @click="editClass(session)">
                  <i class="pi pi-pencil" />
                  Edit
                </button>
                <button type="button" @click="openAttendeesModal(session)">
                  <i class="pi pi-users" />
                  View Members
                </button>
                <button type="button" :disabled="session.Status === 'cancelled'" @click="openCancelModal(session)">
                  <i class="pi pi-ban" />
                  Cancel
                </button>
                <button type="button" class="danger-text" :disabled="session.Status === 'cancelled'" @click="openCancelModal(session, true)">
                  <i class="pi pi-trash" />
                  Delete
                </button>
              </div>
            </div>
          </li>
        </ul>
      </section>

      <div v-if="cancelTarget" class="modal-backdrop" role="presentation">
        <div class="modal" role="dialog" aria-modal="true" aria-labelledby="cancel-title">
          <h2 id="cancel-title">{{ deleteMode ? 'Delete Class' : 'Cancel Class' }}</h2>
          <p>
            Are you sure you want to {{ deleteMode ? 'delete' : 'cancel' }} this class? Members will no longer be able to book it.
          </p>
          <div class="actions modal-actions">
            <button class="ghost" type="button" @click="closeCancelModal">No, keep it</button>
            <button class="danger" type="button" @click="confirmCancel">{{ deleteMode ? 'Yes, delete' : 'Yes, cancel' }}</button>
          </div>
        </div>
      </div>

      <div v-if="attendeesClass" class="modal-backdrop" role="presentation">
        <div class="modal attendees-modal" role="dialog" aria-modal="true" aria-labelledby="attendees-title">
          <div class="modal-head">
            <div>
              <p class="eyebrow">Members</p>
              <h2 id="attendees-title">{{ attendeesClass.name }}</h2>
              <p>{{ attendeesClass.dayOfWeek || formatDate(attendeesClass.date) }} at {{ attendeesClass.startTime }}</p>
            </div>
            <button class="ghost close-button" type="button" @click="closeAttendeesModal">Close</button>
          </div>

          <p v-if="attendeesLoading" class="status">Loading members...</p>
          <p v-else-if="attendees.length === 0" class="status">No members have booked this class yet.</p>

          <ul v-else class="attendee-list">
            <li v-for="attendee in attendees" :key="attendee.BookingID" class="attendee-row">
              <div>
                <strong>{{ attendee.FirstName }} {{ attendee.LastName }}</strong>
                <span>{{ attendee.Email }}</span>
              </div>
              <span class="attendee-pill">{{ attendee.Status }}</span>
              <span class="attendee-pill" :class="attendee.PaymentStatus">{{ attendee.PaymentStatus }}</span>
              <span class="attendee-pill">{{ paymentMethodLabel(attendee.PaymentMethod) }}</span>
            </li>
          </ul>
        </div>
      </div>
    </section>
  </main>
</template>

<style scoped>
.page {
  background:
    radial-gradient(circle at top, rgba(249, 115, 22, 0.08), transparent 28%),
    linear-gradient(180deg, #060606 0%, var(--gym-bg) 45%, #080808 100%);
  min-height: calc(100vh - 64px);
}

.classes {
  max-width: 1180px;
  margin: 0 auto;
  padding: 3rem 1.25rem 5rem;
}

.section-header {
  text-align: center;
  margin-bottom: 1.5rem;
}

.section-header h1 {
  color: var(--gym-text);
  font-size: clamp(2rem, 4vw, 2.7rem);
  font-weight: 800;
  margin: 0.3rem 0 0.45rem;
  text-transform: uppercase;
}

.section-header p:last-child {
  color: var(--gym-text-muted);
  margin: 0;
}

.eyebrow {
  color: var(--gym-orange);
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.18em;
  margin: 0;
  text-transform: uppercase;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 1rem;
  margin-bottom: 1.2rem;
}

.stat-card,
.manager-panel,
.schedule-panel,
.modal {
  background: linear-gradient(145deg, rgba(17, 17, 17, 0.98), rgba(10, 10, 10, 0.98));
  border: 1px solid rgba(249, 115, 22, 0.18);
  border-radius: 8px;
  box-shadow: 0 18px 36px rgba(0, 0, 0, 0.3);
}

.stat-card {
  padding: 1rem;
}

.stat-card span {
  color: var(--gym-text-muted);
  font-size: 0.78rem;
  font-weight: 800;
  text-transform: uppercase;
}

.stat-card strong {
  color: var(--gym-orange);
  display: block;
  font-size: 2rem;
  margin-top: 0.35rem;
}

.manager-panel,
.schedule-panel {
  padding: 1.15rem;
  margin-bottom: 1.2rem;
}

.panel-head,
.table-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1rem;
}

h2,
h3 {
  color: var(--gym-text);
  margin: 0.25rem 0 0;
  text-transform: uppercase;
}

label {
  color: var(--gym-text-muted);
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
  cursor: pointer;
  font-weight: 900;
}

button:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

.icon-text {
  align-items: center;
  display: inline-flex;
  gap: 0.45rem;
  justify-content: center;
}

.primary {
  background: var(--gym-orange);
  color: #fff;
  padding: 0 1rem;
  text-transform: uppercase;
}

.ghost {
  border: 1px solid var(--gym-border);
  background: transparent;
  color: var(--gym-text);
  padding: 0 1rem;
  text-transform: uppercase;
}

.danger {
  border: 1px solid rgba(255, 64, 64, 0.45);
  background: rgba(255, 64, 64, 0.12);
  color: #ff6969;
  padding: 0 1rem;
  text-transform: uppercase;
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

.status {
  color: var(--gym-text-muted);
  text-align: center;
}

.type-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
  gap: 1rem;
  margin-bottom: 1.2rem;
}

.type-card {
  min-height: 130px;
  padding: 1rem;
  text-align: left;
  background: linear-gradient(145deg, rgba(17, 17, 17, 0.98), rgba(10, 10, 10, 0.98));
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-left: 4px solid rgba(249, 115, 22, 0.35);
  border-radius: 8px;
  color: var(--gym-text);
  transition: transform 150ms ease, border-color 150ms ease, box-shadow 150ms ease;
}

.type-card:hover,
.type-card.active {
  transform: translateY(-2px);
  border-color: rgba(249, 115, 22, 0.45);
  border-left-color: var(--gym-orange);
  box-shadow: 0 12px 24px rgba(249, 115, 22, 0.08);
}

.type-card strong {
  display: block;
  font-size: 1.35rem;
  margin: 0.5rem 0 0.25rem;
}

.type-card small,
.type-count {
  color: var(--gym-text-muted);
  font-size: 0.82rem;
}

.selected-pill {
  display: inline-flex;
  padding: 0.35rem 0.65rem;
  border-radius: 999px;
  background: rgba(249, 115, 22, 0.12);
  color: #fdba74;
  font-size: 0.82rem;
  font-weight: 700;
  text-transform: uppercase;
}

.session-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.session {
  position: relative;
  display: grid;
  grid-template-columns: minmax(180px, 1.35fr) repeat(4, minmax(115px, 1fr)) auto 42px;
  gap: 0.55rem;
  align-items: center;
  padding: 0.8rem 0.9rem;
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.03), rgba(249, 115, 22, 0.05));
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-left: 4px solid var(--gym-orange);
  border-radius: 8px;
  color: var(--gym-text);
}

.session-main {
  display: grid;
  gap: 0.2rem;
}

.session-title {
  color: var(--gym-text);
  font-weight: 800;
}

.session-subtitle {
  color: var(--gym-text-muted);
  font-size: 0.85rem;
}

.session-chip,
.status-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  width: fit-content;
  padding: 0.45rem 0.6rem;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.04);
  color: var(--gym-text);
  font-size: 0.88rem;
  font-weight: 700;
}

.session-chip.time {
  color: #fdba74;
  background: rgba(249, 115, 22, 0.12);
  border-color: rgba(249, 115, 22, 0.22);
}

.status-pill.scheduled {
  color: #8ff0b4;
}

.status-pill.cancelled {
  color: #ff8b8b;
}

.status-pill.completed {
  color: #c8c8c8;
}

.menu-wrap {
  position: relative;
  justify-self: end;
}

.menu-button {
  width: 36px;
  min-height: 36px;
  display: grid;
  place-items: center;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: var(--gym-text);
}

.action-menu {
  position: absolute;
  right: 0;
  top: 42px;
  z-index: 10;
  min-width: 150px;
  padding: 0.35rem;
  background: #111;
  border: 1px solid var(--gym-border);
  border-radius: 8px;
  box-shadow: 0 18px 30px rgba(0, 0, 0, 0.35);
}

.action-menu button {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-height: 36px;
  padding: 0 0.65rem;
  background: transparent;
  color: var(--gym-text);
  text-align: left;
}

.action-menu button:hover {
  background: rgba(249, 115, 22, 0.12);
}

.action-menu .danger-text {
  color: #ff6969;
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
  padding: 1.25rem;
}

.attendees-modal {
  max-width: 760px;
}

.modal-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1rem;
}

.modal-head p:last-child {
  color: var(--gym-text-muted);
  margin: 0.35rem 0 0;
}

.close-button {
  min-height: 36px;
}

.modal p {
  color: var(--gym-text-muted);
}

.attendee-list {
  display: grid;
  gap: 0.7rem;
  list-style: none;
  margin: 0;
  padding: 0;
}

.attendee-row {
  display: grid;
  grid-template-columns: minmax(180px, 1fr) repeat(3, auto);
  gap: 0.65rem;
  align-items: center;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-left: 4px solid var(--gym-orange);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.03);
  padding: 0.8rem;
}

.attendee-row strong,
.attendee-row span {
  display: block;
}

.attendee-row strong {
  color: var(--gym-text);
}

.attendee-row div span {
  color: var(--gym-text-muted);
  font-size: 0.86rem;
  margin-top: 0.2rem;
}

.attendee-pill {
  width: fit-content;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.04);
  color: var(--gym-text);
  font-size: 0.78rem;
  font-weight: 800;
  padding: 0.35rem 0.55rem;
  text-transform: uppercase;
}

.attendee-pill.paid {
  color: #8ff0b4;
}

.attendee-pill.pending {
  color: #ffd18a;
}

.attendee-pill.refunded {
  color: #c8c8c8;
}

.modal-actions {
  justify-content: flex-end;
  margin-top: 1.25rem;
}

@media (max-width: 980px) {
  .session {
    grid-template-columns: 1fr;
    align-items: flex-start;
  }

  .menu-wrap {
    justify-self: start;
  }
}

@media (max-width: 760px) {
  .stats-grid {
    grid-template-columns: 1fr 1fr;
  }

  .panel-head,
  .table-header,
  .modal-head,
  .split,
  .actions {
    flex-direction: column;
    align-items: stretch;
  }

  .attendee-row {
    grid-template-columns: 1fr;
    align-items: flex-start;
  }
}
</style>
