import StatCards from "@/app/(dashboard)/(homes)/medical/components/stat-cards";
import DashboardBreadcrumb from "@/components/layout/dashboard-breadcrumb";
import LoadingSkeleton from "@/components/loading-skeleton";
import type { Metadata } from "next";
import { Suspense } from "react";
import AvailableTreatmentsCard from "./components/available-treatments-card";
import DoctorListCard from "./components/doctor-list-card";
import EarningStatisticCard from "./components/earning-statistic-card";
import HealthReportsDocumentCard from "./components/health-reports-document-card";
import LatestAppointmentsCard from "./components/latest-appointments-card";
import PatientVisitedDepartment from "./components/patient-visited-department";
import PatientVisitedGender from "./components/patient-visited-gender";
import TotalIncomeCard from "./components/total-income-card";

const metadata: Metadata = {
    title: "Medical Dashboard | WowDash Admin Panel",
    description:
        "Monitor patient data, manage appointments, and analyze healthcare metrics with the Medical Dashboard in WowDash Admin Template built using Next.js, Tailwind, and Shadcn UI.",
};

const MedicalPage = () => {
    return (
        <>
            <DashboardBreadcrumb title="Medical" text="Medical" />

            <div className="grid grid-cols-1 2xl:grid-cols-12 gap-6">

                <div className="col-span-12 2xl:col-span-9">
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-6">
                        <div className="col-span-12 2xl:col-span-12">
                            <Suspense fallback={<LoadingSkeleton />}>
                                <StatCards />
                            </Suspense>
                        </div>
                        <div className="col-span-12 2xl:col-span-12">
                            <Suspense fallback={<LoadingSkeleton />}>
                                <EarningStatisticCard />
                            </Suspense>
                        </div>
                        <div className="col-span-12 lg:col-span-6">
                            <Suspense fallback={<LoadingSkeleton />}>
                                <PatientVisitedDepartment />
                            </Suspense>
                        </div>
                        <div className="col-span-12 lg:col-span-6">
                            <Suspense fallback={<LoadingSkeleton />}>
                                <PatientVisitedGender />
                            </Suspense>
                        </div>
                        <div className="col-span-12 2xl:col-span-4">
                            <Suspense fallback={<LoadingSkeleton />}>
                                <DoctorListCard />
                            </Suspense>
                        </div>
                        <div className="col-span-12 2xl:col-span-8">
                            <Suspense fallback={<LoadingSkeleton />}>
                                <LatestAppointmentsCard />
                            </Suspense>
                        </div>
                    </div>
                </div>

                <div className="col-span-12 2xl:col-span-3">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                        <div className="col-span-12 2xl:col-span-6 md:col-span-6 2xl:col-span-12">
                            <Suspense fallback={<LoadingSkeleton />}>
                                <TotalIncomeCard />
                            </Suspense>
                        </div>
                        <div className="col-span-12 2xl:col-span-6 md:col-span-6 2xl:col-span-12">
                            <Suspense fallback={<LoadingSkeleton />}>
                                <AvailableTreatmentsCard />
                            </Suspense>
                        </div>
                        <div className="col-span-12 2xl:col-span-6 md:col-span-6 2xl:col-span-12">
                            <Suspense fallback={<LoadingSkeleton />}>
                                <HealthReportsDocumentCard />
                            </Suspense>
                        </div>
                    </div>
                </div>

            </div>
        </>
    );
};
export default MedicalPage;
