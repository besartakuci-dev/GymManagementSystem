<script setup lang="ts">
import { ref } from 'vue'
import coverImage from '@/assets/Login_Register_Cover.png'
import Password from 'primevue/password'
import Button from 'primevue/button'

// Static UI only — no validation, no token, no network, no storage. Reached as
// if from an email link. The button just advances the local view to the success
// state. Passwords are never checked, matched, or submitted anywhere.
const stage = ref<'form' | 'done'>('form')
const password = ref('')
const confirmPassword = ref('')

function showSuccess() {
  // Intentionally does NOT validate or check that the passwords match — static
  // transition only.
  stage.value = 'done'
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

        <!-- Enter a new password -->
        <form v-if="stage === 'form'" key="form" @submit.prevent="showSuccess">
          <div class="head">
            <h1>Set a new password</h1>
            <p>Choose a new password for your account.</p>
          </div>
          <Password v-model="password" placeholder="New password" :feedback="false" toggleMask fluid />
          <Password v-model="confirmPassword" placeholder="Confirm new password" :feedback="false" toggleMask fluid />
          <Button type="submit" label="Reset password" fluid />
          <RouterLink to="/login" class="auth-link">Back to login</RouterLink>
        </form>

        <!-- Success (nothing was actually changed) -->
        <div v-else key="done" class="confirm">
          <div class="icon-wrap">
            <i class="pi pi-check-circle icon" />
          </div>
          <div class="head">
            <h1>Password updated</h1>
            <p>Your password has been updated — you can now log in.</p>
          </div>
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
