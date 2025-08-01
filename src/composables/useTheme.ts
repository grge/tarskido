import { ref, computed, watch } from 'vue'

const THEME_STORAGE_KEY = 'tarskido-theme'

type Theme = 'light' | 'dark'

// Global theme state
const currentTheme = ref<Theme>('light')

// Initialize theme from localStorage or system preference
const initializeTheme = () => {
  const stored = localStorage.getItem(THEME_STORAGE_KEY) as Theme | null
  
  if (stored && (stored === 'light' || stored === 'dark')) {
    currentTheme.value = stored
  } else {
    // Check system preference
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    currentTheme.value = prefersDark ? 'dark' : 'light'
  }
  
  // Apply theme to document
  applyTheme(currentTheme.value)
}

// Apply theme to document root
const applyTheme = (theme: Theme) => {
  document.documentElement.setAttribute('data-theme', theme)
}

// Watch for theme changes and persist
watch(currentTheme, (newTheme) => {
  localStorage.setItem(THEME_STORAGE_KEY, newTheme)
  applyTheme(newTheme)
}, { immediate: false })

export const useTheme = () => {
  const theme = computed(() => currentTheme.value)
  const isDark = computed(() => currentTheme.value === 'dark')
  
  const toggleTheme = () => {
    currentTheme.value = currentTheme.value === 'light' ? 'dark' : 'light'
  }
  
  const setTheme = (newTheme: Theme) => {
    currentTheme.value = newTheme
  }
  
  return {
    theme,
    isDark,
    toggleTheme,
    setTheme,
    initializeTheme
  }
}