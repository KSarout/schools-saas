import { Router } from "express";
import { z } from "zod";
import { Student } from "./student.model";

import { schoolAuth } from "../../middlewares/schoolAuth";
import { requireRole } from "../../middlewares/rbac";

export const studentRouter = Router();

/*
|--------------------------------------------------------------------------
| CREATE STUDENT
|--------------------------------------------------------------------------
| Roles: SCHOOL_ADMIN
*/
studentRouter.post(
    "/",
    schoolAuth,
    requireRole("SCHOOL_ADMIN"),
    async (req, res) => {
        const schema = z.object({
            studentId: z.string().min(1),
            firstName: z.string().min(1),
            lastName: z.string().min(1),
            gender: z.enum(["MALE", "FEMALE"]),
            dateOfBirth: z.string().optional(),
            grade: z.string().min(1),
            section: z.string().min(1),
            parentName: z.string().optional(),
            parentPhone: z.string().optional(),
            address: z.string().optional(),
        });

        const parsed = schema.safeParse(req.body);
        if (!parsed.success)
            return res.status(400).json({ error: "Invalid input" });

        const tenantId = req.user!.tenantId;

        type CreateStudentInput = {
            tenantId: string;
            studentId: string;
            firstName: string;
            lastName: string;
            gender: "MALE" | "FEMALE";
            grade: string;
            section: string;
            dateOfBirth?: Date;
            parentName?: string;
            parentPhone?: string;
            address?: string;
        };

        const studentData: CreateStudentInput = {
            tenantId,
            studentId: parsed.data.studentId.trim(),
            firstName: parsed.data.firstName.trim(),
            lastName: parsed.data.lastName.trim(),
            gender: parsed.data.gender,
            grade: parsed.data.grade.trim(),
            section: parsed.data.section.trim(),
        };

        if (parsed.data.dateOfBirth) {
            studentData.dateOfBirth = new Date(parsed.data.dateOfBirth);
        }

        if (parsed.data.parentName) {
            studentData.parentName = parsed.data.parentName.trim();
        }

        if (parsed.data.parentPhone) {
            studentData.parentPhone = parsed.data.parentPhone.trim();
        }

        if (parsed.data.address) {
            studentData.address = parsed.data.address.trim();
        }

        const student = await Student.create(studentData);

        return res.json({ student });
    }
);

/*
|--------------------------------------------------------------------------
| LIST STUDENTS (Search + Pagination)
|--------------------------------------------------------------------------
| Roles: SCHOOL_ADMIN, TEACHER, ACCOUNTANT
*/
studentRouter.get(
    "/",
    schoolAuth,
    requireRole("SCHOOL_ADMIN", "TEACHER", "ACCOUNTANT"),
    async (req, res) => {
        const schema = z.object({
            q: z.string().optional(),
            page: z.string().optional(),
            limit: z.string().optional(),
            status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
        });

        const parsed = schema.safeParse(req.query);
        if (!parsed.success)
            return res.status(400).json({ error: "Invalid query params" });

        const tenantId = req.user!.tenantId;

        const q = parsed.data.q?.trim() || "";
        const page = Math.max(1, Number(parsed.data.page || 1));
        const limit = Math.min(50, Math.max(1, Number(parsed.data.limit || 10)));

        const filter: any = { tenantId };

        if (parsed.data.status) {
            filter.status = parsed.data.status;
        }

        if (q) {
            filter.$or = [
                { firstName: { $regex: q, $options: "i" } },
                { lastName: { $regex: q, $options: "i" } },
                { studentId: { $regex: q, $options: "i" } },
                { parentPhone: { $regex: q, $options: "i" } },
            ];
        }

        const [items, total] = await Promise.all([
            Student.find(filter)
                .sort({ createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(limit),
            Student.countDocuments(filter),
        ]);

        return res.json({
            items,
            total,
            page,
            limit,
            totalPages: Math.max(1, Math.ceil(total / limit)),
        });
    }
);

/*
|--------------------------------------------------------------------------
| GET STUDENT BY ID
|--------------------------------------------------------------------------
*/
studentRouter.get(
    "/:id",
    schoolAuth,
    requireRole("SCHOOL_ADMIN", "TEACHER", "ACCOUNTANT"),
    async (req, res) => {
        const tenantId = req.user!.tenantId;

        const student = await Student.findOne({
            _id: req.params.id,
            tenantId,
        });

        if (!student)
            return res.status(404).json({ error: "Student not found" });

        return res.json({ student });
    }
);

/*
|--------------------------------------------------------------------------
| UPDATE STUDENT
|--------------------------------------------------------------------------
| Roles: SCHOOL_ADMIN
*/
studentRouter.put(
    "/:id",
    schoolAuth,
    requireRole("SCHOOL_ADMIN"),
    async (req, res) => {
        const schema = z.object({
            firstName: z.string().min(1).optional(),
            lastName: z.string().min(1).optional(),
            gender: z.enum(["MALE", "FEMALE"]).optional(),
            dateOfBirth: z.string().optional(),
            grade: z.string().min(1).optional(),
            section: z.string().min(1).optional(),
            parentName: z.string().optional(),
            parentPhone: z.string().optional(),
            address: z.string().optional(),
            status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
        });

        const parsed = schema.safeParse(req.body);
        if (!parsed.success)
            return res.status(400).json({ error: "Invalid input" });

        const tenantId = req.user!.tenantId;

        const student = await Student.findOne({
            _id: req.params.id,
            tenantId,
        });

        if (!student)
            return res.status(404).json({ error: "Student not found" });

        Object.assign(student, {
            ...parsed.data,
            dateOfBirth: parsed.data.dateOfBirth
                ? new Date(parsed.data.dateOfBirth)
                : student.dateOfBirth,
        });

        await student.save();

        return res.json({ student });
    }
);

/*
|--------------------------------------------------------------------------
| SOFT DELETE STUDENT (Set INACTIVE)
|--------------------------------------------------------------------------
| Roles: SCHOOL_ADMIN
*/
studentRouter.delete(
    "/:id",
    schoolAuth,
    requireRole("SCHOOL_ADMIN"),
    async (req, res) => {
        const tenantId = req.user!.tenantId;

        const student = await Student.findOne({
            _id: req.params.id,
            tenantId,
        });

        if (!student)
            return res.status(404).json({ error: "Student not found" });

        student.status = "INACTIVE";
        await student.save();

        return res.json({ ok: true });
    }
);
