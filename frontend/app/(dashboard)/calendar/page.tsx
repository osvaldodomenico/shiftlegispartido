import type { Metadata } from "next";
import DashboardBreadcrumb from "@/components/layout/dashboard-breadcrumb";
import { Suspense } from "react";
import LoadingSkeleton from "@/components/loading-skeleton";
import BasicFullCalendar from "./components/basic-full-calendar";
import CalendarSidebar from "./components/calendar-sidebar";

export const metadata: Metadata = {
    title: "Calendário | Shift Partido",
    description:
        "Acompanhe compromissos, eventos e marcos operacionais do diretório.",
};


const CalendarPage = () => {
    return (
        <>
            <DashboardBreadcrumb title="Calendário" text="Calendário" />

            <Suspense fallback={<LoadingSkeleton />}>
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                    <div className="col-span-12 lg:col-span-4 2xl:col-span-3">
                        <CalendarSidebar />
                    </div>

                    <div className="col-span-12 lg:col-span-8 2xl:col-span-9">
                        <BasicFullCalendar />
                    </div>

                </div>
            </Suspense>

        </>
    );
};
export default CalendarPage;
