import OverallReportChart from '@/components/charts/overall-report-chart';
import CustomSelect from "@/components/shared/custom-select";
import { Card, CardContent } from '@/components/ui/card';

const StatisticsCard = () => {
    return (
        <Card className="card h-full rounded-4 overflow-hidden border-0 !p-0">
            <div className="border-b border-neutral-200 dark:border-slate-500 py-4 px-6 flex items-center justify-between flex-wrap gap-2">
                <h6 className="font-semibold text-lg mb-0 text-foreground">Agent Avg. Earnings</h6>
                <CustomSelect
                    placeholder="Yearly"
                    options={["Yearly", "Monthly", "Weekly", "Today"]}
                />
            </div>
            <CardContent className="card-header">
                <div className="card-body flex items-center sm:flex-nowrap flex-wrap py-8">
                    <div className="relative text-center">
                        <OverallReportChart showDataLabels={false} chartHeight={240} />
                        <div
                            className="text-center absolute top-[50%] start-[50%] translate-x-[-50%] translate-y-[-50%]">
                            <h6 className="mb-0 mt-1">$,4578</h6>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                        <div className="flex items-center gap-3">
                            <span className="w-[10px] h-[16px] bg-blue-600 rounded-[50rem] relative">
                            </span>
                            <div className="">
                                <p className="text-secondary-light text-sm mb-0">Online Sale</p>
                                <h6 className="mb-0 text-lg">$3,425</h6>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="w-[10px] h-[16px] bg-yellow-500 rounded-[50rem] relative">
                            </span>
                            <div className="">
                                <p className="text-secondary-light text-sm mb-0">Offline Sale </p>
                                <h6 className="mb-0 text-lg">$3,120</h6>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="w-[10px] h-[16px] bg-green-500 rounded-[50rem] relative">
                            </span>
                            <div className="">
                                <p className="text-secondary-light text-sm mb-0">Agent Sale</p>
                                <h6 className="mb-0 text-lg">$2,472</h6>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="w-[10px] h-[16px] bg-purple-600 rounded-[50rem] relative">
                            </span>
                            <div className="">
                                <p className="text-secondary-light text-sm mb-0">Marketing Sale</p>
                                <h6 className="mb-0 text-lg">$5,120</h6>
                            </div>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

export default StatisticsCard;