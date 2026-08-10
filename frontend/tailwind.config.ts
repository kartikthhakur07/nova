import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        'nova-bg': '#0A0D10',
        'nova-surface': '#12171C',
        'nova-surface-2': '#1A2028',
        'nova-border': '#2A3340',
        'tier-low': '#22C55E',
        'tier-medium': '#F59E0B',
        'tier-high': '#F97316',
        'tier-critical': '#EF4444',
        'voice-active': '#14B8A6',
      },
      fontFamily: {
        display: ['Space Grotesk', 'sans-serif'],
        body: ['IBM Plex Sans', 'sans-serif'],
        mono: ['IBM Plex Mono', 'monospace'],
      },
    },
  },
} satisfies Config
