"use client"

import {useEffect, useMemo, useState} from "react"
import Link from "next/link"
import {useParams} from "next/navigation"
import {toast} from "sonner"

import {Button} from "@/components/ui/button"
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card"
import {Input} from "@/components/ui/input"
import {Badge} from "@/components/ui/badge"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import {StudentFormDialog} from "@/features/students/components/StudentFormDialog"
import {DeleteStudentDialog} from "@/features/students/components/DeleteStudentDialog"
import type {StudentDto, StudentCreateInput} from "@/features/students/api/students.dto"
import {
    useCreateStudent,
    useDeleteStudent,
    useStudentList,
    useUpdateStudent,
} from "@/features/students/hooks/useStudents"

import {useSchoolMe} from "@/features/school-auth/hooks/useSchoolAuth"
import {can, SchoolPermissions} from "@/features/school-auth/rbac/schoolRbac"
import { useAcademicYearsList } from "@/features/academic-years/hooks/useAcademicYears"
import { useClassesList } from "@/features/classes/hooks/useClasses"
import { useSectionsList } from "@/features/sections/hooks/useSections"


import {
    AlertTriangle,
    MoreHorizontal,
    Plus,
    Eye,
    Pencil,
    Trash2,
    Search,
    ArrowUpDown,
} from "lucide-react"

type SortKey = "studentId" | "name" | "grade"
type SortDir = "asc" | "desc"

