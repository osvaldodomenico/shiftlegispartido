import { ArrowUpRight, User } from "lucide-react";

const StatisticsWidgets = () => {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            <div className="col-span-12 md:col-span-4 sm:col-span-6">
                <div className="">
                    <div
                        className="card p-3 border-0 rounded-[8px] shadow-[0_0.25rem_1.875rem_#2e2d740d] bg-white h-full bg-gradient-to-t from-[#f3eeff] to-white">
                        <div className="card-body p-0">
                            <div className="flex items-center gap-3">
                                <div className="">
                                    <span
                                        className="mb-0 w-[40px] h-[40px] text-purple-600 bg-purple-100 border border-purple-200 flex-shrink-0 flex justify-center items-center rounded text-xl mb-0">
                                        <User />
                                    </span>
                                </div>
                                <h6 className="text-base font-medium mb-0">Total Property</h6>
                            </div>
                            <div className="mt-[44px]">
                                <h6 className="font-semibold mb-2">570</h6>
                                <p className="text-sm mb-0 flex items-center gap-2"><span className="font-medium text-green-600 text-sm flex items-center gap-2"> <ArrowUpRight size={14} /> 11.2%</span> Per Month </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div className="col-span-12 md:col-span-4 sm:col-span-6">
                <div className="">
                    <div
                        className="card p-3 border-0 rounded-[8px] shadow-[0_0.25rem_1.875rem_#2e2d740d] h-full bg-gradient-to-t from-[#fff5e9] to-white">
                        <div className="card-body p-0">
                            <div className="flex items-center gap-3">
                                <div className="">
                                    <span
                                        className="mb-0 w-[40px] h-[40px] text-yellow-600 bg-yellow-100 border border-yellow-200 flex-shrink-0 flex justify-center items-center rounded text-xl mb-0">
                                        <User />
                                    </span>
                                </div>
                                <h6 className="text-base font-medium mb-0">Total Property</h6>
                            </div>
                            <div className="mt-[44px]">
                                <h6 className="font-semibold mb-2">570</h6>
                                <p className="text-sm mb-0 flex items-center gap-2"><span className="font-medium text-green-600 text-sm flex items-center gap-2"> <ArrowUpRight size={14} /> 11.2%</span> Per Month </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div className="col-span-12 md:col-span-4 sm:col-span-6">
                <div className="">
                    <div
                        className="card p-3 border-0 rounded-[8px] shadow-[0_0.25rem_1.875rem_#2e2d740d] h-full bg-gradient-to-t from-[#eefbff] to-white">
                        <div className="card-body p-0">
                            <div className="flex items-center gap-3">
                                <div className="">
                                    <span
                                        className="mb-0 w-[40px] h-[40px] text-green-500 bg-green-100 border border-green-200 flex-shrink-0 flex justify-center items-center rounded text-xl mb-0">
                                        <User />
                                    </span>
                                </div>
                                <h6 className="text-base font-medium mb-0">Total Property</h6>
                            </div>
                            <div className="mt-[44px]">
                                <h6 className="font-semibold mb-2">570</h6>
                                <p className="text-sm mb-0 flex items-center gap-2"><span className="font-medium text-green-600 text-sm flex items-center gap-2"> <ArrowUpRight size={14} /> 11.2%</span> Per Month </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StatisticsWidgets;