import CommonLink from '@/components/shared/common-link';
import { Card, CardContent } from '@/components/ui/card';

const ResentRentPropertyCard = () => {
    return (
        <Card className="card h-full rounded-4 overflow-hidden border-0 !p-0">
            <CardContent className="px-0">

                <div className="border-b border-neutral-200 last:border-b-0 dark:border-slate-500 py-4 px-6 flex items-center justify-between flex-wrap gap-2">
                    <h6 className="font-semibold text-lg mb-0 text-foreground">Resent Rent Property</h6>
                    <CommonLink />
                </div>

                <div className="card-body p-0">
                    <div className="flex items-center justify-between gap-3 py-3 px-4 border-b border-neutral-200 last:border-b-0">
                        <div className="flex items-center gap-3">
                            <h6 className="font-medium mb-0 text-base">Property</h6>
                        </div>
                        <div className="flex items-center gap-2">
                            <h6 className="font-medium mb-0 text-base">Amount</h6>
                        </div>
                    </div>
                    <div className="flex items-center justify-between gap-3 py-3 px-4 border-b border-neutral-200 last:border-b-0">
                        <div className="flex items-center gap-3">
                            <div className="">
                                <img src="assets/images/home-nineteen/property-img1.png" alt="Property Image One"
                                    className="w-[40px] h-[40px] rounded-2" />
                            </div>
                            <div className="grow-[1]">
                                <h6 className="text-base mb-0 font-medium">Happy Lagoon Farm</h6>
                                <p className="text-[#111827] text-sm mb-0">09 Arnulfo Crossing, Botsford</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-secondary-light text-base font-medium">$5,000</span>
                        </div>
                    </div>
                    <div className="flex items-center justify-between gap-3 py-3 px-4 border-b border-neutral-200 last:border-b-0">
                        <div className="flex items-center gap-3">
                            <div className="">
                                <img src="assets/images/home-nineteen/property-img2.png" alt="Property Image Two"
                                    className="w-[40px] h-[40px] rounded-2" />
                            </div>
                            <div className="grow-[1]">
                                <h6 className="text-base mb-0 font-medium">Bright Forest Camp</h6>
                                <p className="text-[#111827] text-sm mb-0">4 Novella Block, Eichmannview</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-secondary-light text-base font-medium">$4,000</span>
                        </div>
                    </div>
                    <div className="flex items-center justify-between gap-3 py-3 px-4 border-b border-neutral-200 last:border-b-0">
                        <div className="flex items-center gap-3">
                            <div className="">
                                <img src="assets/images/home-nineteen/property-img3.png" alt="Property Image Three"
                                    className="w-[40px] h-[40px] rounded-2" />
                            </div>
                            <div className="grow-[1]">
                                <h6 className="text-base mb-0 font-medium">Tranquil Hut</h6>
                                <p className="text-[#111827] text-sm mb-0">0 / 77 Purdy Crescent, West</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-secondary-light text-base font-medium">$3,500</span>
                        </div>
                    </div>
                    <div className="flex items-center justify-between gap-3 py-3 px-4 border-b border-neutral-200 last:border-b-0">
                        <div className="flex items-center gap-3">
                            <div className="">
                                <img src="assets/images/home-nineteen/property-img4.png" alt="Property Image Four"
                                    className="w-[40px] h-[40px] rounded-2" />
                            </div>
                            <div className="grow-[1]">
                                <h6 className="text-base mb-0 font-medium">Vintage Offices</h6>
                                <p className="text-[#111827] text-sm mb-0">208 Olson Boulevard, Toyburgh</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-secondary-light text-base font-medium">$2,800</span>
                        </div>
                    </div>
                    <div className="flex items-center justify-between gap-3 py-3 px-4 border-b border-neutral-200 last:border-b-0">
                        <div className="flex items-center gap-3">
                            <div className="">
                                <img src="assets/images/home-nineteen/property-img5.png" alt="Property Image Five"
                                    className="w-[40px] h-[40px] rounded-2" />
                            </div>
                            <div className="grow-[1]">
                                <h6 className="text-base mb-0 font-medium">Relaxed Lodge</h6>
                                <p className="text-[#111827] text-sm mb-0">Suite 756 031 Ines Riverway,</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-secondary-light text-base font-medium">$1,750</span>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

export default ResentRentPropertyCard;