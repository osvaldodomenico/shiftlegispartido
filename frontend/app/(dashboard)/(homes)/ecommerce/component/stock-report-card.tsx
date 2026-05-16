import { Card, CardContent } from '@/components/ui/card';
import React from 'react';
import CommonLink from '@/components/shared/common-link';
import StockReportTable from '@/components/table/stock-report-table';

const StockReportCard = () => {
    return (
        <Card className="card">
            <CardContent className="card-body p-0">
                <div className="flex items-center justify-between">
                    <h6 className="mb-3 font-semibold text-lg">Stock Report</h6>
                    <CommonLink />
                </div>

                <div className="mt-4 space-y-6">
                    <StockReportTable/>
                </div>
            </CardContent>
        </Card>
    );
};

export default StockReportCard;