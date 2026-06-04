<script setup lang="ts">
import { RouterLink } from 'vue-router'
import Card from 'primevue/card'
import Button from 'primevue/button'

const sections = [
  { icon: 'pi pi-users',    label: 'Members',  to: '/admin/members', desc: 'View and manage all gym members.' },
  { icon: 'pi pi-id-card',  label: 'Trainers', to: '/admin/trainers', desc: 'View and manage trainers.' },
  { icon: 'pi pi-calendar', label: 'Classes',  to: '/admin/classes',  desc: 'Manage class schedule and types.' },
]
</script>

<template>
  <main class="page">
    <div class="container">
      <h1>Admin Panel</h1>
      <p>Manage all gym resources from here.</p>

      <div class="grid">
        <Card v-for="s in sections" :key="s.label" class="section-card">
          <template #content>
            <i :class="s.icon" class="section-icon" />
            <h3>{{ s.label }}</h3>
            <p>{{ s.desc }}</p>
            <RouterLink :to="s.to">
              <Button :label="`Go to ${s.label}`" size="small" style="margin-top: 1rem" />
            </RouterLink>
          </template>
        </Card>
      </div>
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
  margin-bottom: 0.4rem;
}

.container > p {
  color: var(--gym-text-muted);
  margin-bottom: 2.5rem;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1.5rem;
}

.section-card {
  background: var(--gym-surface) !important;
  border: 1px solid var(--gym-border) !important;
  text-align: center;
}

.section-icon {
  font-size: 2rem;
  color: var(--gym-orange);
  margin-bottom: 0.75rem;
}

.section-card h3 {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--gym-text);
  margin-bottom: 0.4rem;
}

.section-card p {
  font-size: 0.88rem;
  color: var(--gym-text-muted);
}
</style>
