import EmailSidebar from "@/app/(dashboard)/components/email-sidebar";
import EmailSidebarOverlay from "@/app/(dashboard)/components/email-sidebar-overlay";
import EmailHeader from "@/app/(dashboard)/email/components/email-header";
import EmailList from "@/app/(dashboard)/email/components/email-list";
import EmailSidebarToggleButton from "@/app/(dashboard)/email/components/email-sidebar-toggle-button";
import DashboardBreadcrumb from "@/components/layout/dashboard-breadcrumb";
import LoadingSkeleton from "@/components/loading-skeleton";
import type { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
    title: "Comunicação | Shift Partido",
    description:
        "Centralize mensagens internas e acompanhe a caixa de entrada operacional.",
};

const EmailPage = () => {
    return (
        <>
            <DashboardBreadcrumb title="Comunicação" text="Comunicação" />

            <div className="grid grid-cols-1 xl:grid-cols-12 xl:gap-6 relative">
                <EmailSidebarOverlay />

                {/* Sidebar */}
                <div className="col-span-12 xl:col-span-4 2xl:col-span-3">
                    <Suspense fallback={<LoadingSkeleton />}>
                        <EmailSidebar />
                    </Suspense>
                </div>

                <div className="col-span-12 xl:col-span-8 2xl:col-span-9">
                    <Suspense fallback={<LoadingSkeleton />}>
                        <EmailSidebarToggleButton />
                    </Suspense>

                    <div className="card h-full !p-0 border-0 email-card">
                        <div className="card-header border-b border-neutral-200 dark:border-slate-700 bg-white dark:bg-[#273142] py-4 px-6">
                            <Suspense fallback={<LoadingSkeleton />}>
                                <EmailHeader />
                            </Suspense>
                        </div>
                        <div className="card-body p-0">
                            <Suspense fallback={<LoadingSkeleton />}>
                                <EmailList />
                            </Suspense>
                        </div>
                    </div>
                </div>
            </div>

        </>
    );
};
export default EmailPage;
