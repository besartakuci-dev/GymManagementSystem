<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Button from 'primevue/button'
import { useToast } from 'primevue/usetoast'
import api from '@/api/axios'
import { bookClass } from '@/api/classes'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const toast = useToast()
const classes = ref([])
const loading = ref(true)
const error = ref('')
const joiningId = ref(null)

const DAY_ORDER = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

const selectedType = computed(() =>
  String(route.query.type ?? route.params.type ?? '').toLowerCase()
)

const visibleClasses = computed(() => {
  if (!selectedType.value) return classes.value
  return classes.value.filter((item) => item.ClassTypeName?.toLowerCase() === selectedType.value)
})

const hasVisibleSchedule = computed(() => visibleClasses.value.length > 0)

const groupedClasses = computed(() => {
  const groups = new Map()
  for (const gymClass of visibleClasses.value) {
    const name = gymClass.ClassTypeName
    if (!groups.has(name)) groups.set(name, [])
    groups.get(name).push(gymClass)
  }
  return [...groups.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .filter(([name]) => !selectedType.value || name.toLowerCase() === selectedType.value)
    .map(([name, sessions]) => ({
      name,
      sessions: [...sessions].sort((a, b) => {
        const dayDiff = DAY_ORDER.indexOf(a.dayOfWeek) - DAY_ORDER.indexOf(b.dayOfWeek)
        if (dayDiff !== 0) return dayDiff
        return a.startTime.localeCompare(b.startTime)
      }),
    }))
})

const selectedLabel = computed(() => {
  const fromLive = classes.value.find((item) => item.ClassTypeName?.toLowerCase() === selectedType.value)?.ClassTypeName
  if (fromLive) return fromLive
  return selectedType.value
    ? selectedType.value.charAt(0).toUpperCase() + selectedType.value.slice(1)
    : 'All Classes'
})

const pageTitle = computed(() => {
  if (!selectedType.value) return 'Our Classes'
  return `${selectedLabel.value} Schedule`
})

const fetchClasses = async () => {
  loading.value = true
  error.value = ''
  try {
    const res = await api.get('/classes')
    classes.value = res.data.data.classes ?? []
  } catch (err) {
    console.error('Failed to load classes', err)
    error.value = 'Could not load classes. Please try again later.'
  } finally {
    loading.value = false
  }
}

function classIdOf(session) {
  return session.ClassID ?? session.id ?? null
}

function spotsLeftOf(session) {
  return Number(session.spotsLeft ?? session.SpotsLeft ?? 0)
}

function isBooked(session) {
  return !!session.IsBookedByCurrentUser
}

function joinDisabled(session) {
  if (isBooked(session)) return true
  if (!auth.user || auth.user.Role !== 'member') return true
  if (!auth.hasMembership) return true
  if (!classIdOf(session)) return true
  if (session.status !== 'Active') return true
  if (spotsLeftOf(session) <= 0) return true
  return false
}

function joinLabel(session) {
  if (isBooked(session)) return 'Joined'
  if (!auth.user) return 'Sign in to join'
  if (auth.user.Role !== 'member') return 'Members only'
  if (!auth.hasMembership) return 'Membership required'
  if (!classIdOf(session)) return 'Unavailable'
  if (session.status !== 'Active') return 'Unavailable'
  if (spotsLeftOf(session) <= 0) return 'Full'
  return 'Join'
}

async function onJoin(session) {
  const id = classIdOf(session)
  if (!id) return
  joiningId.value = id
  try {
    await bookClass(id)
    toast.add({ severity: 'success', summary: 'Class booked', detail: 'See you there!', life: 3500 })
    await fetchClasses()
  } catch (e) {
    toast.add({
      severity: 'error',
      summary: 'Could not join',
      detail: e.response?.data?.message ?? 'Something went wrong',
      life: 4000,
    })
  } finally {
    joiningId.value = null
  }
}

onMounted(async () => {
  await fetchClasses()
  if (auth.user) auth.refreshMembership()
})
</script>

<template>
  <main class="page">
    <section class="classes">
      <div class="section-header">
        <p v-if="selectedType" class="selected-pill">Viewing: {{ selectedLabel }}</p>
        <h1>{{ pageTitle }}</h1>
      </div>

      <article class="schedule-hero">
        <span class="eyebrow">Weekly timetable</span>
        <h2>Find your perfect rhythm and plan the week ahead.</h2>
        <p>Browse all scheduled classes, filter by type, and book your spot directly.</p>
      </article>

      <p v-if="loading && !hasVisibleSchedule" class="status">Loading classes...</p>
      <p v-else-if="error && !hasVisibleSchedule" class="status error">{{ error }}</p>
      <p v-else-if="!hasVisibleSchedule" class="status">No upcoming classes scheduled for this class type.</p>

      <div v-if="hasVisibleSchedule" class="groups">
        <div v-for="group in groupedClasses" :key="group.name" class="group-card">
          <div class="group-header">
            <span class="group-type">{{ group.name }}</span>
            <span class="group-count">{{ group.sessions.length }} session{{ group.sessions.length !== 1 ? 's' : '' }}</span>
          </div>
          <ul class="session-list">
            <li
              v-for="session in group.sessions"
              :key="session.ClassID ?? `${group.name}-${session.dayOfWeek}-${session.startTime}`"
              class="session"
              :class="{ 'is-booked': isBooked(session) }"
            >
              <div class="session-left">
                <p class="session-name">{{ session.name || session.Name }}</p>
                <div class="session-meta">
                  <span class="meta-item"><i class="pi pi-calendar" />{{ session.dayOfWeek }}</span>
                  <span class="meta-dot" />
                  <span class="meta-item meta-time"><i class="pi pi-clock" />{{ session.startTime }}–{{ session.endTime }}</span>
                  <span class="meta-dot" />
                  <span class="meta-item"><i class="pi pi-user" />{{ session.TrainerName || session.trainerName }}</span>
                </div>
              </div>
              <div class="session-right">
                <span v-if="spotsLeftOf(session) > 0" class="spots-badge">
                  {{ spotsLeftOf(session) }} spot{{ spotsLeftOf(session) !== 1 ? 's' : '' }} left
                </span>
                <span v-else-if="classIdOf(session)" class="spots-badge full">Full</span>
                <Button
                  :label="joinLabel(session)"
                  :disabled="joinDisabled(session)"
                  :loading="joiningId !== null && classIdOf(session) === joiningId"
                  :severity="isBooked(session) ? 'secondary' : 'warn'"
                  size="small"
                  @click="onJoin(session)"
                />
              </div>
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
  padding: 4rem 1.25rem 5rem;
  max-width: 1180px;
  margin: 0 auto;
  text-align: center;
}

