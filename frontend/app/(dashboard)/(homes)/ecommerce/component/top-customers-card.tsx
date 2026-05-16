import { Card, CardContent } from '@/components/ui/card';
import React from 'react';
import CommonLink from '@/components/shared/common-link';
import TopCustomerList from '@/components/shared/top-customer-list';

const TopCustomersCard = () => {
    return (
        <Card className="card">
            <CardContent className="card-body p-0">
                <div className="flex items-center justify-between">
                    <h6 className="mb-3 font-semibold text-lg">Top Customers</h6>
                    <CommonLink />
                </div>

                <div className="mt-4 space-y-6">
                    <TopCustomerList />
                </div>
            </CardContent>
        </Card>
    );
};

export default TopCustomersCard;