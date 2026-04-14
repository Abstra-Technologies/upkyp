"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FaEdit, FaTrash, FaBullhorn, FaSearch, FaFilter } from "react-icons/fa";
import EditAnnoucementModal from "@/components/systemAdmin/editAnnoucement";
import SideNavAdmin from "@/components/navigation/sidebar-admin";
import Swal from "sweetalert2";

export default function AnnouncementsList() {
    const [announcements, setAnnouncements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const router = useRouter();
    const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
    const [formData, setFormData] = useState({ title: "", message: "", target_audience: "" });
    const [editModal, setEditModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterAudience, setFilterAudience] = useState("");

    useEffect(() => {
        const fetchAnnouncements = async () => {
            setLoading(true);
            setError(null);

            try {
                const res = await fetch("/api/systemadmin/annoucement/view", {
                    method: "GET",
                    credentials: "include",
                });

                if (res.status === 401) {
                    Swal.fire({
                      icon: "warning",
                      title: "Session Expired",
                      text: "Please log in again.",
                    }).then(() => {
                      router.push("/system_admin/login");
                    });
                    return;
                  }

                const data = await res.json();
                if (!res.ok) throw new Error(data.message || "Failed to fetch announcements");

                setAnnouncements(data.announcements || []);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchAnnouncements();
    }, []);

    const handleDelete = async (id) => {
        const result = await Swal.fire({
          title: "Are you sure?",
          text: "You won't be able to undo this action!",
          icon: "warning",
          showCancelButton: true,
          confirmButtonColor: "#d33",
          cancelButtonColor: "#3085d6",
          confirmButtonText: "Yes, delete it!",
        });
      
        if (!result.isConfirmed) return;
      
        try {
          const res = await fetch(`/api/systemadmin/announcement/${id}`, {
            method: "DELETE",
            credentials: "include",
          });
      
          const data = await res.json();
          if (!res.ok) throw new Error(data.message || "Failed to delete announcement");
      
          
          setAnnouncements((prev) => prev.filter((announcement) => announcement.id !== id));
      
          Swal.fire({
            icon: "success",
            title: "Deleted!",
            text: "Announcement deleted successfully!",
          });
        } catch (error) {
          Swal.fire({
            icon: "error",
            title: "Error",
            text: error.message,
          });
        }
      };

    const handleEdit = async (id) => {
        try {
            const res = await fetch(`/api/systemadmin/annoucement/details/${id}`);
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Failed to fetch announcement details");

            setSelectedAnnouncement(id);
            setFormData({
                title: data.announcement.title || "",
                message: data.announcement.message || "",
                target_audience: data.announcement.target_audience,
            });

            setEditModal(true);
        } catch (err) {
            Swal.fire({
                icon: "error",
                title: "Error",
                text: `Error: ${err.message}`,
              });
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleUpdateAnnouncement = async () => {
        try {
            const res = await fetch(`/api/systemadmin/annoucement/details/${selectedAnnouncement}`, {
                method: "PATCH",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title: formData.title,
                    message: formData.message,
                    target_audience: formData.target_audience,
                }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Failed to update announcement");

            // Update announcement in state
            setAnnouncements((prev) =>
                prev.map((announcement) =>
                    announcement.id === selectedAnnouncement
                        ? { ...announcement, ...formData }
                        : announcement
                )
            );

            Swal.fire({
                icon: "success",
                title: "Success!",
                text: "Announcement updated successfully!",
              });
            setEditModal(false);
        } catch (err) {
            Swal.fire({
                icon: "error",
                title: "Error",
                text: err.message,
              });
        }
    };

    // Filter and search functionality
    const filteredAnnouncements = announcements.filter(announcement => {
        const matchesSearch = 
            announcement.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
            announcement.message.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesFilter = filterAudience ? 
            announcement.target_audience === filterAudience : true;
        
        return matchesSearch && matchesFilter;
    });

    // Get unique audience types for filter dropdown
    const audienceTypes = [...new Set(announcements.map(a => a.target_audience))];

    if (loading) return (
        <div className="flex h-screen bg-gray-100">
            <SideNavAdmin/>
            <div className="flex-1 p-8">
                <div className="flex justify-center items-center h-full">
                    <div className="animate-pulse flex flex-col items-center">
                        <div className="h-12 w-12 rounded-full bg-blue-200 mb-4"></div>
                        <div className="h-4 bg-blue-200 rounded w-48 mb-4"></div>
                        <p className="text-gray-500">Loading announcements...</p>
                    </div>
                </div>
            </div>
        </div>
    );

    if (error) return (
        <div className="flex h-screen bg-gray-100">
            <SideNavAdmin />
            <div className="flex-1 p-8">
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
                    <strong className="font-bold">Error: </strong>
                    <span className="block sm:inline">{error}</span>
                </div>
            </div>
        </div>
    );

    return (
        <div className="flex h-screen bg-gray-100">
            <SideNavAdmin />
            <div className="flex-1 p-8 overflow-auto">
                <div className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center">
                            <FaBullhorn className="text-blue-600 mr-3 text-2xl" />
                            <h2 className="text-2xl font-semibold">Announcements</h2>
                        </div>
                        
                        <button 
                            onClick={() => router.push("/system_admin/annoucement")}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                        >
                            + New Announcement
                        </button>
                    </div>

                    <div className="mb-6 flex flex-col sm:flex-row gap-4">
                        <div className="relative flex-grow">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <FaSearch className="text-gray-400" />
                            </div>
                            <input
                                type="text"
                                placeholder="Search announcements..."
                                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        
                        <div className="relative sm:w-64">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <FaFilter className="text-gray-400" />
                            </div>
                            <select
                                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
                                value={filterAudience}
                                onChange={(e) => setFilterAudience(e.target.value)}
                            >
                                <option value="">All Audiences</option>
                                {audienceTypes.map(type => (
                                    <option key={type} value={type}>{type}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {filteredAnnouncements.length === 0 ? (
                        <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
                            <p className="text-gray-500">No announcements found</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto border border-gray-200 rounded-lg">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">#</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Message</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Audience</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Posted By</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {filteredAnnouncements.map((announcement, index) => (
                                        <tr key={announcement.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{index + 1}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{announcement.title}</td>
                                            <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">{announcement.message}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                                                    {announcement.target_audience}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{announcement.admin_name}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(announcement.created_at).toLocaleDateString()}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                <div className="flex space-x-2">
                                                    <button
                                                        className="text-yellow-600 hover:text-yellow-900 p-1"
                                                        onClick={() => handleEdit(announcement.id)}
                                                    >
                                                        <FaEdit />
                                                    </button>
                                                    <button
                                                        className="text-red-600 hover:text-red-900 p-1"
                                                        aria-label="Delete announcement"
                                                        onClick={() => handleDelete(announcement.id)}
                                                    >
                                                        <FaTrash />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
            
            {editModal && (
                <EditAnnoucementModal
                    formData={formData}
                    handleChange={handleChange}
                    handleUpdate={handleUpdateAnnouncement}
                    closeModal={() => setEditModal(false)}
                />
            )}
        </div>
    );
}