<template>
  <section class="admin-dashboard">
    <div class="hero">
      <p class="eyebrow">Admin Area</p>
      <h1>Admin Dashboard</h1>
      <p>Total members, active memberships, upcoming classes and bookings per class.</p>
    </div>

    <div class="cards">
      <div class="card">
        <span>Total Members</span>
        <h2>{{ stats.totalMembers }}</h2>
      </div>

      <div class="card">
        <span>Active Memberships</span>
        <h2>{{ stats.activeMemberships }}</h2>
      </div>

      <div class="card">
        <span>Upcoming Classes</span>
        <h2>{{ stats.upcomingClasses }}</h2>
      </div>

      <div class="card">
        <span>Total Bookings</span>
        <h2>{{ stats.totalBookings }}</h2>
      </div>
    </div>

    <div class="table-card schedule-card">
      <div class="table-header">
        <div>
          <p class="eyebrow">Schedule Management</p>
          <h2>Add or remove class schedules</h2>
        </div>

        <Button label="Refresh" icon="pi pi-refresh" @click="loadDashboard" />
      </div>

      <form class="schedule-form" @submit.prevent="addSchedule">
        <label>
          Class name
          <input v-model="scheduleForm.name" type="text" placeholder="Morning Burn" required />
        </label>
        <label>
          Category
          <select v-model="scheduleForm.category" required>
            <option value="Yoga">Yoga</option>
            <option value="Pilates">Pilates</option>
          </select>
        </label>
        <label>
          Date
          <input v-model="scheduleForm.date" type="date" required />
        </label>
        <label>
          Start time
          <input v-model="scheduleForm.startTime" type="time" required />
        </label>
        <label>
          End time
          <input v-model="scheduleForm.endTime" type="time" required />
        </label>
        <label>
          Room
          <input v-model="scheduleForm.room" type="text" placeholder="Studio A" required />
        </label>
        <label>
          Capacity
          <input v-model.number="scheduleForm.maxCapacity" type="number" min="1" required />
        </label>
        <label>
          Trainer
          <select v-model.number="scheduleForm.trainerId" required>
            <option :value="0" disabled>Select trainer</option>
            <option v-for="trainer in trainers" :key="trainer.TrainerID" :value="trainer.TrainerID">
              {{ trainer.FullName || trainer.Name || `Trainer ${trainer.TrainerID}` }}
            </option>
          </select>
        </label>

        <Button label="Add Schedule" icon="pi pi-plus" type="submit" :loading="savingSchedule" />
      </form>

      <div class="schedule-list">
        <article v-for="item in schedules" :key="item.id" class="schedule-item">
          <div>
            <p class="schedule-title">{{ item.name }}</p>
            <p class="schedule-meta">{{ item.category }} • {{ item.date }} • {{ item.startTime }}–{{ item.endTime }}</p>
            <p class="schedule-meta">Room {{ item.room }} • Capacity {{ item.maxCapacity }} • {{ item.trainerName || 'Trainer not set' }}</p>
          </div>
          <Button label="Remove" icon="pi pi-trash" severity="danger" @click="removeSchedule(item.id)" />
        </article>
      </div>
    </div>

    <div class="table-card">
      <div class="table-header">
        <div>
          <p class="eyebrow">Bookings</p>
          <h2>Users Booking Classes</h2>
        </div>

        <Button label="Refresh" icon="pi pi-refresh" @click="loadDashboard" />
      </div>

      <DataTable
        :value="classBookings"
        :loading="loading"
        paginator
        :rows="5"
        stripedRows
        responsiveLayout="scroll"
      >
        <Column field="ClassName" header="Class" />
        <Column field="Room" header="Room" />
        <Column field="Status" header="Status" />
        <Column field="MaxCapacity" header="Capacity" />
        <Column field="BookedUsers" header="Booked Users" />
      </DataTable>
    </div>
  </section>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useToast } from 'primevue/usetoast'
import Button from 'primevue/button'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import api from '@/api/axios'
import { cancelClass, createClass } from '@/api/classes'

const toast = useToast()
const loading = ref(false)
const savingSchedule = ref(false)

const stats = ref({
  totalMembers: 0,
  activeMemberships: 0,
  upcomingClasses: 0,
  totalBookings: 0,
})

const classBookings = ref<any[]>([])
const schedules = ref<any[]>([])
const trainers = ref<any[]>([])

const scheduleForm = ref<{
  name: string
  category: 'Yoga' | 'Pilates'
  date: string
  startTime: string
  endTime: string
  room: string
  maxCapacity: number
  trainerId: number
}>({
  name: '',
  category: 'Yoga',
  date: '',
  startTime: '09:00',
  endTime: '10:00',
  room: 'Studio A',
  maxCapacity: 12,
  trainerId: 0,
})

async function loadDashboard() {
  try {
    loading.value = true

    const [statsResponse, bookingsResponse, classesResponse] = await Promise.all([
      api.get('/admin/dashboard'),
      api.get('/admin/class-bookings'),
      api.get('/classes'),
    ])

    stats.value = statsResponse.data.data
    classBookings.value = bookingsResponse.data.data.classBookings
    schedules.value = classesResponse.data.data.classes ?? []
    trainers.value = classesResponse.data.data.trainers ?? []

    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: 'Admin dashboard loaded successfully',
      life: 2500,
    })
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to load admin dashboard',
      life: 3000,
    })
  } finally {
    loading.value = false
  }
}

