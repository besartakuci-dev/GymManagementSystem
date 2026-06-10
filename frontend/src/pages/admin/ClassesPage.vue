<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import DataView from 'primevue/dataview'
import Dialog from 'primevue/dialog'
import Tag from 'primevue/tag'
import Button from 'primevue/button'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'
import {
  getClasses,
  createClass,
  updateClass,
  cancelClass,
  deleteClass,
  getClassBookingsById,
} from '@/api/classes'

const toast = useToast()
const confirm = useConfirm()

const classes = ref<any[]>([])
const classTypes = ref<any[]>([])
const trainers = ref<any[]>([])
const loading = ref(true)

// --- Filters / sort (client-side, presentation) ---
const search = ref('')
const statusFilter = ref('all')
const typeFilter = ref('all')
const trainerFilter = ref('all')
const sortOrder = ref<'desc' | 'asc'>('desc')

const typeOptions = computed(() => classTypes.value.map((t: any) => t.TypeName))
const trainerOptions = computed(() => trainers.value.map((t: any) => ({ id: String(t.TrainerID), name: t.TrainerName })))

const filtered = computed(() => {
  let list = classes.value.slice()
  const q = search.value.trim().toLowerCase()
  if (q) list = list.filter((c) => String(c.name ?? '').toLowerCase().includes(q))
  if (statusFilter.value !== 'all') list = list.filter((c) => c.status === statusFilter.value)
  if (typeFilter.value !== 'all') list = list.filter((c) => c.category === typeFilter.value)
  if (trainerFilter.value !== 'all') list = list.filter((c) => String(c.trainerId) === trainerFilter.value)
  list.sort((a, b) => {
    const da = `${a.date} ${a.startTime}`
    const db = `${b.date} ${b.startTime}`
    return sortOrder.value === 'asc' ? da.localeCompare(db) : db.localeCompare(da)
  })
  return list
})

