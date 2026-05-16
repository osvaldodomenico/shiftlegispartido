import DashboardBreadcrumb from "@/components/layout/dashboard-breadcrumb";
import LoadingSkeleton from "@/components/loading-skeleton";
import type { Metadata } from "next";
import { Suspense } from "react";
import TransactionHistoryCard from "../finance/components/transaction-history-card";
import EarningsOverviewCard from "./components/earnings-overview-card";
import HomeSale from "./components/home-sale";
import PropertyListCard from "./components/property-list-card";
import ResentRentPropertyCard from "./components/resent-rent-property-card";
import ResentSalePropertyCard from "./components/resent-sale-property-card";
import SocialSourceCard from "./components/social-source-card";
import StatisticsCard from "./components/statistics-card";
import StatisticsWidgets from "./components/statistics-widgets";
import TotalRevenueCard from "./components/total-revenue-card";

const metadata: Metadata = {
    title: "Sales Dashboard | Track Revenue, Orders & Growth - WowDash Admin Panel",
    description:
        "Analyze sales performance, monitor revenue, track orders, conversions, and customer insights with the Sales Dashboard in WowDash. Built with Next.js, Tailwind CSS, and ShadCN UI for a fast, scalable, and modern admin experience.",
};

const projectManagement = () => {
    return (
        <>
            <DashboardBreadcrumb title="Real Estate" text="Real Estate" />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
                <div className="col-span-12 2xl:col-span-7">
                    <Suspense fallback={<LoadingSkeleton />}>
                        <HomeSale />
                    </Suspense>
                </div>

                <div className="col-span-12 2xl:col-span-5">
                     <Suspense fallback={<LoadingSkeleton />}>
                        <StatisticsWidgets />
                    </Suspense>
                </div>
                
                <div className="col-span-12 lg:col-span-5">
                    <StatisticsCard />
                </div>

                <div className="col-span-12 lg:col-span-7">
                    <TotalRevenueCard />
                </div>

                <div className="col-span-12 2xl:col-span-4 lg:col-span-6">
                    <SocialSourceCard />
                </div>

                <div className="col-span-12 2xl:col-span-4 lg:col-span-6">
                    <ResentRentPropertyCard />
                </div>

                <div className="col-span-12 2xl:col-span-4">
                   <ResentSalePropertyCard />
                </div>

                <div className="col-span-12 2xl:col-span-8">
                    <TransactionHistoryCard />
                </div>

                <div className="col-span-12 2xl:col-span-4">
                    <EarningsOverviewCard />
                </div>

                <div className="col-span-12">
                    <PropertyListCard />
                </div>
            </div>

        </>
    );
};
export default projectManagement;