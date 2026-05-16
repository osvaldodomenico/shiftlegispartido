import DashboardBreadcrumb from "@/components/layout/dashboard-breadcrumb";
import LoadingSkeleton from "@/components/loading-skeleton";
import type { Metadata } from "next";
import { Suspense } from "react";
import AverageEarningCard from "./components/average-earning-card";
import MyTasksCard from "./components/my-tasks-card";
import ProjectAnalysisCard from "./components/project-analysis-card";
import ProjectWidgets from "./components/project-widgets";
import ProjectsStatusCard from "./components/projects-status-card";
import TasksOverviewCard from "./components/tasks-overview-card";
import TeamMembersCard from "./components/team-members-card";
import WorkingScheduleCard from "./components/working-schedule-card";

const metadata: Metadata = {
    title: "Project Management | Track Tasks, Teams & Productivity - WowDash Admin Panel",
    description:
        "Manage projects, assign tasks, monitor team performance, and track productivity effortlessly with the Project Management Dashboard in WowDash Admin Template. Built using Next.js, Tailwind CSS, and ShadCN UI for a smooth and modern workflow experience.",
};

const projectManagement = () => {
    return (
        <>
            <DashboardBreadcrumb title="Project Management" text="Project Management" />

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-6">

                <div className="col-span-12 2xl:col-span-8">
                    <Suspense fallback={<LoadingSkeleton />}>
                        <AverageEarningCard />
                    </Suspense>
                </div>

                <div className="col-span-12 2xl:col-span-4">
                    <Suspense fallback={<LoadingSkeleton />}>
                        <WorkingScheduleCard />
                    </Suspense>
                </div>

                <div className="col-span-12 sm:col-span-12">
                    <div className="">
                        <Suspense fallback={<LoadingSkeleton />}>
                            <div className="grid grid-cols-1 sm:grid-cols-12 gap-6">
                                <ProjectWidgets />
                            </div>
                        </Suspense>
                    </div>
                </div>

                <div className="col-span-12 sm:col-span-6 2xl:col-span-4">
                    <Suspense fallback={<LoadingSkeleton />}>
                        <MyTasksCard />
                    </Suspense>
                </div>

                <div className="col-span-12 sm:col-span-6 2xl:col-span-4">
                    <Suspense fallback={<LoadingSkeleton />}>
                        <ProjectAnalysisCard />
                    </Suspense>
                </div>

                <div className="col-span-12 sm:col-span-6 2xl:col-span-4">
                    <Suspense fallback={<LoadingSkeleton />}>
                        <TeamMembersCard />
                    </Suspense>
                </div>

                <div className="col-span-12 sm:col-span-6 2xl:col-span-4">
                    <Suspense fallback={<LoadingSkeleton />}>
                        <TasksOverviewCard />
                    </Suspense>
                </div>

                <div className="col-span-12 2xl:col-span-8">
                    <Suspense fallback={<LoadingSkeleton />}>
                        <ProjectsStatusCard />
                    </Suspense>
                </div>
            </div>
        </>
    );
};
export default projectManagement;