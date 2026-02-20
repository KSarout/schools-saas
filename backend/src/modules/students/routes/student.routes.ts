import {Router} from "express";
import {z} from "zod";
import {schoolAuth} from "../../../middlewares/schoolAuth";
import {requireSchoolPermission} from "../../../middlewares/rbac";
import {nextSequence} from "../../counters/service/counter.service";
import {formatStudentCode} from "../service/studentCode";
import {
    countStudentsForTenant,
    createStudentForTenant,
    findStudentByIdForTenant,
    listStudentsForTenant,
} from "../service/student.repo";
import { sendError, sendList, sendOk } from "../../../core/apiResponse";
import { buildStudentListFilter, studentListSort } from "../service/student.search";
import { toStudentDto } from "../dto/student.dto";

export const studentRouter = Router();

studentRouter.use(schoolAuth);

const GenderSchema = z.enum(["MALE", "FEMALE"]);
const StatusSchema = z.enum(["ACTIVE", "INACTIVE"]);

/*
|--------------------------------------------------------------------------
| CREATE
|--------------------------------------------------------------------------
*/
studentRouter.post(
    "/",
    requireSchoolPermission("students.create"),
    async (req, res) => {
        const schema = z.object({
            studentId: z.string().min(1),
            firstName: z.string().min(1),
            lastName: z.string().min(1),
            gender: GenderSchema,
            dateOfBirth: z.string().optional(),
            grade: z.string().min(1),
            section: z.string().min(1),
            parentName: z.string().optional(),
            parentPhone: z.string().optional(),
            address: z.string().optional(),
        });

        const parsed = schema.safeParse(req.body);
        if (!parsed.success) return sendError(res, 400, "Invalid input", parsed.error.issues);

        const tenantId = req.user!.tenantId;

        const year = new Date().getFullYear();
        const counterKey = `STUDENT:${year}`;

        // retry at most 2 times on duplicate code (extremely rare)
        for (let attempt = 0; attempt < 2; attempt++) {
            const seq = await nextSequence(tenantId, counterKey);
            const studentCode = formatStudentCode(seq, { year });

            try {
                const created = await createStudentForTenant(tenantId, {
                    studentCode,
                    studentId: parsed.data.studentId.trim(),
                    firstName: parsed.data.firstName.trim(),
                    lastName: parsed.data.lastName.trim(),
                    gender: parsed.data.gender,
                    dateOfBirth: parsed.data.dateOfBirth ? new Date(parsed.data.dateOfBirth) : undefined,
                    grade: parsed.data.grade.trim(),
                    section: parsed.data.section.trim(),
                    parentName: parsed.data.parentName?.trim() || undefined,
                    parentPhone: parsed.data.parentPhone?.trim() || undefined,
                    address: parsed.data.address?.trim() || undefined,
                    status: "ACTIVE",
                });

                return res.status(201).json(toStudentDto(created));
            } catch (err: any) {
                // Mongo duplicate key error
                if (err?.code === 11000 && attempt === 0) continue;
                throw err;
            }
        }

        return sendError(res, 500, "Failed to create student");
    }
);


/*
|--------------------------------------------------------------------------
| LIST
|--------------------------------------------------------------------------
*/
studentRouter.get(
    "/",
    requireSchoolPermission("students.list"),
    async (req, res) => {
        const schema = z.object({
            q: z.string().optional(),
            page: z.coerce.number().int().min(1).default(1),
            limit: z.coerce.number().int().min(1).max(50).default(10),
            status: StatusSchema.optional(),
        });

        const parsed = schema.safeParse(req.query);
        if (!parsed.success) return sendError(res, 400, "Invalid query params", parsed.error.issues);

        const {q, page, limit, status} = parsed.data;
        const tenantId = req.user!.tenantId;
        const skip = (page - 1) * limit;
        const filter = buildStudentListFilter({ q, status });

        const [items, total] = await Promise.all([
            listStudentsForTenant(tenantId, filter).sort(studentListSort).skip(skip).limit(limit).lean(),
            countStudentsForTenant(tenantId, filter),
        ]);

        return sendList(res, {
            items: items.map(toStudentDto),
            total,
            page,
            limit,
        });
    }
);

/*
|--------------------------------------------------------------------------
| GET BY ID
|--------------------------------------------------------------------------
*/
studentRouter.get(
    "/:id",
    requireSchoolPermission("students.read"),
    async (req, res) => {
        const tenantId = req.user!.tenantId;
        const studentId = String(req.params.id);

        const student = await findStudentByIdForTenant(tenantId, studentId).lean();

        if (!student) return sendError(res, 404, "Student not found");

        return res.json(toStudentDto(student));
    }
);

/*
|--------------------------------------------------------------------------
| PATCH
|--------------------------------------------------------------------------
*/
studentRouter.patch(
    "/:id",
    requireSchoolPermission("students.update"),
    async (req, res) => {
        const schema = z
            .object({
                studentId: z.string().optional(),
                firstName: z.string().optional(),
                lastName: z.string().optional(),
                gender: GenderSchema.optional(),
                dateOfBirth: z.string().optional(),
                grade: z.string().optional(),
                section: z.string().optional(),
                parentName: z.string().optional(),
                parentPhone: z.string().optional(),
                address: z.string().optional(),
                status: StatusSchema.optional(),
            })
            .refine((v) => Object.keys(v).length > 0, {message: "At least one field is required"});

        const parsed = schema.safeParse(req.body);
        if (!parsed.success) return sendError(res, 400, "Invalid input", parsed.error.issues);

        const tenantId = req.user!.tenantId;
        const studentId = String(req.params.id);

        const student = await findStudentByIdForTenant(tenantId, studentId);
        if (!student) return sendError(res, 404, "Student not found");

        const data = parsed.data;

        if (data.studentId !== undefined) student.studentId = data.studentId.trim();
        if (data.firstName !== undefined) student.firstName = data.firstName.trim();
        if (data.lastName !== undefined) student.lastName = data.lastName.trim();
        if (data.gender !== undefined) student.gender = data.gender;
        if (data.grade !== undefined) student.grade = data.grade.trim();
        if (data.section !== undefined) student.section = data.section.trim();
        if (data.status !== undefined) student.status = data.status;

        if (data.parentName !== undefined) student.parentName = data.parentName.trim() || undefined;
        if (data.parentPhone !== undefined) student.parentPhone = data.parentPhone.trim() || undefined;
        if (data.address !== undefined) student.address = data.address.trim() || undefined;

        if (data.dateOfBirth !== undefined) {
            student.dateOfBirth = data.dateOfBirth ? new Date(data.dateOfBirth) : undefined;
        }

        await student.save();
        return res.json(toStudentDto(student));
    }
);

/*
|--------------------------------------------------------------------------
| SOFT DELETE
|--------------------------------------------------------------------------
*/
studentRouter.delete(
    "/:id",
    requireSchoolPermission("students.delete"),
    async (req, res) => {
        const tenantId = req.user!.tenantId;
        const studentId = String(req.params.id);

        const student = await findStudentByIdForTenant(tenantId, studentId);
        if (!student) return sendError(res, 404, "Student not found");

        student.status = "INACTIVE";
        await student.save();

        return sendOk(res);
    }
);
