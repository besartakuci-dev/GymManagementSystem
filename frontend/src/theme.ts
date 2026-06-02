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
        surface: {
          0:   '#ffffff',
          50:  '#000000',
          100: '#0a0a0a',
          200: '#111111',
          300: '#2a2a2a',
          400: '#404040',
          500: '#737373',
          600: '#a3a3a3',
          700: '#d4d4d4',
          800: '#e5e5e5',
          900: '#f5f5f5',
          950: '#fafafa',
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
