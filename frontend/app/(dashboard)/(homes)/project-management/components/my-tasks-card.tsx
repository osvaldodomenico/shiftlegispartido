import CustomSelect from "@/components/shared/custom-select";
import MyTaskTable from "@/components/table/my-task-table";
import { Card, CardContent } from '@/components/ui/card';

const MyTasksCard = () => {
    return (
        <Card className="card p-6 border-0 rounded-xl shadow-none">
            <CardContent className="p-0">
                <div className="pb-4 flex items-center justify-between flex-wrap gap-2">
                    <h6 className="font-semibold text-lg mb-0 text-foreground">My Tasks</h6>
                    <CustomSelect
                        placeholder="Yearly"
                        options={["All Tasks", "Pending", "Completed", "In Progress", "Canceled"]}
                    />
                </div>
                <div className="p-0">
                    <div className="table-responsive scroll-sm">
                        <MyTaskTable />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

export default MyTasksCard;