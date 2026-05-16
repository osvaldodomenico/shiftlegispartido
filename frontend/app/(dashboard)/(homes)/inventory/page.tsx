import DashboardBreadcrumb from '@/components/layout/dashboard-breadcrumb';
import LoadingSkeleton from '@/components/loading-skeleton';
import type { Metadata } from "next";
import { Suspense } from "react";
import IncomeExpenseCard from './components/income-expense-card';
import OverallReportCard from './components/overall-report-card';
import PurchaseSalesCard from './components/purchase-sales-card';
import RecentTransactionsCard from './components/recent-transactions-card';
import StateCards from './components/state-cards';
import TopCustomerCard from './components/top-customer-card';
import TopSuppliersCard from './components/top-suppliers-card';
import UsersCard from './components/users-card';

export const metadata: Metadata = {
    title: "POS & Inventory Management | WowDash Admin Panel",
    description:
        "Manage sales, track stock levels, and streamline operations with the POS & Inventory system in WowDash Admin Panel. Simplify transactions and optimize inventory control effortlessly.",
};


const InventorPage = () => {
    return (
        <>
            <DashboardBreadcrumb title="POS & Inventory" text="POS & Inventory" />

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">

                <div className="col-span-12">
                    <Suspense fallback={<LoadingSkeleton />}>
                        <StateCards />
                    </Suspense>
                </div>

                <div className="col-span-12 2xl:col-span-8">
                    <Suspense fallback={<LoadingSkeleton />}>
                        <IncomeExpenseCard />
                    </Suspense>
                </div>
                <div className="col-span-12 md:col-span-6 2xl:col-span-4">
                    <Suspense fallback={<LoadingSkeleton />}>
                        <UsersCard />
                    </Suspense>
                </div>
                <div className="col-span-12 md:col-span-6 2xl:col-span-4">
                    <Suspense fallback={<LoadingSkeleton />}>
                        <TopSuppliersCard />
                    </Suspense>
                </div>
                <div className="col-span-12 md:col-span-6 2xl:col-span-4">
                    <Suspense fallback={<LoadingSkeleton />}>
                        <TopCustomerCard />
                    </Suspense>
                </div>
                <div className="col-span-12 md:col-span-6 2xl:col-span-4">
                    <Suspense fallback={<LoadingSkeleton />}>
                        <OverallReportCard />
                    </Suspense>
                </div>
                <div className="col-span-12 md:col-span-6 2xl:col-span-4">
                    <Suspense fallback={<LoadingSkeleton />}>
                        <PurchaseSalesCard />
                    </Suspense>
                </div>
                <div className="col-span-12 md:col-span-6 2xl:col-span-8">
                    <Suspense fallback={<LoadingSkeleton />}>
                        <RecentTransactionsCard />
                    </Suspense>
                </div>

            </div>
        </>
    );
};

export default InventorPage;