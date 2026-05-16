import CustomSelect from '@/components/shared/custom-select';
import { Card, CardContent } from '@/components/ui/card';
import ReferralChartImage from '@/public/assets/images/home-seventeen/referral-chart.png';
import Image from 'next/image';

const ReferralSourcesCard = () => {
    return (
        <Card className="card !p-0 border-0 rounded-xl shadow-none">
            <CardContent className="p-0">
                <div className="border-b border-neutral-200 dark:border-slate-500 py-4 px-6 flex items-center justify-between flex-wrap gap-2">
                    <h6 className="font-semibold text-lg mb-0 text-foreground">Referral Sources</h6>
                    <CustomSelect
                        placeholder="Yearly"
                        options={["Yearly", "Monthly", "Weekly", "Today"]}
                    />
                </div>
                <div className="card-body p-6">
                    <Image src={ReferralChartImage} alt="Image" className='w-full' />
                </div>
            </CardContent>
        </Card>
    );
};

export default ReferralSourcesCard;