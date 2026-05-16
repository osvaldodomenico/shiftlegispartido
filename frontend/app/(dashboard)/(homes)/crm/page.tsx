import CampaignCard from '@/app/(dashboard)/(homes)/crm/components/campaign-card';
import ClientPaymentStatusCard from '@/app/(dashboard)/(homes)/crm/components/client-payment-status-card';
import CountriesStatusCard from '@/app/(dashboard)/(homes)/crm/components/countries-status-card';
import CustomerOverviewCard from '@/app/(dashboard)/(homes)/crm/components/customer-overview-card';
import EarningStatisticsCard from '@/app/(dashboard)/(homes)/crm/components/earning-statistics-card';
import LastTransactionCard from '@/app/(dashboard)/(homes)/crm/components/last-transaction-card';
import RevenueGrowthCard from '@/app/(dashboard)/(homes)/crm/components/revenue-growth-card';
import StatsCard from '@/app/(dashboard)/(homes)/crm/components/stats-card';
import TodoListRecentCard from '@/app/(dashboard)/(homes)/crm/components/todo-list-recent-card';
import TopPerformerCard from '@/app/(dashboard)/(homes)/crm/components/top-performer-card';
import DashboardBreadcrumb from '@/components/layout/dashboard-breadcrumb';
import LoadingSkeleton from '@/components/loading-skeleton';
import type { Metadata } from "next";
import { Suspense } from 'react';

const metadata: Metadata = {
  title: "CRM Dashboard | WowDash Admin Panel",
  description:
    "Manage customer interactions, view campaign performance, track revenue, and analyze customer behavior with the CRM Dashboard in WowDash.",
};


const crmPage = () => {
  return (
    <>
      <DashboardBreadcrumb title="CRM" text="CRM" />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">

        <div className="lg:col-span-12 2xl:col-span-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 xl:grid-cols-3 gap-6">
            <Suspense fallback={<LoadingSkeleton />}>
              <StatsCard />
            </Suspense>
          </div>
        </div>

        <div className="lg:col-span-12 2xl:col-span-4">
          <Suspense fallback={<LoadingSkeleton />}>
            <RevenueGrowthCard />
          </Suspense>
        </div>

        <div className="lg:col-span-12 2xl:col-span-8">
          <Suspense fallback={<LoadingSkeleton />}>
            <EarningStatisticsCard />
          </Suspense>
        </div>

        <div className="lg:col-span-12 2xl:col-span-4">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-6 2xl:col-span-12 col-xxl-12 col-sm-6">
              <Suspense fallback={<LoadingSkeleton />}>
                <CampaignCard />
              </Suspense>
            </div>
            <div className="lg:col-span-6 2xl:col-span-12 col-xxl-12 col-sm-6">
              <Suspense fallback={<LoadingSkeleton />}>
                <CustomerOverviewCard />
              </Suspense>
            </div>
          </div>
        </div>

        <div className="lg:col-span-6 2xl:col-span-4">
          <Suspense fallback={<LoadingSkeleton />}>
            <ClientPaymentStatusCard />
          </Suspense>
        </div>

        <div className="lg:col-span-6 2xl:col-span-4">
          <Suspense fallback={<LoadingSkeleton />}>
            <CountriesStatusCard />
          </Suspense>
        </div>

        <div className="lg:col-span-12 2xl:col-span-4">
          <Suspense fallback={<LoadingSkeleton />}>
            <TopPerformerCard />
          </Suspense>
        </div>

        <div className="lg:col-span-12 2xl:col-span-6">
          <Suspense fallback={<LoadingSkeleton />}>
            <TodoListRecentCard />
          </Suspense>
        </div>

        <div className="lg:col-span-12 2xl:col-span-6">
          <Suspense fallback={<LoadingSkeleton />}>
            <LastTransactionCard />
          </Suspense>
        </div>

      </div>
    </>
  );
};

export default crmPage;