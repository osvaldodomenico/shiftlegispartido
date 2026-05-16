import CoinAnalyticsCard from "@/app/(dashboard)/(homes)/cryptocurrency/components/coin-analytics-card";
import MarketInfoCard from "@/app/(dashboard)/(homes)/cryptocurrency/components/market-info-card";
import MasterCard from "@/app/(dashboard)/(homes)/cryptocurrency/components/master-card";
import MyOrderCard from "@/app/(dashboard)/(homes)/cryptocurrency/components/my-order-card";
import RecentTransactionCard from "@/app/(dashboard)/(homes)/cryptocurrency/components/recent-transaction-card";
import StatsCard from "@/app/(dashboard)/(homes)/cryptocurrency/components/stats-card";
import TotalBalanceCard from "@/app/(dashboard)/(homes)/cryptocurrency/components/total-balance-card";
import UsersActivateCard from "@/app/(dashboard)/(homes)/cryptocurrency/components/users-activate-card";
import DashboardBreadcrumb from "@/components/layout/dashboard-breadcrumb";
import LoadingSkeleton from "@/components/loading-skeleton";
import type { Metadata } from "next";
import { Suspense } from "react";

const metadata: Metadata = {
  title: "Cryptocurrency Dashboard | WowDash Admin Panel",
  description:
    "Track real-time crypto prices, wallet balances, and market trends with the Cryptocurrency Dashboard in WowDash Admin Template.",
};


const Cryptocurrency = () => {
  return (
    <>
      <DashboardBreadcrumb title="Cryptocurrency" text="Cryptocurrency" />

      <Suspense fallback={<LoadingSkeleton />}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-5 gap-6">
          <StatsCard />
        </div>
      </Suspense>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 mt-6">
        <div className="xl:col-span-12 2xl:col-span-8">
          <div className="grid grid-cols-1 2xl:grid-cols-12 gap-6">
            <div className="col-span-12">
              <Suspense fallback={<LoadingSkeleton />}>
                <CoinAnalyticsCard />
              </Suspense>
            </div>

            <div className="col-span-12 2xl:col-span-6">
              <Suspense fallback={<LoadingSkeleton />}>
                <MarketInfoCard />
              </Suspense>
            </div>

            <div className="col-span-12 2xl:col-span-6">
              <Suspense fallback={<LoadingSkeleton />}>
                <MyOrderCard />
              </Suspense>
            </div>

            <div className="col-span-12">
              <Suspense fallback={<LoadingSkeleton />}>
                <RecentTransactionCard />
              </Suspense>
            </div>
          </div>
        </div>

        <div className="xl:col-span-12 2xl:col-span-4">
          <div className="space-y-6">
            <Suspense fallback={<LoadingSkeleton />}>
              <MasterCard />
            </Suspense>
            <Suspense fallback={<LoadingSkeleton />}>
              <TotalBalanceCard />
            </Suspense>
            <Suspense fallback={<LoadingSkeleton />}>
              <UsersActivateCard />
            </Suspense>
          </div>
        </div>
      </div>
    </>
  );
};

export default Cryptocurrency;
