export const routing = {
    locales: ["en", "km"] as const,
    defaultLocale: "en",
    localePrefix: "always",
    localeDetection: false,
} as const

export type Locale = (typeof routing.locales)[number]
