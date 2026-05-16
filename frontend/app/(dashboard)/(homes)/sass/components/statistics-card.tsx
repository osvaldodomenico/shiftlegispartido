import OverallReportChart from '@/components/charts/overall-report-chart';
import CommonLink from '@/components/shared/common-link';
import { Card, CardContent } from '@/components/ui/card';

const StatisticsCard = () => {
    return (
        <Card className="card !p-0 border-0 rounded-xl shadow-none">
            <CardContent className="p-6">
                <div className="flex items-center justify-between flex-wrap gap-2">
                    <h6 className="font-semibold text-lg mb-0 text-foreground">Statistics</h6>
                    <CommonLink />
                </div>
                <div className="flex items-center gap-5 flex-sm-nowrap flex-wrap pt-6">
                    <div className="flex flex-col gap-3">
                        <div className="flex items-center gap-3">
                            <div className="">
                                <span className="w-[20px] h-[20px] bg-blue-600 rounded-[50%] relative">
                                    <span
                                        className="w-[10px] h-[10px] bg-blue-100 rounded-[50%] absolute top-[50%] start-[50%] -translate-x-[50%] -translate-y-[50%]"></span>
                                </span>
                            </div>
                            <div className="">
                                <h6 className="mb-0">172</h6>
                                <p className="text-neutral-500 dark:text-neutral-200 text-sm">Total Visitors</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="">
                                <span
                                    className="w-[20px] h-[20px] bg-yellow-400 rounded-[50%] relative">
                                    <span
                                        className="w-[10px] h-[10px] bg-yellow-100 rounded-[50%] absolute top-[50%] start-[50%] -translate-x-[50%] -translate-y-[50%]"></span>
                                </span>
                            </div>
                            <div className="">
                                <h6 className="mb-0">300</h6>
                                <p className="text-neutral-500 dark:text-neutral-200 text-sm">Total Page Views
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="">
                                <span className="w-[20px] h-[20px] bg-green-600 rounded-[50%] relative">
                                    <span
                                        className="w-[10px] h-[10px] bg-green-100 rounded-[50%] absolute top-[50%] start-[50%] -translate-x-[50%] -translate-y-[50%]"></span>
                                </span>
                            </div>
                            <div className="">
                                <h6 className="mb-0">200</h6>
                                <p className="text-neutral-500 dark:text-neutral-200 text-sm">Registrations</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="">
                                <span className="w-[20px] h-[20px] bg-purple-600 rounded-[50%] relative">
                                    <span
                                        className="w-[10px] h-[10px] bg-purple-100 rounded-[50%] absolute top-[50%] start-[50%] -translate-x-[50%] -translate-y-[50%]"></span>
                                </span>
                            </div>
                            <div className="">
                                <h6 className="mb-0">500</h6>
                                <p className="text-neutral-500 dark:text-neutral-200 text-sm">Registrations</p>
                            </div>
                        </div>
                    </div>
                    <div className="">
                        <OverallReportChart showDataLabels={false} />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

export default StatisticsCard;