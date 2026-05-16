import { Card, CardContent } from '@/components/ui/card';

const SocialSourceCard = () => {
    return (
        <Card className="card h-full rounded-4 overflow-hidden border-0 !p-0">
            <div className="border-b border-neutral-200 dark:border-slate-500 py-4 px-6 flex items-center justify-between flex-wrap gap-2">
                <h6 className="font-semibold text-lg mb-0 text-foreground">Social Source (Buyers)</h6>
            </div>
            <CardContent className="">
                <div className="card-body">
                    <div className="flex flex-col gap-[22px]">
                        <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                                <div
                                    className="w-[40px] h-[40px] rounded-[50%] flex justify-center items-center bg-purple-100 flex-shrink-0">
                                    <img src="assets/images/home-nine/socials1.png" alt="Image" className="" />
                                </div>
                                <div className="grow-[1]">
                                    <h6 className="text-base mb-0 font-semibold">Email</h6>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-secondary-light text-base font-medium">6,200</span>
                                <span className="text-green-500 text-base font-medium">0.3%</span>
                            </div>
                        </div>
                        <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                                <div
                                    className="w-[40px] h-[40px] rounded-[50%] flex justify-center items-center bg-yellow-100 flex-shrink-0">
                                    <img src="assets/images/home-nine/socials2.png" alt="Image" className="" />
                                </div>
                                <div className="grow-[1]">
                                    <h6 className="text-base mb-0 font-semibold">Clicked</h6>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-secondary-light text-base font-medium">Clicked</span>
                                <span className="text-red-600 text-base font-medium">1.3%</span>
                            </div>
                        </div>
                        <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                                <div
                                    className="w-[40px] h-[40px] rounded-[50%] flex justify-center items-center bg-cyan-100 flex-shrink-0">
                                    <img src="assets/images/home-nine/socials3.png" alt="Image" className="" />
                                </div>
                                <div className="grow-[1]">
                                    <h6 className="text-base mb-0 font-semibold">Subscribe</h6>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-secondary-light text-base font-medium">5,175</span>
                                <span className="text-green-500 text-base font-medium">0.3%</span>
                            </div>
                        </div>
                        <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                                <div
                                    className="w-[40px] h-[40px] rounded-[50%] flex justify-center items-center bg-green-100 flex-shrink-0">
                                    <img src="assets/images/home-nine/socials4.png" alt="Image" className="" />
                                </div>
                                <div className="grow-[1]">
                                    <h6 className="text-base mb-0 font-semibold">Complaints </h6>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-secondary-light text-base font-medium">3,780</span>
                                <span className="text-green-500 text-base font-medium">0.3%</span>
                            </div>
                        </div>
                        <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                                <div
                                    className="w-[40px] h-[40px] rounded-[50%] flex justify-center items-center bg-red-100 flex-shrink-0">
                                    <img src="assets/images/home-nine/socials5.png" alt="Image" className="" />
                                </div>
                                <div className="grow-[1]">
                                    <h6 className="text-base mb-0 font-semibold">Unsubscribe</h6>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-secondary-light text-base font-medium">4,120</span>
                                <span className="text-green-500 text-base font-medium">0.3%</span>
                            </div>
                        </div>
                        <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                                <div
                                    className="w-[40px] h-[40px] rounded-[50%] flex justify-center items-center bg-cyan-100 flex-shrink-0">
                                    <img src="assets/images/home-nine/socials3.png" alt="Image" className="" />
                                </div>
                                <div className="grow-[1]">
                                    <h6 className="text-base mb-0 font-semibold">Subscribe</h6>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-secondary-light text-base font-medium">5,175</span>
                                <span className="text-green-500 text-base font-medium">0.3%</span>
                            </div>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

export default SocialSourceCard;