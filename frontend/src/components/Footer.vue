<script setup lang="ts">
import { RouterLink } from 'vue-router'

const year = new Date().getFullYear()
</script>

<template>
  <footer class="footer">
    <div class="footer-inner">

      <div class="col brand-col">
        <span class="brand">GymCore</span>
        <p>Train harder. Live stronger.<br />Kosovo's premier fitness destination.</p>
        <!-- decorative chips; swap spans for <a href> when real profiles exist -->
        <div class="socials" aria-hidden="true">
          <span><i class="pi pi-facebook" /></span>
          <span><i class="pi pi-instagram" /></span>
          <span><i class="pi pi-youtube" /></span>
        </div>
      </div>

      <div class="col">
        <h4>Navigate</h4>
        <RouterLink to="/home">Home</RouterLink>
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
      <span>© {{ year }} GymCore. All rights reserved.</span>
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

.socials {
  display: flex;
  gap: 0.6rem;
  margin-top: 0.5rem;
}

.socials span {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--gym-surface-raised);
  border: 1px solid var(--gym-border);
  color: var(--gym-text-muted);
  transition: var(--gym-transition);
}

.socials span:hover {
  background: var(--gym-orange);
  border-color: var(--gym-orange);
  color: #000;
  transform: translateY(-3px);
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
  transition: var(--gym-transition);
}

.col a:hover {
  color: var(--gym-orange);
  padding-left: 5px;
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
