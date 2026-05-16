import CommonLink from "@/components/shared/common-link";
import { Card, CardContent } from "@/components/ui/card";

const PropertyListCard = () => {
    return (
        <Card className="card shadow-7 rounded-[12px] bg-white h-full overflow-hidden !p-0">
            <CardContent className="px-0">
                <div className="card-header border-b bg-white py-4 px-6 flex items-center justify-between">
                    <h6 className="text-lg font-semibold mb-0">Property List</h6>
                    <CommonLink />
                </div>
                <div className="card-body p-5">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                        <div className="col-span-12 2xl:col-span-3 sm:col-span-6">
                            <div className="bg-white rounded-lg overflow-hidden border border-neutral-200">
                                <figure className="relative mb-0">
                                    <img src="assets/images/home-nineteen/property-list-img1.png"
                                        alt="Property List Image One" className="w-full" />
                                    <span
                                        className="bg-red-600 text-white rounded inline-flex items-center gap-2 text-uppercase px-4 py-1.5 text-sm absolute top-0 start-0 mt-5 ms-5">
                                        <img src="assets/images/home-nineteen/icons/featured-icon.png"
                                            alt="Feature Icon" />
                                        Featured
                                    </span>
                                    <span
                                        className="bg-white text-static-black rounded inline-flex items-center gap-2 text-uppercase px-4 py-1.5 text-sm absolute bottom-0 start-0 mb-5 ms-5 font-semibold">
                                        $4,600
                                    </span>
                                </figure>
                                <div className="p-5">
                                    <h6 className="text-base mb-4">House on the Hollywood</h6>
                                    <span className="text-secondary-light text-sm">374 Johnson Ave</span>
                                    <div className="flex items-center justify-between gap-2 mt-4 flex-wrap">
                                        <div className="flex items-center gap-2">
                                            <span className="text-[#111827] flex">
                                                <img src="assets/images/home-nineteen/icons/amenities-icon1.png"
                                                    alt="Bed Icon" className="dark-img-white" />
                                            </span>
                                            <span className="text-[#111827] text-sm">6 Beds</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[#111827] flex">
                                                <img src="assets/images/home-nineteen/icons/amenities-icon2.png"
                                                    alt="Bed Icon" className="dark-img-white" />
                                            </span>
                                            <span className="text-[#111827] text-sm">2 Baths</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[#111827] flex">
                                                <img src="assets/images/home-nineteen/icons/amenities-icon3.png"
                                                    alt="Bed Icon" className="dark-img-white" />
                                            </span>
                                            <span className="text-[#111827] text-sm">200 sqft</span>
                                        </div>
                                    </div>
                                    <div className="my-4 border-b border-neutral-200 w-full"></div>
                                    <div className="flex items-center justify-between gap-4 sm:flex-nowrap flex-wrap">
                                        <span className="text-[#111827] text-sm">For Sale</span>
                                        <div className="flex items-center gap-6">
                                            <button type="button" className="cursor-pointer flex hover:scale-[1.6]">
                                                <img src="assets/images/home-nineteen/icons/link-icon1.png"
                                                    alt="Link Button" className="dark-img-white" />
                                            </button>
                                            <button type="button" className="cursor-pointer flex hover:scale-[1.6]">
                                                <img src="assets/images/home-nineteen/icons/link-icon2.png"
                                                    alt="Wishlist Button" className="dark-img-white" />
                                            </button>
                                            <button type="button" className="cursor-pointer flex hover:scale-[1.6]">
                                                <img src="assets/images/home-nineteen/icons/link-icon3.png"
                                                    alt="Export Button" className="dark-img-white" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="col-span-12 2xl:col-span-3 sm:col-span-6">
                            <div className="bg-white rounded-lg overflow-hidden border border-neutral-200">
                                <figure className="relative mb-0">
                                    <img src="assets/images/home-nineteen/property-list-img2.png"
                                        alt="Property List Image Two" className="w-full" />
                                    <span
                                        className="bg-red-600 text-white rounded inline-flex items-center gap-2 text-uppercase px-4 py-1.5 text-sm absolute top-0 start-0 mt-5 ms-5">
                                        <img src="assets/images/home-nineteen/icons/featured-icon.png"
                                            alt="Feature Icon" />
                                        Featured
                                    </span>
                                    <span
                                        className="bg-white text-static-black rounded inline-flex items-center gap-2 text-uppercase px-4 py-1.5 text-sm absolute bottom-0 start-0 mb-5 ms-5 font-semibold">
                                        $5,800
                                    </span>
                                </figure>
                                <div className="p-5">
                                    <h6 className="text-base mb-4">Comfortable Villa Green</h6>
                                    <span className="text-secondary-light text-sm">178 Broadway, Brooklyn</span>
                                    <div className="flex items-center justify-between gap-2 mt-4 flex-wrap">
                                        <div className="flex items-center gap-2">
                                            <span className="text-[#111827] flex">
                                                <img src="assets/images/home-nineteen/icons/amenities-icon1.png"
                                                    alt="Bed Icon" className="dark-img-white" />
                                            </span>
                                            <span className="text-[#111827] text-sm">6 Beds</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[#111827] flex">
                                                <img src="assets/images/home-nineteen/icons/amenities-icon2.png"
                                                    alt="Bed Icon" className="dark-img-white" />
                                            </span>
                                            <span className="text-[#111827] text-sm">3 Baths</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[#111827] flex">
                                                <img src="assets/images/home-nineteen/icons/amenities-icon3.png"
                                                    alt="Bed Icon" className="dark-img-white" />
                                            </span>
                                            <span className="text-[#111827] text-sm">600 sqft</span>
                                        </div>
                                    </div>
                                    <div className="my-4 border-b border-neutral-200 w-full"></div>
                                    <div className="flex items-center justify-between gap-4 sm:flex-nowrap flex-wrap">
                                        <span className="text-[#111827] text-sm">For Sale</span>
                                        <div className="flex items-center gap-6">
                                            <button type="button" className="cursor-pointer flex hover:scale-[1.6]">
                                                <img src="assets/images/home-nineteen/icons/link-icon1.png"
                                                    alt="Link Button" className="dark-img-white" />
                                            </button>
                                            <button type="button" className="cursor-pointer flex hover:scale-[1.6]">
                                                <img src="assets/images/home-nineteen/icons/link-icon2.png"
                                                    alt="Wishlist Button" className="dark-img-white" />
                                            </button>
                                            <button type="button" className="cursor-pointer flex hover:scale-[1.6]">
                                                <img src="assets/images/home-nineteen/icons/link-icon3.png"
                                                    alt="Export Button" className="dark-img-white" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="col-span-12 2xl:col-span-3 sm:col-span-6">
                            <div className="bg-white rounded-lg overflow-hidden border border-neutral-200">
                                <figure className="relative mb-0">
                                    <img src="assets/images/home-nineteen/property-list-img3.png"
                                        alt="Property List Image One" className="w-full" />
                                    <span
                                        className="bg-red-600 text-white rounded inline-flex items-center gap-2 text-uppercase px-4 py-1.5 text-sm absolute top-0 start-0 mt-5 ms-5">
                                        <img src="assets/images/home-nineteen/icons/featured-icon.png"
                                            alt="Feature Icon" />
                                        Featured
                                    </span>
                                    <span
                                        className="bg-white text-static-black rounded inline-flex items-center gap-2 text-uppercase px-4 py-1.5 text-sm absolute bottom-0 start-0 mb-5 ms-5 font-semibold">
                                        $4,500
                                    </span>
                                </figure>
                                <div className="p-5">
                                    <h6 className="text-base mb-4">Quality House For Sale</h6>
                                    <span className="text-secondary-light text-sm">873 Bedford Ave</span>
                                    <div className="flex items-center justify-between gap-2 mt-4 flex-wrap">
                                        <div className="flex items-center gap-2">
                                            <span className="text-[#111827] flex">
                                                <img src="assets/images/home-nineteen/icons/amenities-icon1.png"
                                                    alt="Bed Icon" className="dark-img-white" />
                                            </span>
                                            <span className="text-[#111827] text-sm">10 Beds</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[#111827] flex">
                                                <img src="assets/images/home-nineteen/icons/amenities-icon2.png"
                                                    alt="Bed Icon" className="dark-img-white" />
                                            </span>
                                            <span className="text-[#111827] text-sm">2 Baths</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[#111827] flex">
                                                <img src="assets/images/home-nineteen/icons/amenities-icon3.png"
                                                    alt="Bed Icon" className="dark-img-white" />
                                            </span>
                                            <span className="text-[#111827] text-sm">400 sqft</span>
                                        </div>
                                    </div>
                                    <div className="my-4 border-b border-neutral-200 w-full"></div>
                                    <div className="flex items-center justify-between gap-4 sm:flex-nowrap flex-wrap">
                                        <span className="text-[#111827] text-sm">For Sale</span>
                                        <div className="flex items-center gap-6">
                                            <button type="button" className="cursor-pointer flex hover:scale-[1.6]">
                                                <img src="assets/images/home-nineteen/icons/link-icon1.png"
                                                    alt="Link Button" className="dark-img-white" />
                                            </button>
                                            <button type="button" className="cursor-pointer flex hover:scale-[1.6]">
                                                <img src="assets/images/home-nineteen/icons/link-icon2.png"
                                                    alt="Wishlist Button" className="dark-img-white" />
                                            </button>
                                            <button type="button" className="cursor-pointer flex hover:scale-[1.6]">
                                                <img src="assets/images/home-nineteen/icons/link-icon3.png"
                                                    alt="Export Button" className="dark-img-white" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="col-span-12 2xl:col-span-3 sm:col-span-6">
                            <div className="bg-white rounded-lg overflow-hidden border border-neutral-200">
                                <figure className="relative mb-0">
                                    <img src="assets/images/home-nineteen/property-list-img4.png"
                                        alt="Property List Image One" className="w-full" />
                                    <span
                                        className="bg-red-600 text-white rounded inline-flex items-center gap-2 text-uppercase px-4 py-1.5 text-sm absolute top-0 start-0 mt-5 ms-5">
                                        <img src="assets/images/home-nineteen/icons/featured-icon.png"
                                            alt="Feature Icon" />
                                        Featured
                                    </span>
                                    <span
                                        className="bg-white text-static-black rounded inline-flex items-center gap-2 text-uppercase px-4 py-1.5 text-sm absolute bottom-0 start-0 mb-5 ms-5 font-semibold">
                                        $5,500
                                    </span>
                                </figure>
                                <div className="p-5">
                                    <h6 className="text-base mb-4">Diamond Family Home</h6>
                                    <span className="text-secondary-light text-sm">254 S 2nd St, Brooklyn</span>
                                    <div className="flex items-center justify-between gap-2 mt-4 flex-wrap">
                                        <div className="flex items-center gap-2">
                                            <span className="text-[#111827] flex">
                                                <img src="assets/images/home-nineteen/icons/amenities-icon1.png"
                                                    alt="Bed Icon" className="dark-img-white" />
                                            </span>
                                            <span className="text-[#111827] text-sm">4 Beds</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[#111827] flex">
                                                <img src="assets/images/home-nineteen/icons/amenities-icon2.png"
                                                    alt="Bed Icon" className="dark-img-white" />
                                            </span>
                                            <span className="text-[#111827] text-sm">2 Baths</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[#111827] flex">
                                                <img src="assets/images/home-nineteen/icons/amenities-icon3.png"
                                                    alt="Bed Icon" className="dark-img-white" />
                                            </span>
                                            <span className="text-[#111827] text-sm">300 sqft</span>
                                        </div>
                                    </div>
                                    <div className="my-4 border-b border-neutral-200 w-full"></div>
                                    <div className="flex items-center justify-between gap-4 sm:flex-nowrap flex-wrap">
                                        <span className="text-[#111827] text-sm">For Sale</span>
                                        <div className="flex items-center gap-6">
                                            <button type="button" className="cursor-pointer flex hover:scale-[1.6]">
                                                <img src="assets/images/home-nineteen/icons/link-icon1.png"
                                                    alt="Link Button" className="dark-img-white" />
                                            </button>
                                            <button type="button" className="cursor-pointer flex hover:scale-[1.6]">
                                                <img src="assets/images/home-nineteen/icons/link-icon2.png"
                                                    alt="Wishlist Button" className="dark-img-white" />
                                            </button>
                                            <button type="button" className="cursor-pointer flex hover:scale-[1.6]">
                                                <img src="assets/images/home-nineteen/icons/link-icon3.png"
                                                    alt="Export Button" className="dark-img-white" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

export default PropertyListCard;