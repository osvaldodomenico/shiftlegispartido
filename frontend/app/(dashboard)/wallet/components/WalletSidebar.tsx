"use client";

import { Card, CardContent } from "@/components/ui/card";
import Image from "next/image";

import crypto1 from "@/public/assets/images/crypto/crypto-img1.png";
import crypto2 from "@/public/assets/images/crypto/crypto-img2.png";
import crypto5 from "@/public/assets/images/crypto/crypto-img5.png";
import crypto6 from "@/public/assets/images/crypto/crypto-img6.png";
import { ArrowLeftRight, Download, Plus, Upload } from "lucide-react";

const watchlist = [
  {
    name: "Bitcoin",
    symbol: "BTC",
    image: crypto1,
    price: "$1,236.21",
    amount: "1.4363 BTC",
  },
  {
    name: "Ethereum",
    symbol: "ETH",
    image: crypto2,
    price: "$1,236.21",
    amount: "1.4363 ETH",
  },
  {
    name: "Dogecoin",
    symbol: "DOGE",
    image: crypto5,
    price: "$1,658",
    amount: "1.4363 DOGE",
  },
  {
    name: "Digibyte",
    symbol: "DGB",
    image: crypto6,
    price: "$165.8",
    amount: "1.4363 DGB",
  },
];

const WalletSidebar = () => {
  return (
    <Card className="h-full border-0 py-0">
      <CardContent className="p-0">
        <div className="px-6 py-5">
          {/* Header */}
          <span className="mb-2 block">WowDash</span>
          <h5 className="text-2xl">$40,570.85</h5>

          {/* Actions */}
          <div className="mt-6 pb-6 mb-6 border-b border-neutral-200 dark:border-neutral-600 flex items-center gap-4 justify-between flex-wrap">
            {[
              { label: "Buy", icon: <Plus /> },
              { label: "Swap", icon: <ArrowLeftRight /> },
              { label: "Send", icon: <Upload /> },
              { label: "Receive", icon: <Download /> },
            ].map((item, i) => (
              <div key={i} className="text-center flex flex-col items-center">
                <span className="w-[60px] h-[60px] bg-blue-50 dark:bg-blue-600/25 text-blue-600 dark:text-blue-400 text-2xl flex justify-center items-center rounded-full">
                  {item.icon}
                </span>
                <span className="text-neutral-600 dark:text-neutral-200 font-medium mt-6">
                  {item.label}
                </span>
              </div>
            ))}
          </div>

          {/* Watchlist Header */}
          <div className="flex items-center justify-between gap-2 pb-6 border-b border-neutral-200 dark:border-neutral-600">
            <h6 className="text-lg mb-0">Watchlist</h6>
            <a href="#" className="text-blue-600 font-medium text-base">
              Sell all
            </a>
          </div>

          {/* Watchlist Items */}
          {watchlist.map((item, index) => (
            <div
              key={index}
              className={`flex items-center justify-between flex-wrap gap-2 py-4 ${
                index !== watchlist.length - 1
                  ? "border-b border-neutral-200 dark:border-neutral-600"
                  : ""
              }`}
            >
              <div className="flex items-center">
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
              </div>

              <div className="flex flex-col text-right">
                <span className="text-base font-medium text-neutral-600 dark:text-neutral-200">
                  {item.price}
                </span>
                <span className="text-xs text-secondary-light">
                  {item.amount}
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default WalletSidebar;