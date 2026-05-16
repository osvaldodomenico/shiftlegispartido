import DashboardBreadcrumb from "@/components/layout/dashboard-breadcrumb";
import LoadingSkeleton from "@/components/loading-skeleton";
import type { Metadata } from "next";
import { Suspense } from "react";
import AgentEarnings from "./components/agent-earnings";
import BestAgentsCard from "./components/best-agents-card";
import OverallVolume from "./components/overall-volume";
import ReasonCalls from "./components/reason-calls";
import RecentCallsCard from "./components/recent-calls-card";
import SalesCountriesCallCenter from "./components/sales-countries-call-center";
import StateCard from "./components/state-card";

const metadata: Metadata = {
    title: "Call Center Dashboard | Manage Calls, Agents & Performance - WowDash Admin Panel",
    description: "Monitor call activities, manage agents, track customer queries, and analyze performance with the Call Center Dashboard in WowDash. Built using Next.js, Tailwind CSS, and ShadCN UI for a fast, modern, and efficient workflow experience.",
};

const projectManagement = () => {
    return (
        <>
            <DashboardBreadcrumb title="Call Center" text="Call Center" />

            <div className="">
                <Suspense fallback={<LoadingSkeleton />}>
                    <StateCard />
                </Suspense>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-6">
                <div className="col-span-12 2xl:col-span-4">
                    <Suspense fallback={<LoadingSkeleton />}>
                        <AgentEarnings />
                    </Suspense>
                </div>
                <div className="col-span-12 2xl:col-span-8">
                    <Suspense fallback={<LoadingSkeleton />}>
                        <OverallVolume />
                    </Suspense>
                </div>

                <div className="col-span-12 2xl:col-span-6">
                    <Suspense fallback={<LoadingSkeleton />}>
                        <SalesCountriesCallCenter />
                    </Suspense>
                </div>

                <div className="col-span-12 2xl:col-span-6">
                    <Suspense fallback={<LoadingSkeleton />}>
                        <BestAgentsCard />
                    </Suspense>
                </div>

                <div className="col-span-12 2xl:col-span-8">
                    <Suspense fallback={<LoadingSkeleton />}>
                        <RecentCallsCard />
                    </Suspense>
                </div>

                <div className="col-span-12 2xl:col-span-4">
                    <Suspense fallback={<LoadingSkeleton />}>
                        <ReasonCalls />
                    </Suspense>
                </div>
            </div>
        </>
    );
};
export default projectManagement;