<script setup lang="ts">
import { RouterLink } from 'vue-router'
import Button from 'primevue/button'
</script>

<template>
  <main class="page">
    <h1>403</h1>
    <p>You don't have permission to access this page.</p>
    <RouterLink to="/home">
      <Button label="Go Home" />
    </RouterLink>
  </main>
</template>

<style scoped>
.page {
  min-height: calc(100vh - 64px);
  background: var(--gym-bg);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  text-align: center;
}

h1 {
  font-size: 5rem;
  font-weight: 900;
  color: var(--gym-orange);
  line-height: 1;
}

p {
  color: var(--gym-text-muted);
  font-size: 1rem;
}
</style>
