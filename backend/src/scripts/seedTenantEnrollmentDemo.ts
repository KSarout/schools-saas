import mongoose, { Types } from "mongoose";
import { connectDB } from "../core/db";
import { logger } from "../core/logger";
import { AcademicYearModel } from "../modules/academic-years/academic-year.model";
import { SchoolClassModel } from "../modules/classes/class.model";
import { SectionModel } from "../modules/sections/section.model";
import { EnrollmentModel } from "../modules/enrollments/model/enrollment.model";
import { StudentModel } from "../modules/students/model/student.model";
import { UserModel } from "../modules/users/model/user.model";
import { hashPassword } from "../utils/password";

type SeedArgs = {
    tenantId: string;
};

function parseArgs(argv: string[]): SeedArgs {
    const tenantArg = argv.find((arg) => arg.startsWith("--tenantId="));
    const tenantId = tenantArg?.slice("--tenantId=".length)?.trim();

    if (!tenantId) {
        throw new Error("Missing required argument: --tenantId=<ObjectId>");
    }

    if (!Types.ObjectId.isValid(tenantId)) {
        throw new Error("Invalid tenantId. Must be a valid ObjectId.");
    }

    return { tenantId };
}

function ensureNonProduction() {
    if (process.env.NODE_ENV === "production") {
        throw new Error("This seed script is disabled in production");
    }
}

function studentRows(tenantId: string) {
    const suffix = tenantId.slice(-6).toUpperCase();
    return [
        {
            studentCode: `STU-${suffix}-0001`,
            studentId: `SCH-${suffix}-001`,
            firstName: "Dara",
            lastName: "Sok",
            gender: "MALE" as const,
            grade: "Grade 7",
            section: "A",
            parentName: "Sok Chan",
            parentPhone: "012000001",
            address: "Phnom Penh",
        },
        {
            studentCode: `STU-${suffix}-0002`,
            studentId: `SCH-${suffix}-002`,
            firstName: "Sreyneang",
            lastName: "Kim",
            gender: "FEMALE" as const,
            grade: "Grade 7",
            section: "A",
            parentName: "Kim Srey",
            parentPhone: "012000002",
            address: "Phnom Penh",
        },
        {
            studentCode: `STU-${suffix}-0003`,
            studentId: `SCH-${suffix}-003`,
            firstName: "Vannak",
            lastName: "Meas",
            gender: "MALE" as const,
            grade: "Grade 7",
            section: "A",
            parentName: "Meas Vann",
            parentPhone: "012000003",
            address: "Phnom Penh",
        },
    ];
}

async function ensureSeedActor(tenantId: string) {
    const existing = await UserModel.findOne({ role: "SCHOOL_ADMIN", isActive: true }).setOptions({ tenantId });
    if (existing) return existing;

    const suffix = tenantId.slice(-6).toLowerCase();
    const passwordHash = await hashPassword("SeedAdmin123!");
    return UserModel.create({
        tenantId,
        name: "Seed School Admin",
        email: `seed-admin-${suffix}@local.school`,
        passwordHash,
        role: "SCHOOL_ADMIN",
        isActive: true,
        mustChangePassword: true,
    });
}

async function run() {
    ensureNonProduction();
    const { tenantId } = parseArgs(process.argv.slice(2));

    await connectDB();

    logger.info("seed.enrollment-demo.start", { tenantId, nodeEnv: process.env.NODE_ENV });

    const actor = await ensureSeedActor(tenantId);

    const academicYear = await AcademicYearModel.findOneAndUpdate(
        { code: "AY-2026" },
        {
            $set: {
                tenantId,
                name: "Academic Year 2026",
                code: "AY-2026",
                startDate: new Date("2026-01-01T00:00:00.000Z"),
                endDate: new Date("2026-12-31T23:59:59.999Z"),
                isActive: true,
                isCurrent: true,
            },
        },
        { new: true, upsert: true, setDefaultsOnInsert: true }
    ).setOptions({ tenantId });

    await AcademicYearModel.updateMany(
        { _id: { $ne: academicYear._id }, isCurrent: true },
        { $set: { isCurrent: false } }
    ).setOptions({ tenantId });

    const schoolClass = await SchoolClassModel.findOneAndUpdate(
        { academicYearId: academicYear._id, code: "G7-A" },
        {
            $set: {
                tenantId,
                academicYearId: academicYear._id,
                name: "Grade 7 - A",
                code: "G7-A",
                level: "GRADE_7",
                capacity: 40,
                isActive: true,
            },
        },
        { new: true, upsert: true, setDefaultsOnInsert: true }
    ).setOptions({ tenantId });

    const section = await SectionModel.findOneAndUpdate(
        { classId: schoolClass._id, code: "A" },
        {
            $set: {
                tenantId,
                classId: schoolClass._id,
                name: "Section A",
                code: "A",
                capacity: 40,
                isActive: true,
            },
        },
        { new: true, upsert: true, setDefaultsOnInsert: true }
    ).setOptions({ tenantId });

    const seededStudents = [] as Array<{ _id: Types.ObjectId; studentId: string }>;
    for (const row of studentRows(tenantId)) {
        const student = await StudentModel.findOneAndUpdate(
            { studentId: row.studentId },
            {
                $set: {
                    tenantId,
                    studentCode: row.studentCode,
                    studentId: row.studentId,
                    firstName: row.firstName,
                    lastName: row.lastName,
                    gender: row.gender,
                    grade: row.grade,
                    section: row.section,
                    academicYearId: academicYear._id,
                    classId: schoolClass._id,
                    sectionId: section._id,
                    parentName: row.parentName,
                    parentPhone: row.parentPhone,
                    address: row.address,
                    status: "ACTIVE",
                },
            },
            { new: true, upsert: true, setDefaultsOnInsert: true }
        ).setOptions({ tenantId });

        seededStudents.push({ _id: student._id, studentId: student.studentId });
    }

    for (const student of seededStudents) {
        await EnrollmentModel.findOneAndUpdate(
            {
                studentId: student._id,
                academicYearId: academicYear._id,
                status: "ACTIVE",
            },
            {
                $setOnInsert: {
                    tenantId,
                    studentId: student._id,
                    academicYearId: academicYear._id,
                    classId: schoolClass._id,
                    sectionId: section._id,
                    status: "ACTIVE",
                    startDate: new Date("2026-01-10T00:00:00.000Z"),
                    note: "Seeded enrollment",
                    createdBy: actor._id,
                },
            },
            {
                upsert: true,
                new: true,
                setDefaultsOnInsert: true,
            }
        ).setOptions({ tenantId });
    }

    logger.info("seed.enrollment-demo.done", {
        tenantId,
        academicYearId: String(academicYear._id),
        classId: String(schoolClass._id),
        sectionId: String(section._id),
        studentCount: seededStudents.length,
    });

    await mongoose.disconnect();
}

run().catch(async (error) => {
    logger.error("seed.enrollment-demo.failed", {
        error: error instanceof Error ? error.message : String(error),
    });

    await mongoose.disconnect();
    process.exit(1);
});
