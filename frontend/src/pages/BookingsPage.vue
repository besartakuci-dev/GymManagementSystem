<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Tag from 'primevue/tag'
import Button from 'primevue/button'
import { getMyBookings } from '@/api/classes'

const bookings = ref<any[]>([])
const loading = ref(true)
const error = ref('')

type Severity = 'success' | 'info' | 'warn' | 'danger' | 'secondary'

function statusSeverity(status: string): Severity {
  switch (status) {
    case 'attended':
      return 'success'
    case 'booked':
      return 'info'
    case 'no_show':
      return 'warn'
    case 'cancelled':
      return 'danger'
    default:
      return 'secondary'
  }
}

async function loadBookings() {
  loading.value = true
  error.value = ''
  try {
    const { data } = await getMyBookings()
    bookings.value = data.data.bookings ?? []
  } catch (e: any) {
    error.value = e?.response?.data?.message ?? 'Could not load your bookings.'
    bookings.value = []
  } finally {
    loading.value = false
  }
}

onMounted(loadBookings)
</script>

<template>
  <main class="page">
    <div class="container">
      <div class="header">
        <div>
          <h1>My Bookings</h1>
          <p>Classes you've booked.</p>
        </div>
        <Button label="Refresh" icon="pi pi-refresh" outlined :loading="loading" @click="loadBookings" />
      </div>

      <p v-if="error" class="status error">{{ error }}</p>

      <!-- Empty state -->
      <div v-else-if="!loading && bookings.length === 0" class="empty">
        <i class="pi pi-calendar-times" />
        <h2>No bookings yet</h2>
        <p>You haven't booked any classes. Browse the schedule and join one.</p>
        <RouterLink to="/classes">
          <Button label="Browse classes" icon="pi pi-search" />
        </RouterLink>
      </div>

      <!-- Bookings table -->
      <DataTable
        v-else
        :value="bookings"
        :loading="loading"
        paginator
        :rows="8"
        stripedRows
        responsiveLayout="scroll"
        class="bookings-table"
      >
        <Column field="ClassName" header="Class" />
        <Column field="ClassTypeName" header="Type" />
        <Column header="Day & Date">
          <template #body="{ data }">{{ data.dayOfWeek }}, {{ data.date }}</template>
        </Column>
        <Column header="Time">
          <template #body="{ data }">{{ data.startTime }}–{{ data.endTime }}</template>
        </Column>
        <Column field="TrainerName" header="Trainer" />
        <Column field="Room" header="Room" />
        <Column header="Status">
          <template #body="{ data }">
            <Tag :value="data.BookingStatus" :severity="statusSeverity(data.BookingStatus)" />
          </template>
        </Column>
      </DataTable>
    </div>
  </main>
</template>

<style scoped>
.page {
  min-height: calc(100vh - 64px);
  background: var(--gym-bg);
  padding: 4rem 2rem;
}

.container {
  max-width: 1000px;
  margin: 0 auto;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 1rem;
  margin-bottom: 2rem;
}

h1 {
  font-size: 2rem;
  font-weight: 800;
  color: var(--gym-text);
  margin-bottom: 0.4rem;
}

.header p {
  color: var(--gym-text-muted);
}

.status.error {
  color: var(--gym-orange);
  text-align: center;
  padding: 2rem 0;
}

.empty {
  text-align: center;
  padding: 4rem 1rem;
  border: 1px solid var(--gym-border);
  border-radius: 16px;
  background: var(--gym-surface);
}

.empty i {
  font-size: 2.5rem;
  color: var(--gym-orange);
  margin-bottom: 1rem;
}

.empty h2 {
  font-size: 1.3rem;
  color: var(--gym-text);
  margin-bottom: 0.5rem;
}

.empty p {
  color: var(--gym-text-muted);
  margin-bottom: 1.5rem;
}

.bookings-table {
  border: 1px solid var(--gym-border);
  border-radius: 16px;
  overflow: hidden;
}
</style>