.schedule-hero {
  text-align: center;
  border: 1px solid rgba(249, 115, 22, 0.25);
  border-radius: 24px;
  padding: 1.1rem 1.15rem 1.2rem;
  margin: 0 auto 1.6rem;
  max-width: 920px;
  background: linear-gradient(135deg, rgba(17, 17, 17, 0.98), rgba(10, 10, 10, 0.98));
  box-shadow: 0 18px 40px rgba(0, 0, 0, 0.35);
}

.eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.35rem 0.65rem;
  border-radius: 999px;
  background: var(--gym-orange-subtle);
  color: #fdba74;
  text-transform: uppercase;
  letter-spacing: 0.18em;
  font-size: 0.72rem;
  font-weight: 700;
}

.schedule-hero h2 {
  margin-top: 0.75rem;
  font-size: clamp(1.1rem, 2vw, 1.4rem);
  color: var(--gym-text);
}

.schedule-hero p {
  margin-top: 0.35rem;
  color: var(--gym-text-muted);
  line-height: 1.5;
}

.section-header h1 {
  font-size: clamp(2rem, 4vw, 2.5rem);
  font-weight: 800;
  color: var(--gym-text);
  margin-bottom: 0.5rem;
}

.selected-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.35rem 0.65rem;
  border-radius: 999px;
  background: rgba(249, 115, 22, 0.12);
  color: #fdba74;
  font-size: 0.82rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  margin-bottom: 0.5rem;
}

.status {
  text-align: center;
  color: var(--gym-text-muted);
}

.status.error {
  color: var(--gym-orange);
}

.groups {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  max-width: 920px;
  margin: 0 auto;
}

.group-card {
  background: rgba(15, 15, 15, 0.9);
  border: 1px solid rgba(249, 115, 22, 0.18);
  border-radius: 18px;
  overflow: hidden;
}

.group-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.9rem 1.25rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  background: rgba(249, 115, 22, 0.06);
}

.group-type {
  font-size: 1rem;
  font-weight: 700;
  color: var(--gym-orange);
  letter-spacing: 0.01em;
}

.group-count {
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--gym-text-muted);
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 999px;
  padding: 0.2rem 0.65rem;
}

.session-list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.session {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.04);
  transition: background 150ms ease;
}

.session:last-child {
  border-bottom: none;
}

.session:hover {
  background: rgba(249, 115, 22, 0.04);
}

.session.is-booked {
  background: rgba(249, 115, 22, 0.03);
}

.session-left {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  min-width: 0;
  text-align: left;
}

.session-name {
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--gym-text);
  margin: 0;
}

.session-meta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.4rem;
  font-size: 0.8rem;
  color: var(--gym-text-muted);
}

.meta-item {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
}

.meta-item i {
  font-size: 0.72rem;
  opacity: 0.7;
}

.meta-time {
  color: #fdba74;
}

.meta-dot {
  width: 3px;
  height: 3px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  flex-shrink: 0;
}

.session-right {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  flex-shrink: 0;
}

.spots-badge {
  font-size: 0.75rem;
  font-weight: 600;
  color: #86efac;
  background: rgba(134, 239, 172, 0.1);
  border: 1px solid rgba(134, 239, 172, 0.2);
  border-radius: 999px;
  padding: 0.2rem 0.6rem;
  white-space: nowrap;
}

.spots-badge.full {
  color: #f87171;
  background: rgba(248, 113, 113, 0.1);
  border-color: rgba(248, 113, 113, 0.2);
}

@media (max-width: 600px) {
  .session {
    flex-direction: column;
    align-items: flex-start;
  }

  .session-right {
    width: 100%;
    justify-content: space-between;
  }
}
</style>
