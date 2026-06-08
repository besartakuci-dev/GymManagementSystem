<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { cancelMyBooking, getMyBookedClasses } from '@/api/classes'

interface BookedClass {
  BookingID: number
  ClassID: number
  BookingDate: string
  BookingStatus: string
  Amount: string | number
  PaymentMethod: 'cash' | 'card' | 'bank_transfer'
  PaymentStatus: 'pending' | 'paid' | 'refunded'
  name: string
  category: string
  date: string
  dayOfWeek: string
  startTime: string
  endTime: string
  room: string
  trainerName: string
  status: string
}

const router = useRouter()
const bookings = ref<BookedClass[]>([])
const loading = ref(true)
const cancelling = ref(false)
const error = ref('')
const notice = ref('')
const cancelTarget = ref<BookedClass | null>(null)

const upcomingBookings = computed(() =>
  bookings.value.filter((booking) => booking.BookingStatus !== 'cancelled' && new Date(`${booking.date}T${booking.startTime}:00`) >= new Date())
)

const pastBookings = computed(() =>
  bookings.value.filter((booking) => booking.BookingStatus !== 'cancelled' && new Date(`${booking.date}T${booking.startTime}:00`) < new Date())
)

const cancelledBookings = computed(() =>
  bookings.value.filter((booking) => booking.BookingStatus === 'cancelled')
)

function paymentMethodLabel(value: string) {
  if (value === 'bank_transfer') return 'Bank transfer'
  return value.charAt(0).toUpperCase() + value.slice(1)
}

function paymentStatusLabel(value: string) {
  if (value === 'pending') return 'Pending payment'
  return value.charAt(0).toUpperCase() + value.slice(1)
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }).format(new Date(`${value}T00:00:00`))
}

function canCancel(booking: BookedClass) {
  return booking.BookingStatus === 'booked' && new Date(`${booking.date}T${booking.startTime}:00`) >= new Date()
}

function openCancelModal(booking: BookedClass) {
  if (!canCancel(booking)) return
  cancelTarget.value = booking
  error.value = ''
  notice.value = ''
}

function closeCancelModal() {
  cancelTarget.value = null
}

async function confirmCancelBooking() {
  if (!cancelTarget.value) return
  cancelling.value = true
  error.value = ''
  notice.value = ''

  try {
    await cancelMyBooking(cancelTarget.value.BookingID)
    notice.value =
      cancelTarget.value.PaymentStatus === 'paid'
        ? 'Booking cancelled and payment marked as refunded.'
        : 'Booking cancelled.'
    closeCancelModal()
    await loadBookings()
  } catch (e: any) {
    error.value = e.response?.data?.message || 'Could not cancel this booking.'
  } finally {
    cancelling.value = false
  }
}

async function loadBookings() {
  loading.value = true
  error.value = ''

  try {
    const { data } = await getMyBookedClasses()
    bookings.value = data.data.bookings ?? []
  } catch (e: any) {
    if (e.response?.status === 401) {
      router.push('/login')
      return
    }
    error.value = e.response?.data?.message || 'Could not load your booked classes.'
  } finally {
    loading.value = false
  }
}

onMounted(loadBookings)
</script>

<template>
  <main class="page">
    <section class="container">
      <div class="page-head">
        <div>
          <p class="eyebrow">Member Area</p>
          <h1>My Classes</h1>
          <p>Your booked classes and payment status appear here.</p>
        </div>
        <RouterLink to="/classes" class="browse-link">Browse Classes</RouterLink>
      </div>

      <p v-if="loading" class="status">Loading your classes...</p>
      <p v-else-if="error" class="status error">{{ error }}</p>
      <p v-if="notice" class="status success">{{ notice }}</p>

      <template v-else>
        <p v-if="bookings.length === 0" class="empty">
          You have not booked any classes yet.
          <RouterLink to="/classes">Find a class</RouterLink>
        </p>

        <section v-if="upcomingBookings.length" class="booking-section">
          <div class="section-title">
            <p class="eyebrow">Upcoming</p>
            <h2>Booked Classes</h2>
          </div>

          <div class="booking-grid">
            <article v-for="booking in upcomingBookings" :key="booking.BookingID" class="booking-card">
              <div class="card-top">
                <span class="pill">{{ booking.category }}</span>
                <span class="pill" :class="booking.PaymentStatus">{{ paymentStatusLabel(booking.PaymentStatus) }}</span>
              </div>

              <h3>{{ booking.name }}</h3>
              <p class="trainer">{{ booking.trainerName }}</p>

              <dl>
                <div>
                  <dt>Date</dt>
                  <dd>{{ formatDate(booking.date) }}</dd>
                </div>
                <div>
                  <dt>Time</dt>
                  <dd>{{ booking.startTime }} - {{ booking.endTime }}</dd>
                </div>
                <div>
                  <dt>Room</dt>
                  <dd>{{ booking.room }}</dd>
                </div>
                <div>
                  <dt>Payment</dt>
                  <dd>{{ paymentMethodLabel(booking.PaymentMethod) }}</dd>
                </div>
                <div>
                  <dt>Amount</dt>
                  <dd>{{ Number(booking.Amount).toFixed(2) }}</dd>
                </div>
              </dl>

              <button v-if="canCancel(booking)" class="danger-button" type="button" @click="openCancelModal(booking)">
                Cancel Booking
              </button>
            </article>
          </div>
        </section>

        <section v-if="pastBookings.length" class="booking-section">
          <div class="section-title">
            <p class="eyebrow">History</p>
            <h2>Past Classes</h2>
          </div>

          <div class="booking-grid">
            <article v-for="booking in pastBookings" :key="booking.BookingID" class="booking-card muted">
              <div class="card-top">
                <span class="pill">{{ booking.category }}</span>
                <span class="pill">{{ booking.status }}</span>
              </div>
              <h3>{{ booking.name }}</h3>
              <p class="trainer">{{ formatDate(booking.date) }} at {{ booking.startTime }}</p>
            </article>
          </div>
        </section>

        <section v-if="cancelledBookings.length" class="booking-section">
          <div class="section-title">
            <p class="eyebrow">Cancelled</p>
            <h2>Cancelled Classes</h2>
          </div>

          <div class="booking-grid">
            <article v-for="booking in cancelledBookings" :key="booking.BookingID" class="booking-card muted">
              <div class="card-top">
                <span class="pill">{{ booking.category }}</span>
                <span class="pill" :class="booking.PaymentStatus">{{ paymentStatusLabel(booking.PaymentStatus) }}</span>
              </div>
              <h3>{{ booking.name }}</h3>
              <p class="trainer">{{ formatDate(booking.date) }} at {{ booking.startTime }}</p>
            </article>
          </div>
        </section>
      </template>

      <div v-if="cancelTarget" class="modal-backdrop" role="presentation">
        <div class="modal" role="dialog" aria-modal="true" aria-labelledby="cancel-booking-title">
          <h2 id="cancel-booking-title">Cancel Booking</h2>
          <p>
            Cancel your booking for {{ cancelTarget.name }} on {{ formatDate(cancelTarget.date) }}?
            Paid bookings will be marked as refunded.
          </p>
          <div class="modal-actions">
            <button class="ghost-button" type="button" @click="closeCancelModal">Keep Booking</button>
            <button class="danger-button" type="button" :disabled="cancelling" @click="confirmCancelBooking">
              {{ cancelling ? 'Cancelling...' : 'Cancel Booking' }}
            </button>
          </div>
        </div>
      </div>
    </section>
  </main>
