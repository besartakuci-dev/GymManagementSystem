import { ref, readonly } from 'vue'
import { getMe } from '@/api/auth'

const user = ref<any>(null)
const initialized = ref(false)

export function useAuth() {
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
  }

  function logout() {
    localStorage.removeItem('token')
    user.value = null
  }

  return { user: readonly(user), init, setUser, logout }
}
