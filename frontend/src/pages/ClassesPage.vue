<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import axios from 'axios'
import Card from 'primevue/card'

const route = useRoute()
const classes = ref([])
const loading = ref(true)
const error = ref('')

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

const pageTitle = computed(() => {
  if (!selectedType.value) return 'Our Classes'
  const typeName = classes.value.map((item) => item.ClassTypeName).find((name) => name.toLowerCase() === selectedType.value)
  return typeName ? `${typeName} Schedule` : 'Class Schedule'
})

const fetchClasses = async () => {
  loading.value = true
  error.value = ''

  try {
    const res = await axios.get('http://localhost:3000/api/classes')
    classes.value = res.data.data.classes ?? []
  } catch (err) {
    console.error('Failed to load classes', err)
    error.value = 'Could not load classes. Please try again later.'
  } finally {
    loading.value = false
  }
}

onMounted(fetchClasses)
</script>

<template>
  <main class="page">
    <section class="classes">
      <div class="section-header">
        <h1>{{ pageTitle }}</h1>
        <p v-if="selectedType">View the weekly schedule for this class type.</p>
        <p v-else>Weekly schedule grouped by class type.</p>
      </div>

      <p v-if="loading && !hasVisibleSchedule" class="status">Loading classes...</p>
      <p v-else-if="error && !hasVisibleSchedule" class="status error">{{ error }}</p>
      <p v-else-if="!hasVisibleSchedule" class="status">No upcoming classes scheduled for this class type.</p>

      <p v-if="error && hasVisibleSchedule" class="status note">Showing sample schedule while the live class list loads.</p>

      <div v-if="hasVisibleSchedule" class="groups">
        <Card v-for="group in groupedClasses" :key="group.name" class="group-card">
          <template #title>
            <h2>{{ group.name }}</h2>
          </template>
          <template #content>
            <ul class="session-list">
              <li v-for="session in group.sessions" :key="session.ClassID ?? `${group.name}-${session.dayOfWeek}-${session.startTime}`" class="session">
                <span class="session-day">{{ session.dayOfWeek }}</span>
                <span class="session-separator">-</span>
                <span class="session-time">{{ session.startTime }}</span>
                <span class="session-separator">-</span>
                <span class="session-trainer">{{ session.TrainerName }}</span>
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
  background: var(--gym-bg);
  min-height: calc(100vh - 64px);
}

.classes {
  padding: 4rem 2rem 5rem;
  max-width: 900px;
  margin: 0 auto;
}

.section-header {
  text-align: center;
  margin-bottom: 2.5rem;
}

.section-header h1 {
  font-size: clamp(2rem, 4vw, 2.5rem);
  font-weight: 800;
  color: var(--gym-text);
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
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.group-card {
  background: var(--gym-surface) !important;
  border: 1px solid var(--gym-border) !important;
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
}

.session {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: var(--gym-surface-raised);
  border: 1px solid var(--gym-border);
  border-radius: 6px;
  color: var(--gym-text);
  font-size: 0.95rem;
}

.session-day {
  font-weight: 600;
}

.session-time {
  color: var(--gym-orange);
}

.session-trainer {
  color: var(--gym-text-muted);
}

.session-separator {
  color: var(--gym-text-muted);
}

@media (max-width: 600px) {
  .classes {
    padding: 3rem 1.25rem 4rem;
  }

  .session {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.25rem;
  }

  .session-separator {
    display: none;
  }
}

</style>
