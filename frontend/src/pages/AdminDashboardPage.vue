<template>
  <section class="admin-dashboard">
    <Toast />

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
import Toast from 'primevue/toast'
import Button from 'primevue/button'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import api from '@/api/axios'

const toast = useToast()
const loading = ref(false)

const stats = ref({
  totalMembers: 0,
  activeMemberships: 0,
  upcomingClasses: 0,
  totalBookings: 0,
})

const classBookings = ref([])

async function loadDashboard() {
  try {
    loading.value = true

    const [statsResponse, bookingsResponse] = await Promise.all([
      api.get('/admin/dashboard'),
      api.get('/admin/class-bookings'),
    ])

    stats.value = statsResponse.data.data
    classBookings.value = bookingsResponse.data.data.classBookings

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

  .hero h1 {
    font-size: 40px;
  }
}
</style>