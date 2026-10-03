import { createContext, useCallback, useContext, useEffect, useMemo, useState, type PropsWithChildren } from 'react'

export type ThemePreference = 'light' | 'dark' | 'system'
export type ResolvedTheme = 'light' | 'dark'

/** Must match the inline script in index.html that applies the theme before first paint. */
export const THEME_STORAGE_KEY = 'ai-health-theme'
const THEME_COLORS: Record<ResolvedTheme, string> = { dark: '#0a0f1c', light: '#f5f7fb' }

interface ThemeContextValue {
  preference: ThemePreference
  resolvedTheme: ResolvedTheme
  setPreference: (preference: ThemePreference) => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

const readPreference = (): ThemePreference => {
  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY)
    return stored === 'light' || stored === 'dark' || stored === 'system' ? stored : 'dark'
  } catch {
    return 'dark'
  }
}

const systemPrefersLight = () => window.matchMedia?.('(prefers-color-scheme: light)').matches ?? false

const applyTheme = (theme: ResolvedTheme, animate: boolean) => {
  const root = document.documentElement
  if (animate) {
    root.classList.add('theme-transition')
    window.setTimeout(() => root.classList.remove('theme-transition'), 300)
  }
  root.dataset.theme = theme
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_COLORS[theme])
}

export const ThemeProvider = ({ children }: PropsWithChildren) => {
  const [preference, setPreferenceState] = useState<ThemePreference>(readPreference)
  const [systemLight, setSystemLight] = useState(systemPrefersLight)

  // Follow OS changes while "system" is selected
  useEffect(() => {
    const query = window.matchMedia?.('(prefers-color-scheme: light)')
    if (!query) return
    const onChange = (event: MediaQueryListEvent) => setSystemLight(event.matches)
    query.addEventListener('change', onChange)
    return () => query.removeEventListener('change', onChange)
  }, [])

  const resolvedTheme: ResolvedTheme = preference === 'system' ? (systemLight ? 'light' : 'dark') : preference

  useEffect(() => {
    applyTheme(resolvedTheme, document.documentElement.dataset.theme !== resolvedTheme)
  }, [resolvedTheme])

  const setPreference = useCallback((next: ThemePreference) => {
    setPreferenceState(next)
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, next)
    } catch {
      // Storage unavailable (private mode) — the choice still applies for this session
    }
  }, [])

  const value = useMemo(() => ({ preference, resolvedTheme, setPreference }), [preference, resolvedTheme, setPreference])

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider')
  }
  return context
}
