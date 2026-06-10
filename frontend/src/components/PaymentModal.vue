<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import InputMask from 'primevue/inputmask'
import Button from 'primevue/button'

/**
 * Static "payment" modal — purely cosmetic checkout UI.
 *
 * The card fields below are decorative only: they are never validated, read, or
 * sent anywhere. This component owns *presentation* (the dialog, the form, the
 * styling/animation); it does not know how to charge anyone. Clicking "Pay"
 * simply emits `confirm` and hands control back to the parent, which decides what
 * (if anything) actually happens. There is no real payment, gateway, or network
 * call in this file.
 */
const props = defineProps<{
  // The plan the user clicked — read-only; we only display its name/price/duration.
  plan: { PlanName?: string; Price?: number | string; DurationMonths?: number } | null
  // Reflects the parent's "processing" state so the Pay button can show a spinner
  // and the modal can't be dismissed mid-flow. Cosmetic only.
  loading?: boolean
}>()

const emit = defineEmits<{ confirm: [] }>()

// Open/close is owned by the parent via `v-model:visible`.
const visible = defineModel<boolean>('visible', { default: false })

// Cosmetic card fields — decorative only, never read or transmitted.
const cardName = ref('')
const cardNumber = ref('')
const cardExpiry = ref('')
const cardCvc = ref('')

// Clear the (purely cosmetic) fields whenever the modal opens, so a previous
// glance never lingers into the next one.
watch(visible, (open) => {
  if (open) {
    cardName.value = ''
    cardNumber.value = ''
    cardExpiry.value = ''
    cardCvc.value = ''
  }
})

// €30, formatted to match the plan card the user clicked on the Home page.
const price = computed(() => `€${Number(props.plan?.Price ?? 0).toFixed(0)}`)
const period = computed(() => {
  const months = props.plan?.DurationMonths ?? 1
  return `${months} ${months === 1 ? 'month' : 'months'}`
})

function close() {
  if (props.loading) return
  visible.value = false
}

function onPay() {
  // No validation, no submission, no network — just hand off to the parent.
  if (props.loading) return
  emit('confirm')
}
</script>

<template>
  <Dialog
    v-model:visible="visible"
    modal
    blockScroll
    :draggable="false"
    :dismissableMask="!loading"
    :closable="!loading"
    :closeOnEscape="!loading"
    header="Checkout"
    class="gym-pay-dialog"
    :style="{ width: 'min(26rem, 92vw)' }"
    :pt="{
      mask: { class: 'gym-pay-mask' },
      transition: {
        enterFromClass: 'gym-pay-enter-from',
        enterActiveClass: 'gym-pay-enter-active',
        enterToClass: 'gym-pay-enter-to',
        leaveFromClass: 'gym-pay-leave-from',
        leaveActiveClass: 'gym-pay-leave-active',
        leaveToClass: 'gym-pay-leave-to',
      },
    }"
  >
    <!-- Selected plan summary (read-only — mirrors the plan the user picked) -->
    <div class="gym-pay-summary">
      <div class="row">
        <span class="name">{{ plan?.PlanName }}</span>
        <span class="per">/ {{ period }}</span>
      </div>
      <div class="row total">
        <span>Total</span>
        <strong class="amt">{{ price }}</strong>
      </div>
    </div>

    <!-- Cosmetic card form — submit on Enter just triggers the same no-op handler. -->
    <form class="gym-pay-form" @submit.prevent="onPay">
      <label class="field">
        <span>Cardholder name</span>
        <InputText v-model="cardName" placeholder="Name on card" autocomplete="off" />
      </label>

      <label class="field">
        <span>Card number</span>
        <InputMask
          v-model="cardNumber"
          mask="9999 9999 9999 9999"
          placeholder="0000 0000 0000 0000"
        />
      </label>

      <div class="field-row">
        <label class="field">
          <span>Expiry</span>
          <InputMask v-model="cardExpiry" mask="99/99" placeholder="MM/YY" />
        </label>
        <label class="field">
          <span>CVC</span>
          <InputMask v-model="cardCvc" mask="999" placeholder="123" />
        </label>
      </div>

      <p class="gym-pay-note">
        <i class="pi pi-lock" /> Demo only — no real payment is processed.
      </p>
    </form>

    <template #footer>
      <Button label="Cancel" text severity="secondary" :disabled="loading" @click="close" />
      <Button
        :label="`Pay ${price}`"
        icon="pi pi-credit-card"
        :loading="loading"
        class="gym-btn-primary"
        @click="onPay"
      />
    </template>
  </Dialog>
</template>

<!-- Slot content (summary + form) is owned by this component, so scoped styles
     reach it even though PrimeVue teleports the dialog to <body>. -->