// --- Display helpers (formatting only) ---
function ymd(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
function formatTime(time: string): string {
  if (!time) return ''
  const [hStr, mStr] = time.split(':')
  const h = Number(hStr)
  if (Number.isNaN(h)) return time
  const period = h >= 12 ? 'PM' : 'AM'
  const h12 = h % 12 === 0 ? 12 : h % 12
  return `${h12}:${mStr ?? '00'} ${period}`
}
function relativeDay(dateStr: string): string {
  if (!dateStr) return ''
  const today = new Date()
  const tomorrow = new Date(today)
  tomorrow.setDate(today.getDate() + 1)
  if (dateStr === ymd(today)) return 'Today'
  if (dateStr === ymd(tomorrow)) return 'Tomorrow'
  const d = new Date(`${dateStr}T00:00:00`)
  if (Number.isNaN(d.getTime())) return dateStr
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}
function formatWhen(c: any): string {
  const day = relativeDay(c.date)
  const start = formatTime(c.startTime)
  const end = formatTime(c.endTime)
  if (!start) return day
  return `${day} · ${start}${end ? '–' + end : ''}`
}
function occupancyPct(c: any): number {
  const cap = Number(c.maxCapacity) || 0
  const booked = Number(c.bookedCount) || 0
  if (cap <= 0) return 0
  return Math.min(100, Math.round((booked / cap) * 100))
}
// 'Active' (scheduled) is the default → no badge; only deviations show one.
function showStatusBadge(status: string): boolean {
  return !!status && status !== 'Active'
}
function statusSeverity(status: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
  if (status === 'Cancelled') return 'danger'
  if (status === 'Completed') return 'secondary'
  return 'info'
}

async function load() {
  loading.value = true
  try {
    const { data } = await getClasses()
    classes.value = data.data.classes ?? []
    classTypes.value = data.data.classTypes ?? []
    trainers.value = data.data.trainers ?? []
  } catch {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to load classes', life: 3000 })
  } finally {
    loading.value = false
  }
}

// --- Create / Edit dialog ---
const formVisible = ref(false)
const formMode = ref<'create' | 'edit'>('create')
const editingId = ref<number | null>(null)
const saving = ref(false)
const blankForm = () => ({
  name: '',
  category: classTypes.value[0]?.TypeName ?? '',
  date: '',
  startTime: '09:00',
  endTime: '10:00',
  room: 'Studio A',
  maxCapacity: 12,
  trainerId: '',
})
const form = ref(blankForm())

function openCreate() {
  formMode.value = 'create'
  editingId.value = null
  form.value = blankForm()
  formVisible.value = true
}
function openEdit(c: any) {
  formMode.value = 'edit'
  editingId.value = c.id
  form.value = {
    name: c.name ?? '',
    category: c.category ?? '',
    date: c.date ?? '',
    startTime: c.startTime ?? '09:00',
    endTime: c.endTime ?? '10:00',
    room: c.room ?? '',
    maxCapacity: Number(c.maxCapacity) || 1,
    trainerId: c.trainerId != null ? String(c.trainerId) : '',
  }
  formVisible.value = true
}

async function saveClass() {
  if (!form.value.trainerId) {
    toast.add({ severity: 'warn', summary: 'Trainer required', detail: 'Please select a trainer.', life: 3000 })
    return
  }
  saving.value = true
  const payload = {
    name: form.value.name,
    category: form.value.category,
    date: form.value.date,
    startTime: form.value.startTime,
    endTime: form.value.endTime,
    room: form.value.room,
    maxCapacity: Number(form.value.maxCapacity),
    trainerId: Number(form.value.trainerId),
  }
  try {
    if (formMode.value === 'create') {
      await createClass(payload)
      toast.add({ severity: 'success', summary: 'Class created', detail: form.value.name, life: 3000 })
    } else if (editingId.value != null) {
      await updateClass(editingId.value, payload)
      toast.add({ severity: 'success', summary: 'Class updated', detail: form.value.name, life: 3000 })
    }
    formVisible.value = false
    await load()
  } catch (e: any) {
    toast.add({
      severity: 'error',
      summary: formMode.value === 'create' ? 'Could not create class' : 'Could not update class',
      detail: e?.response?.data?.message || 'Check the details and try again.',
      life: 4000,
    })
  } finally {
    saving.value = false
  }
}

function confirmCancel(c: any) {
  confirm.require({
    header: 'Cancel this class?',
    message: `"${c.name}" will be marked cancelled. Members' existing bookings stay on record.`,
    icon: 'pi pi-exclamation-triangle',
    acceptProps: { label: 'Cancel class', severity: 'warn' },
    rejectProps: { label: 'Keep', severity: 'secondary', outlined: true },
    accept: async () => {
      try {
        await cancelClass(c.id)
        toast.add({ severity: 'success', summary: 'Class cancelled', detail: c.name, life: 3000 })
        await load()
      } catch (e: any) {
        toast.add({ severity: 'error', summary: 'Could not cancel', detail: e?.response?.data?.message || 'Try again.', life: 4000 })
      }
    },
  })
}

function confirmDelete(c: any) {
  confirm.require({
    header: 'Delete this class?',
    message: `"${c.name}" will be permanently deleted, along with its bookings. This cannot be undone.`,
    icon: 'pi pi-exclamation-triangle',
    acceptProps: { label: 'Delete', severity: 'danger' },
    rejectProps: { label: 'Cancel', severity: 'secondary', outlined: true },
    accept: async () => {
      try {
        await deleteClass(c.id)
        toast.add({ severity: 'success', summary: 'Class deleted', detail: c.name, life: 3000 })
        await load()
      } catch (e: any) {
        toast.add({ severity: 'error', summary: 'Could not delete', detail: e?.response?.data?.message || 'Try again.', life: 4000 })
      }
    },
  })
}

// --- Bookings drill-down dialog ---
const bookingsVisible = ref(false)
const bookingsLoading = ref(false)
const bookingsList = ref<any[]>([])
const bookingsClass = ref<any>(null)

async function openBookings(c: any) {
  bookingsClass.value = c
  bookingsList.value = []
  bookingsVisible.value = true
  bookingsLoading.value = true
  try {
    const { data } = await getClassBookingsById(c.id)
    bookingsList.value = data.data.bookings ?? []
  } catch {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Could not load bookings', life: 3000 })
  } finally {
    bookingsLoading.value = false
  }
}

onMounted(load)
</script>

<template>
  <div class="classes-page">
    <div class="page-header">
      <div>
        <h1>Classes</h1>
        <p>Create, edit, and manage all gym classes.</p>
      </div>
      <Button label="New class" icon="pi pi-plus" @click="openCreate" />
    </div>

    <!-- Toolbar: search + filters + sort -->
    <div class="toolbar">
      <span class="search-wrap">
        <i class="pi pi-search search-icon" />
        <input v-model="search" type="text" placeholder="Search classes…" class="ctl search-input" />
      </span>
      <select v-model="statusFilter" class="ctl">
        <option value="all">All statuses</option>
        <option value="Active">Active</option>
        <option value="Cancelled">Cancelled</option>
        <option value="Completed">Completed</option>
      </select>
      <select v-model="typeFilter" class="ctl">
        <option value="all">All types</option>
        <option v-for="t in typeOptions" :key="t" :value="t">{{ t }}</option>
      </select>
      <select v-model="trainerFilter" class="ctl">
        <option value="all">All trainers</option>
        <option v-for="t in trainerOptions" :key="t.id" :value="t.id">{{ t.name }}</option>
      </select>
      <select v-model="sortOrder" class="ctl">
        <option value="desc">Latest first</option>
        <option value="asc">Soonest first</option>
      </select>
      <span class="count">{{ filtered.length }} classes</span>
    </div>

    <!-- States -->
    <p v-if="loading && !classes.length" class="muted">Loading…</p>
    <p v-else-if="!filtered.length" class="muted">No classes match your filters.</p>

    <!-- Card grid -->
    <DataView v-else :value="filtered" :rows="9" paginator layout="list" dataKey="id" class="cv">
      <template #list="{ items }">
        <div class="grid">
          <article v-for="c in items" :key="c.id" class="card">
            <div class="card-top">
              <div class="title-block">
                <h3 class="name">{{ c.name }}</h3>
                <span v-if="c.category" class="type">{{ c.category }}</span>
              </div>
              <Tag v-if="showStatusBadge(c.status)" :value="c.status" :severity="statusSeverity(c.status)" class="tag" />
            </div>

            <p class="when"><i class="pi pi-calendar" /> {{ formatWhen(c) }}</p>

            <p class="meta">
              <span v-if="c.trainerName"><i class="pi pi-user" /> {{ c.trainerName }}</span>
              <span v-if="c.room"><i class="pi pi-map-marker" /> {{ c.room }}</span>
            </p>

            <div class="occ">
              <div class="occ-head">
                <span class="occ-count">{{ c.bookedCount }} / {{ c.maxCapacity }}</span>
                <span class="occ-label">booked</span>
              </div>
              <div class="bar"><div class="bar-fill" :style="{ width: occupancyPct(c) + '%' }" /></div>
            </div>

            <div class="actions">
              <Button v-if="c.status !== 'Cancelled'" label="Edit" icon="pi pi-pencil" size="small" outlined @click="openEdit(c)" />
              <Button label="Bookings" icon="pi pi-users" size="small" text @click="openBookings(c)" />
              <Button v-if="c.status === 'Active'" label="Cancel" icon="pi pi-ban" size="small" severity="warn" text @click="confirmCancel(c)" />
              <Button label="Delete" icon="pi pi-trash" size="small" severity="danger" text @click="confirmDelete(c)" />
            </div>
          </article>
        </div>
      </template>
    </DataView>

    <!-- Create / Edit dialog -->
    <Dialog v-model:visible="formVisible" modal :header="formMode === 'create' ? 'New class' : 'Edit class'" :style="{ width: '34rem' }">
      <form class="form" @submit.prevent="saveClass">
        <label class="field full">
          <span>Class name</span>
          <input v-model="form.name" type="text" placeholder="Morning Burn" class="ctl" required />
        </label>
        <label class="field">
          <span>Category</span>
          <select v-model="form.category" class="ctl" required>
            <option value="" disabled>Select type</option>
            <option v-for="t in typeOptions" :key="t" :value="t">{{ t }}</option>
          </select>
        </label>
        <label class="field">
          <span>Trainer</span>
          <select v-model="form.trainerId" class="ctl" required>
            <option value="" disabled>Select trainer</option>
            <option v-for="t in trainerOptions" :key="t.id" :value="t.id">{{ t.name }}</option>
          </select>
        </label>
        <label class="field">
          <span>Date</span>
          <input v-model="form.date" type="date" class="ctl" required />
        </label>
        <label class="field">
          <span>Room</span>
          <input v-model="form.room" type="text" placeholder="Studio A" class="ctl" required />
        </label>
        <label class="field">
          <span>Start time</span>
          <input v-model="form.startTime" type="time" class="ctl" required />
        </label>
        <label class="field">
          <span>End time</span>
          <input v-model="form.endTime" type="time" class="ctl" required />
        </label>
        <label class="field">
          <span>Capacity</span>
          <input v-model.number="form.maxCapacity" type="number" min="1" class="ctl" required />
        </label>
      </form>
      <template #footer>
        <Button label="Cancel" text severity="secondary" @click="formVisible = false" />
        <Button :label="formMode === 'create' ? 'Create class' : 'Save changes'" :loading="saving" @click="saveClass" />
      </template>
    </Dialog>

    <!-- Bookings drill-down -->
    <Dialog v-model:visible="bookingsVisible" modal :header="`Bookings — ${bookingsClass?.name ?? ''}`" :style="{ width: '30rem' }">
      <p v-if="bookingsLoading" class="muted">Loading…</p>
      <p v-else-if="!bookingsList.length" class="muted">No one has booked this class yet.</p>
      <ul v-else class="bk-list">
        <li v-for="bk in bookingsList" :key="bk.BookingID" class="bk-row">
          <div class="bk-avatar">{{ (bk.FirstName?.[0] ?? '') + (bk.LastName?.[0] ?? '') }}</div>
          <div class="bk-info">
            <span class="bk-name">{{ bk.FirstName }} {{ bk.LastName }}</span>
            <span class="bk-email">{{ bk.Email }}</span>
          </div>
        </li>
      </ul>
    </Dialog>
  </div>
</template>

<style scoped>
.classes-page {
  max-width: 1100px;
}

.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

h1 {
  font-size: 1.75rem;
  font-weight: 800;
  color: var(--gym-text);
  margin-bottom: 0.25rem;
}

.page-header p {
  color: var(--gym-text-muted);
  font-size: 0.9rem;
}

/* Toolbar */
.toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.6rem;
  margin-bottom: 1.5rem;
}

