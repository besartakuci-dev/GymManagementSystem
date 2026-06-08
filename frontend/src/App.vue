<script setup lang="ts">
import { onMounted } from 'vue'
import { RouterView } from 'vue-router'
import Toast from 'primevue/toast'
import Navbar from '@/components/Navbar.vue'
import Footer from '@/components/Footer.vue'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
onMounted(auth.init)
</script>

<template>
  <Navbar />
  <RouterView />
  <Footer />
  <Toast />
</template>
