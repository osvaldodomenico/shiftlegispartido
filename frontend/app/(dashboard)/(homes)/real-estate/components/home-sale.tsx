import bgImage from "@/public/assets/images/home-nineteen/home-card-bg.png";
import homeImage from "@/public/assets/images/home-nineteen/home-png.png";

const HomeSale = () => {
    return (
        <div
            className="bg-img rounded-3 overflow-hidden flex items-end justify-between sm:flex-nowrap flex-wrap bg-cover bg-no-repeat bg-center w-full h-full"
            style={{ backgroundImage: `url(${bgImage.src})` }}
        >
            <div className="py-10 ps-9 pe-5">
                <h6 className="text-white mb-[28px] capitalize">
                    Enjoy your first home sale
                </h6>

                <a
                    href="#"
                    className="bg-[#ff9f29] hover:bg-[#fa8c06] text-white text-sm btn-sm px-6 py-3 rounded-[8px] inline-flex items-center gap-2"
                >
                    Explore Now
                </a>
            </div>

            <div className="pe-9">
                <img src={homeImage.src} alt="Home Image" />
            </div>
        </div>
    );
};

export default HomeSale;