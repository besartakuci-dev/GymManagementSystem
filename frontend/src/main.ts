import { createApp } from 'vue'
import PrimeVue from 'primevue/config'
import { createPinia } from 'pinia'
import router from './router'
import 'primeicons/primeicons.css'
import './styles/base.css'
import GymPreset from './theme'
import App from './App.vue'
import ToastService from 'primevue/toastservice'
import ConfirmationService from 'primevue/confirmationservice'

const app = createApp(App)

app.use(createPinia())
app.use(PrimeVue, {
  theme: {
    preset: GymPreset,
    options: { darkModeSelector: '.dark' },
  },
})
app.use(ToastService)
app.use(ConfirmationService)
app.use(router)
app.mount('#app')
