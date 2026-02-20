import axios, {AxiosError, AxiosInstance, AxiosHeaders, InternalAxiosRequestConfig} from "axios";
import {useSuperAdminStore} from "@/lib/stores/superAdminStore";
import {useSchoolAuthStore} from "@/lib/stores/useSchoolAuthStore";

export class ApiError extends Error {
    status?: number;
    url?: string;

    constructor(message: string, opts?: { status?: number; url?: string }) {
        super(message);
        this.name = "ApiError";
        this.status = opts?.status;
        this.url = opts?.url;
    }
}

const baseURL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

export const api: AxiosInstance = axios.create({
    baseURL,
    timeout: 15000,
    headers: {"Content-Type": "application/json"},
});

const bareApi: AxiosInstance = axios.create({
    baseURL,
    timeout: 15000,
    headers: {"Content-Type": "application/json"},
});

type RetriableRequestConfig = InternalAxiosRequestConfig & { _retry?: boolean };

let schoolRefreshInFlight: Promise<string | null> | null = null;
let superAdminRefreshInFlight: Promise<string | null> | null = null;

function setHeader(config: InternalAxiosRequestConfig, key: string, value: string) {
    const headers = config.headers;
    headers.set(key, value);
    return;
}

function isSuperAdminRoute(url: string) {
    return url.startsWith("/super-admin");
}

function isSchoolRoute(url: string) {
    return !isSuperAdminRoute(url);
}

function isAuthBypassRoute(url: string) {
    return (
        url.startsWith("/auth/login") ||
        url.startsWith("/auth/refresh") ||
        url.startsWith("/auth/logout") ||
        url.startsWith("/super-admin/login") ||
        url.startsWith("/super-admin/refresh") ||
        url.startsWith("/super-admin/logout")
    );
}

function shouldSkipAutoLogout(url: string) {
    return url.startsWith("/auth/change-password");
}

async function refreshSchoolAccessTokenOnce() {
    if (!schoolRefreshInFlight) {
        schoolRefreshInFlight = (async () => {
            const { refreshToken, tenantSlug } = useSchoolAuthStore.getState();
            if (!refreshToken) return null;

            const res = await bareApi.post("/auth/refresh", { refreshToken }, {
                headers: tenantSlug ? { "X-Tenant": tenantSlug.trim().toLowerCase() } : undefined,
            });

            const nextAccessToken = res.data?.accessToken as string | undefined;
            const nextRefreshToken = res.data?.refreshToken as string | undefined;
            if (!nextAccessToken || !nextRefreshToken) return null;

            useSchoolAuthStore.getState().setToken(nextAccessToken);
            useSchoolAuthStore.getState().setRefreshToken(nextRefreshToken);
            return nextAccessToken;
        })()
            .catch(() => null)
            .finally(() => {
                schoolRefreshInFlight = null;
            });
    }
    return schoolRefreshInFlight;
}

async function refreshSuperAdminAccessTokenOnce() {
    if (!superAdminRefreshInFlight) {
        superAdminRefreshInFlight = (async () => {
            const { refreshToken } = useSuperAdminStore.getState();
            if (!refreshToken) return null;

            const res = await bareApi.post("/super-admin/refresh", { refreshToken });

            const nextAccessToken = res.data?.accessToken as string | undefined;
            const nextRefreshToken = res.data?.refreshToken as string | undefined;
            if (!nextAccessToken || !nextRefreshToken) return null;

            useSuperAdminStore.getState().setToken(nextAccessToken);
            useSuperAdminStore.getState().setRefreshToken(nextRefreshToken);
            return nextAccessToken;
        })()
            .catch(() => null)
            .finally(() => {
                superAdminRefreshInFlight = null;
            });
    }
    return superAdminRefreshInFlight;
}

api.interceptors.request.use((config) => {
    const url = config.url ?? "";
    if (typeof window === "undefined") return config;

    // Super Admin
    if (isSuperAdminRoute(url)) {
        const token = useSuperAdminStore.getState().token;
        if (token) setHeader(config, "Authorization", `Bearer ${token}`);
        return config;
    }

    // School default
    const {token: schoolToken, tenantSlug} = useSchoolAuthStore.getState();

    if (isSchoolRoute(url) && tenantSlug) {
        setHeader(config, "X-Tenant", tenantSlug.trim().toLowerCase());
    }

    if (schoolToken && !url.startsWith("/auth/login")) {
        setHeader(config, "Authorization", `Bearer ${schoolToken}`);
    }

    return config;
});

api.interceptors.response.use(
    (res) => res,
    async (err: AxiosError<unknown>) => {
        const url = err.config?.url ?? "";
        const status = err.response?.status;
        const data = err.response?.data as Record<string, unknown> | undefined;
        const requestConfig = (err.config ?? {}) as RetriableRequestConfig;

        if (status === 401 && !isAuthBypassRoute(url) && !requestConfig._retry) {
            if (shouldSkipAutoLogout(url)) {
                const message = (data?.error as string | undefined) || (data?.message as string | undefined) || err.message || "Request failed";
                return Promise.reject(new ApiError(message, {status, url}));
            }

            if (isSuperAdminRoute(url)) {
                const refreshed = await refreshSuperAdminAccessTokenOnce();
                if (refreshed) {
                    requestConfig._retry = true;
                    if (requestConfig.headers) {
                        requestConfig.headers.set("Authorization", `Bearer ${refreshed}`);
                    } else {
                        requestConfig.headers = new AxiosHeaders({ Authorization: `Bearer ${refreshed}` });
                    }
                    return api.request(requestConfig);
                }
                useSuperAdminStore.getState().logout();
            } else {
                const refreshed = await refreshSchoolAccessTokenOnce();
                if (refreshed) {
                    requestConfig._retry = true;
                    if (requestConfig.headers) {
                        requestConfig.headers.set("Authorization", `Bearer ${refreshed}`);
                    } else {
                        requestConfig.headers = new AxiosHeaders({ Authorization: `Bearer ${refreshed}` });
                    }
                    return api.request(requestConfig);
                }
                useSchoolAuthStore.getState().logout();
            }
        }

        const message = (data?.error as string | undefined) || (data?.message as string | undefined) || err.message || "Request failed";
        return Promise.reject(new ApiError(message, {status, url}));
    }
);

export default api;
