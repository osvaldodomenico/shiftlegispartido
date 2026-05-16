import DashboardBreadcrumb from "@/components/layout/dashboard-breadcrumb";
import LoadingSkeleton from "@/components/loading-skeleton";
import type { Metadata } from "next";
import { Suspense } from "react";
import BalanceStatistic from "./components/balance-statistic";
import EarningCategories from "./components/earning-categories";
import ExpenseStatisticsCard from "./components/expense-statistics-card";
import InvestmentCard from "./components/investment-card";
import MonthlyExpenseBreakdown from "./components/monthly-expense-breakdown";
import PaymentHistory from "./components/payment-history";
import QuickTransfer from "./components/quick-transfer";
import StatisticsCard from "./components/statistics-card";
import TransactionHistoryCard from "./components/transaction-history-card";

const metadata: Metadata = {
    title: "Finance & Banking Dashboard | WowDash Admin Panel",
    description:
        "Monitor financial transactions, manage accounts, and track banking performance with the Finance & Banking Dashboard in WowDash Admin Template built using Next.js and Tailwind.",
};

const FinancePage = () => {
    return (
        <>
            <DashboardBreadcrumb title="Finance & Banking" text="Finance & Banking" />

            <Suspense fallback={<LoadingSkeleton />}>
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-6">
                    <StatisticsCard />
                </div>
            </Suspense>

            <div className="mt-6">
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-6">
                    <div className="col-span-12 xl:col-span-8">
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                            <div className="col-span-12">
                                <Suspense fallback={<LoadingSkeleton />}>
                                    <BalanceStatistic />
                                </Suspense>
                            </div>
                            <div className="col-span-12 md:col-span-6">
                                <Suspense fallback={<LoadingSkeleton />}>
                                    <EarningCategories />
                                </Suspense>
                            </div>
                            <div className="col-span-12 md:col-span-6">
                                <Suspense fallback={<LoadingSkeleton />}>
                                    <ExpenseStatisticsCard />
                                </Suspense>
                            </div>
                            <div className="col-span-12 md:col-span-6">
                                <Suspense fallback={<LoadingSkeleton />}>
                                    <PaymentHistory />
                                </Suspense>
                            </div>
                            <div className="col-span-12 md:col-span-6">
                                <Suspense fallback={<LoadingSkeleton />}>
                                    <MonthlyExpenseBreakdown />
                                </Suspense>
                            </div>
                        </div>
                    </div>

                    <div className="col-span-12 xl:col-span-4">
                        <div className="flex flex-col gap-6">
                            <Suspense fallback={<LoadingSkeleton />}>
                                <QuickTransfer />
                            </Suspense>
                            <Suspense fallback={<LoadingSkeleton />}>
                                <InvestmentCard />
                            </Suspense>
                        </div>
                    </div>
                </div>
            </div>
            <div className="mt-6 lg:block hidden">
                <Suspense fallback={<LoadingSkeleton />}>
                    <TransactionHistoryCard />
                </Suspense>
            </div>
        </>
    );
};
export default FinancePage;
