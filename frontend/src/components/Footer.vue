<script setup lang="ts">
import { RouterLink } from 'vue-router'

const year = new Date().getFullYear()
</script>

<template>
  <footer class="footer">
    <div class="footer-inner">

      <div class="col brand-col">
        <span class="brand">BBros Gym</span>
        <p>Train harder. Live stronger.<br />Kosovo's premier fitness destination.</p>
      </div>

      <div class="col">
        <h4>Navigate</h4>
        <RouterLink to="/home">Home</RouterLink>
        <RouterLink to="/classes">Classes</RouterLink>
        <RouterLink to="/about">About Us</RouterLink>
      </div>

      <div class="col">
        <h4>Contact</h4>
        <span>Prishtina, Kosovo</span>
        <span>info@bbrosgym.com</span>
        <span>+383 44 000 000</span>
      </div>

    </div>

    <div class="footer-bottom">
      <span>© {{ year }} BBros Gym. All rights reserved.</span>
    </div>
  </footer>
</template>

<style scoped>
.footer {
  background: var(--gym-surface);
  border-top: 1px solid var(--gym-border);
}

.footer-inner {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr;
  gap: 3rem;
  max-width: 1100px;
  margin: 0 auto;
  padding: 3rem 2rem;
}

.col {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.brand {
  font-size: 1.2rem;
  font-weight: 700;
  color: var(--gym-orange);
  letter-spacing: 0.03em;
  margin-bottom: 0.25rem;
}

.brand-col p {
  font-size: 0.88rem;
  color: var(--gym-text-muted);
  line-height: 1.6;
  margin: 0;
}

h4 {
  font-size: 0.78rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--gym-text-muted);
  margin-bottom: 0.25rem;
}

.col a {
  font-size: 0.9rem;
  color: var(--gym-text-muted);
  text-decoration: none;
  transition: color 0.15s;
}

.col a:hover {
  color: var(--gym-orange);
}

.col span {
  font-size: 0.9rem;
  color: var(--gym-text-muted);
}

.footer-bottom {
  border-top: 1px solid var(--gym-border);
  padding: 1.25rem 2rem;
  text-align: center;
}

.footer-bottom span {
  font-size: 0.82rem;
  color: var(--gym-text-muted);
}

@media (max-width: 640px) {
  .footer-inner {
    grid-template-columns: 1fr;
    gap: 2rem;
  }
}
</style>
