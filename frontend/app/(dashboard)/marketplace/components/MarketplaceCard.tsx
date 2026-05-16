import CardSmallChartTwo from "@/components/charts/card-small-chart-two";
import CustomSelect from "@/components/shared/custom-select";
import SearchBox from "@/components/shared/search-box";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import crypto1 from "@/public/assets/images/crypto/crypto-img1.png";
import crypto2 from "@/public/assets/images/crypto/crypto-img2.png";
import crypto3 from "@/public/assets/images/crypto/crypto-img3.png";
import crypto4 from "@/public/assets/images/crypto/crypto-img4.png";
import crypto5 from "@/public/assets/images/crypto/crypto-img5.png";
import crypto6 from "@/public/assets/images/crypto/crypto-img6.png";
import { ChevronDown, ChevronsLeft, ChevronsRight, ChevronUp, Star } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

const cryptoData = [
    {
        name: "Bitcoin",
        symbol: "BTC",
        image: crypto1,
        amount: "0.3464 BTC",
        price: "$2,753.00",
        change: "1.37%",
        type: "up",
        chartBg: "#16a34a",
    },
    {
        name: "Ethereum",
        symbol: "ETH",
        image: crypto2,
        amount: "0.5464 ETH",
        price: "$2,753.00",
        change: "1.37%",
        type: "up",
        chartBg: "#16a34a",
    },
    {
        name: "Litecoin",
        symbol: "LTC",
        image: crypto3,
        amount: "0.5464 LTC",
        price: "$2,753.00",
        change: "1.37%",
        type: "up",
        chartBg: "#16a34a",
    },
    {
        name: "Binance",
        symbol: "BNB",
        image: crypto4,
        amount: "0.5464 BNB",
        price: "$2,753.00",
        change: "1.37%",
        type: "up",
        chartBg: "#16a34a",
    },
    {
        name: "Dogecoin",
        symbol: "DOGE",
        image: crypto6,
        amount: "0.5464 DOGE",
        price: "$2,753.00",
        change: "1.37%",
        type: "down",
        chartBg: "#dc2626",
    },
    {
        name: "Polygon",
        symbol: "MATIC",
        image: crypto5,
        amount: "0.5464 MATIC",
        price: "$2,753.00",
        change: "1.37%",
        type: "down",
        chartBg: "#dc2626",
    },
    {
        name: "Bitcoin",
        symbol: "BTC",
        image: crypto1,
        amount: "0.3464 BTC",
        price: "$2,753.00",
        change: "1.37%",
        type: "up",
        chartBg: "#16a34a",
    },
    {
        name: "Ethereum",
        symbol: "ETH",
        image: crypto2,
        amount: "0.5464 ETH",
        price: "$2,753.00",
        change: "1.37%",
        type: "up",
        chartBg: "#16a34a",
    },
    {
        name: "Litecoin",
        symbol: "LTC",
        image: crypto3,
        amount: "0.5464 LTC",
        price: "$2,753.00",
        change: "1.37%",
        type: "up",
        chartBg: "#16a34a",
    },
    {
        name: "Binance",
        symbol: "BNB",
        image: crypto4,
        amount: "0.5464 BNB",
        price: "$2,753.00",
        change: "1.37%",
        type: "up",
        chartBg: "#16a34a",
    },
    {
        name: "Dogecoin",
        symbol: "DOGE",
        image: crypto6,
        amount: "0.5464 DOGE",
        price: "$2,753.00",
        change: "1.37%",
        type: "down",
        chartBg: "#dc2626",
    },
    {
        name: "Polygon",
        symbol: "MATIC",
        image: crypto5,
        amount: "0.5464 MATIC",
        price: "$2,753.00",
        change: "1.37%",
        type: "down",
        chartBg: "#dc2626",
    },
];

