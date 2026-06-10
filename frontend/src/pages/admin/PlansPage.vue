<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import DataView from 'primevue/dataview'
import Dialog from 'primevue/dialog'
import Tag from 'primevue/tag'
import Button from 'primevue/button'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'
import { getAdminPlans, createPlan, updatePlan, deletePlan } from '@/api/plans'

const toast = useToast()
const confirm = useConfirm()

const plans = ref<any[]>([])
const loading = ref(true)

// --- Filters / sort (client-side, presentation) ---
const search = ref('')
const statusFilter = ref('all')
const sortOrder = ref<'order' | 'price-asc' | 'price-desc'>('order')

const filtered = computed(() => {
  let list = plans.value.slice()
  const q = search.value.trim().toLowerCase()
  if (q) list = list.filter((p) => String(p.PlanName ?? '').toLowerCase().includes(q))
  if (statusFilter.value === 'active') list = list.filter((p) => !!p.IsActive)
  if (statusFilter.value === 'inactive') list = list.filter((p) => !p.IsActive)
  list.sort((a, b) => {
    if (sortOrder.value === 'price-asc') return Number(a.Price) - Number(b.Price)
    if (sortOrder.value === 'price-desc') return Number(b.Price) - Number(a.Price)
    return (Number(a.SortOrder) - Number(b.SortOrder)) || (Number(a.Price) - Number(b.Price))
  })
  return list
})

// --- Display helpers (formatting only) ---
function formatPrice(price: any): string {
  return `€${Number(price ?? 0).toFixed(2)}`
}
function formatDuration(months: any): string {
  const m = Number(months) || 0
  if (m === 1) return 'month'
  if (m === 12) return 'year'
  return `${m} months`
}
// 'Active' is the default → no badge; inactive plans (and popular ones) get a tag.
function statusOf(p: any): string {
  if (!p.IsActive) return 'Inactive'
  if (p.IsPopular) return 'Popular'
  return 'Active'
}
function showStatusBadge(status: string): boolean {
  return !!status && status !== 'Active'
}
function statusSeverity(status: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
  if (status === 'Inactive') return 'danger'
  if (status === 'Popular') return 'info'
  return 'info'
}

async function load() {
  loading.value = true
  try {
    const { data } = await getAdminPlans()
    plans.value = data.data.plans ?? []
  } catch {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to load plans', life: 3000 })
  } finally {
    loading.value = false
  }
}

// --- Create / Edit dialog ---
const formVisible = ref(false)
const formMode = ref<'create' | 'edit'>('create')
const editingId = ref<number | null>(null)
const saving = ref(false)
const blankForm = () => ({
  name: '',
  price: 0,
  durationMonths: 1,
  includesClasses: false,
  isPopular: false,
  sortOrder: 0,
  description: '',
  features: '',
})
const form = ref(blankForm())

function openCreate() {
  formMode.value = 'create'
  editingId.value = null
  form.value = blankForm()
  formVisible.value = true
}
function openEdit(p: any) {
  formMode.value = 'edit'
  editingId.value = p.PlanID
  form.value = {
    name: p.PlanName ?? '',
    price: Number(p.Price) || 0,
    durationMonths: Number(p.DurationMonths) || 1,
    includesClasses: !!p.IncludesClasses,
    isPopular: !!p.IsPopular,
    sortOrder: Number(p.SortOrder) || 0,
    description: p.Description ?? '',
    features: Array.isArray(p.Features) ? p.Features.join('\n') : '',
  }
  formVisible.value = true
}

async function savePlan() {
  if (!form.value.name.trim()) {
    toast.add({ severity: 'warn', summary: 'Name required', detail: 'Please enter a plan name.', life: 3000 })
    return
  }
  saving.value = true
  const payload = {
    name: form.value.name.trim(),
    price: Number(form.value.price),
    durationMonths: Number(form.value.durationMonths),
    includesClasses: form.value.includesClasses,
    isPopular: form.value.isPopular,
    sortOrder: Number(form.value.sortOrder),
    description: form.value.description,
    features: form.value.features.split('\n').map((s) => s.trim()).filter(Boolean),
  }
  try {
    if (formMode.value === 'create') {
      await createPlan(payload)
      toast.add({ severity: 'success', summary: 'Plan created', detail: payload.name, life: 3000 })
    } else if (editingId.value != null) {
      await updatePlan(editingId.value, payload)
      toast.add({ severity: 'success', summary: 'Plan updated', detail: payload.name, life: 3000 })
    }
    formVisible.value = false
    await load()
  } catch (e: any) {
    toast.add({
      severity: 'error',
      summary: formMode.value === 'create' ? 'Could not create plan' : 'Could not update plan',
      detail: e?.response?.data?.message || 'Check the details and try again.',
      life: 4000,
    })
  } finally {
    saving.value = false
  }
}

