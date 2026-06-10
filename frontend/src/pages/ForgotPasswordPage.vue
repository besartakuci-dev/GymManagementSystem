<script setup lang="ts">
import { ref } from 'vue'
import coverImage from '@/assets/Login_Register_Cover.png'
import InputText from 'primevue/inputtext'
import Button from 'primevue/button'

// Static UI only — no validation, no email, no token, no network, no storage.
// The button just advances the local view from the email form to the
// confirmation state. Nothing is ever sent.
const stage = ref<'request' | 'sent'>('request')
const email = ref('')

function showConfirmation() {
  // Intentionally does NOT validate or send anything — static transition only.
  stage.value = 'sent'
}

function resend() {
  // Optional "Resend" — intentionally a no-op (nothing is sent).
}
</script>

<template>
  <main class="auth-page">

    <!-- Left: cover image (same artwork as login / register) -->
    <div class="cover">
      <img :src="coverImage" alt="GymCore" />
    </div>

    <!-- Right: card -->
    <div class="card">
      <Transition appear name="auth-fade" mode="out-in">

        <!-- State A — enter email -->
        <form v-if="stage === 'request'" key="request" @submit.prevent="showConfirmation">
          <div class="head">
            <h1>Forgot your password?</h1>
            <p>Enter the email linked to your account and we'll send you a link to reset your password.</p>
          </div>
          <InputText v-model="email" type="email" placeholder="Email" fluid />
          <Button type="submit" label="Send reset link" fluid />
          <RouterLink to="/login" class="auth-link">Back to login</RouterLink>
        </form>

        <!-- State B — confirmation (nothing was actually sent) -->
        <div v-else key="sent" class="confirm">
          <div class="icon-wrap">
            <i class="pi pi-envelope icon" />
          </div>
          <div class="head">
            <h1>Check your email</h1>
            <p>If an account exists for that email, we've sent a reset link.</p>
          </div>
          <p class="resend-note">
            Didn't receive it?
            <button type="button" class="auth-link inline" @click="resend">Resend</button>
          </p>
          <RouterLink to="/login" class="auth-link">Back to login</RouterLink>
        </div>

      </Transition>
    </div>

  </main>
</template>

<style scoped>
.auth-page {
  min-height: calc(100vh - 64px);
  display: grid;
  grid-template-columns: 1fr 1fr;
  background: var(--gym-bg);
}

/* Left panel */
.cover {
  position: relative;
  overflow: hidden;
}

.cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

/* dark gradient for depth (matches the login/register cover) */
.cover::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(0, 0, 0, 0.65) 0%, rgba(10, 10, 10, 0.35) 50%, rgba(0, 0, 0, 0.6) 100%);
}

/* orange accent line along the bottom of the photo panel */
.cover::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 4px;
  background: linear-gradient(90deg, transparent, var(--gym-orange), transparent);
}

/* Right panel */
.card {
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 3rem 3.5rem;
  background: var(--gym-surface);
  border-left: 1px solid var(--gym-border);
}

form {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.confirm {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.85rem;
  text-align: center;
}

.head h1 {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--gym-text);
  margin-bottom: 0.5rem;
}

.head p {
  color: var(--gym-text-muted);
  font-size: 0.9rem;
  line-height: 1.6;
}

/* orange-tinted icon badge — same pattern as the rest of the app */
.icon-wrap {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: var(--gym-orange-subtle);
  display: flex;
  align-items: center;
  justify-content: center;
}

.icon {
  font-size: 2rem;
  color: var(--gym-orange);
}

/* muted link, eases toward orange on hover (matches the app's auth links) */
.auth-link {
  align-self: center;
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  font-family: inherit;
  font-size: 0.85rem;
  color: var(--gym-text-muted);
  text-decoration: none;
  transition: var(--gym-transition);
}

.auth-link:hover {
  color: var(--gym-orange);
}

.resend-note {
  font-size: 0.85rem;
  color: var(--gym-text-muted);
}

.auth-link.inline {
  font-size: 0.85rem;
}

/* ~300ms cross-fade between the two states (and on first appear).
   prefers-reduced-motion is honored globally in styles/base.css. */
.auth-fade-enter-active,
.auth-fade-leave-active {
  transition: opacity 0.3s var(--gym-ease), transform 0.3s var(--gym-ease);
}

.auth-fade-enter-from {
  opacity: 0;
  transform: translateY(8px);
}

.auth-fade-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

/* Collapse image on small screens (matches login/register) */
@media (max-width: 768px) {
  .auth-page {
    grid-template-columns: 1fr;
  }

  .cover {
    display: none;
  }

  .card {
    padding: 2rem;
    border-left: none;
  }
}
</style>
