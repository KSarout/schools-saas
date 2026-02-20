import {Router} from "express";
import {z} from "zod";
import {StudentModel, type StudentDocument} from "./student.model";
import {schoolAuth} from "../../middlewares/schoolAuth";
import {requireRole} from "../../middlewares/rbac";
import {nextSequence} from "../counters/counter.service";
import {formatStudentCode} from "./studentCode";

export const studentRouter = Router();

studentRouter.use(schoolAuth);

const GenderSchema = z.enum(["MALE", "FEMALE"]);
const StatusSchema = z.enum(["ACTIVE", "INACTIVE"]);

function escapeRegex(input: string) {
    return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Works for both mongoose docs and lean objects
type StudentLike = StudentDocument | (Record<string, any> & { _id: any });

export function toStudentDto(s: StudentLike) {
    const id = typeof s._id?.toString === "function" ? s._id.toString() : String(s._id);

    return {
        id,
        studentCode: s.studentCode,
        studentId: s.studentId,

        firstName: s.firstName,
        lastName: s.lastName,
        gender: s.gender,

        dateOfBirth: s.dateOfBirth ? new Date(s.dateOfBirth).toISOString() : undefined,

        grade: s.grade,
        section: s.section,

        parentName: s.parentName ?? undefined,
        parentPhone: s.parentPhone ?? undefined,
        address: s.address ?? undefined,

        status: s.status,

        createdAt: s.createdAt ? new Date(s.createdAt).toISOString() : undefined,
        updatedAt: s.updatedAt ? new Date(s.updatedAt).toISOString() : undefined,
    };
}

/*
|--------------------------------------------------------------------------
| CREATE
|--------------------------------------------------------------------------
*/
studentRouter.post(
    "/",
    requireRole("SCHOOL_ADMIN", "ACCOUNTANT"),
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
        if (!parsed.success) return res.status(400).json({ error: "Invalid input" });

        const tenantId = req.user!.tenantId;

        const year = new Date().getFullYear();
        const counterKey = `STUDENT:${year}`;

        // retry at most 2 times on duplicate code (extremely rare)
        for (let attempt = 0; attempt < 2; attempt++) {
            const seq = await nextSequence(tenantId, counterKey);
            const studentCode = formatStudentCode(seq, { year });

            try {
                const created = await StudentModel.create({
                    tenantId,
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

        return res.status(500).json({ error: "Failed to create student" });
    }
);


/*
|--------------------------------------------------------------------------
| LIST
|--------------------------------------------------------------------------
*/
studentRouter.get(
    "/",
    requireRole("SCHOOL_ADMIN", "TEACHER", "ACCOUNTANT"),
    async (req, res) => {
        const schema = z.object({
            q: z.string().optional(),
            page: z.coerce.number().int().min(1).default(1),
            limit: z.coerce.number().int().min(1).max(50).default(10),
            status: StatusSchema.optional(),
        });

        const parsed = schema.safeParse(req.query);
        if (!parsed.success) return res.status(400).json({error: "Invalid query params"});

        const {q, page, limit, status} = parsed.data;
        const tenantId = req.user!.tenantId;
        const skip = (page - 1) * limit;

        const filter: Record<string, any> = {
            tenantId,
            status: status ?? "ACTIVE",
        };

        if (q?.trim()) {
            const s = q.trim();
            const safe = escapeRegex(s);

            const looksLikeCode = s.toUpperCase().startsWith("STU-");
            filter.$or = looksLikeCode
                ? [{studentCode: {$regex: `^${safe}`, $options: "i"}}]
                : [
                    {studentCode: {$regex: safe, $options: "i"}},
                    {studentId: {$regex: safe, $options: "i"}},
                    {firstName: {$regex: safe, $options: "i"}},
                    {lastName: {$regex: safe, $options: "i"}},
                    {parentPhone: {$regex: safe, $options: "i"}},
                ];
        }

        const [items, total] = await Promise.all([
            StudentModel.find(filter).sort({createdAt: -1}).skip(skip).limit(limit).lean(),
            StudentModel.countDocuments(filter),
        ]);

        return res.json({
            items: items.map(toStudentDto),
            total,
            page,
            limit,
            totalPages: Math.max(1, Math.ceil(total / limit)),
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
    requireRole("SCHOOL_ADMIN", "TEACHER", "ACCOUNTANT"),
    async (req, res) => {
        const tenantId = req.user!.tenantId;

        const student = await StudentModel.findOne({
            _id: req.params.id,
            tenantId,
        }).lean();

        if (!student) return res.status(404).json({error: "Student not found"});

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
    requireRole("SCHOOL_ADMIN", "ACCOUNTANT"),
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
        if (!parsed.success) return res.status(400).json({error: "Invalid input"});

        const tenantId = req.user!.tenantId;

        const student = await StudentModel.findOne({_id: req.params.id, tenantId});
        if (!student) return res.status(404).json({error: "Student not found"});

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
    requireRole("SCHOOL_ADMIN", "ACCOUNTANT"),
    async (req, res) => {
        const tenantId = req.user!.tenantId;

        const student = await StudentModel.findOne({_id: req.params.id, tenantId});
        if (!student) return res.status(404).json({error: "Student not found"});

        student.status = "INACTIVE";
        await student.save();

        return res.json({ok: true});
    }
);
