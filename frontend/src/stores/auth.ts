import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { getMe } from '@/api/auth'
import { getMyMemberships } from '@/api/plans'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<any>(null)
  const membership = ref<any>(null)
  const initialized = ref(false)

  const hasMembership = computed(() => !!membership.value)

  async function refreshMembership() {
    if (!user.value) {
      membership.value = null
      return
    }
    try {
      const { data } = await getMyMemberships()
      membership.value = data.data.active ?? null
    } catch {
      membership.value = null
    }
  }

  async function init() {
    if (initialized.value) return
    initialized.value = true
    const token = localStorage.getItem('token')
    if (!token) return
    try {
      const { data } = await getMe()
      user.value = data.data.user
      await refreshMembership()
    } catch {
      localStorage.removeItem('token')
    }
  }

  function setUser(u: any) {
    user.value = u
  }

  function logout() {
    localStorage.removeItem('token')
    user.value = null
    membership.value = null
  }

  return { user, membership, hasMembership, initialized, init, refreshMembership, setUser, logout }
})