export default function StudentsPageView() {
    const params = useParams<{ locale: string }>()
    const locale = params.locale
    const [q, setQ] = useState("")
    const [debouncedQ, setDebouncedQ] = useState("")
    const [page, setPage] = useState(1)
    const limit = 10

    const [sortKey, setSortKey] = useState<SortKey>("studentId")
    const [sortDir, setSortDir] = useState<SortDir>("asc")
    const strictPlacementEnv = process.env.NEXT_PUBLIC_STUDENTS_REQUIRE_STRUCTURE_ON_CREATE === "true"
    const [strictPlacementRequired, setStrictPlacementRequired] = useState(strictPlacementEnv)

    // debounce search
    useEffect(() => {
        const t = setTimeout(() => {
            setDebouncedQ(q)
        }, 400)

        return () => clearTimeout(t)
    }, [q])

    const list = useStudentList({q: debouncedQ, page, limit})

    // dialogs state
    const [createOpen, setCreateOpen] = useState(false)
    const [editOpen, setEditOpen] = useState(false)
    const [deleteOpen, setDeleteOpen] = useState(false)
    const [active, setActive] = useState<StudentDto | null>(null)

    const createMut = useCreateStudent()
    const updateMut = useUpdateStudent()
    const deleteMut = useDeleteStudent()
    const academicYearsQuery = useAcademicYearsList({ page: 1, limit: 50 })
    const classesQuery = useClassesList({ page: 1, limit: 50 })
    const sectionsQuery = useSectionsList({ page: 1, limit: 50 })

    const totalPages = list.data?.totalPages ?? 1

    const createError = createMut.isError ? (createMut.error as Error).message : null
    const updateError = updateMut.isError ? (updateMut.error as Error).message : null
    const deleteError = deleteMut.isError ? (deleteMut.error as Error).message : null

    const me = useSchoolMe()
    const role = me.data?.user?.role
    const canManage = can(role, SchoolPermissions.manageStudents)

    async function onCreate(input: StudentCreateInput) {
        if (!canManage) throw new Error("Forbidden")

        try {
            await createMut.mutateAsync(input)
            setCreateOpen(false)

            toast.success('Student created', {
                description: "The student record has been added successfully."
            });
        } catch (err) {
            const message = (err as Error).message || ""
            if (message.includes("academicYearId, classId, and sectionId are required")) {
                setStrictPlacementRequired(true)
            }
            toast("Create failed", {
                description: message,
            })
        }
    }

    async function onEdit(input: StudentCreateInput) {
        if (!canManage) throw new Error("Forbidden")
        if (!active) return

        try {
            await updateMut.mutateAsync({id: active.id, input})
            setEditOpen(false)

            toast.success("Student updated", {
                description: "Student information has been saved.",
            })
        } catch (err) {
            toast.error("Update failed", {
                description: (err as Error).message,
            })
        }
    }

    async function onDelete() {
        if (!canManage) throw new Error("Forbidden")
        if (!active) return

        try {
            await deleteMut.mutateAsync(active.id)
            setDeleteOpen(false)

            toast.success("Student deleted",
                {
                    description: "The student record was removed.",
                })
        } catch (err) {
            toast.error(
                "Delete failed",
                {
                    description: (err as Error).message,
                })
        }
    }

    const rows = useMemo(() => list.data?.items ?? [], [list.data?.items])
    const academicYearOptions = useMemo(
        () => (academicYearsQuery.data?.items ?? []).map((item) => ({ id: item.id, name: item.name, code: item.code })),
        [academicYearsQuery.data?.items]
    )
    const classOptions = useMemo(
        () =>
            (classesQuery.data?.items ?? []).map((item) => ({
                id: item.id,
                name: item.name,
                code: item.code,
                academicYearId: item.academicYearId,
            })),
        [classesQuery.data?.items]
    )
    const sectionOptions = useMemo(
        () =>
            (sectionsQuery.data?.items ?? []).map((item) => ({
                id: item.id,
                name: item.name,
                code: item.code,
                classId: item.classId,
            })),
        [sectionsQuery.data?.items]
    )

    // client-side sorting (works nicely even if backend doesn't support sorting yet)
    const sortedRows = useMemo(() => {
        const sorted = [...rows]

        sorted.sort((a, b) => {
            const dir = sortDir === "asc" ? 1 : -1

            if (sortKey === "studentId") {
                return a.studentId.localeCompare(b.studentId) * dir
            }

            if (sortKey === "grade") {
                return (a.grade ?? "").localeCompare(b.grade ?? "") * dir
            }

            // name
            const nameA = `${a.firstName} ${a.lastName}`.trim()
            const nameB = `${b.firstName} ${b.lastName}`.trim()
            return nameA.localeCompare(nameB) * dir
        })

        return sorted
    }, [rows, sortKey, sortDir])

    function toggleSort(key: SortKey) {
        if (sortKey !== key) {
            setSortKey(key)
            setSortDir("asc")
            return
        }
        setSortDir((d) => (d === "asc" ? "desc" : "asc"))
    }

    return (
        <div className="mx-auto space-y-6">
            {/* Page header */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div className="space-y-1">
                    <h1 className="text-2xl font-bold tracking-tight">Students</h1>
                    <p className="text-sm text-muted-foreground">
                        Manage student records, enrollment, and class assignment.
                    </p>
                </div>

                {canManage ? (
                    <Button onClick={() => setCreateOpen(true)}>
                        <Plus className="mr-2 h-4 w-4"/>
                        Add student
                    </Button>
                ) : null}
            </div>

            {/* Filters */}
            <Card
                className="bg-card/80 shadow-sm ring-1 ring-border/40 backdrop-blur supports-backdrop-filter:bg-card/70">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-base">Search</CardTitle>
                    <CardDescription>Find students by ID or name.</CardDescription>
                </CardHeader>

                <CardContent className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
                    <div className="relative">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground"/>
                        <Input
                            placeholder="Search by ID / name..."
                            value={q}
                            onChange={(e) => {
                                setQ(e.target.value)
                                setPage(1)
                            }}
                            className="pl-9"
                        />
                    </div>

                    <div className="flex items-center justify-between gap-3 sm:justify-end">
                        <div className="text-sm text-muted-foreground">
                            Total: <span className="text-foreground">{list.data?.total ?? 0}</span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Error state */}
            {list.isError ? (
                <div
                    className="flex items-start gap-3 rounded-xl bg-destructive/10 p-4 text-sm text-destructive ring-1 ring-destructive/20">
                    <AlertTriangle className="mt-0.5 h-4 w-4"/>
                    <div className="min-w-0">
                        <div className="font-medium">Failed to load students</div>
                        <div className="text-destructive/90">{(list.error as Error).message}</div>
                    </div>
                </div>
            ) : null}

            {/* Table */}
            <Card
                className="bg-card/80 shadow-sm ring-1 ring-border/40 backdrop-blur supports-backdrop-filter:bg-card/70">
                <CardContent className="p-0">
                    <div className="overflow-hidden rounded-xl">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-muted/40 text-muted-foreground">
                                <tr>
                                    <th className="px-4 py-3 text-left font-medium">
                                        <button
                                            type="button"
                                            onClick={() => toggleSort("studentId")}
                                            className="inline-flex items-center gap-1 hover:text-foreground"
                                        >
                                            Student ID <ArrowUpDown className="h-3.5 w-3.5"/>
                                        </button>
                                    </th>

                                    <th className="px-4 py-3 text-left font-medium">
                                        <button
                                            type="button"
                                            onClick={() => toggleSort("name")}
                                            className="inline-flex items-center gap-1 hover:text-foreground"
                                        >
                                            Name <ArrowUpDown className="h-3.5 w-3.5"/>
                                        </button>
                                    </th>

                                    <th className="px-4 py-3 text-left font-medium">
                                        <button
                                            type="button"
                                            onClick={() => toggleSort("grade")}
                                            className="inline-flex items-center gap-1 hover:text-foreground"
                                        >
                                            Grade <ArrowUpDown className="h-3.5 w-3.5"/>
                                        </button>
                                    </th>

                                    <th className="px-4 py-3 text-left font-medium">Section</th>
                                    <th className="px-4 py-3 text-left font-medium">Gender</th>
                                    <th className="px-4 py-3 text-right font-medium">Actions</th>
                                </tr>
                                </thead>

                                <tbody>
                                {list.isLoading || list.isFetching ? (
                                    <SkeletonRows/>
                                ) : sortedRows.length === 0 ? (
                                    <tr className="border-t border-border/30">
                                        <td colSpan={6} className="px-4 py-12 text-center">
                                            <div className="mx-auto max-w-sm space-y-2">
                                                <div className="text-sm font-medium">No students found</div>
                                                <div className="text-sm text-muted-foreground">
                                                    Try adjusting your search terms.
                                                </div>
                                                {canManage ? (
                                                    <Button className="mt-2" onClick={() => setCreateOpen(true)}>
                                                        <Plus className="mr-2 h-4 w-4"/>
                                                        Add first student
                                                    </Button>
                                                ) : null}
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    sortedRows.map((s) => (
                                        <tr
                                            key={s.id}
                                            className="border-t border-border/30 odd:bg-background even:bg-muted/10 hover:bg-muted/30 transition"
                                        >
                                            <td className="px-4 py-3 font-mono text-xs sm:text-sm">{s.studentId}</td>

                                            <td className="px-4 py-3">
                                                <Link
                                                    href={`/${locale}/school/dashboard/students/${s.id}`}
                                                    className="font-medium hover:underline"
                                                >
                                                    {s.firstName} {s.lastName}
                                                </Link>
                                            </td>

                                            <td className="px-4 py-3">
                                                <Badge variant="secondary" className="bg-muted/40 text-foreground">
                                                    {s.grade}
                                                </Badge>
                                            </td>

                                            <td className="px-4 py-3 text-muted-foreground">{s.section}</td>
                                            <td className="px-4 py-3 text-muted-foreground">{s.gender}</td>

                                            <td className="px-4 py-3 text-right">
                                                <RowActions
                                                    locale={locale}
                                                    student={s}
                                                    canManage={canManage}
                                                    onEdit={() => {
                                                        setActive(s)
                                                        setEditOpen(true)
                                                    }}
                                                    onDelete={() => {
                                                        setActive(s)
                                                        setDeleteOpen(true)
                                                    }}
                                                />
                                            </td>
                                        </tr>
                                    ))
                                )}
                                </tbody>
                            </table>
                        </div>

                        {/* Footer */}
                        <div className="border-t border-border/30 bg-background/40 px-4 py-3">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <div className="text-sm text-muted-foreground">
                                    Page <span className="text-foreground">{list.data?.page ?? page}</span> of{" "}
                                    <span className="text-foreground">{totalPages}</span>
                                </div>

                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        disabled={page <= 1 || list.isFetching}
                                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                                    >
                                        Prev
                                    </Button>

                                    <Button
                                        variant="outline"
                                        disabled={page >= totalPages || list.isFetching}
                                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                    >
                                        Next
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Create */}
            {canManage && createOpen && (
                <StudentFormDialog
                    key={`create-student-${createOpen ? "open" : "closed"}-${strictPlacementRequired ? "strict" : "relaxed"}`}
                    open={createOpen}
                    onOpenChange={setCreateOpen}
                    title="Add student"
                    submitLabel="Create"
                    submitting={createMut.isPending}
                    error={createError}
                    academicYearOptions={academicYearOptions}
                    classOptions={classOptions}
                    sectionOptions={sectionOptions}
                    strictPlacementRequired={strictPlacementRequired}
                    onSubmit={onCreate}
                />
            )}

            {/* Edit */}
            {canManage && editOpen && (
                <StudentFormDialog
                    key={`edit-student-${active?.id ?? "none"}-${editOpen ? "open" : "closed"}-${strictPlacementRequired ? "strict" : "relaxed"}`}
                    open={editOpen}
                    onOpenChange={setEditOpen}
                    title="Edit student"
                    submitLabel="Save"
                    initial={active ?? undefined}
                    submitting={updateMut.isPending}
                    error={updateError}
                    academicYearOptions={academicYearOptions}
                    classOptions={classOptions}
                    sectionOptions={sectionOptions}
                    strictPlacementRequired={strictPlacementRequired}
                    onSubmit={onEdit}
                />
            )}

            {/* Delete */}
            {canManage && (
                <DeleteStudentDialog
                    open={deleteOpen}
                    onOpenChange={setDeleteOpen}
                    studentName={active ? `${active.firstName} ${active.lastName}` : "this student"}
                    submitting={deleteMut.isPending}
                    error={deleteError}
                    onConfirm={onDelete}
                />
            )}
        </div>
    )
}

