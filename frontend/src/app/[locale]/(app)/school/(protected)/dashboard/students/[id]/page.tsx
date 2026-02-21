// "use client";
//
// import Link from "next/link";
// import {useParams} from "next/navigation";
//
// import {useStudentDetail} from "@/features/students/hooks/useStudents";
// import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
// import {Button} from "@/components/ui/button";
//
// export default function StudentProfilePage() {
//     const params = useParams<{ locale: string; id: string }>();
//     const {locale, id} = params;
//
//     const q = useStudentDetail(id);
//
//     return (
//         <div className="p-6 max-w-4xl mx-auto space-y-6">
//             <div className="flex items-center justify-between">
//                 <Button asChild variant="outline">
//                     <Link href={`/${locale}/school/dashboard/students`}>Back</Link>
//                 </Button>
//             </div>
//
//             <Card>
//                 <CardHeader>
//                     <CardTitle>Student Profile</CardTitle>
//                 </CardHeader>
//                 <CardContent className="space-y-3">
//                     {q.isLoading ? (
//                         <div>Loading...</div>
//                     ) : q.isError ? (
//                         <div className="text-sm text-destructive">{(q.error as Error).message}</div>
//                     ) : (
//                         <>
//                             <div className="text-sm">
//                                 <b>Student ID:</b> {q.data?.studentId}
//                             </div>
//                             <div className="text-sm">
//                                 <b>Name:</b> {q.data?.firstName} {q.data?.lastName}
//                             </div>
//                             <div className="text-sm">
//                                 <b>Gender:</b> {q.data?.gender}
//                             </div>
//                             <div className="text-sm">
//                                 <b>Date of birth:</b> {q.data?.dateOfBirth ? q.data.dateOfBirth.slice(0, 10) : "-"}
//                             </div>
//                             <div className="text-sm">
//                                 <b>Grade:</b> {q.data?.grade} — <b>Section:</b> {q.data?.section}
//                             </div>
//
//                             <div className="pt-2 border-t"/>
//
//                             <div className="text-sm">
//                                 <b>Parent:</b> {q.data?.parentName || "-"}
//                             </div>
//                             <div className="text-sm">
//                                 <b>Phone:</b> {q.data?.parentPhone || "-"}
//                             </div>
//                             <div className="text-sm">
//                                 <b>Address:</b> {q.data?.address || "-"}
//                             </div>
//                         </>
//                     )}
//                 </CardContent>
//             </Card>
//         </div>
//     );
// }


"use client"

import {useParams} from "next/navigation"
import {useState} from "react"
import {useSchoolMe} from "@/features/school-auth/hooks/useSchoolAuth"
import {can, SchoolPermissions} from "@/features/school-auth/rbac/schoolRbac"
import {useStudentDetail} from "@/features/students/hooks/useStudents"
import { StudentEnrollmentHistory } from "@/features/enrollment/components/StudentEnrollmentHistory"

import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card"
import {Badge} from "@/components/ui/badge"
import {Button} from "@/components/ui/button"
import {Separator} from "@/components/ui/separator"
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs"

import {Pencil, Trash2, User, Phone, MapPin, GraduationCap} from "lucide-react"