.ctl {
  background: var(--gym-surface);
  border: 1px solid var(--gym-border);
  border-radius: 6px;
  color: var(--gym-text);
  padding: 0.5rem 0.65rem;
  font-size: 0.875rem;
  outline: none;
  transition: border-color 0.15s;
}

.ctl:focus {
  border-color: var(--gym-orange);
}

.search-wrap {
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 0.7rem;
  color: var(--gym-text-muted);
  font-size: 0.85rem;
  pointer-events: none;
}

.search-input {
  padding-left: 2rem;
  width: 220px;
}

.count {
  margin-left: auto;
  font-size: 0.8rem;
  color: var(--gym-text-muted);
}

.muted {
  color: var(--gym-text-muted);
  font-size: 0.9rem;
  padding: 1rem 0;
}

/* Card grid */
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(290px, 1fr));
  gap: 1rem;
  width: 100%;
}

.card {
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
  padding: 1.1rem 1.2rem;
  background: var(--gym-surface-raised);
  border: 1px solid var(--gym-border);
  border-left: 3px solid var(--gym-orange);
  border-radius: 14px;
  transition: transform 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease;
}

.card:hover {
  transform: translateY(-2px);
  border-color: var(--gym-orange);
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.35);
}

.card-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem;
}

.title-block {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  min-width: 0;
}

