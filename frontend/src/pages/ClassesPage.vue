<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Card from 'primevue/card'
import { bookClass, getClasses } from '@/api/classes'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

const classes = ref([])
const loading = ref(true)
const error = ref('')
const notice = ref('')
const bookingClass = ref(null)
const bookingId = ref(null)
const selectedPaymentMethod = ref('card')

const DAY_ORDER = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const PAYMENT_METHODS = [
  { value: 'card', label: 'Card', helper: 'Marked as paid now.' },
  { value: 'bank_transfer', label: 'Bank transfer', helper: 'Marked as paid now.' },
  { value: 'cash', label: 'Cash at gym', helper: 'Booking is saved with payment pending.' },
]

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
const userRole = computed(() => String(auth.user?.Role || '').toLowerCase())
const isMember = computed(() => userRole.value === 'member')

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

const canBook = (session) => {
  return Boolean(
    session.ClassID &&
      session.Status === 'scheduled' &&
      Number(session.spotsLeft ?? session.SpotsLeft ?? 0) > 0 &&
      !session.IsBookedByCurrentUser
  )
}

const bookButtonLabel = (session) => {
  if (!session.ClassID) return 'Preview'
  if (session.IsBookedByCurrentUser) return 'Booked'
  if (session.Status === 'cancelled') return 'Cancelled'
  if (Number(session.spotsLeft ?? session.SpotsLeft ?? 0) <= 0) return 'Full'
  return 'Book'
}

const openPaymentModal = (session) => {
  if (!auth.user) {
    router.push({ path: '/login', query: { redirect: route.fullPath } })
    return
  }
  if (!isMember.value || !canBook(session)) return
  error.value = ''
  notice.value = ''
  selectedPaymentMethod.value = 'card'
  bookingClass.value = session
}

const closePaymentModal = () => {
  bookingClass.value = null
  selectedPaymentMethod.value = 'card'
}

const confirmBooking = async () => {
  if (!bookingClass.value) return
  bookingId.value = bookingClass.value.ClassID
  error.value = ''
  notice.value = ''

  try {
    const { data } = await bookClass(bookingClass.value.ClassID, selectedPaymentMethod.value)
    const paymentStatus = data.data.booking?.PaymentStatus
    notice.value =
      paymentStatus === 'pending'
        ? 'Class booked. Please pay cash at the gym.'
        : 'Class booked and payment recorded.'
    closePaymentModal()
    await fetchClasses()
  } catch (err) {
    error.value = err.response?.data?.message || 'Could not book this class.'
  } finally {
    bookingId.value = null
  }
}

