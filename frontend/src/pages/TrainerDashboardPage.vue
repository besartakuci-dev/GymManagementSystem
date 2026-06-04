<template>
  <section class="dashboard-page">
    <Toast />

    <div class="dashboard-hero">
      <p class="eyebrow">Trainer Area</p>
      <h1>Classes Dashboard</h1>
      <p>Manage upcoming classes, booked spots, capacity and enrolled members.</p>
    </div>

    <div class="stats-grid">
      <div class="stat-card">
        <span>Total Classes</span>
        <strong>{{ classes.length }}</strong>
      </div>

      <div class="stat-card">
        <span>Total Bookings</span>
        <strong>{{ totalBookings }}</strong>
      </div>

      <div class="stat-card">
        <span>Available Spots</span>
        <strong>{{ availableSpots }}</strong>
      </div>
    </div>

    <div class="table-card">
      <div class="table-header">
        <div>
          <p class="eyebrow">Overview</p>
          <h2>Upcoming Classes</h2>
        </div>
        <Button label="Refresh" icon="pi pi-refresh" @click="loadClasses" />
      </div>

      <DataTable
        :value="classes"
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
        <Column field="BookedSpots" header="Booked" />

        <Column header="Action">
          <template #body="{ data }">
            <Button
              label="View Bookings"
              icon="pi pi-users"
              size="small"
              @click="loadBookings(data)"
            />
          </template>
        </Column>
      </DataTable>
    </div>

    <Dialog
      v-model:visible="bookingsDialog"
      modal
      :header="selectedClass ? selectedClass.ClassName + ' Bookings' : 'Bookings'"
      style="width: 70vw"
    >
      <DataTable :value="bookings" :loading="bookingsLoading" responsiveLayout="scroll">
        <Column field="FirstName" header="First Name" />
        <Column field="LastName" header="Last Name" />
        <Column field="Email" header="Email" />
        <Column field="Status" header="Status" />
        <Column field="BookingDate" header="Booking Date" />
      </DataTable>
    </Dialog>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useToast } from 'primevue/usetoast'
import Toast from 'primevue/toast'
import Button from 'primevue/button'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Dialog from 'primevue/dialog'
import api from '@/api/axios'

const toast = useToast()

const classes = ref<any[]>([])
const bookings = ref<any[]>([])
const loading = ref(false)
const bookingsLoading = ref(false)
const bookingsDialog = ref(false)
const selectedClass = ref<any>(null)

const totalBookings = computed(() =>
  classes.value.reduce((sum, item) => sum + Number(item.BookedSpots || 0), 0)
)

const availableSpots = computed(() =>
  classes.value.reduce(
    (sum, item) => sum + (Number(item.MaxCapacity || 0) - Number(item.BookedSpots || 0)),
    0
  )
)

async function loadClasses() {
  try {
    loading.value = true
    const response = await api.get('/classes/dashboard')
    classes.value = response.data.data.classes

    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: 'Classes loaded successfully',
      life: 2500,
    })
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to load classes',
      life: 3000,
    })
  } finally {
    loading.value = false
  }
}

async function loadBookings(classItem: any) {
  try {
    selectedClass.value = classItem
    bookingsDialog.value = true
    bookingsLoading.value = true

    const response = await api.get(`/classes/${classItem.ClassID}/bookings`)
    bookings.value = response.data.data.bookings

    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: 'Bookings loaded successfully',
      life: 2500,
    })
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to load bookings',
      life: 3000,
    })
  } finally {
    bookingsLoading.value = false
  }
}

onMounted(() => {
  loadClasses()
})
</script>

<style scoped>
.dashboard-page {
  min-height: 100vh;
  padding: 70px 8%;
  background:
    radial-gradient(circle at top right, rgba(255, 115, 35, 0.16), transparent 35%),
    #050505;
  color: #fff;
}

.dashboard-hero {
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

.dashboard-hero h1 {
  font-size: 64px;
  line-height: 1;
  margin: 10px 0 15px;
  text-transform: uppercase;
}

.dashboard-hero p {
  color: #9b9b9b;
  font-size: 18px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 22px;
  margin-bottom: 35px;
}

.stat-card,
.table-card {
  background: #111;
  border: 1px solid #292929;
  border-radius: 18px;
  box-shadow: 0 0 25px rgba(255, 115, 35, 0.08);
}

.stat-card {
  padding: 28px;
}

.stat-card span {
  color: #9b9b9b;
  font-size: 15px;
}

.stat-card strong {
  display: block;
  margin-top: 10px;
  font-size: 44px;
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

:deep(.p-datatable) {
  background: transparent;
  color: #fff;
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

:deep(.p-dialog) {
  background: #111;
  color: #fff;
}

:deep(.p-dialog-header) {
  background: #111;
  color: #fff;
}

@media (max-width: 900px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }

  .dashboard-hero h1 {
    font-size: 42px;
  }
}
</style>