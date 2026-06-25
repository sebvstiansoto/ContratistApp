import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: {
          50:  '#eef1fd',
          100: '#dde3fb',
          500: '#4361ee',
          600: '#3b5bdb',
          700: '#2f4ac0',
        },
      },
    },
  },
  plugins: [require('@tailwindcss/forms')],
} satisfies Config
