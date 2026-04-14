"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { Upload, Trash2, Loader2, Image as ImageIcon, ArrowLeft } from "lucide-react";
import Swal from "sweetalert2";
import { useRouter } from "next/navigation";

export default function CMSHeadersPage() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState("landlord");
    const [images, setImages] = useState<any[]>([]);
    const [uploading, setUploading] = useState(false);
    const [loading, setLoading] = useState(false);
    const [file, setFile] = useState<File | null>(null);

    const folderMap: Record<string, string> = {
        landlord: "upkyp/headers/landlord",
        tenant: "upkyp/headers/tenant",
        public: "upkyp/headers/public",
    };

    // Fetch images
    useEffect(() => {
        fetchImages();
    }, [activeTab]);

    const fetchImages = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`/api/systemadmin/cms/imagesList?folder=${folderMap[activeTab]}`);
            setImages(response.data.resources || []);
        } catch (error: any) {
            console.error("Error fetching images:", error);
            Swal.fire("Error", "Failed to load images from Cloudinary.", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selected = e.target.files?.[0];
        if (selected) setFile(selected);
    };

    const handleUpload = async () => {
        if (!file) return Swal.fire("No File", "Please select an image to upload.", "info");

        const reader = new FileReader();
        reader.onloadend = async () => {
            try {
                setUploading(true);
                const base64 = reader.result;

                await axios.post("/api/systemadmin/cms/uploads", {
                    image: base64,
                    folder: folderMap[activeTab],
                });

                Swal.fire("Uploaded!", "Header image uploaded successfully.", "success");
                setFile(null);
                fetchImages();
            } catch (err) {
                Swal.fire("Error", "Failed to upload image.", "error");
            } finally {
                setUploading(false);
            }
        };
        reader.readAsDataURL(file);
    };

    const handleDelete = async (public_id: string) => {
        const confirm = await Swal.fire({
            title: "Delete Image?",
            text: "This will permanently delete the header image.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#d33",
            cancelButtonColor: "#3085d6",
            confirmButtonText: "Delete",
        });

        if (!confirm.isConfirmed) return;

        try {
            await axios.delete("/api/cloudinary/deleteImage", { data: { public_id } });
            Swal.fire("Deleted!", "Image removed successfully.", "success");
            fetchImages();
        } catch {
            Swal.fire("Error", "Failed to delete image.", "error");
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
            {/* Back Button */}
            <button
                onClick={() => router.back()}
                className="mb-6 flex items-center text-gray-600 hover:text-gray-900 transition-all"
            >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to CMS
            </button>

            {/* Header */}
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-800">Header & Hero Sections</h1>
                <p className="text-gray-500 mt-1">
                    Manage portal and marketing banners stored in Cloudinary.
                </p>
            </div>

            {/* Tabs */}
            <div className="flex flex-wrap gap-2 mb-6">
                {[
                    { id: "landlord", label: "Landlord Portal" },
                    { id: "tenant", label: "Tenant Portal" },
                    { id: "public", label: "Public / Marketing" },
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-4 py-2 rounded-lg font-medium transition-all ${
                            activeTab === tab.id
                                ? "bg-gradient-to-r from-blue-600 to-emerald-600 text-white shadow-md"
                                : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Upload Section */}
            <div className="p-4 bg-white border border-gray-100 rounded-xl shadow-sm mb-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h2 className="font-semibold text-gray-800">Upload New Header</h2>
                        <p className="text-gray-500 text-sm">
                            Upload banners for the selected section.
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            className="text-sm text-gray-600"
                        />
                        <button
                            onClick={handleUpload}
                            disabled={uploading}
                            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-emerald-600 text-white px-4 py-2 rounded-lg font-medium hover:shadow-md transition-all disabled:opacity-50"
                        >
                            {uploading ? (
                                <>
                                    <Loader2 className="animate-spin w-4 h-4" /> Uploading...
                                </>
                            ) : (
                                <>
                                    <Upload className="w-4 h-4" /> Upload
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Image Gallery */}
            <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
                <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <ImageIcon className="w-5 h-5 text-blue-600" />
                    {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Header Images
                </h2>

                {loading ? (
                    <div className="flex items-center justify-center py-10 text-gray-500">
                        <Loader2 className="animate-spin w-5 h-5 mr-2" />
                        Loading images...
                    </div>
                ) : images.length === 0 ? (
                    <p className="text-gray-500 text-center py-10">
                        No images found for this section.
                    </p>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {images.map((img) => (
                            <div
                                key={img.public_id}
                                className="relative group border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all"
                            >
                                <img
                                    src={img.secure_url}
                                    alt={img.public_id}
                                    className="object-cover w-full h-48 sm:h-56"
                                />
                                <button
                                    onClick={() => handleDelete(img.public_id)}
                                    className="absolute top-2 right-2 p-2 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all"
                                    title="Delete Image"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Page_footer */}
            <div className="text-center text-sm text-gray-500 mt-10">
                © {new Date().getFullYear()} UPKYP CMS · Cloudinary Headers Manager
            </div>
        </div>
    );
}
