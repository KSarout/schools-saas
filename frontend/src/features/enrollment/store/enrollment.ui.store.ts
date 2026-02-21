import { create } from "zustand";
import type { EnrollmentListItem } from "@/features/enrollment/dto/enrollment.dto";

type EnrollmentUiState = {
    selectedEnrollment: EnrollmentListItem | null;
    assignOpen: boolean;
    transferOpen: boolean;
    promoteOpen: boolean;
    withdrawOpen: boolean;
    openAssign: () => void;
    openTransfer: (enrollment: EnrollmentListItem) => void;
    openPromote: (enrollment: EnrollmentListItem) => void;
    openWithdraw: (enrollment: EnrollmentListItem) => void;
    closeAssign: () => void;
    closeTransfer: () => void;
    closePromote: () => void;
    closeWithdraw: () => void;
};

export const useEnrollmentUiStore = create<EnrollmentUiState>((set) => ({
    selectedEnrollment: null,
    assignOpen: false,
    transferOpen: false,
    promoteOpen: false,
    withdrawOpen: false,
    openAssign: () => set({ assignOpen: true }),
    openTransfer: (selectedEnrollment) => set({ selectedEnrollment, transferOpen: true }),
    openPromote: (selectedEnrollment) => set({ selectedEnrollment, promoteOpen: true }),
    openWithdraw: (selectedEnrollment) => set({ selectedEnrollment, withdrawOpen: true }),
    closeAssign: () => set({ assignOpen: false }),
    closeTransfer: () => set({ transferOpen: false, selectedEnrollment: null }),
    closePromote: () => set({ promoteOpen: false, selectedEnrollment: null }),
    closeWithdraw: () => set({ withdrawOpen: false, selectedEnrollment: null }),
}));
