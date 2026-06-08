<script setup lang="ts">
import { onMounted, ref } from 'vue'
import Card from 'primevue/card'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import InputMask from 'primevue/inputmask'
import Tag from 'primevue/tag'
import ProgressSpinner from 'primevue/progressspinner'
import { useToast } from 'primevue/usetoast'
import { useAuthStore } from '@/stores/auth'
import { getPlans, subscribe } from '@/api/plans'
import { useCancelMembership } from '@/composables/useCancelMembership'

const auth = useAuthStore()
const toast = useToast()
const { requestCancel, cancelling } = useCancelMembership()

const plans = ref<any[]>([])
const loading = ref(true)

const checkoutVisible = ref(false)
const selectedPlan = ref<any>(null)
const processing = ref(false)

// Cosmetic card fields — decorative only, never sent to the backend.
const cardName = ref('')
const cardNumber = ref('')
const cardExpiry = ref('')
const cardCvc = ref('')

const formatEuro = (value: unknown) => `€${Number(value ?? 0).toFixed(2)}`
const formatDuration = (months: number) => `${months} ${months === 1 ? 'month' : 'months'}`
const formatDate = (value: unknown) => (value ? new Date(value as string).toLocaleDateString() : '')

async function loadPlans() {
  loading.value = true
  try {
    const { data } = await getPlans()
    plans.value = data.data.plans ?? []
  } catch {
    plans.value = []
    toast.add({
      severity: 'error',
      summary: 'Could not load plans',
      detail: 'Please try again in a moment.',
      life: 4000,
    })
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  await loadPlans()
  if (auth.user) auth.refreshMembership()
})

function isCurrentPlan(plan: any) {
  return auth.hasMembership && auth.membership?.PlanID === plan.PlanID
}

function openCheckout(plan: any) {
  selectedPlan.value = plan
  cardName.value = ''
  cardNumber.value = ''
  cardExpiry.value = ''
  cardCvc.value = ''
  processing.value = false
  checkoutVisible.value = true
}

async function pay() {
  if (!selectedPlan.value || processing.value) return
  processing.value = true

  // Fake "processing" delay for realism — there is no real gateway.
  await new Promise((resolve) => setTimeout(resolve, 1000))

  try {
    // Only the plan id + a cosmetic payment method are sent. No card data leaves the browser.
    await subscribe(selectedPlan.value.PlanID, 'card')
    await auth.refreshMembership()
    toast.add({
      severity: 'success',
      summary: 'Payment successful',
      detail: 'Your membership is active.',
      life: 4000,
    })
    checkoutVisible.value = false
  } catch (e: any) {
    toast.add({
      severity: 'error',
      summary: 'Something went wrong',
      detail: e.response?.data?.message ?? 'Please try again.',
      life: 4000,
    })
  } finally {
    processing.value = false
  }
}
</script>

<template>
  <main class="page">
    <div class="container">
      <header class="head">
        <h1>Membership Plans</h1>
        <p>Choose the plan that fits your training. Subscribe in seconds.</p>
      </header>

      <!-- Current active membership -->
      <section v-if="auth.hasMembership" class="active-banner">
        <i class="pi pi-verified" />
        <div class="active-text">
          <span>
            Active plan: <strong>{{ auth.membership?.PlanName }}</strong>
          </span>
          <span class="muted">Valid until {{ formatDate(auth.membership?.EndDate) }}</span>
        </div>
        <Tag
          :value="auth.membership?.Status"
          :severity="auth.membership?.Status === 'active' ? 'success' : 'secondary'"
          class="status-tag"
        />
        <Button
          v-if="auth.membership?.Status === 'active'"
          label="Cancel membership"
          icon="pi pi-times"
          severity="danger"
          outlined
          size="small"
          :loading="cancelling"
          @click="requestCancel(auth.membership)"
        />
      </section>

      <!-- Plans -->
      <p v-if="loading" class="status">Loading plans…</p>
      <p v-else-if="!plans.length" class="status">No membership plans available right now.</p>

      <div v-else class="plans-grid">
        <Card
          v-for="plan in plans"
          :key="plan.PlanID"
          class="plan-card"
          :class="{ active: isCurrentPlan(plan) }"
        >
          <template #content>
            <h3 class="plan-name">{{ plan.PlanName }}</h3>

            <div class="price">
              <span class="amount">{{ formatEuro(plan.Price) }}</span>
              <span class="period">/ {{ formatDuration(plan.DurationMonths) }}</span>
            </div>

            <Tag
              v-if="plan.IncludesClasses"
              value="Includes classes"
              severity="success"
              icon="pi pi-check"
              class="includes-tag"
            />
            <Tag
              v-else
              value="Gym access only"
              severity="secondary"
              class="includes-tag"
            />

            <p class="plan-desc">{{ plan.Description }}</p>

            <Button
              v-if="isCurrentPlan(plan)"
              label="Current plan"
              icon="pi pi-check"
              disabled
              fluid
            />
            <Button
              v-else
              label="Subscribe"
              icon="pi pi-credit-card"
              @click="openCheckout(plan)"
              fluid
            />
          </template>
        </Card>
      </div>
    </div>

    <!-- Cosmetic checkout dialog -->
    <Dialog
      v-model:visible="checkoutVisible"
      modal
      :draggable="false"
      :closable="!processing"
      header="Checkout"
      class="checkout-dialog"
      :style="{ width: '26rem' }"
    >
      <div v-if="selectedPlan" class="summary">
        <div class="summary-row">
          <span>{{ selectedPlan.PlanName }} · {{ formatDuration(selectedPlan.DurationMonths) }}</span>
          <strong>{{ formatEuro(selectedPlan.Price) }}</strong>
        </div>
        <div class="summary-row total">
          <span>Total</span>
          <strong>{{ formatEuro(selectedPlan.Price) }}</strong>
        </div>
      </div>

      <form class="card-form" @submit.prevent="pay">
        <div class="field">
          <label for="cardName">Cardholder name</label>
          <InputText id="cardName" v-model="cardName" placeholder="Name on card" autocomplete="off" />
        </div>

        <div class="field">
          <label for="cardNumber">Card number</label>
          <InputMask
            id="cardNumber"
            v-model="cardNumber"
            mask="9999 9999 9999 9999"
            placeholder="0000 0000 0000 0000"
          />
        </div>

        <div class="field-row">
          <div class="field">
            <label for="cardExpiry">Expiry</label>
            <InputMask id="cardExpiry" v-model="cardExpiry" mask="99/99" placeholder="MM/YY" />
          </div>
          <div class="field">
            <label for="cardCvc">CVC</label>
            <InputMask id="cardCvc" v-model="cardCvc" mask="999" placeholder="123" />
          </div>
        </div>

        <p class="demo-note">
          <i class="pi pi-lock" /> Demo only — no real payment is processed.
        </p>
      </form>

      <div v-if="processing" class="processing">
        <ProgressSpinner style="width: 2.5rem; height: 2.5rem" strokeWidth="4" />
        <span>Processing…</span>
      </div>

      <template #footer>
        <Button label="Cancel" severity="secondary" text :disabled="processing" @click="checkoutVisible = false" />
        <Button
          :label="`Pay ${formatEuro(selectedPlan?.Price)}`"
          icon="pi pi-credit-card"
          :loading="processing"
          @click="pay"
        />
      </template>
    </Dialog>
  </main>
