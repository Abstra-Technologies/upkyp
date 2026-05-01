
import BugReportForm from "@/components/Commons/bugreport";
import useAuthStore from "@/zustand/authStore";


export default function BugReports() {
    const { user, admin, loading } = useAuthStore();
    return (
        <div>
            <BugReportForm user_id={user?.user_id} />
        </div>
    );
}
