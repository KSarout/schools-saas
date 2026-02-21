import { useMutation, useQueryClient } from "@tanstack/react-query";
import { promoteEnrollment } from "@/features/enrollment/api/enrollment.api";
import type { PromoteEnrollmentPayload } from "@/features/enrollment/dto/enrollment.dto";
import { enrollmentKeys } from "@/features/enrollment/hooks/useEnrollments";

export function usePromoteEnrollment() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (payload: PromoteEnrollmentPayload) => promoteEnrollment(payload),
        onSuccess: async (_result, payload) => {
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: enrollmentKeys.all }),
                queryClient.invalidateQueries({ queryKey: enrollmentKeys.audits() }),
                queryClient.invalidateQueries({ queryKey: enrollmentKeys.history(payload.studentId) }),
            ]);
        },
    });
}
