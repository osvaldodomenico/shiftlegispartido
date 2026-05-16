"use client";

import { Card, CardContent } from "@/components/ui/card";
import { FileText, ScrollText, UserRound, UsersRound } from "lucide-react";

interface StatItem {
  id: number;
  title: string;
  value: number | string;
  icon: React.ReactNode;
  color: string;
  blurColor: string;
}

const statsData: StatItem[] = [
  {
    id: 1,
    title: "Total Projects",
    value: 320,
    icon: <FileText />,
    color: "bg-red-600",
    blurColor: "bg-red-500/30",
  },
  {
    id: 2,
    title: "Total Clients",
    value: 547,
    icon: <UserRound />,
    color: "bg-green-600",
    blurColor: "bg-green-500/30",
  },
  {
    id: 3,
    title: "Team Members",
    value: 356,
    icon: <UsersRound />,
    color: "bg-yellow-500",
    blurColor: "bg-yellow-500/30",
  },
  {
    id: 4,
    title: "Finished Projects",
    value: 435,
    icon: <ScrollText />,
    color: "bg-cyan-600",
    blurColor: "bg-cyan-500/30",
  },
];

function ProjectWidgets() {
  return (
    <>
      {statsData.map((item) => (
        <div key={item.id} className="col-span-12 sm:col-span-6 2xl:col-span-3">
          <Card className="bg-white dark:bg-[#273142] p-4 rounded-lg relative overflow-hidden border-0">
            <span
              className={`w-[155px] h-[40px] -translate-y-1/2 -rotate-[27.131deg] rounded-[130px] ${item.blurColor} blur-[32px] -me-[30px] absolute end-0 top-[50%]`}
            ></span>

            <CardContent className="px-0">
              <div className="flex items-center justify-between gap-1">
                <div>
                  <span className="text-neutral-500 dark:text-neutral-300 text-sm font-medium">
                    {item.title}
                  </span>
                  <h6 className="text-2xl mb-0 font-semibold">{item.value}</h6>
                </div>
                <span
                  className={`w-[40px] h-[40px] rounded-lg ${item.color} text-white flex justify-center items-center text-[24px]`}
                >
                  {item.icon}
                </span>
              </div>

              <a
                href="#"
                className="bg-green-500/20 hover:bg-green-500 hover:text-white text-green-600 dark:text-green-500 dark:hover:text-white text-sm py-1 px-6 mt-2.5 rounded inline-block transition-all duration-200"
              >
                View More
              </a>
            </CardContent>
          </Card>
        </div>
      ))}
    </>
  );
}

export default ProjectWidgets;