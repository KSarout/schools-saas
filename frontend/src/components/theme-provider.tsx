"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"
import type { ThemeProviderProps } from "next-themes"

function SystemThemeSync({ storageKey }: { storageKey: string }) {
    React.useEffect(() => {
        const media = window.matchMedia("(prefers-color-scheme: dark)");

        const applySystemTheme = () => {
            const stored = window.localStorage.getItem(storageKey);
            const isSystem = stored === null || stored === "system";
            if (!isSystem) return;
            document.documentElement.classList.toggle("dark", media.matches);
        };

        applySystemTheme();
        media.addEventListener("change", applySystemTheme);
        window.addEventListener("storage", applySystemTheme);

        return () => {
            media.removeEventListener("change", applySystemTheme);
            window.removeEventListener("storage", applySystemTheme);
        };
    }, [storageKey]);

    return null;
}

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
    const storageKey = props.storageKey ?? "theme";

    return (
        <NextThemesProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            storageKey="school-saas-theme"
            disableTransitionOnChange
            {...props}
        >
            <SystemThemeSync storageKey={storageKey} />
            {children}
        </NextThemesProvider>
    )
}
