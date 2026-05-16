import GenerateContentChart from '@/components/charts/generate-content-chart';
import CustomSelect from "@/components/shared/custom-select";
import { Card, CardContent } from '@/components/ui/card';
import { ArrowDown, ArrowUp } from 'lucide-react';

const TotalRevenueCard = () => {
    return (
        <Card className="card h-full rounded-4 overflow-hidden border-0 !p-0">
            <div className="border-b border-neutral-200 dark:border-slate-500 py-4 px-6 flex items-center justify-between flex-wrap gap-2">
                <h6 className="font-semibold text-lg mb-0 text-foreground">Total Revenue</h6>
                <CustomSelect
                    placeholder="Yearly"
                    options={["Yearly", "Monthly", "Weekly", "Today"]}
                />
            </div>
            <CardContent className="">
                <div className="card-body">
                    <ul className="flex flex-wrap items-center justify-center gap-10">
                        <li className="flex items-center gap-1">
                            <div className="flex items-center gap-2">
                                <span className="w-[8px] h-[12px] rounded-[50rem] bg-blue-600"></span>
                                <span className="text-secondary-light text-sm font-semibold">Income </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <h6 className="mb-0">$26,201</h6>
                                <span className="text-green-500 flex items-center gap-1 text-sm font-bold">
                                    10%
                                    <ArrowUp size={14} />
                                </span>
                            </div>
                        </li>
                        <li className="flex items-center gap-1">
                            <div className="flex items-center gap-2">
                                <span className="w-[8px] h-[12px] rounded-[50rem] bg-yellow-500"></span>
                                <span className="text-secondary-light text-sm font-semibold">Expenses </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <h6 className="mb-0">$18,120</h6>
                                <span className="text-red-500 flex items-center gap-1 text-sm font-bold">
                                    10%
                                    <ArrowDown size={14} />
                                </span>
                            </div>
                        </li>
                    </ul>
                    <div className="mt-2.5">
                        <GenerateContentChart />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

export default TotalRevenueCard;