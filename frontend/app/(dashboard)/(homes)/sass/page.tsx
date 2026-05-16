import WorldMapChart from "@/components/charts/world-map-chart";
import DashboardBreadcrumb from "@/components/layout/dashboard-breadcrumb";
import LoadingSkeleton from "@/components/loading-skeleton";
import CountryList from "@/components/shared/country-list";
import CustomSelect from "@/components/shared/custom-select";
import { Card, CardContent } from "@/components/ui/card";
import type { Metadata } from "next";
import { Suspense } from "react";
import UpgradeNowCard from "../analytics/components/upgrade-now-card";
import DailyEarningsCard from "./components/daily-earnings-card";
import RecentActivityCard from "./components/recent-activity-card";
import ReferralSourcesCard from "./components/referral-sources-card";
import StatisticsCard from "./components/statistics-card";
import TransactionHistoryCard from "./components/transaction-history-card";
import UserTrafficCard from "./components/user-traffic-card";
import WidgetsCard from "./components/widgets-card";

const metadata: Metadata = {
  title: "SaaS Dashboard | Manage Subscriptions, Users & Analytics - WowDash Admin Panel",
  description:
    "Build and manage scalable SaaS applications with the SaaS Dashboard in WowDash. Monitor subscriptions, users, billing, and analytics using a modern admin panel built with Next.js, Tailwind CSS, and ShadCN UI.",
};


const projectManagement = () => {
    return (
        <>
            <DashboardBreadcrumb title="Call Center" text="Call Center" />

            <div className="grid grid-cols-1 2xl:grid-cols-12 gap-6">
                <div className="col-span-12 2xl:col-span-6">
                    <Suspense fallback={<LoadingSkeleton />}>
                        <WidgetsCard />
                    </Suspense>
                </div>

                <div className="col-span-12 2xl:col-span-6">
                    <Suspense fallback={<LoadingSkeleton />}>
                        <DailyEarningsCard />
                    </Suspense>
                </div>

                <div className="col-span-12 2xl:col-span-8">
                    <Suspense fallback={<LoadingSkeleton />}>
                        <UserTrafficCard />
                    </Suspense>
                </div>

                <div className="col-span-12 2xl:col-span-4">
                    <Suspense fallback={<LoadingSkeleton />}>
                        <ReferralSourcesCard />
                    </Suspense>
                </div>

                <div className="col-span-12 2xl:col-span-4">
                    <Suspense fallback={<LoadingSkeleton />}>
                        <TransactionHistoryCard />
                    </Suspense>
                </div>

                <div className="col-span-12 2xl:col-span-8">
                    <Suspense fallback={<LoadingSkeleton />}>
                        <RecentActivityCard />
                    </Suspense>
                </div>

                <div className="col-span-12 2xl:col-span-6">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 h-full">
                        <div className="col-span-12 md:col-span-4">
                            <Suspense fallback={<LoadingSkeleton />}>
                                <UpgradeNowCard />
                            </Suspense>
                        </div>
                        <div className="col-span-12 md:col-span-8">
                            <Suspense fallback={<LoadingSkeleton />}>
                                <StatisticsCard />
                            </Suspense>
                        </div>
                    </div>
                </div>
                <div className="col-span-12 2xl:col-span-6">
                    <Suspense fallback={<LoadingSkeleton />}>
                        <Card className="card h-full rounded-lg border-0 !p-0 block">
                            <CardContent className="card-body p-6 h-full flex flex-col justify-between">

                                <div className="flex items-center flex-wrap gap-2 justify-between mb-5">
                                    <h6 className="font-bold text-lg mb-0">Sales by Countries</h6>
                                    <CustomSelect
                                        placeholder="Monthly"
                                        options={["Monthly", "Weekly", "Yearly",]}
                                    />
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                                    <div className="col-span-12 lg:col-span-6">
                                        <div className="border border-neutral-300 dark:border-neutral-300/20 rounded-lg bg-neutral-50 dark:bg-neutral-600/20 h-full">
                                            <WorldMapChart mapHeight={310} />
                                        </div>
                                    </div>
                                    <div className="col-span-12 lg:col-span-6">
                                        <div className="border border-neutral-300 dark:border-neutral-300/20 rounded-lg bg-neutral-50 dark:bg-neutral-600/20 h-full max-h-[276px] overflow-y-auto p-6 scrollbar-thin scrollbar-invisible hover:scrollbar-visible">
                                            <CountryList />
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </Suspense>
                </div>
            </div>
        </>
    );
};
export default projectManagement;