import TimeSeriesChart from "@/components/charts/TimeSeriesChart";
import CustomSelect from "@/components/shared/custom-select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import BitcoinIcon from "@/public/assets/images/crypto/bitcoin.png";
import { ArrowUp, Star } from "lucide-react";
import Image from "next/image";

const marketData = [
    {
        marketCap: "$1.15M",
        marketShare: "39% of crypto market",

        volume: "$146.36k",
        change: "1.37%",
        type: "up",

        supply: "807.21M ITC",
        supplyShare: "91% of crypto market",

        maxSupply: "10B ITC",
        progress: 30,
    },
    {
        marketCap: "$2.20M",
        marketShare: "50% of crypto market",

        volume: "$200.10k",
        change: "2.10%",
        type: "down",

        supply: "500M ITC",
        supplyShare: "70% of crypto market",

        maxSupply: "8B ITC",
        progress: 60,
    },
];

const MarketplaceDetailsCard = () => {
    return (
        <div className="card border-0 h-full p-0! rounded-[12px]">
            <div className="card-body px-6 py-8">

                <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
                    <div className="flex items-center">
                        <Image src={BitcoinIcon} alt="Image" width={72}
                            className="w-[72px] h-[72px] rounded-[50%] flex-shrink-0 me-3 overflow-hidden" />
                        <div className="grow flex flex-col">
                            <h4 className="mb-1.5">Bitcoin <span
                                className="text-base text-neutral-400 font-semibold">BTC</span> </h4>
                            <span className="text-base mb-0 font-medium text-neutral-500 block">Currency in USD.
                                Market Open</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-6">
                        <div className="flex flex-col align-items-end">
                            <div className="flex items-center gap-2 mb-1.5">
                                <h6 className="mb-0">$0.32533</h6>
                                <span
                                    className="text-sm font-semibold rounded-[50rem] bg-green-100 text-green-600 border br-green px-2 py-1 line-height-1 flex items-center gap-1">
                                    <ArrowUp size={16} /> 10%
                                </span>
                            </div>
                            <div className="">
                                <span className="font-semibold text-secondary-light text-sm">+0,021301</span>
                                <span className="font-semibold text-green-600 text-sm">(+6.42%)</span>
                            </div>
                        </div>
                        <button type="button"
                            className="star-btn w-[48px] h-[48px] flex justify-center items-center border rounded-[8px] text-2xl text-neutral-400 hover:text-blue-600 line-height-1">
                            <Star />
                        </button>
                    </div>
                </div>

                <h6 className="mb-6">About</h6>
                <p className="text-secondary-light">IoT Chain (ITC) is a cryptocurrency and operates on the Ethereum
                    platform. IoT Chain has a current supply of 99,999,999 with 87,214,657.4756 in circulation.
                    The last known price of IoT Chain is 0.01318397 USD and is up 0.00 over the last 24 hours.
                    It is currently trading on 5 active market(s) with $0.00 traded over the last 24 hours. More
                    information can be found at https://iotchain.io/. </p>

                <div className="my-6">
                    <div className="flex flex-wrap items-center justify-between mb-6">
                        <h6 className="text-lg mb-0">Bitcoin Chain Price</h6>
                        <CustomSelect
                            placeholder="Yearly"
                            options={["Yearly", "Monthly", "Weekly", "Today"]}
                        />
                    </div>

                    <div className="">
                        <TimeSeriesChart />
                    </div>
                </div>

                <div className="border rounded-[12px] p-6">
                    <h6 className="text-base mb-1.5">Market Stats</h6>



                    <div className="w-full overflow-x-auto">
                        <Table className="table-auto border-spacing-0 border-separate">
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="bg-neutral-100 dark:bg-slate-700 border-t border-neutral-200 dark:border-slate-600 overflow-hidden px-4 h-12 border-s rounded-tl-lg">Market Cap</TableHead>
                                    <TableHead className="bg-neutral-100 dark:bg-slate-700 border-t border-neutral-200 dark:border-slate-600 overflow-hidden px-4 h-12">Volume (24H)</TableHead>
                                    <TableHead className="bg-neutral-100 dark:bg-slate-700 border-t border-neutral-200 dark:border-slate-600 overflow-hidden px-4 h-12">Circulating Supply</TableHead>
                                    <TableHead className="bg-neutral-100 dark:bg-slate-700 border-t border-neutral-200 dark:border-slate-600 overflow-hidden px-4 h-12 border-e rounded-tr-lg text-center">Max Supply</TableHead>
                                </TableRow>
                            </TableHeader>

                            <TableBody>
                                {marketData.map((item, index) => {
                                    const isLastRow = index === marketData.length - 1;
                                    const isUp = item.type === "up";

                                    return (
                                        <TableRow key={index}>
                                            {/* Market Cap */}
                                            <TableCell
                                                className={`py-3 px-4 border-b border-neutral-200 dark:border-slate-600 first:border-s last:border-e ${isLastRow ? "rounded-bl-lg" : ""
                                                    }`}
                                            >
                                                <div className="text-[#4b5563]">
                                                    <h6 className="text-base mb-1.5">{item.marketCap}</h6>
                                                    <span className="text-neutral-500 text-sm">
                                                        {item.marketShare}
                                                    </span>
                                                </div>
                                            </TableCell>

                                            {/* Volume */}
                                            <TableCell
                                                className={`py-3 px-4 border-b border-neutral-200 dark:border-slate-600 first:border-s last:border-e`}
                                            >
                                                <div className="text-[#4b5563]">
                                                    <h6 className="text-base mb-1.5">{item.volume}</h6>
                                                    <span
                                                        className={`px-4 py-1.5 rounded-[50rem] font-semibold text-xs inline-flex items-center gap-1
                                                            ${isUp
                                                                ? "bg-success-focus text-success-600"
                                                                : "bg-danger-100 text-danger-600"
                                                            }`}
                                                    >
                                                        <i
                                                            className={`${isUp ? "ri-arrow-up-s-fill" : "ri-arrow-down-s-fill"
                                                                }`}
                                                        ></i>
                                                        {item.change}
                                                    </span>
                                                </div>
                                            </TableCell>

                                            {/* Supply */}
                                            <TableCell
                                                className={`py-3 px-4 border-b border-neutral-200 dark:border-slate-600 first:border-s last:border-e`}
                                            >
                                                <div className="text-[#4b5563]">
                                                    <h6 className="text-base mb-1.5">{item.supply}</h6>
                                                    <span className="text-neutral-500 text-sm">
                                                        {item.supplyShare}
                                                    </span>
                                                </div>
                                            </TableCell>

                                            {/* Allocation */}
                                            <TableCell
                                                className={`py-3 px-4 border-b border-neutral-200 dark:border-slate-600 first:border-s last:border-e ${isLastRow ? "rounded-br-lg" : ""
                                                    }`}
                                            >
                                                <div className="text-[#4b5563]">
                                                    <h6 className="text-base mb-1.5 text-center">{item.maxSupply}</h6>
                                                    <div className="flex items-center gap-2 w-[100px] mx-auto">
                                                        <div className="w-[112px] bg-gray-200 rounded-[50rem] h-2 dark:bg-gray-600">
                                                            <div
                                                                className="bg-blue-600 h-2 rounded-full"
                                                                style={{ width: `${item.progress}%` }}
                                                            ></div>
                                                        </div>
                                                        <span className="text-neutral-500 text-sm font-bold">
                                                            {item.progress}%
                                                        </span>
                                                    </div>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>

                        </Table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MarketplaceDetailsCard;