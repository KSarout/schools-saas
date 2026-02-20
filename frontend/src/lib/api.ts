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


function setHeader(config: InternalAxiosRequestConfig, key: string, value: string) {
    const headers = config.headers;
    headers.set(key, value);
    return;
}

api.interceptors.request.use((config) => {
    const url = config.url ?? "";
    if (typeof window === "undefined") return config;

    // Super Admin
    if (url.startsWith("/super-admin")) {
        const token = useSuperAdminStore.getState().token;
        if (token) setHeader(config, "Authorization", `Bearer ${token}`);
        return config;
    }

    // School default
    const {token: schoolToken, tenantSlug} = useSchoolAuthStore.getState();

    if (tenantSlug) setHeader(config, "X-Tenant", tenantSlug.trim().toLowerCase());

    if (schoolToken && !url.startsWith("/auth/login")) {
        setHeader(config, "Authorization", `Bearer ${schoolToken}`);
    }

    return config;
});

api.interceptors.response.use(
    (res) => res,
    (err: AxiosError<any>) => {
        const url = err.config?.url ?? "";
        const status = err.response?.status;
        const data: any = err.response?.data;

        const isSuperAdmin = url.startsWith("/super-admin");
        const isLogin = url.startsWith("/auth/login") || url.startsWith("/super-admin/login");

        if (status === 401 && !isLogin) {
            if (isSuperAdmin) {
                const t = useSuperAdminStore.getState().token;
                if (t) useSuperAdminStore.getState().logout();
            } else {
                const t = useSchoolAuthStore.getState().token;
                if (t) useSchoolAuthStore.getState().logout();
            }
        }

        const message = data?.error || data?.message || err.message || "Request failed";
        return Promise.reject(new ApiError(message, {status, url}));
    }
);

export default api;
