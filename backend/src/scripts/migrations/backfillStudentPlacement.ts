import mongoose from "mongoose";
import { connectDB } from "../../core/db";
import { logger } from "../../core/logger";
import { StudentModel } from "../../modules/students/model/student.model";
import { AcademicYearModel } from "../../modules/academic-years/academic-year.model";
import { SchoolClassModel } from "../../modules/classes/class.model";
import { SectionModel } from "../../modules/sections/section.model";
import { validateStudentPlacement } from "../../modules/students/service/studentPlacement";

type TenantId = string;

type Args = {
    apply: boolean;
    tenantId?: string;
    limit?: number;
};

type BackfillStats = {
    scanned: number;
    updated: number;
    skipped: number;
    unresolved: number;
    errors: number;
};

function parseArgs(argv: string[]): Args {
    const args: Args = { apply: false };

    for (const arg of argv) {
        if (arg === "--apply") args.apply = true;
        if (arg.startsWith("--tenantId=")) args.tenantId = arg.slice("--tenantId=".length);
        if (arg.startsWith("--limit=")) {
            const limit = Number(arg.slice("--limit=".length));
            if (Number.isFinite(limit) && limit > 0) args.limit = Math.floor(limit);
        }
    }

    return args;
}

function normalize(value: string | undefined | null) {
    return (value ?? "").trim().toLowerCase();
}

async function getDefaultAcademicYearId(tenantId: TenantId): Promise<string | undefined> {
    const current = await AcademicYearModel.findOne({ isCurrent: true })
        .sort({ startDate: -1, _id: 1 })
        .setOptions({ tenantId });
    if (current) return String(current._id);

    const latest = await AcademicYearModel.findOne({ isActive: true })
        .sort({ startDate: -1, _id: 1 })
        .setOptions({ tenantId });
    if (latest) return String(latest._id);

    return undefined;
}

async function resolveClassId(params: {
    tenantId: TenantId;
    grade: string;
    academicYearId?: string;
}): Promise<{ classId?: string; academicYearId?: string; reason?: string }> {
    const grade = normalize(params.grade);
    if (!grade) return { reason: "missing-grade" };

    const baseFilter: Record<string, unknown> = {
        $or: [{ nameSearch: grade }, { codeSearch: grade }],
    };

    if (params.academicYearId) baseFilter.academicYearId = params.academicYearId;

    const classes = await SchoolClassModel.find(baseFilter)
        .sort({ createdAt: -1, _id: 1 })
        .limit(2)
        .setOptions({ tenantId: params.tenantId });

    if (classes.length === 1 && classes[0]) {
        const candidate = classes[0];
        return {
            classId: String(candidate._id),
            academicYearId: String(candidate.academicYearId),
        };
    }

    if (classes.length > 1) return { reason: "ambiguous-class" };

    if (params.academicYearId) {
        const fallback = await SchoolClassModel.find({
            $or: [{ nameSearch: grade }, { codeSearch: grade }],
        })
            .sort({ createdAt: -1, _id: 1 })
            .limit(2)
            .setOptions({ tenantId: params.tenantId });

        if (fallback.length === 1 && fallback[0]) {
            const candidate = fallback[0];
            return {
                classId: String(candidate._id),
                academicYearId: String(candidate.academicYearId),
            };
        }

        if (fallback.length > 1) return { reason: "ambiguous-class" };
    }

    return { reason: "class-not-found" };
}

async function resolveSectionId(params: {
    tenantId: TenantId;
    classId?: string;
    section: string;
}): Promise<{ sectionId?: string; reason?: string }> {
    if (!params.classId) return { reason: "missing-class" };
    const section = normalize(params.section);
    if (!section) return { reason: "missing-section" };

    const matches = await SectionModel.find({
        classId: params.classId,
        $or: [{ nameSearch: section }, { codeSearch: section }],
    })
        .sort({ createdAt: -1, _id: 1 })
        .limit(2)
        .setOptions({ tenantId: params.tenantId });

    if (matches.length === 1 && matches[0]) return { sectionId: String(matches[0]._id) };
    if (matches.length > 1) return { reason: "ambiguous-section" };

    return { reason: "section-not-found" };
}

