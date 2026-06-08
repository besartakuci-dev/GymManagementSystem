<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import Tag from 'primevue/tag'
import { getDashboard, getClassBookings, getUsers} from '@/api/admin'
import { getClasses, createClass, cancelClass } from '@/api/classes'
import api from '@/api/axios'

const router = useRouter()
const toast = useToast()

const stats = ref<any>(null)
const users = ref<any[]>([])
const classBookings = ref<any[]>([])
const schedules = ref<any[]>([])
const trainers = ref<any[]>([])
const classTypes = ref<any[]>([])
const loading = ref(true)
const savingSchedule = ref(false)

const statCards = [
  { key: 'totalMembers',      label: 'Total Members',      icon: 'pi pi-users' },
  { key: 'activeMemberships', label: 'Active Memberships', icon: 'pi pi-id-card' },
  { key: 'upcomingClasses',   label: 'Upcoming Classes',   icon: 'pi pi-calendar' },
  { key: 'totalBookings',     label: 'Total Bookings',     icon: 'pi pi-bookmark' },
]

const scheduleForm = ref({
  name: '',
  category: '' as string,
  date: '',
  startTime: '09:00',
  endTime: '10:00',
  room: 'Studio A',
  maxCapacity: 12,
  trainerId: 0,
})

function resetScheduleForm() {
  scheduleForm.value = {
    name: '', category: classTypes.value[0]?.TypeName ?? '', date: '',
    startTime: '09:00', endTime: '10:00',
    room: 'Studio A', maxCapacity: 12, trainerId: 0,
  }
}

async function loadAll() {
  loading.value = true
  try {
    const [dashRes, usersRes, bookingsRes, classesRes, typesRes] = await Promise.all([
      getDashboard(),
      getUsers(),
      getClassBookings(),
      getClasses(),
      api.get('/class-types'),
    ])
    stats.value         = dashRes.data.data
    users.value         = usersRes.data.data.users
    classBookings.value = bookingsRes.data.data.classBookings ?? []
    schedules.value     = classesRes.data.data.classes ?? []
    trainers.value      = classesRes.data.data.trainers ?? []
    classTypes.value    = typesRes.data.data ?? []
    if (!scheduleForm.value.category && classTypes.value.length) {
      scheduleForm.value.category = classTypes.value[0].TypeName
    }
  } catch {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to load dashboard data', life: 3000 })
  } finally {
    loading.value = false
  }
}

async function addSchedule() {
  if (!scheduleForm.value.trainerId) {
    toast.add({ severity: 'warn', summary: 'Trainer required', detail: 'Please select a trainer.', life: 3000 })
    return
  }
  savingSchedule.value = true
  try {
    await createClass({
      name:        scheduleForm.value.name,
      category:    scheduleForm.value.category,
      date:        scheduleForm.value.date,
      startTime:   scheduleForm.value.startTime,
      endTime:     scheduleForm.value.endTime,
      room:        scheduleForm.value.room,
      maxCapacity: Number(scheduleForm.value.maxCapacity),
      trainerId:   Number(scheduleForm.value.trainerId),
    })
    toast.add({ severity: 'success', summary: 'Schedule added', detail: 'New class schedule created.', life: 3000 })
    resetScheduleForm()
    await loadAll()
  } catch (e: any) {
    toast.add({ severity: 'error', summary: 'Could not add schedule', detail: e?.response?.data?.message || 'Check the details and try again.', life: 4000 })
  } finally {
    savingSchedule.value = false
  }
}

async function removeSchedule(classId: number) {
  try {
    await cancelClass(classId)
    toast.add({ severity: 'success', summary: 'Removed', detail: 'Class schedule cancelled.', life: 3000 })
    await loadAll()
  } catch (e: any) {
    toast.add({ severity: 'error', summary: 'Could not remove', detail: e?.response?.data?.message || 'Unable to remove schedule.', life: 4000 })
  }
}

