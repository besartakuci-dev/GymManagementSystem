<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import Card from 'primevue/card'
import Button from 'primevue/button'
import { useToast } from 'primevue/usetoast'
import api from '@/api/axios'
import { bookClass } from '@/api/classes'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const auth = useAuthStore()
const toast = useToast()
const classes = ref([])
const loading = ref(true)
const error = ref('')
const joiningId = ref(null)

const DAY_ORDER = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

const SAMPLE_CLASS_SCHEDULES = {
  fitness: [
    { ClassTypeName: 'Fitness', dayOfWeek: 'Monday', startTime: '08:00 PM', TrainerName: 'Coach Alex' },
    { ClassTypeName: 'Fitness', dayOfWeek: 'Wednesday', startTime: '06:30 PM', TrainerName: 'Coach Alex' },
  ],
  pilates: [
    { ClassTypeName: 'Pilates', dayOfWeek: 'Tuesday', startTime: '07:00 PM', TrainerName: 'Coach Mila' },
    { ClassTypeName: 'Pilates', dayOfWeek: 'Friday', startTime: '05:30 PM', TrainerName: 'Coach Mila' },
  ],
  yoga: [
    { ClassTypeName: 'Yoga', dayOfWeek: 'Monday', startTime: '07:30 PM', TrainerName: 'Coach Sara' },
    { ClassTypeName: 'Yoga', dayOfWeek: 'Saturday', startTime: '10:00 AM', TrainerName: 'Coach Sara' },
  ],
  crossfit: [
    { ClassTypeName: 'CrossFit', dayOfWeek: 'Thursday', startTime: '06:00 PM', TrainerName: 'Coach Leo' },
    { ClassTypeName: 'CrossFit', dayOfWeek: 'Sunday', startTime: '09:30 AM', TrainerName: 'Coach Leo' },
  ],
}

const selectedType = computed(() => String(route.params.type ?? '').toLowerCase())

const visibleClasses = computed(() => {
  if (!selectedType.value) return classes.value
  const matching = classes.value.filter((item) => item.ClassTypeName?.toLowerCase() === selectedType.value)
  if (matching.length) return matching
  return SAMPLE_CLASS_SCHEDULES[selectedType.value] ?? []
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

  const fromSample = SAMPLE_CLASS_SCHEDULES[selectedType.value]?.[0]?.ClassTypeName
  if (fromSample) return fromSample

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
        <p>Each session is highlighted with a brighter, more elegant layout so the class lineup feels easier to scan and more inviting to explore.</p>
      </article>

      <p v-if="loading && !hasVisibleSchedule" class="status">Loading classes...</p>
      <p v-else-if="error && !hasVisibleSchedule" class="status error">{{ error }}</p>
      <p v-else-if="!hasVisibleSchedule" class="status">No upcoming classes scheduled for this class type.</p>

      <div v-if="hasVisibleSchedule" class="groups">
        <Card v-for="group in groupedClasses" :key="group.name" class="group-card">
          <template #title>
            <h2>{{ group.name }}</h2>
          </template>
          <template #content>
            <ul class="session-list">
              <li v-for="session in group.sessions" :key="session.ClassID ?? `${group.name}-${session.dayOfWeek}-${session.startTime}`" class="session">
                <span class="session-chip day"><span class="chip-icon">📅</span>{{ session.dayOfWeek }}</span>
                <span class="session-chip time"><span class="chip-icon">⏰</span>{{ session.startTime }}</span>
                <span class="session-chip trainer"><span class="chip-icon">🧑‍🏫</span>{{ session.TrainerName }}</span>
                <div class="session-join">
                  <Button
                    :label="joinLabel(session)"
                    :disabled="joinDisabled(session)"
                    :loading="joiningId !== null && classIdOf(session) === joiningId"
                    size="small"
                    @click="onJoin(session)"
                  />
                </div>
              </li>
            </ul>
          </template>
        </Card>
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
  padding: 4rem 2rem 5rem;
  max-width: 1180px;
  margin: 0 auto;
  text-align: center;
  padding-left: 1.25rem;
  padding-right: 1.25rem;
}

.schedule-hero {
  text-align: center;
  border: 1px solid rgba(249, 115, 22, 0.25);
  border-radius: 24px;
  padding: 1.1rem 1.15rem 1.2rem;
  margin: 0 auto 1.6rem;
  max-width: 920px;
  background:
    linear-gradient(135deg, rgba(17, 17, 17, 0.98), rgba(10, 10, 10, 0.98));
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

.section-header p {
  color: var(--gym-text-muted);
  font-size: 1rem;
}

.status {
  text-align: center;
  color: var(--gym-text-muted);
}

.status.error {
  color: var(--gym-orange);
}

.groups {
  display: grid;
  gap: 1.2rem;
  justify-items: center;
}

.group-card {
  width: 100%;
  max-width: 920px;
}

.group-card {
  background:
    linear-gradient(145deg, rgba(17, 17, 17, 0.98), rgba(10, 10, 10, 0.98)) !important;
  border: 1px solid rgba(249, 115, 22, 0.18) !important;
  border-radius: 22px !important;
  box-shadow: 0 18px 36px rgba(0, 0, 0, 0.30);
  overflow: hidden;
}

.group-card :deep(.p-card-body) {
  padding: 1.05rem 1.05rem 1.1rem;
}

.group-card :deep(.p-card-content) {
  padding-top: 0.25rem;
}

.group-card h2 {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--gym-orange);
  margin: 0;
}

.session-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  align-items: stretch;
}

.session {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 0.55rem;
  align-items: center;
  padding: 0.8rem 0.9rem;
  background:
    linear-gradient(145deg, rgba(255, 255, 255, 0.03), rgba(249, 115, 22, 0.05));
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-left: 4px solid var(--gym-orange);
  border-radius: 16px;
  color: var(--gym-text);
  font-size: 0.95rem;
  transition: transform 150ms ease, box-shadow 150ms ease, border-color 150ms ease;
}

.session:hover {
  transform: translateY(-2px);
  border-color: rgba(249, 115, 22, 0.35);
  box-shadow: 0 12px 24px rgba(249, 115, 22, 0.08);
}

.session-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.45rem 0.6rem;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: var(--gym-text);
  font-weight: 600;
  width: fit-content;
}

.session-chip.time {
  color: #fdba74;
  background: rgba(249, 115, 22, 0.12);
  border-color: rgba(249, 115, 22, 0.22);
}

.session-chip.trainer {
  color: #d4d4d8;
}

.session-join {
  display: flex;
  justify-content: flex-end;
  align-items: center;
}

.chip-icon {
  font-size: 0.9rem;
}

@media (max-width: 600px) {
  .classes {
    padding: 3rem 1.25rem 4rem;
  }

  .session {
    grid-template-columns: 1fr;
    align-items: flex-start;
    gap: 0.35rem;
  }

  .session-separator {
    display: none;
  }
}

</style>
