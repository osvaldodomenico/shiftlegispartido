import CommonLink from "@/components/shared/common-link";
import { Card, CardContent } from "@/components/ui/card";

const ResentSalePropertyCard = () => {
    return (
        <Card className="card h-full rounded-4 overflow-hidden border-0 !p-0">
            <CardContent className="px-0">

                <div className="border-b border-neutral-200 dark:border-slate-500 py-4 px-6 flex items-center justify-between flex-wrap gap-2">
                    <h6 className="font-semibold text-lg mb-0 text-foreground">Recent Sale Property</h6>
                    <CommonLink />
                </div>

                <div className="card-body p-0">
                    <div className="flex items-center justify-between gap-3 py-[10.5px] px-4 border-b border-neutral-200">
                        <div className="flex items-center gap-3">
                            <h6 className="font-medium mb-0 text-base">Property</h6>
                        </div>
                        <div className="flex items-center gap-2">
                            <h6 className="font-medium mb-0 text-base">Amount</h6>
                        </div>
                    </div>

                    <div className="flex items-center justify-between gap-3 py-[10.5px] px-4 border-b border-neutral-200 last:border-b-0">
                        <div className="flex items-center gap-3">
                            <img src="assets/images/home-nineteen/property-img6.png" alt="Property Image One" className="w-[40px] h-[40px] rounded-2" />
                            <div className="grow">
                                <h6 className="text-base mb-0 font-medium">Happy Lagoon Farm</h6>
                                <p className="text-[#111827] text-sm mb-0">09 Arnulfo Crossing, Botsford</p>
                            </div>
                        </div>
                        <div className="flex items-end flex-col">
                            <span className="text-secondary-light text-base font-medium">$5,000</span>
                            <span className="text-green-500 text-base font-medium">+ 12.50%</span>
                        </div>
                    </div>

                    <div className="flex items-center justify-between gap-3 py-[10.5px] px-4 border-b border-neutral-200 last:border-b-0">
                        <div className="flex items-center gap-3">
                            <img src="assets/images/home-nineteen/property-img7.png" alt="Property Image Two" className="w-[40px] h-[40px] rounded-2" />
                            <div className="grow">
                                <h6 className="text-base mb-0 font-medium">Bright Forest Camp</h6>
                                <p className="text-[#111827] text-sm mb-0">4 Novella Block, Eichmannview</p>
                            </div>
                        </div>
                        <div className="flex items-end flex-col">
                            <span className="text-secondary-light text-base font-medium">$15,000</span>
                            <span className="text-danger-600 text-base font-medium">- 5.50%</span>
                        </div>
                    </div>

                    <div className="flex items-center justify-between gap-3 py-[10.5px] px-4 border-b border-neutral-200 last:border-b-0">
                        <div className="flex items-center gap-3">
                            <img src="assets/images/home-nineteen/property-img8.png" alt="Property Image Three" className="w-[40px] h-[40px] rounded-2" />
                            <div className="grow">
                                <h6 className="text-base mb-0 font-medium">Tranquil Hut</h6>
                                <p className="text-[#111827] text-sm mb-0">0 / 77 Purdy Crescent, West</p>
                            </div>
                        </div>
                        <div className="flex items-end flex-col">
                            <span className="text-secondary-light text-base font-medium">$37,000</span>
                            <span className="text-green-500 text-base font-medium">+ 15.50%</span>
                        </div>
                    </div>

                    <div className="flex items-center justify-between gap-3 py-[10.5px] px-4 border-b border-neutral-200 last:border-b-0">
                        <div className="flex items-center gap-3">
                            <img src="assets/images/home-nineteen/property-img9.png" alt="Property Image Four" className="w-[40px] h-[40px] rounded-2" />
                            <div className="grow">
                                <h6 className="text-base mb-0 font-medium">Vintage Offices</h6>
                                <p className="text-[#111827] text-sm mb-0">208 Olson Boulevard, Toyburgh</p>
                            </div>
                        </div>
                        <div className="flex items-end flex-col">
                            <span className="text-secondary-light text-base font-medium">$27,000</span>
                            <span className="text-green-500 text-base font-medium">+ 17.50%</span>
                        </div>
                    </div>

                    <div className="flex items-center justify-between gap-3 py-[10.5px] px-4 border-b border-neutral-200 last:border-b-0">
                        <div className="flex items-center gap-3">
                            <img src="assets/images/home-nineteen/property-img10.png" alt="Property Image Five" className="w-[40px] h-[40px] rounded-2" />
                            <div className="grow">
                                <h6 className="text-base mb-0 font-medium">Relaxed Lodge</h6>
                                <p className="text-[#111827] text-sm mb-0">Suite 756 031 Ines Riverway,</p>
                            </div>
                        </div>
                        <div className="flex items-end flex-col">
                            <span className="text-secondary-light text-base font-medium">$17,000</span>
                            <span className="text-green-500 text-base font-medium">+ 25.50%</span>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

export default ResentSalePropertyCard;