import NftPromoBanner from "@/app/(dashboard)/(homes)/nft/components/nft-promo-banner";
import DashboardBreadcrumb from "@/components/layout/dashboard-breadcrumb";
import LoadingSkeleton from "@/components/loading-skeleton";
import type { Metadata } from "next";
import { Suspense } from "react";
import EthPriceCard from "./components/eth-price-card";
import FeaturedCreatorsCard from "./components/featured-creators-card";
import RecentBidCard from "./components/recent-bid-card";
import StatisticsCard from "./components/statistics-card";
import TopCreatorsCard from "./components/top-creators-card";
import TrendingBidWidgets from "./components/trending-bid-widgets";
import TrendingNftCard from "./components/trending-nft-card";

const metadata: Metadata = {
    title: "LMS Dashboard | WowDash Admin Panel",
    description:
        "Manage courses, track student progress, and analyze learning outcomes with the LMS Dashboard in WowDash Admin Template built using Next.js and Tailwind.",
};

const InvestmentPage = () => {
    return (
        <>
            <DashboardBreadcrumb title="NFT & Gaming" text="NFT & Gaming" />

            <div className="gap-6 grid grid-cols-1 2xl:grid-cols-12">
                <div className="col-span-12 2xl:col-span-8">
                    <div className="gap-6 grid grid-cols-1 sm:grid-cols-12">
                        <div className="col-span-12">
                            <Suspense fallback={<LoadingSkeleton />}>
                                <NftPromoBanner />
                            </Suspense>
                        </div>

                        <div className="col-span-12">
                            <Suspense fallback={<LoadingSkeleton />}>
                                <TrendingBidWidgets />
                            </Suspense>
                        </div>

                        <div className="col-span-12">
                            <Suspense fallback={<LoadingSkeleton />}>
                                <TrendingNftCard />
                            </Suspense>
                        </div>

                        <div className="col-span-12">
                            <Suspense fallback={<LoadingSkeleton />}>
                                <RecentBidCard />
                            </Suspense>
                        </div>
                    </div>
                </div>

                <div className="col-span-12 2xl:col-span-4">
                    <div className="gap-6 grid grid-cols-1 sm:grid-cols-12">
                        <div className="col-span-12 md:col-span-6 2xl:col-span-12">
                            <Suspense fallback={<LoadingSkeleton />}>
                                <EthPriceCard />
                            </Suspense>
                        </div>
                        <div className="col-span-12 md:col-span-6 2xl:col-span-12">
                            <Suspense fallback={<LoadingSkeleton />}>
                                <StatisticsCard />
                            </Suspense>
                        </div>
                        <div className="col-span-12 md:col-span-6 2xl:col-span-12">
                            <Suspense fallback={<LoadingSkeleton />}>
                                <FeaturedCreatorsCard />
                            </Suspense>
                        </div>
                        <div className="col-span-12 md:col-span-6 2xl:col-span-12">
                            <Suspense fallback={<LoadingSkeleton />}>
                                <TopCreatorsCard />
                            </Suspense>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};
export default InvestmentPage;