function confirmDeactivate(p: any) {
  confirm.require({
    header: 'Deactivate this plan?',
    message: `"${p.PlanName}" will be hidden from the storefront. Existing memberships keep working, and you can reactivate it later.`,
    icon: 'pi pi-exclamation-triangle',
    acceptProps: { label: 'Deactivate', severity: 'warn' },
    rejectProps: { label: 'Keep', severity: 'secondary', outlined: true },
    accept: async () => {
      try {
        await deletePlan(p.PlanID)
        toast.add({ severity: 'success', summary: 'Plan deactivated', detail: p.PlanName, life: 3000 })
        await load()
      } catch (e: any) {
        toast.add({ severity: 'error', summary: 'Could not deactivate', detail: e?.response?.data?.message || 'Try again.', life: 4000 })
      }
    },
  })
}

async function reactivate(p: any) {
  try {
    await updatePlan(p.PlanID, { name: p.PlanName, price: Number(p.Price), isActive: true })
    toast.add({ severity: 'success', summary: 'Plan reactivated', detail: p.PlanName, life: 3000 })
    await load()
  } catch (e: any) {
    toast.add({ severity: 'error', summary: 'Could not reactivate', detail: e?.response?.data?.message || 'Try again.', life: 4000 })
  }
}

onMounted(load)
</script>

<template>
  <div class="plans-page">
    <div class="page-header">
      <div>
        <h1>Plans</h1>
        <p>Create, edit, and manage all membership plans.</p>
      </div>
      <Button label="New plan" icon="pi pi-plus" @click="openCreate" />
    </div>

    <!-- Toolbar: search + filters + sort -->
    <div class="toolbar">
      <span class="search-wrap">
        <i class="pi pi-search search-icon" />
        <input v-model="search" type="text" placeholder="Search plans…" class="ctl search-input" />
      </span>
      <select v-model="statusFilter" class="ctl">
        <option value="all">All statuses</option>
        <option value="active">Active</option>
        <option value="inactive">Inactive</option>
      </select>
      <select v-model="sortOrder" class="ctl">
        <option value="order">Sort order</option>
        <option value="price-asc">Price: low → high</option>
        <option value="price-desc">Price: high → low</option>
      </select>
      <span class="count">{{ filtered.length }} plans</span>
    </div>

    <!-- States -->
    <p v-if="loading && !plans.length" class="muted">Loading…</p>
    <p v-else-if="!filtered.length" class="muted">No plans match your filters.</p>

    <!-- Card grid -->
    <DataView v-else :value="filtered" :rows="9" paginator layout="list" dataKey="PlanID" class="cv">
      <template #list="{ items }">
        <div class="grid">
          <article v-for="p in items" :key="p.PlanID" class="card" :class="{ inactive: !p.IsActive }">
            <div class="card-top">
              <div class="title-block">
                <h3 class="name">{{ p.PlanName }}</h3>
                <span class="type">{{ formatDuration(p.DurationMonths) }} plan</span>
              </div>
              <Tag v-if="showStatusBadge(statusOf(p))" :value="statusOf(p)" :severity="statusSeverity(statusOf(p))" class="tag" />
            </div>

            <p class="when">
              <i class="pi pi-tag" /> {{ formatPrice(p.Price) }}
              <span class="per">/ {{ formatDuration(p.DurationMonths) }}</span>
            </p>

            <p class="meta">
              <span>
                <i :class="p.IncludesClasses ? 'pi pi-check' : 'pi pi-times'" />
                {{ p.IncludesClasses ? 'Includes group classes' : 'Gym access only' }}
              </span>
              <span><i class="pi pi-sort" /> Order {{ p.SortOrder }}</span>
            </p>

            <ul v-if="p.Features && p.Features.length" class="features">
              <li v-for="(f, i) in p.Features" :key="i"><i class="pi pi-check-circle" /> {{ f }}</li>
            </ul>
            <p v-else-if="p.Description" class="desc">{{ p.Description }}</p>

            <div class="actions">
              <Button label="Edit" icon="pi pi-pencil" size="small" outlined @click="openEdit(p)" />
              <Button
                v-if="p.IsActive"
                label="Deactivate"
                icon="pi pi-ban"
                size="small"
                severity="warn"
                text
                @click="confirmDeactivate(p)"
              />
              <Button
                v-else
                label="Reactivate"
                icon="pi pi-check"
                size="small"
                severity="success"
                text
                @click="reactivate(p)"
              />
            </div>
          </article>
        </div>
      </template>
    </DataView>

    <!-- Create / Edit dialog -->
    <Dialog v-model:visible="formVisible" modal :header="formMode === 'create' ? 'New plan' : 'Edit plan'" :style="{ width: '34rem' }">
      <form class="form" @submit.prevent="savePlan">
        <label class="field full">
          <span>Plan name</span>
          <input v-model="form.name" type="text" placeholder="Premium" class="ctl" required />
        </label>
        <label class="field">
          <span>Price (€)</span>
          <input v-model.number="form.price" type="number" min="0" step="0.01" class="ctl" required />
        </label>
        <label class="field">
          <span>Duration (months)</span>
          <input v-model.number="form.durationMonths" type="number" min="1" class="ctl" required />
        </label>
        <label class="field">
          <span>Includes group classes</span>
          <select v-model="form.includesClasses" class="ctl">
            <option :value="false">No — gym access only</option>
            <option :value="true">Yes — includes classes</option>
          </select>
        </label>
        <label class="field">
          <span>Most popular</span>
          <select v-model="form.isPopular" class="ctl">
            <option :value="false">No</option>
            <option :value="true">Yes</option>
          </select>
        </label>
        <label class="field">
          <span>Sort order</span>
          <input v-model.number="form.sortOrder" type="number" min="0" class="ctl" />
        </label>
        <label class="field full">
          <span>Description</span>
          <textarea v-model="form.description" rows="2" placeholder="Short summary shown on the plan card." class="ctl" />
        </label>
        <label class="field full">
          <span>Features <small class="hint">(one per line)</small></span>
          <textarea v-model="form.features" rows="4" placeholder="Full gym access&#10;Unlimited group classes&#10;Priority booking" class="ctl" />
        </label>
      </form>
      <template #footer>
        <Button label="Cancel" text severity="secondary" @click="formVisible = false" />
        <Button :label="formMode === 'create' ? 'Create plan' : 'Save changes'" :loading="saving" @click="savePlan" />
      </template>
    </Dialog>
  </div>
