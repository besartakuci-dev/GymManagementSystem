<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import DataView from 'primevue/dataview'
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

// --- Presentational display helpers (formatting only — never mutate fetched values) ---

// 'booked' is the normal/default state, so it carries no signal → no badge for it.
const DEFAULT_STATUS = 'booked'
function showStatusBadge(status: string): boolean {
  return !!status && status !== DEFAULT_STATUS
}
function statusLabel(status: string): string {
  switch (status) {
    case 'booked':
      return 'Confirmed'
    case 'attended':
      return 'Attended'
    case 'no_show':
      return 'No-show'
    case 'cancelled':
      return 'Cancelled'
    default:
      return status
  }
}

function ymd(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
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

function formatWhen(booking: any): string {
  const day = relativeDay(booking.date)
  const time = formatTime(booking.startTime)
  return time ? `${day} · ${time}` : day
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
          <h1>My Schedule</h1>
          <p>Classes you've booked.</p>
        </div>
        <div class="header-actions">
          <RouterLink to="/classes">
            <Button label="Find Classes" icon="pi pi-search" />
          </RouterLink>
          <Button label="Refresh" icon="pi pi-refresh" outlined :loading="loading" @click="loadBookings" />
        </div>
      </div>

      <p v-if="error" class="status error">{{ error }}</p>

      <!-- Loading (initial) -->
      <p v-else-if="loading && !bookings.length" class="status">Loading your schedule…</p>

      <!-- Empty state -->
      <div v-else-if="!bookings.length" class="empty">
        <i class="pi pi-calendar-times" />
        <h2>No classes booked yet</h2>
        <p>You haven't booked any classes. Browse the schedule and join one.</p>
        <RouterLink to="/classes">
          <Button label="Browse classes" icon="pi pi-search" />
        </RouterLink>
      </div>

      <!-- Bookings as a paginated card grid -->
      <DataView
        v-else
        :value="bookings"
        :rows="8"
        paginator
        layout="list"
        dataKey="BookingID"
        class="bookings-view"
      >
        <template #list="{ items }">
          <div class="cards-grid">
            <article v-for="b in items" :key="b.BookingID" class="booking-card">
              <div class="card-top">
                <div class="title-block">
                  <h3 class="class-name">{{ b.ClassName }}</h3>
                  <span v-if="b.ClassTypeName" class="class-type">{{ b.ClassTypeName }}</span>
                </div>
                <Tag
                  v-if="showStatusBadge(b.BookingStatus)"
                  :value="statusLabel(b.BookingStatus)"
                  :severity="statusSeverity(b.BookingStatus)"
                  class="status-tag"
                />
              </div>

              <p class="when">
                <i class="pi pi-calendar" />
                <span>{{ formatWhen(b) }}</span>
              </p>

              <p class="details">
                <span v-if="b.TrainerName"><i class="pi pi-user" /> {{ b.TrainerName }}</span>
                <span v-if="b.Room"><i class="pi pi-map-marker" /> {{ b.Room }}</span>
              </p>
            </article>
          </div>
        </template>
      </DataView>
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

.header-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  justify-content: flex-end;
}

.header-actions a {
  text-decoration: none;
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

.status {
  text-align: center;
  color: var(--gym-text-muted);
  padding: 2rem 0;
}

.status.error {
  color: var(--gym-orange);
}

/* Empty state */
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

/* Card grid */
.cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1rem;
  width: 100%;
}

.booking-card {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  padding: 1.15rem 1.25rem;
  background: var(--gym-surface-raised);
  border: 1px solid var(--gym-border);
  border-left: 3px solid var(--gym-orange);
  border-radius: 14px;
  transition: transform 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease;
}

.booking-card:hover {
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

/* Primary element: class name */
.class-name {
  font-size: 1.2rem;
  font-weight: 700;
  line-height: 1.25;
  color: var(--gym-text);
}

/* Merged subtitle: class type, de-emphasized */
.class-type {
  font-size: 0.78rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--gym-text-muted);
}

.status-tag {
  flex-shrink: 0;
  text-transform: capitalize;
}

/* Primary element: date & time */
.when {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1rem;
  font-weight: 600;
  color: var(--gym-text);
}

.when i {
  color: var(--gym-orange);
  font-size: 0.95rem;
}

/* Secondary: trainer + room */
.details {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem 1.1rem;
  font-size: 0.85rem;
  color: var(--gym-text-muted);
}

.details span {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
}

.details i {
  font-size: 0.85rem;
  opacity: 0.8;
}

/* DataView reset to blend with the page */
.bookings-view :deep(.p-dataview),
.bookings-view :deep(.p-dataview-content) {
  background: transparent;
  border: none;
}

.bookings-view :deep(.p-paginator) {
  background: transparent;
  margin-top: 1.25rem;
}

@media (max-width: 560px) {
  .page {
    padding: 3rem 1.25rem;
  }

  .header {
    flex-direction: column;
    align-items: flex-start;
  }
}

@media (max-width: 640px) {
  .page {
    padding: 3rem 1rem;
  }

  .header {
    align-items: flex-start;
    flex-direction: column;
  }

  .header-actions {
    justify-content: flex-start;
    width: 100%;
  }

  .header-actions a,
  .header-actions :deep(.p-button) {
    width: 100%;
  }
}
</style>