</template>

<style scoped>
.page {
  min-height: calc(100vh - 64px);
  background: var(--gym-bg);
  padding: 3rem 2rem 5rem;
}

.container {
  max-width: 1100px;
  margin: 0 auto;
}

.head {
  text-align: center;
  margin-bottom: 2rem;
}

.head h1 {
  font-size: 2rem;
  font-weight: 800;
  color: var(--gym-text);
  margin-bottom: 0.5rem;
}

.head p {
  color: var(--gym-text-muted);
  font-size: 1rem;
}

/* Active membership banner */
.active-banner {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  max-width: 700px;
  margin: 0 auto 2.5rem;
  padding: 0.85rem 1.1rem;
  border-radius: 12px;
  background: var(--gym-orange-subtle);
  border: 1px solid rgba(249, 115, 22, 0.3);
  color: var(--gym-text);
}

.active-banner > i {
  font-size: 1.4rem;
  color: var(--gym-orange);
}

.active-text {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  flex: 1;
}

.active-text strong {
  color: var(--gym-orange);
}

.active-text .muted {
  font-size: 0.82rem;
  color: var(--gym-text-muted);
}

.status-tag {
  text-transform: capitalize;
}

/* Plans grid */
.plans-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1.5rem;
}

.plan-card {
  background: var(--gym-surface) !important;
  border: 1px solid var(--gym-border) !important;
  text-align: center;
  transition: border-color 0.15s ease, transform 0.15s ease;
}

.plan-card:hover {
  transform: translateY(-2px);
  border-color: var(--gym-orange) !important;
}

.plan-card.active {
  border-color: var(--gym-orange) !important;
  box-shadow: 0 0 0 1px var(--gym-orange);
}

.plan-name {
  font-size: 1.2rem;
  font-weight: 700;
  color: var(--gym-text);
  margin-bottom: 0.5rem;
}

.price {
  margin-bottom: 0.75rem;
}

.amount {
  font-size: 2rem;
  font-weight: 800;
  color: var(--gym-orange);
}

.period {
  font-size: 0.85rem;
  color: var(--gym-text-muted);
}

.includes-tag {
  margin-bottom: 0.85rem;
}

.plan-desc {
  font-size: 0.88rem;
  color: var(--gym-text-muted);
  line-height: 1.5;
  margin-bottom: 1.1rem;
  min-height: 2.6rem;
}

.status {
  text-align: center;
  color: var(--gym-text-muted);
}

/* Checkout dialog */
.summary {
  border: 1px solid var(--gym-border);
  border-radius: 10px;
  padding: 0.85rem 1rem;
  margin-bottom: 1.25rem;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.9rem;
  color: var(--gym-text-muted);
}

.summary-row.total {
  margin-top: 0.5rem;
  padding-top: 0.5rem;
  border-top: 1px solid var(--gym-border);
  color: var(--gym-text);
  font-size: 1rem;
}

.summary-row.total strong {
  color: var(--gym-orange);
}

.card-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  flex: 1;
}

.field label {
  font-size: 0.78rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--gym-text-muted);
}

.field :deep(input) {
  width: 100%;
}

.field-row {
  display: flex;
  gap: 1rem;
}

.demo-note {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.8rem;
  color: var(--gym-text-muted);
  margin-top: 0.25rem;
}

.processing {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  margin-top: 1.25rem;
  color: var(--gym-text-muted);
  font-size: 0.9rem;
}
</style>