<style scoped>
.gym-pay-summary {
  background: var(--gym-surface-raised);
  border: 1px solid var(--gym-border);
  border-radius: 10px;
  padding: 0.85rem 1rem;
  margin-bottom: 1.25rem;
}

.gym-pay-summary .row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.9rem;
  color: var(--gym-text-muted);
}

.gym-pay-summary .row .name {
  color: var(--gym-text);
  font-weight: 700;
}

.gym-pay-summary .row.total {
  margin-top: 0.5rem;
  padding-top: 0.5rem;
  border-top: 1px solid var(--gym-border);
  color: var(--gym-text);
}

.gym-pay-summary .amt {
  color: var(--gym-orange);
  font-size: 1.2rem;
  font-weight: 800;
}

.gym-pay-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.gym-pay-form .field {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  flex: 1;
}

.gym-pay-form .field > span {
  font-size: 0.72rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--gym-text-muted);
}

.gym-pay-form .field-row {
  display: flex;
  gap: 1rem;
}

/* Full-width fields + grey placeholders. The orange focus border + ring is already
   provided globally by base.css (.p-inputtext:enabled:focus). */
.gym-pay-form .field :deep(input) {
  width: 100%;
}

.gym-pay-form .field :deep(input)::placeholder {
  color: var(--gym-text-muted);
}

.gym-pay-note {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.78rem;
  color: var(--gym-text-muted);
  margin-top: 0.1rem;
}

.gym-pay-note .pi {
  color: var(--gym-orange);
}
</style>

<!-- Dialog chrome is rendered by PrimeVue and teleported to <body>, so it lives
     outside the scoped tree. These rules are global but namespaced to .gym-pay-*
     so no other dialog in the app is affected. Class selectors are doubled where
     they must beat PrimeVue's runtime-injected theme rules (same trick base.css
     uses on .p-button / .p-inputtext). -->
<style>
/* Backdrop: dark wash + blur. PrimeVue animates the modal mask's background with a
   `forwards` keyframe whose end state reads --px-mask-background, and a running
   animation beats a plain `background` declaration regardless of specificity — so we
   set that custom property to land on the spec's 0.7 (the `background` below is just a
   fallback for when the animation doesn't run). */
.gym-pay-mask.gym-pay-mask {
  --px-mask-background: rgba(0, 0, 0, 0.7);
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
}

/* Dialog surface: GymCore card surface + radius + hairline border + lift shadow */
.gym-pay-dialog.gym-pay-dialog {
  background: var(--gym-surface);
  border: 1px solid var(--gym-border);
  border-radius: 14px;
  box-shadow: var(--gym-shadow-lift);
  overflow: hidden;
}

.gym-pay-dialog .p-dialog-header {
  background: transparent;
  border-bottom: 1px solid var(--gym-border);
  padding: 1.1rem 1.35rem;
}

.gym-pay-dialog .p-dialog-title {
  font-size: 1.05rem;
  font-weight: 800;
  letter-spacing: 0.02em;
  color: var(--gym-text);
}

.gym-pay-dialog .p-dialog-content {
  background: transparent;
  padding: 1.35rem;
}

.gym-pay-dialog .p-dialog-footer {
  background: transparent;
  border-top: 1px solid var(--gym-border);
  padding: 1rem 1.35rem;
  gap: 0.5rem;
}

/* Close (×): muted, warms to GymCore orange on hover (never red). The class is
   doubled so these beat Aura's .p-button-text.p-button-secondary(:hover) rules,
   which the × button also carries. */
.gym-pay-dialog .p-dialog-close-button.p-dialog-close-button {
  color: var(--gym-text-muted);
}

.gym-pay-dialog .p-dialog-close-button.p-dialog-close-button:not(:disabled):hover {
  color: var(--gym-orange);
  background: var(--gym-orange-wash);
}

/* Enter/leave: soft fade + scale, 300ms on GymCore's standard easing. The phase
   classes land on the same element as .gym-pay-dialog, so we qualify them with it
   to beat the runtime-injected `.p-dialog { transform: scale(1) }` (otherwise the
   scale/translate is overridden and only the opacity fade survives). */
.gym-pay-dialog.gym-pay-enter-active,
.gym-pay-dialog.gym-pay-leave-active {
  transition: opacity 0.3s var(--gym-ease), transform 0.3s var(--gym-ease);
}

.gym-pay-dialog.gym-pay-enter-from,
.gym-pay-dialog.gym-pay-leave-to {
  opacity: 0;
  transform: scale(0.95) translateY(10px);
}

@media (prefers-reduced-motion: reduce) {
  .gym-pay-dialog.gym-pay-enter-active,
  .gym-pay-dialog.gym-pay-leave-active {
    transition-duration: 0.01ms;
  }

  .gym-pay-dialog.gym-pay-enter-from,
  .gym-pay-dialog.gym-pay-leave-to {
    opacity: 1;
    transform: none;
  }
}
</style>
