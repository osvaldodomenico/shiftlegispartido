import DashboardBreadcrumb from "@/components/layout/dashboard-breadcrumb";
import CustomSelect from "@/components/shared/custom-select";
import SearchBox from "@/components/shared/search-box";
import UsersListTable from '@/components/table/users-list-table';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

const metadata: Metadata = {
    title: "Users List & Management | WowDash Admin Dashboard",
    description:
        "View, manage, and organize users with the users list feature in the WowDash Admin Dashboard built with Next.js and Tailwind CSS.",
};

const UsersList = () => {
    return (
        <>
            <DashboardBreadcrumb title="Users List" text="Users List" />

            <Card className="card h-full !p-0 !block border-0 overflow-hidden mb-6">
                <CardHeader className="border-b border-neutral-200 dark:border-slate-600 !py-4 px-6 flex items-center flex-wrap gap-3 justify-between">
                    <div className="flex items-center flex-wrap gap-3">
                        <span className="text-base font-medium text-neutral-500 dark:text-neutral-300 mb-0">Show</span>
                        <CustomSelect
                            placeholder="1"
                            options={["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"]}
                        />
                        <SearchBox />
                        <CustomSelect
                            placeholder="Status"
                            options={["Status", "Active", "Inactive"]}
                        />
                    </div>
                    <Button className={cn(`w-auto h-11`)} asChild>
                        <Link href="#">
                            <Plus className="w-5 h-5" />
                            Add New User
                        </Link>
                    </Button>
                </CardHeader>

                <CardContent className="card-body p-6">
                    <UsersListTable />
                </CardContent>
            </Card>

        </>
    );
};
export default UsersList;
