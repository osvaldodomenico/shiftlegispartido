import PodcastEarningsOverviewChart from "@/components/charts/podcast-earnings-overview-chart";
import CustomSelect from "@/components/shared/custom-select";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowUp } from "lucide-react";

const EarningsOverviewCard = () => {
    return (
        <Card className="card bg-white rounded-[12px] py-5 px-6 shadow-9 h-full mb-5">
            <CardContent className="px-0">
                <div className="flex items-center flex-wrap gap-2 justify-between">
                    <h6 className="mb-0 font-bold text-lg">Earnings Overview</h6>
                    <CustomSelect
                        placeholder="Yearly"
                        options={["Yearly", "Monthly", "Weekly", "Today"]}
                    />
                </div>
                <ul className="flex flex-wrap items-center justify-center mt-6 gap-3">
                    <li className="flex items-center gap-2">
                        <span className="w-[8px] h-[8px] rounded-[50%] bg-blue-600"></span>
                        <span className="text-secondary-light text-sm font-medium inline-flex items-center gap-1">
                            Earnings:
                            <span className="text-[#111827] text-xl font-bold">$26,201</span>
                        </span>
                        <div className="flex items-center gap-1 font-semibold text-green-500">
                            <span className="text-[inherit]">10%</span>
                            <ArrowUp size={14} />
                        </div>
                    </li>
                </ul>
                <div className="mt-6 -ms-4 -mb-4">
                    <PodcastEarningsOverviewChart chartHeight={310} />
                </div>
            </CardContent>
        </Card>
    );
};

export default EarningsOverviewCard;