function SkeletonRows() {
    return (
        <>
            {Array.from({length: 8}).map((_, i) => (
                <tr key={i} className="border-t border-border/30">
                    <td className="px-4 py-3">
                        <div className="h-4 w-24 animate-pulse rounded bg-muted/40"/>
                    </td>
                    <td className="px-4 py-3">
                        <div className="h-4 w-40 animate-pulse rounded bg-muted/40"/>
                    </td>
                    <td className="px-4 py-3">
                        <div className="h-4 w-20 animate-pulse rounded bg-muted/40"/>
                    </td>
                    <td className="px-4 py-3">
                        <div className="h-4 w-16 animate-pulse rounded bg-muted/40"/>
                    </td>
                    <td className="px-4 py-3">
                        <div className="h-4 w-16 animate-pulse rounded bg-muted/40"/>
                    </td>
                    <td className="px-4 py-3 text-right">
                        <div className="ml-auto h-8 w-10 animate-pulse rounded bg-muted/40"/>
                    </td>
                </tr>
            ))}
        </>
    )
}

function RowActions({
                        locale,
                        student,
                        canManage,
                        onEdit,
                        onDelete,
                    }: {
    locale: string
    student: StudentDto
    canManage: boolean
    onEdit: () => void
    onDelete: () => void
}) {
    return (
        <div className="inline-flex items-center justify-end gap-2">

            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" aria-label="Actions">
                        <MoreHorizontal className="h-4 w-4"/>
                    </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent align="end" className="w-44">
                    <DropdownMenuItem asChild>
                        <Link href={`/${locale}/school/dashboard/students/${student.id}`}>
                            <Eye className="mr-2 h-4 w-4"/>
                            View
                        </Link>
                    </DropdownMenuItem>

                    {canManage ? (
                        <>
                            <DropdownMenuItem onClick={onEdit}>
                                <Pencil className="mr-2 h-4 w-4"/>
                                Edit
                            </DropdownMenuItem>

                            <DropdownMenuItem
                                onClick={onDelete}
                                className="text-destructive focus:text-destructive"
                            >
                                <Trash2 className="mr-2 h-4 w-4"/>
                                Delete
                            </DropdownMenuItem>
                        </>
                    ) : null}
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    )
}
