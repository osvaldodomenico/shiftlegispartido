import DashboardBreadcrumb from "@/components/layout/dashboard-breadcrumb";
import type { Metadata } from "next";
import CompanyForm from "./company-form";

export const metadata: Metadata = {
    title: "Empresa | Shift Partido",
    description:
        "Gerencie os dados institucionais e operacionais do diretório.",
};

const ViewProfile = () => {
    return (
        <>
            <DashboardBreadcrumb title="Empresa" text="Empresa" />

            <div>
                <div className="card h-full rounded-lg border-0 p-6">
                    <div className="card-body p-0">
                        <CompanyForm />
                    </div>
                </div>
            </div>

        </>
    );
};
export default ViewProfile;
