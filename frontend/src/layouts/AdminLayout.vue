<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'

const navItems = [
  { icon: 'pi pi-home',       label: 'Dashboard',   to: '/admin' },
  { icon: 'pi pi-users',      label: 'Users',        to: '/admin/members' },
  { icon: 'pi pi-user-plus',  label: 'Create User',  to: '/admin/users/create' },
  { icon: 'pi pi-calendar',   label: 'Classes',      to: '/admin/classes' },
  { icon: 'pi pi-tags',       label: 'Plans',        to: '/admin/plans' },
]
</script>

<template>
  <div class="admin-layout">

    <aside class="sidebar">
      <p class="sidebar-title">Admin Panel</p>
      <nav>
        <RouterLink
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          class="nav-item"
          exact-active-class="active"
        >
          <i :class="item.icon" />
          <span>{{ item.label }}</span>
        </RouterLink>
      </nav>
    </aside>

    <main class="content">
      <RouterView />
    </main>

  </div>
</template>

<style scoped>
.admin-layout {
  display: flex;
  min-height: calc(100vh - 64px);
  background: var(--gym-bg);
}

/* Sidebar */
.sidebar {
  width: 220px;
  flex-shrink: 0;
  background: var(--gym-surface);
  border-right: 1px solid var(--gym-border);
  padding: 1.5rem 0;
  position: sticky;
  top: 64px;
  height: calc(100vh - 64px);
  overflow-y: auto;
}

.sidebar-title {
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--gym-text-muted);
  padding: 0 1.25rem 0.75rem;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.7rem 1.25rem;
  color: var(--gym-text-muted);
  text-decoration: none;
  font-size: 0.9rem;
  transition: background 0.15s, color 0.15s;
  border-left: 3px solid transparent;
}

.nav-item i {
  font-size: 1rem;
  width: 16px;
}

.nav-item:hover {
  background: var(--gym-surface-raised);
  color: var(--gym-text);
}

.nav-item.active {
  color: var(--gym-orange);
  border-left-color: var(--gym-orange);
  background: var(--gym-orange-subtle);
}

/* Content */
.content {
  flex: 1;
  padding: 2.5rem;
  overflow-y: auto;
}
</style>
