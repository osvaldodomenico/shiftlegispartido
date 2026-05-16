import DashboardBreadcrumb from "@/components/layout/dashboard-breadcrumb";
import LoadingSkeleton from "@/components/loading-skeleton";
import type { Metadata } from "next";
import { Suspense } from "react";
import MarketplaceDetailsCard from "./components/MarketplaceDetailsCard";
import MarketplaceDetailsSidebar from "./components/MarketplaceDetailsSidebar";

const metadata: Metadata = {
    title: "Marketplace Details | WowDash Admin Dashboard",
    description:
        "View detailed marketplace insights including product information, analytics, and seller data in WowDash Admin Dashboard. Designed with Next.js, TypeScript, and Tailwind CSS for modern web apps.",
};

const MarketplaceDetailsPage = () => {
    return (
        <>
            <DashboardBreadcrumb title="Marketplace Details" text="Marketplace Details" />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="col-span-12 lg:col-span-8 2xl:col-span-9">
                    <Suspense fallback={<LoadingSkeleton />}>
                        <MarketplaceDetailsCard />
                    </Suspense>
                </div>
                <div className="col-span-12 lg:col-span-4 2xl:col-span-3">
                    <Suspense fallback={<LoadingSkeleton />}>
                        <MarketplaceDetailsSidebar />
                    </Suspense>
                </div>
            </div>
        </>
    );
};
export default MarketplaceDetailsPage;