function roleSeverity(role: string) {
  if (role === 'admin')   return 'danger'
  if (role === 'trainer') return 'warn'
  return 'secondary'
}

onMounted(loadAll)
</script>

<template>
  <div class="dashboard">

    <h1>Dashboard</h1>

    <!-- Stats -->
    <div class="stats-grid">
      <div v-for="s in statCards" :key="s.key" class="stat-card">
        <i :class="s.icon" class="stat-icon" />
        <div>
          <p class="stat-value">{{ stats ? stats[s.key] ?? 0 : '—' }}</p>
          <p class="stat-label">{{ s.label }}</p>
        </div>
      </div>
    </div>

    <!-- Schedule management -->
    <div class="section">
      <div class="section-header">
        <h2>Schedule Management</h2>
        <Button label="Refresh" icon="pi pi-refresh" size="small" severity="secondary" @click="loadAll" />
      </div>

      <!-- Add form card -->
      <div class="card">
        <p class="card-label">Add New Schedule</p>
        <form class="schedule-form" @submit.prevent="addSchedule">
          <label class="field">
            <span>Class name</span>
            <input v-model="scheduleForm.name" type="text" placeholder="Morning Burn" required />
          </label>
          <label class="field">
            <span>Category</span>
            <select v-model="scheduleForm.category" required>
              <option value="" disabled>Select type</option>
              <option v-for="t in classTypes" :key="t.ClassTypeID" :value="t.TypeName">
                {{ t.TypeName }}
              </option>
            </select>
          </label>
          <label class="field">
            <span>Date</span>
            <input v-model="scheduleForm.date" type="date" required />
          </label>
          <label class="field">
            <span>Start time</span>
            <input v-model="scheduleForm.startTime" type="time" required />
          </label>
          <label class="field">
            <span>End time</span>
            <input v-model="scheduleForm.endTime" type="time" required />
          </label>
          <label class="field">
            <span>Room</span>
            <input v-model="scheduleForm.room" type="text" placeholder="Studio A" required />
          </label>
          <label class="field">
            <span>Capacity</span>
            <input v-model.number="scheduleForm.maxCapacity" type="number" min="1" required />
          </label>
          <label class="field">
            <span>Trainer</span>
            <select v-model.number="scheduleForm.trainerId" required>
              <option :value="0" disabled>Select trainer</option>
              <option v-for="t in trainers" :key="t.TrainerID" :value="t.TrainerID">
                {{ t.TrainerName }}
              </option>
            </select>
          </label>
          <div class="form-submit">
            <Button label="Add Schedule" icon="pi pi-plus" type="submit" :loading="savingSchedule" />
          </div>
        </form>
      </div>

      <!-- Existing schedules card -->
      <div class="card">
        <p class="card-label">Existing Schedules</p>
        <div v-if="schedules.length" class="schedule-list">
          <article v-for="item in schedules" :key="item.id" class="schedule-item">
            <div>
              <p class="schedule-title">{{ item.name }}</p>
              <p class="schedule-meta">{{ item.category }} • {{ item.date }} • {{ item.startTime }}–{{ item.endTime }}</p>
              <p class="schedule-meta">Room {{ item.room }} • Capacity {{ item.maxCapacity }} • {{ item.trainerName || 'Trainer not set' }}</p>
            </div>
            <Button label="Remove" icon="pi pi-trash" severity="danger" size="small" @click="removeSchedule(item.id)" />
          </article>
        </div>
        <p v-else-if="!loading" class="empty">No schedules yet.</p>
      </div>
    </div>

    <!-- Class bookings -->
    <div class="section">
      <div class="section-header">
        <h2>Class Bookings</h2>
      </div>
      <DataTable :value="classBookings" :loading="loading" stripedRows paginator :rows="5" class="data-table">
        <Column field="ClassName"   header="Class" />
        <Column field="Room"        header="Room" />
        <Column field="Status"      header="Status" />
        <Column field="MaxCapacity" header="Capacity" />
        <Column field="BookedUsers" header="Booked Users" />
      </DataTable>
    </div>

    <!-- Users -->
    <!-- <div class="section">
      <div class="section-header">
        <h2>All Users</h2>
        <Button label="Create User" icon="pi pi-plus" size="small" @click="router.push('/admin/users/create')" />
      </div>
      <DataTable :value="users" :loading="loading" stripedRows paginator :rows="10" class="data-table">
        <Column field="FirstName" header="First Name" sortable />
        <Column field="LastName"  header="Last Name"  sortable />
        <Column field="Email"     header="Email"      sortable />
        <Column field="Role"      header="Role"       sortable>
          <template #body="{ data }">
            <Tag :value="data.Role" :severity="roleSeverity(data.Role)" />
          </template>
        </Column>
        <Column field="JoinDate" header="Joined" sortable>
          <template #body="{ data }">
            {{ new Date(data.JoinDate).toLocaleDateString() }}
          </template>
        </Column>
        <Column field="IsActive" header="Status">
          <template #body="{ data }">
            <Tag :value="data.IsActive ? 'Active' : 'Inactive'" :severity="data.IsActive ? 'success' : 'danger'" />
          </template>
        </Column>
      </DataTable>
    </div> -->

  </div>
