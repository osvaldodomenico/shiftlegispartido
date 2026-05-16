import EarningStatisticsChart from '@/components/charts/earning-statistics-chart';
import CustomSelect from '@/components/shared/custom-select';
import { Card, CardContent } from '@/components/ui/card';

const DailyEarningsCard = () => {
    return (
        <Card className="card !p-0 border-0 rounded-xl shadow-none">
            <CardContent className="p-0">
                <div className="border-b border-neutral-200 dark:border-slate-500 py-4 px-6 flex items-center justify-between flex-wrap gap-2">
                    <h6 className="font-semibold text-lg mb-0 text-foreground">Daily Earnings</h6>
                    <CustomSelect
                        placeholder="Yearly"
                        options={["Yearly", "Monthly", "Weekly", "Today"]}
                    />
                </div>
                <div className="card-body p-6">
                    <ul className="flex flex-wrap items-center justify-center gap-3">
                        <li className="flex items-center gap-2">
                            <span className="w-[12px] h-[8px] rounded-[50rem] bg-blue-600"></span>
                            <span
                                className="text-neutral-500 dark:text-neutral-200 text-sm font-semibold line-height-1">Earning:
                                <span className="text-primary-light font-bold text-xl ms-1">$15.5k</span>
                            </span>
                        </li>
                    </ul>
                    <div className="-mb-6">
                        <EarningStatisticsChart />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

export default DailyEarningsCard;