import { useMutation, useQueryClient } from "@tanstack/react-query";
import { withdrawEnrollment } from "@/features/enrollment/api/enrollment.api";
import type { WithdrawEnrollmentPayload } from "@/features/enrollment/dto/enrollment.dto";
import { enrollmentKeys } from "@/features/enrollment/hooks/useEnrollments";

export function useWithdrawEnrollment() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (payload: WithdrawEnrollmentPayload) => withdrawEnrollment(payload),
        onSuccess: async (_result, payload) => {
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: enrollmentKeys.all }),
                queryClient.invalidateQueries({ queryKey: enrollmentKeys.history(payload.studentId) }),
            ]);
        },
    });
}
