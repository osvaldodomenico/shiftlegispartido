import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import CustomSelect from '@/components/shared/custom-select';
import TransactionList from '@/components/shared/transaction-list';

const TransactionsCard = () => {
    return (
        <Card className="card h-full rounded-lg border-0">
            <CardContent className="card-body p-0">
                <div className="flex items-center flex-wrap gap-2 justify-between">
                    <h6 className="mb-0 font-bold text-lg">Transactions</h6>
                    <CustomSelect
                        placeholder="This Month"
                        options={["This Month", "Last Month", "This Year", "This Week"]}
                    />
                </div>

                <div className="mt-6">
                    <TransactionList/>
                </div>
        
            </CardContent>
        </Card>
    );
};

export default TransactionsCard;