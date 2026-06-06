import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getMe } from '@/api/auth'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<any>(null)
  const initialized = ref(false)

  async function init() {
    if (initialized.value) return
    initialized.value = true
    const token = localStorage.getItem('token')
    if (!token) return
    try {
      const { data } = await getMe()
      user.value = data.data.user
    } catch {
      localStorage.removeItem('token')
    }
  }

  function setUser(u: any) {
    user.value = u
    initialized.value = true
  }

  function logout() {
    localStorage.removeItem('token')
    user.value = null
    initialized.value = false
  }

  return { user, initialized, init, setUser, logout }
})
