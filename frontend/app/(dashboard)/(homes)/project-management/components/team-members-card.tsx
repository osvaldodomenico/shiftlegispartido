
import CommonLink from "@/components/shared/common-link";
import TeamMembersTable from "@/components/table/team-members-table";
import { Card, CardContent } from '@/components/ui/card';

const TeamMembersCard = () => {
    return (
        <Card className="card p-6 border-0 rounded-xl shadow-none">
            <CardContent className="p-0">
                <div className="pb-4 flex items-center justify-between flex-wrap gap-2">
                    <h6 className="font-semibold text-lg mb-0 text-foreground">Team Members</h6>
                    <CommonLink />
                </div>
                <div className="p-0">
                    <div className="table-responsive scroll-sm">
                        <TeamMembersTable />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

export default TeamMembersCard;
