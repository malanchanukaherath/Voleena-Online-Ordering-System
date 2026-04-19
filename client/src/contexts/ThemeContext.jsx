import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext(null);

const STORAGE_KEY = 'voleena-theme';

// Simple: This gets the initial theme.
const getInitialTheme = () => {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored === 'dark' || stored === 'light') return stored;
    } catch {
        // localStorage not available (SSR / private browsing edge case)
    }
    // Fall back to OS preference
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
    }
    return 'light';
};

// Simple: This updates the theme.
const applyTheme = (theme) => {
    const root = document.documentElement;
    if (theme === 'dark') {
        root.classList.add('dark');
    } else {
        root.classList.remove('dark');
    }
};

// Simple: This provides shared data for other parts of the app.
export const ThemeProvider = ({ children }) => {
    const [theme, setTheme] = useState(() => {
        const initial = getInitialTheme();
        // Apply immediately to avoid flash
        if (typeof document !== 'undefined') applyTheme(initial);
        return initial;
    });

    const toggleTheme = useCallback(() => {
        setTheme((prev) => {
            const next = prev === 'dark' ? 'light' : 'dark';
            try {
                localStorage.setItem(STORAGE_KEY, next);
            } catch {
                // Ignore storage errors
            }
            applyTheme(next);
            return next;
        });
    }, []);

    // Sync with OS preference changes (when user hasn't manually set a preference)
    useEffect(() => {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        // Simple: This handles what happens when change is triggered.
        const handleChange = (e) => {
            try {
                const stored = localStorage.getItem(STORAGE_KEY);
                // Only follow OS if there's no explicit user preference saved
                if (!stored) {
                    const next = e.matches ? 'dark' : 'light';
                    setTheme(next);
                    applyTheme(next);
                }
            } catch {
                // Ignore
            }
        };
        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
    }, []);

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme, isDark: theme === 'dark' }}>
            {children}
        </ThemeContext.Provider>
    );
};

// Simple: This helps manage the theme.
export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};
