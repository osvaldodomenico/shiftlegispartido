import CommonLink from '@/components/shared/common-link';
import RecentActivityTableSass from '@/components/table/recent-activity-table-sass';
import { Card, CardContent } from '@/components/ui/card';

const RecentActivityCard = () => {
    return (
        <Card className="card !p-0 border-0 rounded-xl shadow-none">
            <CardContent className="p-0">
                <div className="border-b border-neutral-200 dark:border-slate-500 py-4 px-6 flex items-center justify-between flex-wrap gap-2">
                    <h6 className="font-semibold text-lg mb-0 text-foreground">Recent Activity</h6>
                    <CommonLink />
                </div>
                <div className="card-body">
                    <RecentActivityTableSass />
                </div>
            </CardContent>
        </Card>
    );
};

export default RecentActivityCard;