.name {
  font-size: 1.15rem;
  font-weight: 700;
  line-height: 1.25;
  color: var(--gym-text);
}

.type {
  font-size: 0.76rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--gym-text-muted);
}

.tag {
  flex-shrink: 0;
  text-transform: capitalize;
}

.when {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--gym-text);
}

.when i {
  color: var(--gym-orange);
  font-size: 0.9rem;
}

.meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem 1rem;
  font-size: 0.82rem;
  color: var(--gym-text-muted);
}

.meta span {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
}

.meta i {
  font-size: 0.82rem;
  opacity: 0.8;
}

.occ {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.occ-head {
  display: flex;
  align-items: baseline;
  gap: 0.4rem;
}

.occ-count {
  font-size: 1.05rem;
  font-weight: 800;
  color: var(--gym-orange);
}

.occ-label {
  font-size: 0.78rem;
  color: var(--gym-text-muted);
}

.bar {
  height: 6px;
  border-radius: 999px;
  background: var(--gym-border);
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  border-radius: 999px;
  background: var(--gym-orange);
  transition: width 0.3s ease;
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
  margin-top: 0.25rem;
  padding-top: 0.6rem;
  border-top: 1px solid var(--gym-border);
}

/* Form dialog */
.form {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--gym-text);
}

.field.full {
  grid-column: 1 / -1;
}

/* Bookings list */
.bk-list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  margin: 0;
  padding: 0;
}

.bk-row {
  display: flex;
  align-items: center;
  gap: 0.7rem;
}

.bk-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--gym-orange-subtle);
  color: var(--gym-orange);
  font-size: 0.75rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  text-transform: uppercase;
}

.bk-info {
  display: flex;
  flex-direction: column;
}

.bk-name {
  color: var(--gym-text);
  font-size: 0.9rem;
}

.bk-email {
  color: var(--gym-text-muted);
  font-size: 0.8rem;
}

/* DataView reset */
.cv :deep(.p-dataview),
.cv :deep(.p-dataview-content) {
  background: transparent;
  border: none;
}

.cv :deep(.p-paginator) {
  background: transparent;
  margin-top: 1.25rem;
}

@media (max-width: 560px) {
  .form {
    grid-template-columns: 1fr;
  }

  .page-header {
    flex-direction: column;
  }
}
</style>
