<script setup lang="ts">
</script>

<template>
  <main class="page">
    <div class="container">
      <h1>Members</h1>
      <p>All registered gym members will be listed here.</p>
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
  max-width: 1000px;
  margin: 0 auto;
}

h1 {
  font-size: 2rem;
  font-weight: 800;
  color: var(--gym-text);
  margin-bottom: 0.75rem;
}

p { color: var(--gym-text-muted); }
</style>
