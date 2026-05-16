import AreaChartSingle from '@/components/charts/area-chart-single';
import GreenBarChart from '@/components/charts/green-bar-chart';
import UpdownBarChartSmall from '@/components/charts/updown-bar-chart-small';
import { BadgePercent, MessageSquare, UserPlus } from 'lucide-react';

const WidgetsCard = () => {
    return (
        <div className="card h-full border-0 rounded-[16px] overflow-hidden border-0">
            <div className="card-body p-0">
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
                    <div className="col-span-12 sm:col-span-6">
                        <div
                            className="px-4 py-3 rounded-[8px] border border-neutral-200 dark:border-neutral-200/20 h-full bg-[linear-gradient(299deg,rgba(255,255,255,0)_53.55%,rgba(0,85,255,0.0784313725)_93.27%)]">
                            <div className="flex items-center gap-3">
                                <span
                                    className="bg-blue-600 w-[48px] h-[48px] text-2xl rounded-[50%] flex justify-center items-center text-white">
                                    <UserPlus />
                                </span>
                                <div className="grow">
                                    <div className="flex justify-between items-center">
                                        <h6 className="font-semibold mb-0">750</h6>
                                        <span
                                            className="bg-green-600/10 text-green-600 dark:text-green-500 font-semibold border border-green-300 dark:border-green-600/[20] rounded-[50rem] px-4 text-sm">+200</span>
                                    </div>
                                    <span className="text-neutral-500 dark:text-neutral-200 mt-1">Total Users</span>
                                </div>
                            </div>
                            <div className="mt-4 -mb-4">
                                <AreaChartSingle chartColor="#487fff" chartHeight={80} />
                            </div>
                        </div>
                    </div>
                    <div className="col-span-12 sm:col-span-6">
                        <div
                            className="px-4 py-3 rounded-[8px] border border-neutral-200 dark:border-neutral-200/20 h-full bg-[linear-gradient(299deg,rgba(255,255,255,0)_56.67%,rgba(244,148,30,0.1490196078)_92.87%)]">
                            <div className="flex items-center gap-3">
                                <span
                                    className="bg-yellow-500 w-[48px] h-[48px] text-2xl rounded-[50%] flex justify-center items-center text-white">
                                    <BadgePercent />
                                </span>
                                <div className="grow">
                                    <div className="flex justify-between items-center">
                                        <h6 className="font-semibold mb-0">240</h6>
                                        <span
                                            className="bg-red-600/10 text-red-600 dark:text-red-500 font-semibold border border-red-300 dark:border-red-600/[20] rounded-[50rem] px-4 text-sm">-200</span>
                                    </div>
                                    <span className="text-neutral-500 dark:text-neutral-200 mt-1">Total
                                        Orders</span>
                                </div>
                            </div>
                            <div className="mt-4 -mb-4">
                                <AreaChartSingle chartColor="#ff9f29" chartHeight={80} />
                            </div>
                        </div>
                    </div>
                    <div className="col-span-12 sm:col-span-6">
                        <div
                            className="px-4 py-3 rounded-[8px] border border-neutral-200 dark:border-neutral-200/20 h-full bg-[linear-gradient(299deg,rgba(255,255,255,0)_56.67%,rgba(130,82,233,0.168627451)_92.87%)]">
                            <div className="flex items-center gap-3">
                                <span
                                    className="bg-purple-500 w-[48px] h-[48px] text-2xl rounded-[50%] flex justify-center items-center text-white">
                                    <MessageSquare />
                                </span>
                                <div className="grow">
                                    <div className="flex justify-between items-center">
                                        <h6 className="font-semibold mb-0">47.5%</h6>
                                        <span
                                            className="bg-green-600/10 text-green-600 dark:text-green-500 font-semibold border border-green-300 dark:border-green-600/[20] rounded-[50rem] px-4 text-sm">+3.6%</span>
                                    </div>
                                    <span className="text-neutral-500 dark:text-neutral-200 mt-1">Conversion
                                        Rate</span>
                                </div>
                            </div>
                            <div className="mt-4">
                                <UpdownBarChartSmall />
                            </div>
                        </div>
                    </div>
                    <div className="col-span-12 sm:col-span-6">
                        <div
                            className="px-4 py-3 rounded-[8px] border border-neutral-200 dark:border-neutral-200/20 h-full bg-[linear-gradient(299deg,rgba(255,255,255,0)_56.67%,rgba(34,197,94,0.14)_92.87%)]">
                            <div className="flex items-center gap-3">
                                <span
                                    className="bg-green-500 w-[48px] h-[48px] text-2xl rounded-[50%] flex justify-center items-center text-white">
                                    <UserPlus />
                                </span>
                                <div className="grow">
                                    <div className="flex justify-between items-center">
                                        <h6 className="font-semibold mb-0">$2.7M</h6>
                                        <span
                                            className="bg-green-600/10 text-green-600 dark:text-green-500 font-semibold border border-green-300 dark:border-green-600/[20] rounded-[50rem] px-4 text-sm">+3.6%</span>
                                    </div>
                                    <span className="text-neutral-500 dark:text-neutral-200 mt-1">Order Value</span>
                                </div>
                            </div>
                            <div className="mt-4">
                                <GreenBarChart />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WidgetsCard;