import axios, {AxiosError, AxiosInstance} from "axios";
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

api.interceptors.request.use((config) => {
    const url = config.url ?? "";
    config.headers = config.headers ?? {};

    // Super Admin routes
    if (typeof window !== "undefined" && url.startsWith("/super-admin")) {
        const token = useSuperAdminStore.getState().token;
        if (token) config.headers.Authorization = `Bearer ${token}`;
        return config;
    }

    // School routes (default)
    if (typeof window !== "undefined") {
        const {token: schoolToken, tenantSlug} = useSchoolAuthStore.getState();

        if (tenantSlug) config.headers["X-Tenant"] = tenantSlug;
        if (schoolToken && !url.startsWith("/auth/login")) {
            config.headers.Authorization = `Bearer ${schoolToken}`;
        }
    }

    return config;
});

api.interceptors.response.use(
    (res) => res,
    (err: AxiosError<any>) => {
        const url = err.config?.url ?? "";
        const status = err.response?.status;
        const data: any = err.response?.data;

        if (status === 401 && url.startsWith("/super-admin")) {
            useSuperAdminStore.getState().logout();
        }
        if (status === 401 && !url.startsWith("/super-admin") && !url.startsWith("/auth/login")) {
            useSchoolAuthStore.getState().logout();
        }

        const message = data?.error || data?.message || err.message || "Request failed";
        return Promise.reject(new ApiError(message, {status, url}));
    }
);

export default api;
