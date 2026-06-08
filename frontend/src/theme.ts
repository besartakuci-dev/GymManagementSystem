import { definePreset } from '@primevue/themes'
import Aura from '@primevue/themes/aura'

const GymPreset = definePreset(Aura, {
  semantic: {
    primary: {
      50:  '{orange.50}',
      100: '{orange.100}',
      200: '{orange.200}',
      300: '{orange.300}',
      400: '{orange.400}',
      500: '{orange.500}',
      600: '{orange.600}',
      700: '{orange.700}',
      800: '{orange.800}',
      900: '{orange.900}',
      950: '{orange.950}',
    },
    colorScheme: {
      dark: {
        // Aura dark mode uses surface.0 as the lightest shade (text color) and the
        // high indices (800/900/950) as component backgrounds. Keep this scale
        // monotonic light -> dark, or PrimeVue surfaces render light-on-light.
        surface: {
          0:   '#ffffff',
          50:  '#fafafa',
          100: '#f5f5f5',
          200: '#e5e5e5',
          300: '#d4d4d4',
          400: '#a3a3a3',
          500: '#737373',
          600: '#404040',
          700: '#2a2a2a',
          800: '#111111',
          900: '#0a0a0a',
          950: '#000000',
        },
        highlight: {
          background:      'rgba(249, 115, 22, 0.15)',
          focusBackground: 'rgba(249, 115, 22, 0.25)',
          color:           '#f97316',
          focusColor:      '#f97316',
        },
      },
    },
  },
})

export default GymPreset
