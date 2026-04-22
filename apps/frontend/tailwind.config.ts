import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{vue,ts,tsx}'],
  theme: {
    extend: {
      boxShadow: {
        auth: '0 24px 80px rgba(15, 23, 42, 0.14)',
      },
    },
  },
  plugins: [],
} satisfies Config
