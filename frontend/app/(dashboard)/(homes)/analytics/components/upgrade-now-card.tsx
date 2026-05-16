import TrailBgImage from "@/public/assets/images/home-nine/trail-bg.png";
import { StaticImageData } from "next/image";
import Link from "next/link";

interface BackgroundImageData {
    TrailBgImage: StaticImageData;
}


const UpgradeNowCard = () => {
    return (
        <div className="trail-bg h-full text-center flex flex-col justify-between items-center p-4 rounded-lg bg-cover bg-no-repeat bg-center"
            style={{ backgroundImage: `url(${TrailBgImage.src})` }}
        >
            <h6 className="text-white text-xl mb-4">Upgrade Your Plan</h6>
            <div className="">
                <p className="text-white mb-6">Your free trial expired in 7 days</p>
                <Link
                    href="#"
                    className="w-full py-2 px-6 rounded-[50rem] bg-gradient-to-r from-[#CBFFF9] to-[#FFEEB1] text-sm justify-center dark:text-neutral-900 transform transition-transform duration-300 hover:scale-105 inline-flex items-center justify-center"
                >
                    Upgrade Now
                </Link>

            </div>
        </div>
    );
};

export default UpgradeNowCard;