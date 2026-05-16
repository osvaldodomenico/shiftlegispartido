import { Card, CardContent } from "@/components/ui/card";
import {
    ArrowUpRight,
    BadgePercent,
    CircleDollarSign,
    Inbox,
    UserRound,
} from "lucide-react";

type WidgetItem = {
    id: number;
    title: string;
    value: string;
    lastMonth: string;
    percent: string;
    icon: React.ReactNode;
    iconBg: string;
    gradient: string;
};

const widgets: WidgetItem[] = [
    {
        id: 1,
        title: "Total Product",
        value: "240",
        lastMonth: "Last month 10",
        percent: "95%",
        icon: <Inbox />,
        iconBg: "bg-blue-600",
        gradient:
            "bg-[linear-gradient(190deg,rgba(255,255,255,0.14)_8.24%,rgba(13,110,253,0.05)_89.87%)]",
    },
    {
        id: 2,
        title: "Total User",
        value: "350",
        lastMonth: "Last month 102",
        percent: "95%",
        icon: <UserRound />,
        iconBg: "bg-yellow-400",
        gradient:
            "bg-[linear-gradient(190deg,rgba(255,255,255,0)_8.24%,rgba(255,159,41,0.09)_89.87%)]",
    },
    {
        id: 3,
        title: "Total Sales",
        value: "$10,750",
        lastMonth: "Last month $1,600.00",
        percent: "95%",
        icon: <BadgePercent />,
        iconBg: "bg-purple-600",
        gradient:
            "bg-[linear-gradient(190deg,rgba(255,255,255,0)_8.24%,rgba(130,82,233,0.09)_89.87%)]",
    },
    {
        id: 4,
        title: "Total Revenue",
        value: "$8,000",
        lastMonth: "Last month $1,600.00",
        percent: "95%",
        icon: <CircleDollarSign />,
        iconBg: "bg-cyan-600",
        gradient:
            "bg-[linear-gradient(190deg,rgba(255,255,255,0.14)_8.24%,rgba(13,202,240,0.10)_89.87%)]",
    },
];

const SalesWidgetsCard = () => {
    return (
        <Card className="card h-full rounded-lg border-0">
            <CardContent className="p-0">
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
                    {widgets.map((item) => (
                        <div
                            key={item.id}
                            className="col-span-12 sm:col-span-6 2xl:col-span-3"
                        >
                            <div
                                className={`px-6 py-4 rounded-lg border border-neutral-200 dark:border-neutral-200/20 h-full ${item.gradient}`}
                            >
                                <div className="flex justify-between items-center gap-3">
                                    <div className="grow">
                                        <h6 className="font-semibold mb-0">
                                            {item.value}
                                        </h6>
                                        <span className="text-neutral-500 dark:text-neutral-200 mt-1 block">
                                            {item.title}
                                        </span>
                                    </div>

                                    <span
                                        className={`${item.iconBg} w-12 h-12 rounded-full flex items-center justify-center text-white`}
                                    >
                                        {item.icon}
                                    </span>
                                </div>

                                <p className="text-sm mt-5 mb-0">
                                    <span className="bg-white dark:bg-black shadow px-2 py-1 rounded-md font-medium text-green-500 text-sm inline-flex items-center gap-1 me-1.5">
                                        <ArrowUpRight className="size-4" />
                                        {item.percent}
                                    </span>
                                    {item.lastMonth}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
};

export default SalesWidgetsCard;
