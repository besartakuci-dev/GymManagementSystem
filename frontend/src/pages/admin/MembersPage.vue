<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useToast } from 'primevue/usetoast'
import { FilterMatchMode } from '@primevue/core/api'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Tag from 'primevue/tag'
import InputText from 'primevue/inputtext'
import Button from 'primevue/button'
import { getUsers, setUserActive } from '@/api/admin'

const toast = useToast()
const users = ref<any[]>([])
const loading = ref(true)

const filters = ref({
  global: { value: null, matchMode: FilterMatchMode.CONTAINS },
})

function roleSeverity(role: string) {
  if (role === 'admin')   return 'danger'
  if (role === 'trainer') return 'warn'
  return 'secondary'
}

const togglingId = ref<number | null>(null)

async function toggleActive(user: any) {
  togglingId.value = user.UserID
  try {
    const res = await setUserActive(user.UserID, !user.IsActive)
    const updated = res.data.data.user
    const idx = users.value.findIndex(u => u.UserID === user.UserID)
    if (idx !== -1) users.value[idx] = updated
    toast.add({
      severity: updated.IsActive ? 'success' : 'warn',
      summary: updated.IsActive ? 'Account activated' : 'Account deactivated',
      detail: `${updated.FirstName} ${updated.LastName}`,
      life: 3000,
    })
  } catch {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Could not update account status', life: 3000 })
  } finally {
    togglingId.value = null
  }
}

async function load() {
  loading.value = true
  try {
    const res = await getUsers()
    users.value = res.data.data.users ?? []
  } catch {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to load members', life: 3000 })
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

<template>
  <div class="members-page">
    <div class="page-header">
      <div>
        <h1>Members</h1>
        <p>All registered gym members.</p>
      </div>
    </div>

    <div class="table-card">
      <DataTable
        :value="users"
        :loading="loading"
        v-model:filters="filters"
        :globalFilterFields="['FirstName', 'LastName', 'Email', 'Role', 'Phone']"
        paginator
        :rows="10"
        :rowsPerPageOptions="[10, 25, 50]"
        stripedRows
        removableSort
        class="members-table"
      >
        <template #header>
          <div class="table-toolbar">
            <span class="search-wrap">
              <i class="pi pi-search search-icon" />
              <InputText
                v-model="filters['global'].value"
                placeholder="Search members..."
                class="search-input"
              />
            </span>
            <span class="count">{{ users.length }} users</span>
          </div>
        </template>

        <template #empty>
          <p class="empty">No members found.</p>
        </template>

        <Column field="UserID" header="ID" sortable style="width: 64px" />

        <Column header="Name" sortable sort-field="FirstName">
          <template #body="{ data }">
            <div class="user-name">
              <div class="avatar">{{ data.FirstName?.[0] }}{{ data.LastName?.[0] }}</div>
              <span>{{ data.FirstName }} {{ data.LastName }}</span>
            </div>
          </template>
        </Column>

        <Column field="Email" header="Email" sortable />

        <Column field="Role" header="Role" sortable style="width: 110px">
          <template #body="{ data }">
            <Tag :value="data.Role" :severity="roleSeverity(data.Role)" />
          </template>
        </Column>

        <Column field="Phone" header="Phone" style="width: 150px">
          <template #body="{ data }">{{ data.Phone || '—' }}</template>
        </Column>

        <Column field="JoinDate" header="Joined" sortable style="width: 130px">
          <template #body="{ data }">
            {{ data.JoinDate ? new Date(data.JoinDate).toLocaleDateString() : '—' }}
          </template>
        </Column>

        <Column field="IsActive" header="Status" sortable style="width: 100px">
          <template #body="{ data }">
            <Tag
              :value="data.IsActive ? 'Active' : 'Inactive'"
              :severity="data.IsActive ? 'success' : 'secondary'"
            />
          </template>
        </Column>

        <Column header="" style="width: 130px">
          <template #body="{ data }">
            <Button
              :label="data.IsActive ? 'Deactivate' : 'Activate'"
              :severity="data.IsActive ? 'danger' : 'success'"
              size="small"
              outlined
              :loading="togglingId === data.UserID"
              @click="toggleActive(data)"
            />
          </template>
        </Column>
      </DataTable>
    </div>
  </div>
</template>

<style scoped>
.members-page {
  max-width: 1100px;
}

.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 1.75rem;
}

h1 {
  font-size: 1.75rem;
  font-weight: 800;
  color: var(--gym-text);
  margin-bottom: 0.25rem;
}

.page-header p {
  color: var(--gym-text-muted);
  font-size: 0.9rem;
}

.table-card {
  background: var(--gym-surface-raised);
  border: 1px solid var(--gym-border);
  border-radius: 10px;
  overflow: hidden;
}

.table-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 0;
}

.search-wrap {
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 0.75rem;
  color: var(--gym-text-muted);
  font-size: 0.85rem;
  pointer-events: none;
}

.search-input {
  padding-left: 2.1rem !important;
  background: var(--gym-surface) !important;
  border: 1px solid var(--gym-border) !important;
  border-radius: 6px !important;
  color: var(--gym-text) !important;
  font-size: 0.875rem;
  width: 260px;
}

.count {
  font-size: 0.8rem;
  color: var(--gym-text-muted);
}

.user-name {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--gym-orange-subtle);
  color: var(--gym-orange);
  font-size: 0.75rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  text-transform: uppercase;
}

.empty {
  text-align: center;
  color: var(--gym-text-muted);
  padding: 2rem 0;
  font-size: 0.9rem;
}
</style>
