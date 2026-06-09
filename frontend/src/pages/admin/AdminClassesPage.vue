<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import Button from 'primevue/button'
import Tag from 'primevue/tag'
import { cancelClass, createClass, getClasses, updateClass, type ClassPayload } from '@/api/classes'
import api from '@/api/axios'

interface Trainer {
  TrainerID: number
  TrainerName?: string
  FullName?: string
  Name?: string
}

interface ClassType {
  ClassTypeID: number
  TypeName: string
}

interface GymClass {
  id: number
  ClassID: number
  name: string
  category: string
  date: string
  dayOfWeek?: string
  startTime: string
  endTime: string
  room: string
  maxCapacity: number
  bookedCount: number
  spotsLeft: number
  trainerId: number
  TrainerID?: number
  trainerName?: string
  Status: 'scheduled' | 'cancelled' | 'completed'
  status: string
}

const classes = ref<GymClass[]>([])
const trainers = ref<Trainer[]>([])
const classTypes = ref<ClassType[]>([])
const loading = ref(false)
const saving = ref(false)
const cancelling = ref(false)
const editingId = ref<number | null>(null)
const cancelTarget = ref<GymClass | null>(null)
const error = ref('')
const notice = ref('')

const form = reactive<ClassPayload>({
  name: '',
  category: '',
  date: '',
  startTime: '09:00',
  endTime: '10:00',
  room: 'Studio A',
  maxCapacity: 12,
  trainerId: undefined,
})

const isEditing = computed(() => editingId.value !== null)
const activeClasses = computed(() => classes.value.filter((item) => item.Status === 'scheduled'))

function trainerLabel(trainer: Trainer) {
  return trainer.TrainerName || trainer.FullName || trainer.Name || `Trainer ${trainer.TrainerID}`
}