export default function StudentDetailsPage() {
    const params = useParams<{ locale: string; id: string }>()
    const {id} = params

    const {data, isLoading, isError, error} = useStudentDetail(id)

    const me = useSchoolMe()
    const role = me.data?.user?.role
    const canManage = can(role, SchoolPermissions.manageStudents)

    const [tab, setTab] = useState("overview")

    if (isLoading) {
        return (
            <div className="p-6 max-w-5xl mx-auto">
                <div className="h-6 w-48 animate-pulse bg-muted/40 rounded mb-4"/>
                <div className="h-40 animate-pulse bg-muted/40 rounded-xl"/>
            </div>
        )
    }

    if (isError || !data) {
        return (
            <div className="p-6 max-w-5xl mx-auto text-destructive">
                {(error as Error)?.message || "Failed to load student"}
            </div>
        )
    }

    const s = data

    return (
        <div className="mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">
                        {s.firstName} {s.lastName}
                    </h1>

                    <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                        <span className="font-mono">{s.studentId}</span>
                        <Badge variant="secondary" className="bg-muted/40">
                            {s.grade} {s.section}
                        </Badge>
                        <Badge variant="outline">{s.gender}</Badge>
                    </div>
                </div>

                {canManage && (
                    <div className="flex gap-2">
                        <Button variant="outline">
                            <Pencil className="mr-2 h-4 w-4"/>
                            Edit
                        </Button>
                        <Button variant="destructive">
                            <Trash2 className="mr-2 h-4 w-4"/>
                            Delete
                        </Button>
                    </div>
                )}
            </div>

            <Separator/>

            {/* Tabs */}
            <Tabs value={tab} onValueChange={setTab}>
                <TabsList>
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="guardian">Guardian</TabsTrigger>
                    <TabsTrigger value="academic">Academic</TabsTrigger>
                    <TabsTrigger value="enrollment">Enrollment History</TabsTrigger>
                    <TabsTrigger value="activity">Activity</TabsTrigger>
                </TabsList>

                {/* Overview */}
                <TabsContent value="overview">
                    <Card className="bg-card/80 ring-1 ring-border/40">
                        <CardHeader>
                            <CardTitle>Personal information</CardTitle>
                        </CardHeader>

                        <CardContent className="grid gap-6 sm:grid-cols-2">
                            <InfoItem icon={<User className="h-4 w-4"/>} label="Full name">
                                {s.firstName} {s.lastName}
                            </InfoItem>

                            <InfoItem icon={<GraduationCap className="h-4 w-4"/>} label="Grade">
                                {s.grade} {s.section}
                            </InfoItem>

                            <InfoItem label="Gender">{s.gender}</InfoItem>

                            <InfoItem label="Date of birth">
                                {s.dateOfBirth
                                    ? new Date(s.dateOfBirth).toLocaleDateString()
                                    : "—"}
                            </InfoItem>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Guardian */}
                <TabsContent value="guardian">
                    <Card className="bg-card/80 ring-1 ring-border/40">
                        <CardHeader>
                            <CardTitle>Parent / Guardian</CardTitle>
                        </CardHeader>

                        <CardContent className="grid gap-6 sm:grid-cols-2">
                            <InfoItem icon={<User className="h-4 w-4"/>} label="Parent name">
                                {s.parentName || "—"}
                            </InfoItem>

                            <InfoItem icon={<Phone className="h-4 w-4"/>} label="Phone">
                                {s.parentPhone || "—"}
                            </InfoItem>

                            <InfoItem icon={<MapPin className="h-4 w-4"/>} label="Address">
                                {s.address || "—"}
                            </InfoItem>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Academic */}
                <TabsContent value="academic">
                    <Card className="bg-card/80 ring-1 ring-border/40">
                        <CardHeader>
                            <CardTitle>Academic information</CardTitle>
                        </CardHeader>

                        <CardContent className="grid gap-6 sm:grid-cols-2">
                            <InfoItem label="Grade">{s.grade}</InfoItem>
                            <InfoItem label="Section">{s.section}</InfoItem>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Activity */}
                <TabsContent value="enrollment">
                    <StudentEnrollmentHistory
                        studentId={s.id}
                        studentName={`${s.firstName} ${s.lastName}`.trim()}
                        studentCode={s.studentId}
                        canManage={canManage}
                    />
                </TabsContent>

                {/* Activity */}
                <TabsContent value="activity">
                    <Card className="bg-card/80 ring-1 ring-border/40">
                        <CardHeader>
                            <CardTitle>Recent activity</CardTitle>
                        </CardHeader>

                        <CardContent className="text-sm text-muted-foreground">
                            Attendance, fee payments, and disciplinary records will appear here.
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}

function InfoItem({
                      label,
                      children,
                      icon,
                  }: {
    label: string
    children: React.ReactNode
    icon?: React.ReactNode
}) {
    return (
        <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                {icon}
                <span>{label}</span>
            </div>
            <div className="text-sm font-medium">{children}</div>
        </div>
    )
}
