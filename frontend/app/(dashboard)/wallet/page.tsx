import DashboardBreadcrumb from "@/components/layout/dashboard-breadcrumb";
import LoadingSkeleton from "@/components/loading-skeleton";
import type { Metadata } from "next";
import { Suspense } from "react";
import WalletCard from "./components/WalletCard";
import WalletSidebar from "./components/WalletSidebar";

const metadata: Metadata = {
  title: "Wallet Dashboard | WowDash Finance & Transactions",
  description:
    "Manage your wallet, track transactions, and monitor balances with the WowDash Wallet Dashboard. Built with Next.js and Tailwind CSS for a fast and responsive admin experience.",
};

const WalletPage = () => {
    return (
        <>
            <DashboardBreadcrumb title="Wallet" text="Wallet" />


            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="col-span-12 lg:col-span-9">
                    <Suspense fallback={<LoadingSkeleton />}>
                        <WalletCard />
                    </Suspense>
                </div>

                <div className="col-span-12 lg:col-span-3">
                    <Suspense fallback={<LoadingSkeleton />}>
                        <WalletSidebar />
                    </Suspense>
                </div>
            </div>

        </>
    );
};
export default WalletPage;