const MarketplaceCard = () => {
    return (
        <>
            <Card className="card h-full border-0 !p-0 rounded-xl overflow-hidden">
                <CardContent className="p-0">
                    <div className="card-header border-b border-neutral-200 dark:border-neutral-600 bg-white dark:bg-neutral-700 py-4 px-6 flex items-center flex-wrap gap-3 justify-between">
                        <div className="flex items-center flex-wrap gap-3">
                            <span className="text-base font-medium text-secondary-light mb-0">Show</span>
                            <CustomSelect
                                placeholder="1"
                                options={["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"]}
                            />
                            <SearchBox />
                            <div className="">
                                <Button variant="outline">Wishlist</Button>
                            </div>
                        </div>
                        <Button asChild>
                            <Link href="/portfolio" className="btn text-primary dark:text-primary hover:underline px-0 py-2.5 inline-flex items-center gap-2">
                                Portfolios
                            </Link>
                        </Button>
                    </div>
                    <div className="card-body p-6">
                        <div className="w-full overflow-x-auto">
                            <Table className="table-auto border-spacing-0 border-separate">
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="bg-neutral-100 dark:bg-slate-700 border-t border-neutral-200 dark:border-slate-600 overflow-hidden px-4 h-12 border-s rounded-tl-lg">S.L</TableHead>
                                        <TableHead className="bg-neutral-100 dark:bg-slate-700 border-t border-neutral-200 dark:border-slate-600 overflow-hidden px-4 h-12">Asset</TableHead>
                                        <TableHead className="bg-neutral-100 dark:bg-slate-700 border-t border-neutral-200 dark:border-slate-600 overflow-hidden px-4 h-12">Circulating Supply</TableHead>
                                        <TableHead className="bg-neutral-100 dark:bg-slate-700 border-t border-neutral-200 dark:border-slate-600 overflow-hidden px-4 h-12">Price</TableHead>
                                        <TableHead className="bg-neutral-100 dark:bg-slate-700 border-t border-neutral-200 dark:border-slate-600 overflow-hidden px-4 h-12">Change %</TableHead>
                                        <TableHead className="bg-neutral-100 dark:bg-slate-700 border-t border-neutral-200 dark:border-slate-600 overflow-hidden px-4 h-12">Last (24H)</TableHead>
                                        <TableHead className="bg-neutral-100 dark:bg-slate-700 border-t border-neutral-200 dark:border-slate-600 overflow-hidden px-4 h-12 border-e rounded-tr-lg text-center">Watchlist</TableHead>
                                    </TableRow>
                                </TableHeader>

                                <TableBody>
                                    {cryptoData.map((item, index) => {
                                        const isUp = item.type === "up";
                                        const isLastRow = index === cryptoData.length - 1;

                                        return (
                                            <TableRow key={index}>
                                                {/* SL + Checkbox */}
                                                <TableCell className={`py-3 px-4 border-b border-neutral-200 dark:border-slate-600 first:border-s last:border-e ${isLastRow ? "rounded-bl-lg" : ""}`}>
                                                    <div className="flex items-center gap-3">
                                                        <Checkbox
                                                            className="border border-neutral-300 w-4.5 h-4.5"
                                                        />
                                                        {String(index + 1).padStart(2, "0")}
                                                    </div>
                                                </TableCell>

                                                {/* Asset */}
                                                <TableCell className={`py-3 px-4 border-b border-neutral-200 dark:border-slate-600 first:border-s last:border-e ${isLastRow ? "rounded-bl-lg" : ""}`}>
                                                    <Link href="/marketplace-details" className="flex items-center">
                                                        <Image
                                                            src={item.image}
                                                            alt={item.name}
                                                            width={40}
                                                            height={40}
                                                            className="rounded-full me-2"
                                                        />
                                                        <div className="flex flex-col">
                                                            <span className="text-base font-medium text-neutral-600 dark:text-neutral-200">
                                                                {item.name}
                                                            </span>
                                                            <span className="text-xs text-secondary-light">
                                                                {item.symbol}
                                                            </span>
                                                        </div>
                                                    </Link>
                                                </TableCell>

                                                {/* Amount */}
                                                <TableCell className={`py-3 px-4 border-b border-neutral-200 dark:border-slate-600 first:border-s last:border-e ${isLastRow ? "rounded-bl-lg" : ""}`}>
                                                    {item.amount}
                                                </TableCell>

                                                {/* Price */}
                                                <TableCell className={`py-3 px-4 border-b border-neutral-200 dark:border-slate-600 first:border-s last:border-e ${isLastRow ? "rounded-bl-lg" : ""}`}>
                                                    {item.price}
                                                </TableCell>

                                                {/* Change */}
                                                <TableCell className={`py-3 px-4 border-b border-neutral-200 dark:border-slate-600 first:border-s last:border-e ${isLastRow ? "rounded-bl-lg" : ""}`}>
                                                    <span
                                                        className={`px-4 py-1.5 rounded-full text-xs font-semibold flex items-center w-fit gap-1
                                                                    ${isUp
                                                                ? "bg-green-100 text-green-600 dark:bg-green-600/25 dark:text-green-400"
                                                                : "bg-red-100 text-red-600 dark:bg-red-600/25 dark:text-red-400"
                                                            }`}
                                                    >
                                                        {isUp ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                                        {item.change}
                                                    </span>
                                                </TableCell>

                                                {/* Last 24 hour */}
                                                <TableCell className={`py-3 px-4 border-b border-neutral-200 dark:border-slate-600 first:border-s last:border-e ${isLastRow ? "rounded-bl-lg" : ""}`}>
                                                    <div className="remove-tooltip-title rounded-tooltip-value remove-tooltip-marker">
                                                        <CardSmallChartTwo chartColor={item.chartBg} />
                                                    </div>
                                                </TableCell>

                                                {/* Allocation */}
                                                <TableCell className={`py-3 px-4 border-b border-neutral-200 dark:border-slate-600 first:border-s last:border-e ${isLastRow ? "rounded-bl-lg" : ""}`}>
                                                    <div className="flex justify-center">
                                                        <button type="button" className="text-neutral-600 hover:text-blue-600 cursor-pointer">
                                                            <Star size={20} />
                                                        </button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </div>

                        <div className="flex items-center justify-between flex-wrap gap-2 mt-6">
                            <span className="text-neutral-600">Showing 1 to 10 of 12 entries</span>
                            <ul className="pagination flex flex-wrap items-center gap-2 justify-center">
                                <li className="page-item">
                                    <a className="page-link bg-blue-50 dark:bg-blue-600/25 text-secondary-light font-medium rounded border-0 px-2.5 py-2.5 flex items-center justify-center h-8 w-8 text-base" href="javascript:void(0)">
                                        <ChevronsLeft />
                                    </a>
                                </li>
                                <li className="page-item">
                                    <a className="page-link text-secondary-light font-semibold rounded-lg border-0 flex items-center justify-center h-8 w-8 text-base bg-blue-600 text-white" href="javascript:void(0)">1</a>
                                </li>
                                <li className="page-item">
                                    <a className="page-link bg-blue-50 dark:bg-blue-600/25 text-secondary-light font-medium rounded border-0 px-2.5 py-2.5 flex items-center justify-center h-8 w-8" href="javascript:void(0)">2</a>
                                </li>
                                <li className="page-item">
                                    <a className="page-link bg-blue-50 dark:bg-blue-600/25 text-secondary-light font-medium rounded border-0 px-2.5 py-2.5 flex items-center justify-center h-8 w-8 text-base" href="javascript:void(0)">3</a>
                                </li>
                                <li className="page-item">
                                    <a className="page-link bg-blue-50 dark:bg-blue-600/25 text-secondary-light font-medium rounded border-0 px-2.5 py-2.5 flex items-center justify-center h-8 w-8 text-base" href="javascript:void(0)">4</a>
                                </li>
                                <li className="page-item">
                                    <a className="page-link bg-blue-50 dark:bg-blue-600/25 text-secondary-light font-medium rounded border-0 px-2.5 py-2.5 flex items-center justify-center h-8 w-8 text-base" href="javascript:void(0)">5</a>
                                </li>
                                <li className="page-item">
                                    <a className="page-link bg-blue-50 dark:bg-blue-600/25 text-secondary-light font-medium rounded border-0 px-2.5 py-2.5 flex items-center justify-center h-8 w-8 text-base" href="javascript:void(0)">
                                        <ChevronsRight />
                                    </a>
                                </li>
                            </ul>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </>
    );
};
export default MarketplaceCard;
