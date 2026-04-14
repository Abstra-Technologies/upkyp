'use client';
import SideNavAdmin from "../../../../components/navigation/sidebar-admin";
import CreateAnnouncement from "../../../../components/systemAdmin/CreateAnnouncement";
import { useRouter } from "next/navigation";

const AnnouncementPage = () => {
    const router = useRouter();
    
    const handleViewAnnouncements = () => {
        router.push("/pages/system_admin/annoucement/view");
    };
    
    return (
        <div className="min-h-screen bg-gray-50 flex">
            <SideNavAdmin />
            
            <div className="flex-1 p-6">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-semibold text-blue-600">Announcements</h1>
                    <button 
                        onClick={handleViewAnnouncements}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition flex items-center"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                            <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                        </svg>
                        View Announcements
                    </button>
                </div>
                
                <div className="bg-gray-100 p-4 mb-6 rounded-md border border-gray-200">
                    <p className="text-gray-700">
                        Create system-wide announcements to notify users. All announcements will be displayed according to their target audience settings.
                    </p>
                </div>
                
                <CreateAnnouncement />
            </div>
        </div>
    );
};

export default AnnouncementPage;