import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { getMe } from '@/api/auth'
import { getMyMembership } from '@/api/memberships'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<any>(null)
  const membership = ref<any>(null)
  const initialized = ref(false)
  let initPromise: Promise<void> | null = null

  const hasMembership = computed(() => !!membership.value)

  async function refreshMembership() {
    if (!user.value) {
      membership.value = null
      return
    }
    try {
      const { data } = await getMyMembership()
      membership.value = data.data.membership
    } catch {
      membership.value = null
    }
  }

  async function init() {
    if (initialized.value) return
    if (!initPromise) {
      initPromise = (async () => {
        const token = localStorage.getItem('token')
        if (token) {
          try {
            const { data } = await getMe()
            user.value = data.data.user
            await refreshMembership()
          } catch {
            localStorage.removeItem('token')
          }
        }
        initialized.value = true
      })()
    }
    return initPromise
  }

  function setUser(u: any) {
    user.value = u
    initialized.value = true
  }

  function logout() {
    localStorage.removeItem('token')
    user.value = null
    membership.value = null
    initialized.value = false
    initPromise = null
  }

  return { user, membership, hasMembership, initialized, init, refreshMembership, setUser, logout }
})
