
const StatisticsCards = () => {
    return (
        <div className="shadow-7 p-4 rounded-xl bg-white dark:bg-[#273142]">
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
                <div className="col-span-12 xs:col-span-6 sm:col-span-6">
                    <div className="py-5 px-6 rounded-lg relative z-1 h-full bg-[#A8C9F4]">
                        <img src="assets/images/home-twelve/icons/booking-card-big-icon1.png" alt="Big Icon"
                            className="absolute end-0 bottom-0 me-2 z-n1" />
                        <span className="w-11 h-11 rounded-lg bg-white flex justify-center items-center">
                            <img src="assets/images/home-twelve/icons/booking-card-icon1.png" alt="Icon" />
                        </span>
                        <span className="block mt-3 text-neutral-800">New Booking</span>
                        <h6 className="mt-1 mb-0 dark:text-black">170</h6>
                    </div>
                </div>
                <div className="col-span-12 xs:col-span-6 sm:col-span-6">
                    <div className="py-5 px-6 rounded-lg relative z-1 h-full bg-[#A4E7BC]">
                        <img src="assets/images/home-twelve/icons/booking-card-big-icon2.png" alt="Big Icon"
                            className="absolute end-0 bottom-0 me-1 z-n1" />
                        <span className="w-11 h-11 rounded-lg bg-white flex justify-center items-center">
                            <img src="assets/images/home-twelve/icons/booking-card-icon2.png" alt="Icon" />
                        </span>
                        <span className="block mt-3 text-neutral-800">Schedule Room</span>
                        <h6 className="mt-1 mb-0 dark:text-black">285</h6>
                    </div>
                </div>
                <div className="col-span-12 xs:col-span-6 sm:col-span-6">
                    <div className="py-5 px-6 rounded-lg relative z-1 h-full bg-[#FFBAAA]">
                        <img src="assets/images/home-twelve/icons/booking-card-big-icon3.png" alt="Big Icon"
                            className="absolute end-0 bottom-0 me-0.5 z-n1" />
                        <span className="w-11 h-11 rounded-lg bg-white flex justify-center items-center">
                            <img src="assets/images/home-twelve/icons/booking-card-icon3.png" alt="Icon" />
                        </span>
                        <span className="block mt-3 text-neutral-800">Total Customers</span>
                        <h6 className="mt-1 mb-0 dark:text-black">175</h6>
                    </div>
                </div>
                <div className="col-span-12 xs:col-span-6 sm:col-span-6">
                    <div className="py-5 px-6 rounded-lg relative z-1 h-full bg-[#FFDD96]">
                        <img src="assets/images/home-twelve/icons/booking-card-big-icon4.png" alt="Big Icon"
                            className="absolute end-0 bottom-0 me-0.5 z-n1" />
                        <span className="w-11 h-11 rounded-lg bg-white flex justify-center items-center">
                            <img src="assets/images/home-twelve/icons/booking-card-icon4.png" alt="Icon" />
                        </span>
                        <span className="block mt-3 text-neutral-800">Total Revenue</span>
                        <h6 className="mt-1 mb-0 dark:text-black">$750.00</h6>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StatisticsCards;