async function addSchedule() {
  if (!scheduleForm.value.trainerId) {
    toast.add({ severity: 'warn', summary: 'Trainer required', detail: 'Please select a trainer for this schedule.', life: 3000 })
    return
  }

  try {
    savingSchedule.value = true

    await createClass({
      name: scheduleForm.value.name,
      category: scheduleForm.value.category,
      date: scheduleForm.value.date,
      startTime: scheduleForm.value.startTime,
      endTime: scheduleForm.value.endTime,
      room: scheduleForm.value.room,
      maxCapacity: Number(scheduleForm.value.maxCapacity),
      trainerId: Number(scheduleForm.value.trainerId),
    })

    toast.add({ severity: 'success', summary: 'Schedule added', detail: 'The new class schedule has been created.', life: 3000 })
    await loadDashboard()
    scheduleForm.value = {
      name: '',
      category: 'Yoga',
      date: '',
      startTime: '09:00',
      endTime: '10:00',
      room: 'Studio A',
      maxCapacity: 12,
      trainerId: 0,
    }
  } catch (error: any) {
    toast.add({
      severity: 'error',
      summary: 'Could not add schedule',
      detail: error?.response?.data?.message || 'Please check the schedule details and try again.',
      life: 4000,
    })
  } finally {
    savingSchedule.value = false
  }
}

async function removeSchedule(classId: number) {
  try {
    await cancelClass(classId)
    toast.add({ severity: 'success', summary: 'Schedule removed', detail: 'The class schedule has been cancelled.', life: 3000 })
    await loadDashboard()
  } catch (error: any) {
    toast.add({
      severity: 'error',
      summary: 'Could not remove schedule',
      detail: error?.response?.data?.message || 'Unable to remove the selected schedule.',
      life: 4000,
    })
  }
}

onMounted(() => {
  loadDashboard()
})
</script>

<style scoped>
.admin-dashboard {
  min-height: 100vh;
  padding: 70px 8%;
  background:
    radial-gradient(circle at top right, rgba(255, 115, 35, 0.16), transparent 35%),
    #050505;
  color: white;
}

.hero {
  max-width: 850px;
  margin-bottom: 45px;
}

.eyebrow {
  color: #ff8a2a;
  text-transform: uppercase;
  letter-spacing: 3px;
  font-size: 13px;
  font-weight: 800;
}

.hero h1 {
  font-size: 58px;
  line-height: 1;
  margin: 10px 0 15px;
  text-transform: uppercase;
}

.hero p {
  color: #9b9b9b;
  font-size: 18px;
}

.cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 22px;
  margin-bottom: 35px;
}

.card,
.table-card {
  background: #111;
  border: 1px solid #292929;
  border-radius: 18px;
  box-shadow: 0 0 25px rgba(255, 115, 35, 0.08);
}

.card {
  padding: 28px;
}

.card span {
  color: #9b9b9b;
  font-size: 15px;
}

.card h2 {
  margin: 10px 0 0;
  font-size: 42px;
  color: #ff8a2a;
}

.table-card {
  padding: 28px;
}

.schedule-card {
  margin-bottom: 30px;
}

.schedule-form {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
  margin-bottom: 18px;
}

.schedule-form label {
  display: flex;
  flex-direction: column;
  gap: 6px;
  color: #f3f4f6;
  font-size: 14px;
}

.schedule-form input,
.schedule-form select {
  border: 1px solid #3a3a3a;
  border-radius: 10px;
  background: #0c0c0c;
  color: #fff;
  padding: 10px 12px;
}

.schedule-list {
  display: grid;
  gap: 12px;
}

.schedule-item {
  display: flex;
  justify-content: space-between;
  gap: 14px;
  align-items: center;
  padding: 14px;
  border: 1px solid #2a2a2a;
  border-radius: 14px;
  background: #111;
}

.schedule-title {
  color: #ffb36b;
  font-weight: 700;
  margin-bottom: 4px;
}

.schedule-meta {
  color: #cfcfcf;
  font-size: 13px;
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 25px;
}

.table-header h2 {
  margin: 0;
  font-size: 32px;
}

:deep(.p-datatable-table) {
  background: #0c0c0c;
}

:deep(.p-datatable-thead > tr > th) {
  background: #ff8a2a;
  color: #000;
  font-weight: 800;
  border: none;
}

:deep(.p-datatable-tbody > tr) {
  background: #111;
  color: #fff;
}

:deep(.p-datatable-tbody > tr > td) {
  border-color: #242424;
}

:deep(.p-button) {
  background: #ff8a2a;
  border: none;
  color: #000;
  font-weight: 800;
}

@media (max-width: 1000px) {
  .cards {
    grid-template-columns: 1fr 1fr;
  }
}

@media (max-width: 650px) {
  .cards {
    grid-template-columns: 1fr;
  }

  .schedule-form {
    grid-template-columns: 1fr;
  }

  .schedule-item {
    flex-direction: column;
    align-items: flex-start;
  }

  .hero h1 {
    font-size: 40px;
  }
}
</style>