async function runTenantBackfill(tenantId: TenantId, args: Args): Promise<BackfillStats> {
    const stats: BackfillStats = {
        scanned: 0,
        updated: 0,
        skipped: 0,
        unresolved: 0,
        errors: 0,
    };

    const defaultAcademicYearId = await getDefaultAcademicYearId(tenantId);

    const cursor = StudentModel.find({
        $or: [{ academicYearId: { $exists: false } }, { classId: { $exists: false } }, { sectionId: { $exists: false } }],
    })
        .sort({ createdAt: 1, _id: 1 })
        .setOptions({ tenantId })
        .cursor();

    for await (const student of cursor) {
        if (args.limit && stats.scanned >= args.limit) break;
        stats.scanned += 1;

        try {
            const currentAcademicYearId = student.academicYearId ? String(student.academicYearId) : undefined;
            const currentClassId = student.classId ? String(student.classId) : undefined;
            const currentSectionId = student.sectionId ? String(student.sectionId) : undefined;

            let nextAcademicYearId = currentAcademicYearId;
            let nextClassId = currentClassId;
            let nextSectionId = currentSectionId;

            if (!nextAcademicYearId && defaultAcademicYearId) {
                nextAcademicYearId = defaultAcademicYearId;
            }

            if (!nextClassId) {
                const resolvedClass = await resolveClassId({
                    tenantId,
                    grade: student.grade,
                    academicYearId: nextAcademicYearId,
                });

                if (resolvedClass.classId) {
                    nextClassId = resolvedClass.classId;
                    nextAcademicYearId = resolvedClass.academicYearId ?? nextAcademicYearId;
                }
            }

            if (!nextSectionId) {
                const resolvedSection = await resolveSectionId({
                    tenantId,
                    classId: nextClassId,
                    section: student.section,
                });

                if (resolvedSection.sectionId) {
                    nextSectionId = resolvedSection.sectionId;
                }
            }

            const changed =
                nextAcademicYearId !== currentAcademicYearId ||
                nextClassId !== currentClassId ||
                nextSectionId !== currentSectionId;

            if (!changed) {
                stats.skipped += 1;
                continue;
            }

            await validateStudentPlacement(tenantId, {
                academicYearId: nextAcademicYearId,
                classId: nextClassId,
                sectionId: nextSectionId,
            });

            if (args.apply) {
                student.academicYearId = nextAcademicYearId as any;
                student.classId = nextClassId as any;
                student.sectionId = nextSectionId as any;
                await student.save();
            }

            stats.updated += 1;
        } catch (error: any) {
            if (String(error?.message || "").includes("must belong") || String(error?.message || "").includes("required")) {
                stats.unresolved += 1;
                continue;
            }

            stats.errors += 1;
            logger.warn("student.placement.backfill.error", {
                tenantId,
                studentId: String((student as any)?._id ?? ""),
                error: error?.message || String(error),
            });
        }
    }

    return stats;
}

async function run() {
    const args = parseArgs(process.argv.slice(2));
    await connectDB();

    const tenantFilter = args.tenantId ? { _id: args.tenantId } : {};
    const tenantIds = await StudentModel.find(tenantFilter).distinct("tenantId");

    logger.info("student.placement.backfill.start", {
        mode: args.apply ? "apply" : "dry-run",
        tenantId: args.tenantId,
        tenantCount: tenantIds.length,
        limit: args.limit,
    });

    for (const tenantIdRaw of tenantIds) {
        const tenantId = String(tenantIdRaw);
        const stats = await runTenantBackfill(tenantId, args);

        logger.info("student.placement.backfill.tenant", {
            tenantId,
            mode: args.apply ? "apply" : "dry-run",
            ...stats,
        });
    }

    logger.info("student.placement.backfill.done", {
        mode: args.apply ? "apply" : "dry-run",
    });

    await mongoose.disconnect();
}

run().catch(async (error) => {
    logger.error("student.placement.backfill.failed", { error: error?.message || String(error) });
    await mongoose.disconnect();
    process.exit(1);
});
