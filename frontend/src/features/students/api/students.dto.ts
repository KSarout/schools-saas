import { z } from "zod";
import { listResponseSchema } from "@/lib/schemas/listResponse";

export const StudentGender = ["MALE", "FEMALE"] as const;
export type StudentGender = (typeof StudentGender)[number];

export const StudentSchema = z.object({
    id: z.string(),
    studentId: z.string(),
    firstName: z.string(),
    lastName: z.string(),
    gender: z.enum(StudentGender),
    dateOfBirth: z.string().optional(),
    grade: z.string(),
    section: z.string(),
    academicYearId: z.string().optional(),
    classId: z.string().optional(),
    sectionId: z.string().optional(),
    parentName: z.string().optional(),
    parentPhone: z.string().optional(),
    address: z.string().optional(),
    createdAt: z.string().optional(),
});
export type StudentDto = z.infer<typeof StudentSchema>;

export const StudentListResponseSchema = listResponseSchema(StudentSchema);
export type StudentListResponse = z.infer<typeof StudentListResponseSchema>;

export const StudentCreateInputSchema = z.object({
    studentId: z.string().optional(),
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    gender: z.enum(StudentGender),
    dateOfBirth: z.string().optional(),
    grade: z.string().min(1),
    section: z.string().min(1),
    academicYearId: z.string().optional(),
    classId: z.string().optional(),
    sectionId: z.string().optional(),
    parentName: z.string().optional(),
    parentPhone: z.string().optional(),
    address: z.string().optional(),
});
export type StudentCreateInput = z.infer<typeof StudentCreateInputSchema>;

export const StudentUpdateInputSchema = StudentCreateInputSchema.partial();
export type StudentUpdateInput = z.infer<typeof StudentUpdateInputSchema>;