</template>

<style scoped>
.page {
  min-height: calc(100vh - 64px);
  background:
    radial-gradient(circle at top, rgba(249, 115, 22, 0.08), transparent 28%),
    linear-gradient(180deg, #060606 0%, var(--gym-bg) 45%, #080808 100%);
  padding: 4rem 1.25rem;
}

.container {
  max-width: 1080px;
  margin: 0 auto;
}

.page-head {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.eyebrow {
  color: var(--gym-orange);
  font-size: 0.74rem;
  font-weight: 800;
  letter-spacing: 0.18em;
  margin: 0 0 0.35rem;
  text-transform: uppercase;
}

h1,
h2,
h3 {
  color: var(--gym-text);
  margin: 0;
  text-transform: uppercase;
}

h1 {
  font-size: clamp(2.1rem, 5vw, 3.4rem);
}

.page-head p:last-child,
.trainer,
.status,
.empty,
dt {
  color: var(--gym-text-muted);
}

.browse-link {
  min-height: 42px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  background: var(--gym-orange);
  color: white;
  font-weight: 900;
  padding: 0 1rem;
  text-decoration: none;
  text-transform: uppercase;
}

.status,
.empty {
  text-align: center;
  margin-top: 2rem;
}

.status.error {
  color: #ff8b8b;
}

.status.success {
  color: #8ff0b4;
}

.empty a {
  color: var(--gym-orange);
}

.booking-section {
  margin-top: 1.5rem;
}

.section-title {
  margin-bottom: 1rem;
}

.booking-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1rem;
}

.booking-card {
  background: linear-gradient(145deg, rgba(17, 17, 17, 0.98), rgba(10, 10, 10, 0.98));
  border: 1px solid rgba(249, 115, 22, 0.18);
  border-left: 4px solid var(--gym-orange);
  border-radius: 8px;
  box-shadow: 0 18px 36px rgba(0, 0, 0, 0.3);
  padding: 1.15rem;
}

.booking-card.muted {
  border-left-color: rgba(255, 255, 255, 0.18);
  opacity: 0.78;
}

.card-top {
  display: flex;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.pill {
  border: 1px solid rgba(249, 115, 22, 0.25);
  border-radius: 999px;
  color: #fdba74;
  font-size: 0.72rem;
  font-weight: 800;
  padding: 0.35rem 0.65rem;
  text-transform: uppercase;
}

.pill.paid {
  color: #8ff0b4;
}

.pill.pending {
  color: #ffd18a;
}

dl {
  display: grid;
  gap: 0.55rem;
  margin: 1rem 0 0;
}

dl div {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
}

dt,
dd {
  margin: 0;
}

dd {
  color: var(--gym-text);
  text-align: right;
}

.danger-button,
.ghost-button {
  min-height: 40px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 900;
  padding: 0 0.9rem;
  text-transform: uppercase;
}

.danger-button {
  border: 1px solid rgba(255, 64, 64, 0.45);
  background: rgba(255, 64, 64, 0.12);
  color: #ff6969;
  margin-top: 1rem;
}

.ghost-button {
  border: 1px solid var(--gym-border);
  background: transparent;
  color: var(--gym-text);
}

.danger-button:disabled {
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

.modal {
  width: min(440px, 100%);
  border: 1px solid rgba(249, 115, 22, 0.22);
  border-radius: 8px;
  background: #111;
  box-shadow: 0 20px 44px rgba(0, 0, 0, 0.45);
  padding: 1.25rem;
}

.modal p {
  color: var(--gym-text-muted);
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 1rem;
}

@media (max-width: 720px) {
  .page-head {
    align-items: stretch;
    flex-direction: column;
  }

  dl div {
    align-items: flex-start;
    flex-direction: column;
    gap: 0.15rem;
  }

  dd {
    text-align: left;
  }

  .modal-actions {
    flex-direction: column;
  }
}
</style>
