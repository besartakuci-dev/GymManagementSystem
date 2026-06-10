import { ref } from 'vue'
import { useConfirm } from 'primevue/useconfirm'
import { useToast } from 'primevue/usetoast'
import { useAuthStore } from '@/stores/auth'
import { cancelMembership } from '@/api/plans'

// Shared "cancel my membership" flow: confirm dialog -> PUT cancel -> toast -> refresh.
export function useCancelMembership() {
  const confirm = useConfirm()
  const toast = useToast()
  const auth = useAuthStore()
  const cancelling = ref(false)

  function requestCancel(membership: any) {
    const id = membership?.MembershipID
    if (!id) return

    confirm.require({
      header: 'Cancel your membership?',
      message: 'This will end your active plan.',
      icon: 'pi pi-exclamation-triangle',
      acceptProps: { label: 'Confirm', severity: 'danger' },
      rejectProps: { label: 'Keep', severity: 'secondary', outlined: true },
      accept: async () => {
        cancelling.value = true
        try {
          await cancelMembership(id)
          await auth.refreshMembership()
          toast.add({
            severity: 'success',
            summary: 'Membership cancelled',
            life: 4000,
          })
        } catch (e: any) {
          toast.add({
            severity: 'error',
            summary: 'Could not cancel membership',
            detail: e.response?.data?.message ?? 'Please try again.',
            life: 4000,
          })
        } finally {
          cancelling.value = false
        }
      },
    })
  }

  return { requestCancel, cancelling }
}
