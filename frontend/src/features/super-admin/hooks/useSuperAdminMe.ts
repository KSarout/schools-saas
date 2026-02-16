"use client";

import { useQuery } from "@tanstack/react-query";
import { superAdminKeys } from "../queryKeys";
import { superAdminApi } from "../api/superAdmin.api";
import {useSuperAdminStore} from "@/lib/stores/superAdminStore";

export function useSuperAdminMe() {
    const token = useSuperAdminStore((s) => s.token);

    return useQuery({
        queryKey: superAdminKeys.me(),
        queryFn: superAdminApi.me,
        enabled: !!token,
        retry: false,
        staleTime: 1000 * 30,
    });
}
