"use client";

import { useMutation } from "@tanstack/react-query";
import { superAdminApi } from "../api/superAdmin.api";
import {useSuperAdminStore} from "@/lib/stores/superAdminStore";
import {SuperAdminLoginPayload} from "@/features/super-admin/api/uperAdmin.dto";

export function useSuperAdminLogin() {
    const setToken = useSuperAdminStore((s) => s.setToken);
    const setRefreshToken = useSuperAdminStore((s) => s.setRefreshToken);

    return useMutation({
        mutationFn: (input: SuperAdminLoginPayload) => superAdminApi.login(input),
        onSuccess: (data) => {
            setToken(data.accessToken);
            setRefreshToken(data.refreshToken);
        },
    });
}

export function useSuperAdminLogout() {
    return useMutation({
        mutationFn: async () => {
            const { refreshToken } = useSuperAdminStore.getState();
            if (refreshToken) {
                await superAdminApi.logout(refreshToken);
            }
        },
        onSettled: () => {
            useSuperAdminStore.getState().logout();
        },
    });
}

export async function refreshSuperAdminSession() {
    const state = useSuperAdminStore.getState();
    if (!state.refreshToken) return null;

    const tokens = await superAdminApi.refresh(state.refreshToken);
    useSuperAdminStore.getState().setToken(tokens.accessToken);
    useSuperAdminStore.getState().setRefreshToken(tokens.refreshToken);
    return tokens.accessToken;
}
