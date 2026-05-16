import { Card, CardContent } from "@/components/ui/card";
import StatCards from "./stat-cards";
import UpgradeNowCard from "./upgrade-now-card";

const UpgradePlanCard = () => {
    return (
        <Card className="card h-full rounded-lg border-0 !p-0">
            <CardContent className="card-body p-6">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">

                    <div className="col-span-12 md:col-span-4">
                        <UpgradeNowCard />
                    </div>

                    <div className="col-span-12 md:col-span-8">
                        <StatCards />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

export default UpgradePlanCard;