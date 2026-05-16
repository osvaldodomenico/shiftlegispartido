import DashboardBreadcrumb from "@/components/layout/dashboard-breadcrumb";
import LoadingSkeleton from "@/components/loading-skeleton";
import type { Metadata } from "next";
import { Suspense } from "react";
import CustomersStatisticsCard from "../ecommerce/component/customers-statistics-card";
import DailySalesCard from "../ecommerce/component/daily-sales-card";
import DistributionMapsCard from "../ecommerce/component/distribution-maps-card";
import StockReportCard from "../ecommerce/component/stock-report-card";
import TopCustomersCard from "../ecommerce/component/top-customers-card";
import TopSellingProductCard from "../ecommerce/component/top-selling-product-card";
import TransactionsCard from "../ecommerce/component/transactions-card";
import RecentOrderCard from "./components/recent-order-card";
import SalesFigureCard from "./components/sales-figure-card";
import SalesWidgetsCard from "./components/sales-widgets-card";

const metadata: Metadata = {
   title: "Sales Dashboard | Track Revenue, Orders & Growth - WowDash Admin Panel",
  description:
    "Analyze sales performance, monitor revenue, track orders, conversions, and customer insights with the Sales Dashboard in WowDash. Built with Next.js, Tailwind CSS, and ShadCN UI for a fast, scalable, and modern admin experience.",
};

const projectManagement = () => {
    return (
        <>
            <DashboardBreadcrumb title="Sales" text="Sales" />

            <div className="">
                <SalesWidgetsCard />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">

                <div className="col-span-12 2xl:col-span-4 lg:col-span-6">
                    <Suspense fallback={<LoadingSkeleton />}>
                        <TransactionsCard />
                    </Suspense>
                </div>

                <div className="col-span-12 2xl:col-span-8 lg:col-span-6">
                    <Suspense fallback={<LoadingSkeleton />}>
                        <SalesFigureCard />
                    </Suspense>
                </div>

                <div className="col-span-12 2xl:col-span-8">
                    <Suspense fallback={<LoadingSkeleton />}>
                        <RecentOrderCard />
                    </Suspense>
                </div>

                <div className="col-span-12 2xl:col-span-4 lg:col-span-6">
                    <Suspense fallback={<LoadingSkeleton />}>
                        <DailySalesCard />
                    </Suspense>
                </div>

                <div className="col-span-12 2xl:col-span-4 lg:col-span-6">
                    <Suspense fallback={<LoadingSkeleton />}>
                        <CustomersStatisticsCard />
                    </Suspense>
                </div>
                <div className="col-span-12 2xl:col-span-4 lg:col-span-6">
                    <Suspense fallback={<LoadingSkeleton />}>
                        <DistributionMapsCard />
                    </Suspense>
                </div>
                <div className="col-span-12 2xl:col-span-4 lg:col-span-6">
                    <Suspense fallback={<LoadingSkeleton />}>
                        <TopCustomersCard />
                    </Suspense>
                </div>
                <div className="col-span-12 2xl:col-span-8 sm:col-span-6">
                    <Suspense fallback={<LoadingSkeleton />}>
                        <TopSellingProductCard />
                    </Suspense>
                </div>
                <div className="col-span-12 2xl:col-span-4 sm:col-span-6">
                    <Suspense fallback={<LoadingSkeleton />}>
                        <StockReportCard />
                    </Suspense>
                </div>
            </div>
        </>
    );
};
export default projectManagement;