function resetForm() {
  editingId.value = null
  form.name = ''
  form.category = classTypes.value[0]?.TypeName ?? ''
  form.date = ''
  form.startTime = '09:00'
  form.endTime = '10:00'
  form.room = 'Studio A'
  form.maxCapacity = 12
  form.trainerId = trainers.value[0]?.TrainerID
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
  form.trainerId = gymClass.trainerId ?? gymClass.TrainerID
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function openCancelModal(gymClass: GymClass) {
  cancelTarget.value = gymClass
  error.value = ''
  notice.value = ''
}

function closeCancelModal() {
  cancelTarget.value = null
}

function statusSeverity(status: string) {
  if (status === 'scheduled' || status === 'Active') return 'success'
  if (status === 'cancelled' || status === 'Cancelled') return 'danger'
  return 'secondary'
}

async function loadClasses() {
  loading.value = true
  error.value = ''

  try {
    const [classesRes, typesRes] = await Promise.all([
      getClasses(),
      api.get('/class-types'),
    ])

    classes.value = classesRes.data.data.classes ?? []
    trainers.value = classesRes.data.data.trainers ?? []
    classTypes.value = typesRes.data.data.classTypes ?? typesRes.data.data ?? []

    if (!form.category) form.category = classTypes.value[0]?.TypeName ?? ''
    if (!form.trainerId) form.trainerId = trainers.value[0]?.TrainerID
  } catch (e: any) {
    error.value = e?.response?.data?.message || 'Could not load classes.'
  } finally {
    loading.value = false
  }
}

async function saveClass() {
  error.value = ''
  notice.value = ''

  if (!form.trainerId) {
    error.value = 'Please select a trainer.'
    return
  }

  saving.value = true
  try {
    const payload = {
      ...form,
      maxCapacity: Number(form.maxCapacity),
      trainerId: Number(form.trainerId),
    }

    if (isEditing.value && editingId.value !== null) {
      await updateClass(editingId.value, payload)
      notice.value = 'Class updated.'
    } else {
      await createClass(payload)
      notice.value = 'Class created.'
    }

    await loadClasses()
    resetForm()
  } catch (e: any) {
    error.value = e?.response?.data?.message || 'Could not save class.'
  } finally {
    saving.value = false
  }
}

async function cancelSchedule() {
  if (!cancelTarget.value) return

  error.value = ''
  notice.value = ''
  cancelling.value = true

  try {
    await cancelClass(cancelTarget.value.id)
    notice.value = 'Class cancelled.'
    closeCancelModal()
    await loadClasses()
  } catch (e: any) {
    error.value = e?.response?.data?.message || 'Could not cancel class.'
  } finally {
    cancelling.value = false
  }
}

onMounted(loadClasses)
</script>

<template>
  <div class="classes-page">
    <div class="page-header">
      <div>
        <p class="eyebrow">Classes</p>
        <h1>Manage Classes</h1>
        <p>Add new classes and manage the existing schedule.</p>
      </div>
      <Button label="Refresh" icon="pi pi-refresh" severity="secondary" size="small" @click="loadClasses" />
    </div>

    <section class="stats-grid">
      <div class="stat-card">
        <span>Total Classes</span>
        <strong>{{ classes.length }}</strong>
      </div>
      <div class="stat-card">
        <span>Active</span>
        <strong>{{ activeClasses.length }}</strong>
      </div>
    </section>

    <section class="card">
      <div class="card-header">
        <div>
          <p class="card-label">{{ isEditing ? 'Edit class' : 'Create class' }}</p>
          <h2>{{ isEditing ? 'Update Class' : 'Add Class' }}</h2>
        </div>
        <Button v-if="isEditing" label="New" icon="pi pi-plus" severity="secondary" size="small" @click="resetForm" />
      </div>

      <form class="class-form" @submit.prevent="saveClass">
        <label class="field">
          <span>Class name</span>
          <input v-model="form.name" type="text" placeholder="Morning Yoga" required />
        </label>

        <label class="field">
          <span>Type</span>
          <select v-model="form.category" required>
            <option value="" disabled>Select type</option>
            <option v-for="type in classTypes" :key="type.ClassTypeID" :value="type.TypeName">
              {{ type.TypeName }}
            </option>
          </select>
        </label>

        <label class="field">
          <span>Trainer</span>
          <select v-model.number="form.trainerId" required>
            <option :value="undefined" disabled>Select trainer</option>
            <option v-for="trainer in trainers" :key="trainer.TrainerID" :value="trainer.TrainerID">
              {{ trainerLabel(trainer) }}
            </option>
          </select>
        </label>

        <label class="field">
          <span>Date</span>
          <input v-model="form.date" type="date" required />
        </label>

        <label class="field">
          <span>Start time</span>
          <input v-model="form.startTime" type="time" required />
        </label>

        <label class="field">
          <span>End time</span>
          <input v-model="form.endTime" type="time" required />
        </label>

        <label class="field">
          <span>Room</span>
          <input v-model="form.room" type="text" placeholder="Studio A" required />
        </label>

        <label class="field">
          <span>Capacity</span>
          <input v-model.number="form.maxCapacity" type="number" min="1" max="100" required />
        </label>

        <div class="form-actions">
          <Button :label="saving ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Class'" icon="pi pi-save" type="submit" :loading="saving" />
          <Button v-if="isEditing" label="Cancel Edit" severity="secondary" type="button" @click="resetForm" />
        </div>
      </form>
    </section>

    <section class="alerts">
      <p v-if="error" class="alert error">{{ error }}</p>
      <p v-if="notice" class="alert success">{{ notice }}</p>
    </section>

    <section class="card">
      <div class="card-header">
        <div>
          <p class="card-label">Existing classes</p>
          <h2>Current Schedule</h2>
        </div>
      </div>

      <p v-if="loading" class="empty">Loading classes...</p>
      <p v-else-if="classes.length === 0" class="empty">No classes found.</p>

      <div v-else class="class-list">
        <article v-for="gymClass in classes" :key="gymClass.id" class="class-row">
          <div class="class-main">
            <p class="class-title">{{ gymClass.name }}</p>
            <p class="class-meta">
              {{ gymClass.category }} · {{ gymClass.date }} · {{ gymClass.startTime }}-{{ gymClass.endTime }}
            </p>
            <p class="class-meta">
              {{ gymClass.trainerName || 'Trainer not set' }} · {{ gymClass.room }} · {{ gymClass.bookedCount }} / {{ gymClass.maxCapacity }} booked
            </p>
          </div>

          <div class="row-actions">
            <Tag :value="gymClass.status" :severity="statusSeverity(gymClass.status || gymClass.Status)" />
            <Button label="Edit" icon="pi pi-pencil" severity="secondary" size="small" :disabled="gymClass.Status === 'cancelled'" @click="editClass(gymClass)" />
            <Button label="Cancel" icon="pi pi-ban" severity="danger" size="small" :disabled="gymClass.Status === 'cancelled'" @click="openCancelModal(gymClass)" />
          </div>
        </article>
      </div>
    </section>

    <div v-if="cancelTarget" class="modal-backdrop" role="presentation">
      <div class="confirm-modal" role="dialog" aria-modal="true" aria-labelledby="cancel-class-title">
        <p class="eyebrow">Cancel class</p>
        <h2 id="cancel-class-title">Are you sure?</h2>
        <p>
          Are you sure you want to cancel {{ cancelTarget.name }} on {{ cancelTarget.date }}?
          Members will no longer be able to book this class.
        </p>

        <div class="modal-actions">
          <Button label="Keep Class" severity="secondary" type="button" @click="closeCancelModal" />
          <Button
            :label="cancelling ? 'Cancelling...' : 'Cancel Class'"
            icon="pi pi-ban"
            severity="danger"
            type="button"
            :loading="cancelling"
            @click="cancelSchedule"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.classes-page {
  max-width: 1100px;
}

.page-header,
.card-header,
.class-row,
.row-actions {
  display: flex;
  align-items: center;
}

.page-header {
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.eyebrow,
.card-label {
  color: var(--gym-orange);
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  margin: 0 0 0.35rem;
  text-transform: uppercase;
}

h1,
h2,
p {
  margin: 0;
}

h1 {
  color: var(--gym-text);
  font-size: 1.8rem;
}

h2 {
  color: var(--gym-text);
  font-size: 1.1rem;
}

.page-header p:last-child,
.class-meta,
.empty {
  color: var(--gym-text-muted);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 1rem;
  margin-bottom: 1rem;
}

.stat-card,
.card {
  background: var(--gym-surface-raised);
  border: 1px solid var(--gym-border);
  border-radius: 10px;
}

.stat-card {
  padding: 1rem 1.25rem;
}

.stat-card span {
  color: var(--gym-text-muted);
  display: block;
  font-size: 0.78rem;
  font-weight: 700;
  margin-bottom: 0.4rem;
  text-transform: uppercase;
}

.stat-card strong {
  color: var(--gym-orange);
  font-size: 1.8rem;
}

.card {
  margin-bottom: 1rem;
  padding: 1.25rem;
}

.card-header {
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1rem;
}

.class-form {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 0.85rem;
}

.field {
  color: var(--gym-text);
  display: flex;
  flex-direction: column;
  font-size: 0.82rem;
  font-weight: 700;
  gap: 0.35rem;
}

.field input,
.field select {
  background: var(--gym-surface);
  border: 1px solid var(--gym-border);
  border-radius: 6px;
  color: var(--gym-text);
  font-size: 0.875rem;
  outline: none;
  padding: 0.55rem 0.65rem;
}

.field input:focus,
.field select:focus {
  border-color: var(--gym-orange);
}

.field select option {
  background: var(--gym-surface);
}

.form-actions {
  align-items: end;
  display: flex;
  gap: 0.6rem;
}

.alerts {
  display: grid;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.alert {
  border-radius: 8px;
  font-size: 0.9rem;
  padding: 0.75rem 0.9rem;
}

.alert.error {
  background: rgba(255, 64, 64, 0.12);
  color: #ff8b8b;
}

.alert.success {
  background: rgba(46, 204, 113, 0.12);
  color: #8ff0b4;
}

.class-list {
  display: grid;
  gap: 0.75rem;
}

.class-row {
  border-bottom: 1px solid var(--gym-border);
  gap: 1rem;
  justify-content: space-between;
  padding: 0.85rem 0;
}

.class-row:last-child {
  border-bottom: 0;
  padding-bottom: 0;
}

.class-title {
  color: var(--gym-orange);
  font-weight: 800;
  margin-bottom: 0.25rem;
}

.class-meta {
  font-size: 0.82rem;
  line-height: 1.5;
}

.row-actions {
  flex-wrap: wrap;
  gap: 0.5rem;
  justify-content: flex-end;
}

.empty {
  font-size: 0.9rem;
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

.confirm-modal {
  width: min(430px, 100%);
  border: 1px solid rgba(249, 115, 22, 0.22);
  border-radius: 10px;
  background: var(--gym-surface-raised);
  box-shadow: 0 22px 50px rgba(0, 0, 0, 0.5);
  padding: 1.35rem;
}

.confirm-modal h2 {
  margin-bottom: 0.65rem;
}

.confirm-modal p:not(.eyebrow) {
  color: var(--gym-text-muted);
  line-height: 1.55;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.65rem;
  margin-top: 1.25rem;
}

@media (max-width: 720px) {
  .page-header,
  .class-row {
    align-items: flex-start;
    flex-direction: column;
  }

  .row-actions {
    justify-content: flex-start;
  }

  .modal-actions {
    flex-direction: column;
  }
}
</style>
