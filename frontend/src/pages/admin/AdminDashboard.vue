<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import Tag from 'primevue/tag'
import { getDashboard, getUsers } from '@/api/admin'

const router = useRouter()

const stats = ref<any>(null)
const users = ref<any[]>([])
const loading = ref(true)

const statCards = [
  { key: 'totalMembers',      label: 'Total Members',      icon: 'pi pi-users' },
  { key: 'activeMemberships', label: 'Active Memberships', icon: 'pi pi-id-card' },
  { key: 'upcomingClasses',   label: 'Upcoming Classes',   icon: 'pi pi-calendar' },
  { key: 'totalBookings',     label: 'Total Bookings',     icon: 'pi pi-bookmark' },
]

onMounted(async () => {
  try {
    const [dashRes, usersRes] = await Promise.all([getDashboard(), getUsers()])
    stats.value = dashRes.data.data
    users.value = usersRes.data.data.users
  } finally {
    loading.value = false
  }
})

function roleSeverity(role: string) {
  if (role === 'admin')   return 'danger'
  if (role === 'trainer') return 'warn'
  return 'secondary'
}
</script>

<template>
  <div class="dashboard">

    <h1>Dashboard</h1>

    <!-- Stats -->
    <div class="stats-grid">
      <div v-for="s in statCards" :key="s.key" class="stat-card">
        <i :class="s.icon" class="stat-icon" />
        <div>
          <p class="stat-value">{{ stats ? stats[s.key] ?? 0 : '—' }}</p>
          <p class="stat-label">{{ s.label }}</p>
        </div>
      </div>
    </div>

    <!-- Users table -->
    <div class="section">
      <div class="section-header">
        <h2>All Users</h2>
        <Button label="Create User" icon="pi pi-plus" size="small" @click="router.push('/admin/users/create')" />
      </div>

      <DataTable
        :value="users"
        :loading="loading"
        stripedRows
        paginator
        :rows="10"
        class="users-table"
      >
        <Column field="FirstName" header="First Name" sortable />
        <Column field="LastName"  header="Last Name"  sortable />
        <Column field="Email"     header="Email"      sortable />
        <Column field="Role"      header="Role"       sortable>
          <template #body="{ data }">
            <Tag :value="data.Role" :severity="roleSeverity(data.Role)" />
          </template>
        </Column>
        <Column field="JoinDate" header="Joined" sortable>
          <template #body="{ data }">
            {{ new Date(data.JoinDate).toLocaleDateString() }}
          </template>
        </Column>
        <Column field="IsActive" header="Status">
          <template #body="{ data }">
            <Tag :value="data.IsActive ? 'Active' : 'Inactive'" :severity="data.IsActive ? 'success' : 'danger'" />
          </template>
        </Column>
      </DataTable>
    </div>

  </div>
</template>

<style scoped>
.dashboard { max-width: 1100px; }

h1 {
  font-size: 1.75rem;
  font-weight: 800;
  color: var(--gym-text);
  margin-bottom: 1.75rem;
}

/* Stats */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 2.5rem;
}

.stat-card {
  background: var(--gym-surface-raised);
  border: 1px solid var(--gym-border);
  border-radius: 10px;
  padding: 1.25rem 1.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
}

.stat-icon {
  font-size: 1.6rem;
  color: var(--gym-orange);
}

.stat-value {
  font-size: 1.6rem;
  font-weight: 800;
  color: var(--gym-text);
  line-height: 1;
}

.stat-label {
  font-size: 0.8rem;
  color: var(--gym-text-muted);
  margin-top: 0.2rem;
}

/* Section */
.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
}

h2 {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--gym-text);
}

.users-table {
  background: var(--gym-surface-raised) !important;
  border: 1px solid var(--gym-border) !important;
  border-radius: 8px;
}
</style>
