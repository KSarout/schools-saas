"use client"

import * as React from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"

function makeQueryClient() {
    return new QueryClient({
        defaultOptions: {
            queries: {
                staleTime: 60_000,
                refetchOnWindowFocus: false,
                retry: 1,
            },
            mutations: {
                retry: 0,
            },
        },
    })
}

let browserQueryClient: QueryClient | undefined

function getQueryClient() {
    if (typeof window === "undefined") {
        // Server: always new
        return makeQueryClient()
    }
    // Browser: singleton
    if (!browserQueryClient) browserQueryClient = makeQueryClient()
    return browserQueryClient
}

export function ReactQueryProvider({ children }: { children: React.ReactNode }) {
    const queryClient = getQueryClient()
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}