const fetchClasses = async () => {
  loading.value = true
  error.value = ''

  try {
    if (!auth.initialized) await auth.init()
    const res = await getClasses()
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
      <p v-if="error && hasVisibleSchedule" class="status error">{{ error }}</p>
      <p v-if="notice" class="status success">{{ notice }}</p>

      <div v-if="hasVisibleSchedule" class="groups">
        <Card v-for="group in groupedClasses" :key="group.name" class="group-card">
          <template #title>
            <h2>{{ group.name }}</h2>
          </template>
          <template #content>
            <ul class="session-list">
              <li v-for="session in group.sessions" :key="session.ClassID ?? `${group.name}-${session.dayOfWeek}-${session.startTime}`" class="session">
                <span class="session-chip day"><i class="pi pi-calendar"></i>{{ session.dayOfWeek }}</span>
                <span class="session-chip time"><i class="pi pi-clock"></i>{{ session.startTime }}</span>
                <span class="session-chip trainer"><i class="pi pi-user"></i>{{ session.TrainerName || session.trainerName }}</span>
                <span v-if="session.price !== undefined" class="session-chip price"><i class="pi pi-credit-card"></i>{{ Number(session.price).toFixed(2) }}</span>
                <button
                  class="book-button"
                  type="button"
                  :disabled="auth.user && (!isMember || !canBook(session)) || bookingId === session.ClassID || !session.ClassID"
                  @click="openPaymentModal(session)"
                >
                  {{ bookingId === session.ClassID ? 'Booking...' : bookButtonLabel(session) }}
                </button>
              </li>
            </ul>
          </template>
        </Card>
      </div>

      <div v-if="bookingClass" class="modal-backdrop" role="presentation">
        <div class="payment-modal" role="dialog" aria-modal="true" aria-labelledby="payment-title">
          <div class="modal-head">
            <p class="eyebrow">Payment</p>
            <h2 id="payment-title">Book {{ bookingClass.name || bookingClass.ClassTypeName }}</h2>
            <p>{{ bookingClass.dayOfWeek }} at {{ bookingClass.startTime }} with {{ bookingClass.TrainerName || bookingClass.trainerName }}</p>
          </div>

          <div class="payment-options">
            <label v-for="method in PAYMENT_METHODS" :key="method.value" class="payment-option">
              <input v-model="selectedPaymentMethod" type="radio" name="paymentMethod" :value="method.value" />
              <span>
                <strong>{{ method.label }}</strong>
                <small>{{ method.helper }}</small>
              </span>
            </label>
          </div>

          <div class="modal-actions">
            <button class="ghost-button" type="button" @click="closePaymentModal">Cancel</button>
            <button class="confirm-button" type="button" :disabled="bookingId === bookingClass.ClassID" @click="confirmBooking">
              {{ bookingId === bookingClass.ClassID ? 'Booking...' : 'Confirm Booking' }}
            </button>
          </div>
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
  border-radius: 8px;
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
  color: #ff8b8b;
}

.status.success {
  color: #8ff0b4;
}

.groups {
  display: grid;
  gap: 1.2rem;
  justify-items: center;
}

.group-card {
  width: 100%;
  max-width: 920px;
  background: linear-gradient(145deg, rgba(17, 17, 17, 0.98), rgba(10, 10, 10, 0.98)) !important;
  border: 1px solid rgba(249, 115, 22, 0.18) !important;
  border-radius: 8px !important;
  box-shadow: 0 18px 36px rgba(0, 0, 0, 0.30);
  overflow: visible;
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
  grid-template-columns: repeat(auto-fit, minmax(145px, 1fr)) auto;
  gap: 0.55rem;
  align-items: center;
  padding: 0.8rem 0.9rem;
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.03), rgba(249, 115, 22, 0.05));
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-left: 4px solid var(--gym-orange);
  border-radius: 8px;
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

.session-chip.time,
.session-chip.price {
  color: #fdba74;
  background: rgba(249, 115, 22, 0.12);
  border-color: rgba(249, 115, 22, 0.22);
}

.session-chip.trainer {
  color: #d4d4d8;
}

.book-button,
.confirm-button,
.ghost-button {
  min-height: 40px;
  border: 0;
  border-radius: 6px;
  padding: 0 0.9rem;
  cursor: pointer;
  font-weight: 900;
  text-transform: uppercase;
}

.book-button,
.confirm-button {
  background: var(--gym-orange);
  color: white;
}

.ghost-button {
  border: 1px solid var(--gym-border);
  background: transparent;
  color: var(--gym-text);
}

.book-button:disabled,
.confirm-button:disabled {
  cursor: not-allowed;
  opacity: 0.55;
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

.payment-modal {
  width: min(460px, 100%);
  border: 1px solid rgba(249, 115, 22, 0.22);
  border-radius: 8px;
  background: #111;
  padding: 1.25rem;
  box-shadow: 0 20px 44px rgba(0, 0, 0, 0.45);
  text-align: left;
}

.modal-head h2 {
  color: var(--gym-text);
  margin: 0.75rem 0 0.35rem;
  text-transform: uppercase;
}

.modal-head p:last-child {
  color: var(--gym-text-muted);
  margin: 0 0 1rem;
}

.payment-options {
  display: grid;
  gap: 0.7rem;
}

.payment-option {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  border: 1px solid var(--gym-border);
  border-radius: 8px;
  padding: 0.8rem;
  color: var(--gym-text);
}

.payment-option strong,
.payment-option small {
  display: block;
}

.payment-option small {
  color: var(--gym-text-muted);
  margin-top: 0.2rem;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 1rem;
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

  .modal-actions {
    flex-direction: column;
  }
}
</style>
