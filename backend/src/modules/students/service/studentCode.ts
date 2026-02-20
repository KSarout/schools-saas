type StudentCodeOptions = {
    prefix?: string;     // default: STU
    padLength?: number;  // default: 6
    year?: number;       // optional override (for testing)
};

export function formatStudentCode(
    seq: number,
    options: StudentCodeOptions = {}
) {
    if (!Number.isFinite(seq) || seq <= 0) {
        throw new Error("Invalid sequence number");
    }

    const {
        prefix = "STU",
        padLength = 6,
        year = new Date().getFullYear(),
    } = options;

    const padded = String(seq).padStart(padLength, "0");

    return `${prefix}-${year}-${padded}`;
}
