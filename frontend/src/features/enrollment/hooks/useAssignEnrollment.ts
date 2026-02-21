import { useMutation, useQueryClient } from "@tanstack/react-query";
import { assignEnrollment } from "@/features/enrollment/api/enrollment.api";
import type { AssignEnrollmentPayload } from "@/features/enrollment/dto/enrollment.dto";
import { enrollmentKeys } from "@/features/enrollment/hooks/useEnrollments";

export function useAssignEnrollment() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (payload: AssignEnrollmentPayload) => assignEnrollment(payload),
        onSuccess: async (_result, payload) => {
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: enrollmentKeys.all }),
                queryClient.invalidateQueries({ queryKey: enrollmentKeys.audits() }),
                queryClient.invalidateQueries({ queryKey: enrollmentKeys.history(payload.studentId) }),
            ]);
        },
    });
}