</template>

<style scoped>
.dashboard { max-width: 1100px; }

h1 {
  font-size: 1.75rem;
  font-weight: 800;
  color: var(--gym-text);
  margin-bottom: 1.75rem;
}

/* Stats */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 2.5rem;
}

.stat-card {
  background: var(--gym-surface-raised);
  border: 1px solid var(--gym-border);
  border-radius: 10px;
  padding: 1.25rem 1.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
}

.stat-icon {
  font-size: 1.6rem;
  color: var(--gym-orange);
}

.stat-value {
  font-size: 1.6rem;
  font-weight: 800;
  color: var(--gym-text);
  line-height: 1;
}

.stat-label {
  font-size: 0.8rem;
  color: var(--gym-text-muted);
  margin-top: 0.2rem;
}

/* Sections */
.section {
  margin-bottom: 2.5rem;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
}

h2 {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--gym-text);
}

/* Cards */
.card {
  background: var(--gym-surface-raised);
  border: 1px solid var(--gym-border);
  border-radius: 10px;
  padding: 1.25rem 1.5rem;
  margin-bottom: 1rem;
}

.card-label {
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--gym-text-muted);
  margin-bottom: 1rem;
}

/* Schedule form */
.schedule-form {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 0.75rem;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--gym-text);
}

.field input,
.field select {
  background: var(--gym-surface);
  border: 1px solid var(--gym-border);
  border-radius: 6px;
  color: var(--gym-text);
  padding: 0.5rem 0.65rem;
  font-size: 0.875rem;
  outline: none;
  transition: border-color 0.15s;
}

.field input:focus,
.field select:focus {
  border-color: var(--gym-orange);
}

.field select option {
  background: var(--gym-surface);
}

.form-submit {
  display: flex;
  align-items: flex-end;
}

/* Schedule list */
.schedule-list {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.schedule-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem 0;
  border-bottom: 1px solid var(--gym-border);
}

.schedule-item:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.schedule-title {
  font-weight: 700;
  color: var(--gym-orange);
  margin-bottom: 0.2rem;
  font-size: 0.9rem;
}

.schedule-meta {
  font-size: 0.8rem;
  color: var(--gym-text-muted);
}

.empty {
  color: var(--gym-text-muted);
  font-size: 0.875rem;
}

/* Tables */
.data-table {
  background: var(--gym-surface-raised) !important;
  border: 1px solid var(--gym-border) !important;
  border-radius: 8px;
}

@media (max-width: 600px) {
  .schedule-form {
    grid-template-columns: 1fr;
  }

  .schedule-item {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
