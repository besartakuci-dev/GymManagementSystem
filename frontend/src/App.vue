<script setup lang="ts">
import { onMounted } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import Toast from 'primevue/toast'
import ConfirmDialog from 'primevue/confirmdialog'
import Navbar from '@/components/Navbar.vue'
import Footer from '@/components/Footer.vue'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const route = useRoute()
onMounted(auth.init)
</script>

<template>
  <Navbar v-if="!route.meta.hideShell" />
  <RouterView />
  <Footer v-if="!route.meta.hideShell" />
  <Toast />
  <ConfirmDialog />
</template>
