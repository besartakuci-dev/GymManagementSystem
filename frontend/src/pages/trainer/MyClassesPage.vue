<script setup lang="ts">
</script>

<template>
  <main class="page">
    <div class="container">
      <h1>My Classes</h1>
      <p>Your assigned classes and their members will appear here.</p>
    </div>
  </main>
</template>

<style scoped>
.page {
  min-height: calc(100vh - 64px);
  background: var(--gym-bg);
  padding: 4rem 2rem;
}

.container {
  max-width: 900px;
  margin: 0 auto;
}

h1 {
  font-size: 2rem;
  font-weight: 800;
  color: var(--gym-text);
  margin-bottom: 0.75rem;
}

p {
  color: var(--gym-text-muted);
}
</style>
