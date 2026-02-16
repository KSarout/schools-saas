"use client";

import { useMutation } from "@tanstack/react-query";
import { superAdminApi } from "../api/superAdmin.api";
import {useSuperAdminStore} from "@/lib/stores/superAdminStore";
import {SuperAdminLoginPayload} from "@/features/super-admin/api/uperAdmin.dto";

export function useSuperAdminLogin() {
    const setToken = useSuperAdminStore((s) => s.setToken);

    return useMutation({
        mutationFn: (input: SuperAdminLoginPayload) => superAdminApi.login(input),
        onSuccess: (data) => setToken(data.accessToken),
    });
}
