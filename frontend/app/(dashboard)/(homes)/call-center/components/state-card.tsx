import Image, { StaticImageData } from "next/image";
import ServiceLevelRadialProgress from "./service-level-radial-progress";

import phoneImageIcon1 from "@/public/assets/images/home-sixteen/icon/phone-icon1.png";
import phoneImageIcon2 from "@/public/assets/images/home-sixteen/icon/phone-icon2.png";
import phoneImageIcon3 from "@/public/assets/images/home-sixteen/icon/phone-icon3.png";

interface StatItem {
    icon: StaticImageData;
    title: string;
    value: number;
    subtitle: string;
    compare: string;
}

const stats: StatItem[] = [
    {
        icon: phoneImageIcon1,
        title: "Incoming Calls",
        value: 526,
        subtitle: "Last 7 days",
        compare: "Vs 497 prev. 7 days",
    },
    {
        icon: phoneImageIcon2,
        title: "Answered Calls",
        value: 526,
        subtitle: "Last 7 days",
        compare: "Vs 497 prev. 7 days",
    },
    {
        icon: phoneImageIcon3,
        title: "Abandoned Calls",
        value: 526,
        subtitle: "Last 7 days",
        compare: "Vs 497 prev. 7 days",
    },
];

const StateCard = () => {
    return (
        <div className="bg-white dark:bg-[#273142] radius-12 shadow-7 mb-6">
            <div className="flex flex-wrap xl:flex-nowrap stats-card-wrapper gap-6">
                <div className="grid lg:grid-cols-3 grid-cols-2 flex-grow">
                    {stats.map((item, index) => (
                        <div
                            key={index}
                            className="hover-gradient
                            text-center py-6 px-4 relative
                            before:content-[''] before:absolute before:w-full before:h-0 
                            before:top-0 before:left-0 
                            before:bg-[linear-gradient(180deg,rgba(20,75,214,0.15)_0%,rgba(255,255,255,0)_100%)]
                            before:z-[-1] before:transition-all before:duration-300
                            hover:before:h-full z-[1]">
                            <span>
                                <Image
                                    src={item.icon}
                                    width={56}
                                    height={56}
                                    alt={item.title}
                                    className="mx-auto"
                                />
                            </span>

                            <h6 className="text-xl mt-3">{item.title}</h6>

                            <p className="text-neutral-500 dark:text-neutral-200">
                                {item.subtitle}
                            </p>

                            <h5 className="mt-3">{item.value}</h5>

                            <p className="text-neutral-500 dark:text-neutral-200 mt-4">
                                {item.compare}
                            </p>
                        </div>
                    ))}
                </div>

                <div className="py-6 hidden xxl:block">
                    <span className="w-[2px] h-full bg-neutral-200 dark:bg-neutral-600"></span>
                </div>

                <ServiceLevelRadialProgress />
            </div>
        </div>
    );
};

export default StateCard;