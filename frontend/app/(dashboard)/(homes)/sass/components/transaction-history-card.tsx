import CommonLink from '@/components/shared/common-link';
import TransactionHistorySassTable from '@/components/table/TransactionHistorySassTable';
import { Card, CardContent } from '@/components/ui/card';

const TransactionHistoryCard = () => {
    return (
        <Card className="card !p-0 border-0 rounded-xl shadow-none">
            <CardContent className="p-0">
                <div className="border-b border-neutral-200 dark:border-slate-500 py-4 px-6 flex items-center justify-between flex-wrap gap-2">
                    <h6 className="font-semibold text-lg mb-0 text-foreground">Transaction History</h6>
                    <CommonLink />
                </div>
                <div className="card-body">
                    <TransactionHistorySassTable />
                </div>
            </CardContent>
        </Card>
    );
};

export default TransactionHistoryCard;