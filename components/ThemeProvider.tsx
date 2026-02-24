'use client'

import { createContext, useContext, useEffect, useState } from 'react'

type Theme = 'dark' | 'light'

interface ThemeContextValue {
    theme: Theme
    toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextValue>({
    theme: 'dark',
    toggleTheme: () => { },
})

export function useTheme() {
    return useContext(ThemeContext)
}

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [theme, setTheme] = useState<Theme>('dark')

    // Load from localStorage on mount
    useEffect(() => {
        const stored = localStorage.getItem('theme') as Theme | null
        const initial = stored ?? 'dark'
        setTheme(initial)
        applyTheme(initial)
    }, [])

    const applyTheme = (t: Theme) => {
        const html = document.documentElement
        if (t === 'light') {
            html.classList.add('light')
        } else {
            html.classList.remove('light')
        }
    }

    const toggleTheme = () => {
        const next: Theme = theme === 'dark' ? 'light' : 'dark'
        setTheme(next)
        applyTheme(next)
        localStorage.setItem('theme', next)
    }

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    )
}