</template>

<style scoped>
.plans-page {
  max-width: 1100px;
}

.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.5rem;
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

/* Toolbar */
.toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.6rem;
  margin-bottom: 1.5rem;
}

.ctl {
  background: var(--gym-surface);
  border: 1px solid var(--gym-border);
  border-radius: 6px;
  color: var(--gym-text);
  padding: 0.5rem 0.65rem;
  font-size: 0.875rem;
  outline: none;
  transition: border-color 0.15s;
  font-family: inherit;
}

.ctl:focus {
  border-color: var(--gym-orange);
}

textarea.ctl {
  resize: vertical;
}

.search-wrap {
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 0.7rem;
  color: var(--gym-text-muted);
  font-size: 0.85rem;
  pointer-events: none;
}

.search-input {
  padding-left: 2rem;
  width: 220px;
}

.count {
  margin-left: auto;
  font-size: 0.8rem;
  color: var(--gym-text-muted);
}

.muted {
  color: var(--gym-text-muted);
  font-size: 0.9rem;
  padding: 1rem 0;
}

/* Card grid */
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(290px, 1fr));
  gap: 1rem;
  width: 100%;
}

.card {
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
  padding: 1.1rem 1.2rem;
  background: var(--gym-surface-raised);
  border: 1px solid var(--gym-border);
  border-left: 3px solid var(--gym-orange);
  border-radius: 14px;
  transition: transform 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease;
}

.card:hover {
  transform: translateY(-2px);
  border-color: var(--gym-orange);
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.35);
}

/* Deactivated plans read as muted */
.card.inactive {
  border-left-color: var(--gym-border);
  opacity: 0.7;
}

.card-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem;
}

.title-block {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  min-width: 0;
}

.name {
  font-size: 1.15rem;
  font-weight: 700;
  line-height: 1.25;
  color: var(--gym-text);
}

.type {
  font-size: 0.76rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--gym-text-muted);
}

.tag {
  flex-shrink: 0;
  text-transform: capitalize;
}

.when {
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
  font-size: 1.05rem;
  font-weight: 800;
  color: var(--gym-text);
}

.when i {
  color: var(--gym-orange);
  font-size: 0.9rem;
}

.when .per {
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--gym-text-muted);
}

.meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem 1rem;
  font-size: 0.82rem;
  color: var(--gym-text-muted);
}

.meta span {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
}

.meta i {
  font-size: 0.82rem;
  opacity: 0.8;
}

/* Features list */
.features {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  margin: 0;
  padding: 0;
}

.features li {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.82rem;
  color: var(--gym-text-muted);
}

.features i {
  color: var(--gym-orange);
  font-size: 0.8rem;
}

.desc {
  font-size: 0.85rem;
  color: var(--gym-text-muted);
  line-height: 1.4;
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
  margin-top: 0.25rem;
  padding-top: 0.6rem;
  border-top: 1px solid var(--gym-border);
}

/* Form dialog */
.form {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--gym-text);
}

.field.full {
  grid-column: 1 / -1;
}

.hint {
  font-weight: 400;
  color: var(--gym-text-muted);
}

/* DataView reset */
.cv :deep(.p-dataview),
.cv :deep(.p-dataview-content) {
  background: transparent;
  border: none;
}

.cv :deep(.p-paginator) {
  background: transparent;
  margin-top: 1.25rem;
}

@media (max-width: 560px) {
  .form {
    grid-template-columns: 1fr;
  }

  .page-header {
    flex-direction: column;
  }
}
</style>
