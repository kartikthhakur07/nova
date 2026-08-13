import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        'nova-bg': '#F7F6F2',
        'nova-surface': '#FFFFFF',
        'nova-surface-2': '#E9E9E5',
        'nova-border': '#C8C9C6',
        'tier-low': '#72856C',
        'tier-medium': '#D98A3A',
        'tier-high': '#D98A3A',
        'tier-critical': '#C84B42',
        'voice-active': '#0D9488',
      },
      fontFamily: {
        display: ['Space Grotesk', 'sans-serif'],
        body: ['IBM Plex Sans', 'sans-serif'],
        mono: ['IBM Plex Mono', 'monospace'],
      },
    },
  },
} satisfies Config
