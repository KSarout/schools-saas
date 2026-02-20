import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSchoolAuthStore } from "@/lib/stores/useSchoolAuthStore";
import {
    changePassword,
    schoolLogin,
    schoolLogout,
    schoolMe,
    schoolRefresh,
    type SchoolLoginInput,
    type SchoolMeResponse,
} from "@/features/school-auth/api/schoolAuth.api";

export const schoolAuthKeys = {
    all: ["schoolAuth"] as const,
    me: () => [...schoolAuthKeys.all, "me"] as const,
};

export function useSchoolLogin() {
    const qc = useQueryClient();

    return useMutation({
        mutationFn: (input: SchoolLoginInput) => schoolLogin(input),
        meta: { feature: "school-auth", action: "login" },
        onSuccess: (data) => {
            // ✅ single source of truth: backend tenant slug
            useSchoolAuthStore.getState().login({
                token: data.accessToken,
                refreshToken: data.refreshToken,
                tenantSlug: data.tenant.slug,
                user: data.user,
                tenant: data.tenant,
            });

            // ✅ warm cache for immediate shell rendering
            const mePayload: SchoolMeResponse = {
                user: { ...data.user, mustChangePassword: data.mustChangePassword },
                tenant: data.tenant,
            };

            qc.setQueryData(schoolAuthKeys.me(), mePayload);
        },
    });
}

export function useSchoolMe() {
    const hydrated = useSchoolAuthStore((s) => s.hydrated);
    const token = useSchoolAuthStore((s) => s.token);

    return useQuery({
        queryKey: schoolAuthKeys.me(),
        enabled: hydrated && !!token,
        queryFn: schoolMe,
        retry: false,
        meta: { feature: "school-auth", action: "me" },
    });
}

export function useChangePassword() {
    const qc = useQueryClient();

    return useMutation({
        mutationFn: changePassword,
        meta: { feature: "school-auth", action: "change-password" },
        onSuccess: async () => {
            // refresh /me so UI reflects mustChangePassword=false
            await qc.invalidateQueries({ queryKey: schoolAuthKeys.me() });
        },
    });
}

export function useSchoolLogout() {
    return useMutation({
        mutationFn: async () => {
            const { refreshToken } = useSchoolAuthStore.getState();
            if (refreshToken) {
                await schoolLogout(refreshToken);
            }
        },
        onSettled: () => {
            useSchoolAuthStore.getState().logout();
        },
    });
}

export async function refreshSchoolSession() {
    const state = useSchoolAuthStore.getState();
    if (!state.refreshToken) return null;

    const tokens = await schoolRefresh(state.refreshToken);
    useSchoolAuthStore.getState().setToken(tokens.accessToken);
    useSchoolAuthStore.getState().setRefreshToken(tokens.refreshToken);
    return tokens.accessToken;
}
