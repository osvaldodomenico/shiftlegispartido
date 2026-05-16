"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import crypto1 from "@/public/assets/images/crypto/crypto-img1.png";
import crypto2 from "@/public/assets/images/crypto/crypto-img2.png";
import crypto5 from "@/public/assets/images/crypto/crypto-img5.png";
import crypto6 from "@/public/assets/images/crypto/crypto-img6.png";
import { ArrowDownUp, Check } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

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

const MarketplaceDetailsSidebar = () => {
  return (
    <Card className="h-full border-0 py-0">
      <CardContent className="p-0">
        <Dialog>
          <div className="px-6 py-5">
            <div>
              <Tabs defaultValue="DefaultHome" className="gap-0">
                <div className="">
                  <TabsList className='bg-neutral-100 border border-neutral-200 dark:bg-transparent rounded-md h-[50px] w-full p-0'>
                    <TabsTrigger value="DefaultHome" className='py-3.5 px-2 font-medium text-base inline-flex items-center gap-3 text-blue-600 dark:text-white dark:hover:text-blue-500 data-[state=active]:bg-blue-600 data-[state=active]:text-white dark:data-[state=active]:bg-blue-600 dark:data-[state=active]:text-white rounded-md shadow-none cursor-pointer'>
                      Buy
                    </TabsTrigger>
                    <TabsTrigger value="DefaultDetails" className='py-3.5 px-2 font-medium text-base inline-flex items-center gap-3 text-blue-600 dark:text-white dark:hover:text-blue-500 data-[state=active]:bg-blue-600 data-[state=active]:text-white dark:data-[state=active]:bg-blue-600 dark:data-[state=active]:text-white rounded-md shadow-none cursor-pointer'>
                      Sale
                    </TabsTrigger>
                    <TabsTrigger value="DefaultProfile" className='py-3.5 px-2 font-medium text-base inline-flex items-center gap-3 text-blue-600 dark:text-white dark:hover:text-blue-500 data-[state=active]:bg-blue-600 data-[state=active]:text-white dark:data-[state=active]:bg-blue-600 dark:data-[state=active]:text-white rounded-md shadow-none cursor-pointer'>
                      Convert
                    </TabsTrigger>
                  </TabsList>
                </div>

                <div className="pt-6 pb-6 border-b mb-6">
                  <TabsContent value="DefaultHome" className="p-0">
                    <div className="">
                      <div className="text-center mt-6">
                        <h3 className="text-neutral-400 mb-6">$0</h3>
                        <span className="text-neutral-500 text-sm">You can buy up to $25,000</span>
                      </div>
                      <div className="mt-6 border rounded-[8px] relative">
                        <button type="button"
                          className="bg-blue-600 w-[40px] h-[40px] rounded-[50%] border border-3 border-primary-100 flex justify-center items-center text-white absolute top-[50%] translate-y-[-50%] end-0 me-[60px]">
                          <ArrowDownUp size={20} />
                        </button>
                        <div className="p-4 flex items-center border-b">
                          <span
                            className="text-neutral-500 font-medium w-[76px] border-e">Buy</span>
                          <div className="flex items-center justify-between grow ps-4">
                            <div className="flex items-center gap-2">
                              <img src="assets/images/crypto/crypto-img1.png" alt="Image"
                                className="w-[24px] h-[24px] rounded-[50%] flex-shrink-0 overflow-hidden" />
                              <div className="grow flex flex-col">
                                <span
                                  className="text-sm mb-0 font-medium text-primary-light block">ITC</span>
                              </div>
                            </div>
                            <a href=""
                              className="text-base text-neutral-500 hover:text-primary-600"><i
                                className="ri-arrow-right-s-line"></i></a>
                          </div>
                        </div>
                        <div className="p-4 flex items-center">
                          <span className="text-neutral-500 font-medium w-[76px] border-e">Pay
                            with</span>
                          <div className="flex items-center justify-between grow ps-4">
                            <div className="flex items-center gap-2">
                              <img src="assets/images/crypto/paypal.png" alt="Image"
                                className="w-[24px] h-[24px] rounded-[50%] flex-shrink-0 overflow-hidden" />
                              <div className="grow flex flex-col">
                                <span
                                  className="text-sm mb-0 font-medium text-primary-light block">Paypal</span>
                              </div>
                            </div>
                            <a href=""
                              className="text-base text-neutral-500 hover:text-primary-600"><i
                                className="ri-arrow-right-s-line"></i></a>
                          </div>
                        </div>
                      </div>
                      <DialogTrigger asChild>
                        <Button className={cn('py-6 w-full mt-6')}>Buy</Button>
                      </DialogTrigger>
                    </div>
                  </TabsContent>
                  <TabsContent value="DefaultDetails" className="p-0">
                    <div className="">
                      <div className="text-center mt-6">
                        <h3 className="text-neutral-400 mb-6">$256</h3>
                        <span className="text-neutral-500 text-sm">You can buy up to $25,000</span>
                      </div>
                      <div className="mt-6 border rounded-[8px] relative">
                        <button type="button"
                          className="bg-blue-600 w-[40px] h-[40px] rounded-[50%] border border-3 border-primary-100 flex justify-center items-center text-white absolute top-[50%] translate-y-[-50%] end-0 me-[60px]">
                          <ArrowDownUp size={20} />
                        </button>
                        <div className="p-4 flex items-center border-b">
                          <span
                            className="text-neutral-500 font-medium w-[76px] border-e">Buy</span>
                          <div className="flex items-center justify-between grow ps-4">
                            <div className="flex items-center gap-2">
                              <img src="assets/images/crypto/crypto-img1.png" alt="Image"
                                className="w-[24px] h-[24px] rounded-[50%] flex-shrink-0 overflow-hidden" />
                              <div className="grow flex flex-col">
                                <span
                                  className="text-sm mb-0 font-medium text-primary-light block">ITC</span>
                              </div>
                            </div>
                            <a href=""
                              className="text-base text-neutral-500 hover:text-primary-600"><i
                                className="ri-arrow-right-s-line"></i></a>
                          </div>
                        </div>
                        <div className="p-4 flex items-center">
                          <span className="text-neutral-500 font-medium w-[76px] border-e">Pay
                            with</span>
                          <div className="flex items-center justify-between grow ps-4">
                            <div className="flex items-center gap-2">
                              <img src="assets/images/crypto/paypal.png" alt="Image"
                                className="w-[24px] h-[24px] rounded-[50%] flex-shrink-0 overflow-hidden" />
                              <div className="grow flex flex-col">
                                <span
                                  className="text-sm mb-0 font-medium text-primary-light block">Paypal</span>
                              </div>
                            </div>
                            <a href=""
                              className="text-base text-neutral-500 hover:text-primary-600"><i
                                className="ri-arrow-right-s-line"></i></a>
                          </div>
                        </div>
                      </div>
                      <DialogTrigger asChild>
                        <Button className={cn('py-6 w-full mt-6')}>Buy</Button>
                      </DialogTrigger>
                    </div>
                  </TabsContent>
                  <TabsContent value="DefaultProfile" className="p-0">
                    <div className="">
                      <div className="text-center mt-6">
                        <h3 className="text-neutral-400 mb-6">$2,545</h3>
                        <span className="text-neutral-500 text-sm">You can buy up to $25,000</span>
                      </div>
                      <div className="mt-6 border rounded-[8px] relative">
                        <button type="button"
                          className="bg-blue-600 w-[40px] h-[40px] rounded-[50%] border border-3 border-primary-100 flex justify-center items-center text-white absolute top-[50%] translate-y-[-50%] end-0 me-[60px]">
                          <ArrowDownUp size={20} />
                        </button>
                        <div className="p-4 flex items-center border-b">
                          <span
                            className="text-neutral-500 font-medium w-[76px] border-e">Buy</span>
                          <div className="flex items-center justify-between grow ps-4">
                            <div className="flex items-center gap-2">
                              <img src="assets/images/crypto/crypto-img1.png" alt="Image"
                                className="w-[24px] h-[24px] rounded-[50%] flex-shrink-0 overflow-hidden" />
                              <div className="grow flex flex-col">
                                <span
                                  className="text-sm mb-0 font-medium text-primary-light block">ITC</span>
                              </div>
                            </div>
                            <a href=""
                              className="text-base text-neutral-500 hover:text-primary-600"><i
                                className="ri-arrow-right-s-line"></i></a>
                          </div>
                        </div>
                        <div className="p-4 flex items-center">
                          <span className="text-neutral-500 font-medium w-[76px] border-e">Pay
                            with</span>
                          <div className="flex items-center justify-between grow ps-4">
                            <div className="flex items-center gap-2">
                              <img src="assets/images/crypto/paypal.png" alt="Image"
                                className="w-[24px] h-[24px] rounded-[50%] flex-shrink-0 overflow-hidden" />
                              <div className="grow flex flex-col">
                                <span
                                  className="text-sm mb-0 font-medium text-primary-light block">Paypal</span>
                              </div>
                            </div>
                            <a href=""
                              className="text-base text-neutral-500 hover:text-primary-600"><i
                                className="ri-arrow-right-s-line"></i></a>
                          </div>
                        </div>
                      </div>
                      <DialogTrigger asChild>
                        <Button className={cn('py-6 w-full mt-6')}>Buy</Button>
                      </DialogTrigger>
                    </div>
                  </TabsContent>
                </div>
              </Tabs>
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
                className={`flex items-center justify-between flex-wrap gap-2 py-4 ${index !== watchlist.length - 1
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

          <DialogContent className="sm:max-w-sm max-w-[510px]! px-4 py-14">
            <div className="rounded-2xl bg-white">
              <div className="">
                <div className="text-center">
                  <span
                    className="w-[100px] h-[100px] bg-green-500 rounded-[50%] inline-flex justify-center items-center text-[2rem] mb-8 text-white">
                    <Check size={36} />
                  </span>
                   <DialogTitle className="mb-2 text-2xl">Your purchase was successful!</DialogTitle>
                  <p className="text-neutral-500 mb-0"> <span className="text-blue-600">16.2665 ITC</span> will be
                    available in your portfolio on 10-10-2022</p>
                    <Button asChild className="mt-8 py-4 h-12 px-6">
                      <Link href="/dashboard">Back to Dashboard</Link>
                    </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default MarketplaceDetailsSidebar;
