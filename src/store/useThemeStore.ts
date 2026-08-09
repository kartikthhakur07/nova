import { create } from 'zustand'

interface ThemeStore {
  theme: 'light' | 'dark'
  toggle: () => void
}

export const useThemeStore = create<ThemeStore>((set) => ({
  theme: 'light',
  toggle: () => set((state) => {
    const nextTheme = state.theme === 'light' ? 'dark' : 'light'
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', nextTheme)
    }
    return { theme: nextTheme }
  }),
}))

if (typeof document !== 'undefined') {
  document.documentElement.setAttribute('data-theme', 'light')
}

