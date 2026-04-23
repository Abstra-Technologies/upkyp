"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import useSWR from "swr";
import axios from "axios";
import {
    FolderPlus,
    Folder,
    AlertCircle,
    Grid3X3,
    List,
    MoreVertical,
    Pencil,
    Trash2,
    Upload,
    ChevronRight,
    Search,
    Download,
    Eye,
    ArrowLeft,
    FileText,
    Image as ImageIcon,
    Move,
    Archive,
} from "lucide-react";

import useSubscription from "@/hooks/landlord/useSubscription";
import useAuthStore from "@/zustand/authStore";
import CreateFolderModal from "@/components/landlord/documents/CreateFolderModal";
import RenameFolderModal from "@/components/landlord/documents/RenameFolderModal";
import Swal from "sweetalert2";

const fetcher = (url: string) => axios.get(url).then((res) => res.data);

interface Folder {
    folder_id: number;
    name: string;
    file_count: number;
    total_size: number;
    reference_type?: string;
    reference_id?: string;
    created_at: string;
    updated_at: string;
}

interface FileItem {
    document_id: string;
    file_name: string;
    file_mime_type: string;
    file_size: number;
    file_url: string;
    folder_id: number | null;
    document_type: string;
    reference_type: string;
    reference_id: string;
    uploaded_by: string;
    created_at: string;
    updated_at: string;
}

type ViewMode = "grid" | "list";

export default function DocumentsPage() {
    const { id } = useParams();
    const reference_id = id as string | undefined;
    const reference_type = "property";

    const [viewMode, setViewMode] = useState<ViewMode>("grid");
    const [showCreateFolder, setShowCreateFolder] = useState(false);
    const [showRenameFolder, setShowRenameFolder] = useState(false);
    const [selectedFolder, setSelectedFolder] = useState<Folder | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [menuOpenFolder, setMenuOpenFolder] = useState<number | null>(null);
    const [folders, setFolders] = useState<Folder[]>([]);
    const [files, setFiles] = useState<FileItem[]>([]);
    const [selectedFolderId, setSelectedFolderId] = useState<number | null>(null);
    const [loadingData, setLoadingData] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [dragOverFolderId, setDragOverFolderId] = useState<number | null>(null);
    const [selectedFileId, setSelectedFileId] = useState<string | null>(null);

    const { user } = useAuthStore();
    const landlordId = user?.landlord_id;

    const { subscription, loadingSubscription } = useSubscription(landlordId);
    const maxGB = subscription?.limits?.maxStorage ?? 0;

    const { data: storageData, isLoading: loadingStorage } = useSWR(
        `/api/landlord/storage/usage`,
        fetcher
    );

    const usedStorageBytes = storageData?.total_bytes ?? 0;
    const usedGB = usedStorageBytes / (1024 * 1024 * 1024);
    const usagePercent = maxGB > 0 ? Math.min((usedGB / maxGB) * 100, 100) : 0;
    const storageLimitReached = maxGB > 0 && usedGB >= maxGB;

    useEffect(() => {
        if (selectedFolderId) {
            fetchFilesInFolder(selectedFolderId);
        } else {
            fetchFolders();
            fetchFiles();
        }
    }, [reference_type, reference_id, selectedFolderId]);

    const fetchFolders = async () => {
        try {
            const params = new URLSearchParams();
            if (reference_type && reference_id) {
                params.append("reference_type", reference_type);
                params.append("reference_id", reference_id);
            }
            const res = await axios.get(
                `/api/landlord/documents/folders${params.toString() ? `?${params.toString()}` : ""}`
            );
            setFolders(res.data.folders || []);
        } catch (error) {
            console.error("Error fetching folders:", error);
            setFolders([]);
        } finally {
            setLoadingData(false);
        }
    };

    const fetchFiles = async () => {
        try {
            const params = new URLSearchParams();
            if (reference_type && reference_id) {
                params.append("reference_type", reference_type);
                params.append("reference_id", reference_id);
            }
            const res = await axios.get(
                `/api/landlord/documents${params.toString() ? `?${params.toString()}` : ""}`
            );
            setFiles(res.data.documents || []);
        } catch (error) {
            console.error("Error fetching files:", error);
            setFiles([]);
        } finally {
            setLoadingData(false);
        }
    };

    const fetchFilesInFolder = async (folderId: number) => {
        try {
            const params = new URLSearchParams();
            params.append("folder_id", folderId.toString());
            if (reference_type && reference_id) {
                params.append("reference_type", reference_type);
                params.append("reference_id", reference_id);
            }
            const res = await axios.get(
                `/api/landlord/documents?${params.toString()}`
            );
            setFiles(res.data.documents || []);
        } catch (error) {
            console.error("Error fetching folder files:", error);
            setFiles([]);
        } finally {
            setLoadingData(false);
        }
    };

    const enterFolder = (folderId: number) => {
        setLoadingData(true);
        setSelectedFolderId(folderId);
        fetchFilesInFolder(folderId);
    };

    const handleDeleteFolder = async (folder: Folder) => {
        const result = await Swal.fire({
            title: "Delete Folder",
            html: `Are you sure you want to delete "<strong>${folder.name}</strong>"?<br/>All files in this folder will also be deleted.`,
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Delete",
            cancelButtonText: "Cancel",
            confirmButtonColor: "#dc2626",
        });

        if (!result.isConfirmed) return;

        try {
            setLoadingData(true);
            await axios.delete(`/api/landlord/documents/folders/${folder.folder_id}`);
            Swal.fire("Deleted", "Folder deleted successfully", "success");
            fetchFolders();
            fetchFiles();
        } catch (error: any) {
            Swal.fire(
                "Error",
                error?.response?.data?.message || "Failed to delete folder",
                "error"
            );
        } finally {
            setLoadingData(false);
        }
    };

    const handleRenameFolder = (folder: Folder) => {
        setSelectedFolder(folder);
        setShowRenameFolder(true);
        setMenuOpenFolder(null);
    };

    const handleRenameSuccess = () => {
        fetchFolders();
        setShowRenameFolder(false);
        setSelectedFolder(null);
    };

    const handleMoveFileToFolder = async (documentId: string, folderId: number | null) => {
        try {
            await axios.patch(`/api/landlord/documents/${documentId}`, {
                folder_id: folderId,
            });
            fetchFiles();
            fetchFolders();
            setSelectedFileId(null);
        } catch (error: any) {
            Swal.fire(
                "Error",
                error?.response?.data?.message || "Failed to move file",
                "error"
            );
        }
    };

    const handleDragStart = (e: React.DragEvent, file: FileItem) => {
        e.dataTransfer.setData("text/plain", file.document_id);
        setSelectedFileId(file.document_id);
    };

    const handleDragOver = (e: React.DragEvent, folderId: number) => {
        e.preventDefault();
        setDragOverFolderId(folderId);
    };

    const handleDragLeave = () => {
        setDragOverFolderId(null);
    };

    const handleRootDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        const documentId = e.dataTransfer.getData("text/plain");
        if (documentId) {
            await handleMoveFileToFolder(documentId, null);
        }
    };

    const handleDrop = async (e: React.DragEvent, folderId: number | null) => {
        e.preventDefault();
        setDragOverFolderId(null);
        const documentId = e.dataTransfer.getData("text/plain");
        if (documentId) {
            await handleMoveFileToFolder(documentId, folderId);
        }
    };

    const handleUploadFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (storageLimitReached) {
            Swal.fire("Storage limit reached", "Upgrade your plan to upload more files", "warning");
            return;
        }

        const file = e.target.files?.[0];
        if (!file) return;

        try {
            setUploading(true);
            const formData = new FormData();
            formData.append("file", file);
            if (reference_type && reference_id) {
                formData.append("reference_type", reference_type);
                formData.append("reference_id", reference_id);
            }
            if (selectedFolderId) {
                formData.append("folder_id", selectedFolderId.toString());
            }

            await axios.post("/api/landlord/documents/upload", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });

            Swal.fire("Uploaded", "File uploaded successfully", "success");
            fetchFiles();
        } catch (error: any) {
            Swal.fire(
                "Error",
                error?.response?.data?.message || "Failed to upload file",
                "error"
            );
        } finally {
            setUploading(false);
            e.target.value = "";
        }
    };

    const formatFileSize = (bytes: number) => {
        if (!bytes || bytes === 0) return "0 B";
        const k = 1024;
        const sizes = ["B", "KB", "MB", "GB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
    };

    const formatDate = (dateStr: string) => {
        if (!dateStr) return "";
        const date = new Date(dateStr);
        return date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
        });
    };

    const getFileIcon = (fileType: string) => {
        if (!fileType) return <FileText className="w-6 h-6 text-gray-400" />;
        const imageTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
        if (imageTypes.includes(fileType)) return <ImageIcon className="w-6 h-6 text-blue-500" />;
        if (fileType.includes("pdf")) return <FileText className="w-6 h-6 text-red-500" />;
        if (fileType.includes("word") || fileType.includes("document")) return <FileText className="w-6 h-6 text-blue-600" />;
        if (fileType.includes("sheet") || fileType.includes("excel")) return <FileText className="w-6 h-6 text-green-600" />;
        return <FileText className="w-6 h-6 text-gray-400" />;
    };

    const isImage = (mimeType: string) => {
        if (!mimeType) return false;
        return ["image/jpeg", "image/png", "image/gif", "image/webp"].includes(mimeType);
    };

    const filteredFolders = folders.filter((f) =>
        f.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredFiles = files.filter((f) =>
        f.file_name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loadingSubscription || loadingStorage) {
        return (
            <div className="pb-24 md:pb-6">
                <div className="w-full px-4 md:px-6 pt-20 md:pt-6">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex-1 space-y-2">
                            <div className="h-6 bg-gray-200 rounded w-40 animate-pulse" />
                            <div className="h-4 bg-gray-100 rounded w-64 animate-pulse" />
                        </div>
                        <div className="h-10 w-32 bg-gray-200 rounded-lg animate-pulse" />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="bg-white border rounded-xl p-5 animate-pulse">
                                <div className="w-12 h-12 bg-gray-200 rounded-lg mb-4" />
                                <div className="h-5 bg-gray-200 rounded w-3/4 mb-2" />
                                <div className="h-3 bg-gray-100 rounded w-1/2" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div 
            className="pb-24 md:pb-6"
            onDragOver={(e) => {
                e.preventDefault();
                setDragOverFolderId(-1);
            }}
            onDragLeave={() => setDragOverFolderId(null)}
            onDrop={handleRootDrop}
        >
            <div className={`w-full px-4 md:px-6 pt-20 md:pt-6 ${dragOverFolderId === -1 ? "bg-blue-50" : ""}`}>
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <div className="flex-1">
                        {selectedFolderId ? (
                            <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                                <button
                                    onClick={() => {
                                        setLoadingData(true);
                                        setSelectedFolderId(null);
                                        fetchFiles();
                                    }}
                                    className="hover:text-blue-600 hover:underline flex items-center gap-1"
                                >
                                    <ArrowLeft className="w-4 h-4" />
                                    Documents
                                </button>
                                <ChevronRight className="w-4 h-4" />
                                <span className="font-medium text-gray-900">
                                    {folders.find(f => f.folder_id === selectedFolderId)?.name}
                                </span>
                            </div>
                        ) : reference_id ? (
                            <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                                <Link
                                    href={`/landlord/properties/${reference_id}`}
                                    className="hover:text-blue-600 hover:underline"
                                >
                                    Property
                                </Link>
                                <ChevronRight className="w-4 h-4" />
                                <span className="font-medium text-gray-900">Documents</span>
                            </div>
                        ) : null}
                        <h1 className="text-xl md:text-2xl font-bold text-gray-900">
                            {selectedFolderId 
                                ? folders.find(f => f.folder_id === selectedFolderId)?.name
                                : reference_id ? "Property Documents" : "All Documents"}
                        </h1>
                        <p className="text-sm text-gray-600 mt-1">
                            {selectedFolderId
                                ? `${files.length} files in this folder`
                                : reference_id 
                                ? "Organize and manage your property documents" 
                                : "Organize and manage all your documents"}
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <label
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold cursor-pointer transition ${
                                storageLimitReached
                                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                    : "bg-gradient-to-r from-blue-600 to-emerald-600 text-white hover:shadow-md"
                            }`}
                        >
                            <Upload className="w-4 h-4" />
                            {uploading ? "Uploading..." : "Upload File"}
                            <input
                                type="file"
                                className="hidden"
                                onChange={handleUploadFile}
                                disabled={storageLimitReached || uploading}
                            />
                        </label>
                        <button
                            disabled={storageLimitReached}
                            onClick={() => setShowCreateFolder(true)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition ${
                                storageLimitReached
                                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                            }`}
                        >
                            <FolderPlus className="w-4 h-4" />
                            New Folder
                        </button>
                    </div>
                </div>

                {/* Storage Usage */}
                {!loadingSubscription && (
                    <div className="mb-6 p-4 rounded-lg border bg-gradient-to-r from-blue-50 to-emerald-50">
                        <div className="flex items-center justify-between text-sm mb-1">
                            <span className="text-gray-700 font-medium">Storage Usage</span>
                            <span className="font-semibold text-blue-700">
                                {usedGB.toFixed(2)} / {maxGB === 0 ? "Unlimited" : `${maxGB} GB`}
                            </span>
                        </div>

                        {maxGB > 0 && (
                            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 transition-all"
                                    style={{ width: `${usagePercent}%` }}
                                />
                            </div>
                        )}

                        {storageLimitReached && (
                            <div className="flex items-center gap-2 mt-3 text-xs text-red-600">
                                <AlertCircle className="w-4 h-4" />
                                Storage limit reached. Upgrade your plan to upload more files.
                            </div>
                        )}
                    </div>
                )}

                {/* Toolbar */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search files and folders..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 rounded-lg border text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="flex items-center bg-gray-100 rounded-lg p-1">
                            <button
                                onClick={() => setViewMode("grid")}
                                className={`p-2 rounded ${
                                    viewMode === "grid"
                                        ? "bg-white shadow text-blue-600"
                                        : "text-gray-600 hover:text-gray-900"
                                }`}
                            >
                                <Grid3X3 className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => setViewMode("list")}
                                className={`p-2 rounded ${
                                    viewMode === "list"
                                        ? "bg-white shadow text-blue-600"
                                        : "text-gray-600 hover:text-gray-900"
                                }`}
                            >
                                <List className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Empty State */}
                {((!selectedFolderId && filteredFolders.length === 0) || (selectedFolderId && filteredFiles.length === 0)) && !loadingData && (
                    <div className="flex flex-col items-center justify-center text-center py-16 bg-white border rounded-xl">
                        <Folder className="w-14 h-14 text-gray-300 mb-4" />
                        <h2 className="text-lg font-semibold text-gray-800 mb-1">
                            {selectedFolderId ? "Empty folder" : "No files yet"}
                        </h2>
                        <p className="text-sm text-gray-600 max-w-sm mb-5">
                            Upload files or create folders to organize your documents
                        </p>
                        <div className="flex gap-2">
                            <label
                                className={`px-5 py-2.5 rounded-lg font-semibold cursor-pointer transition ${
                                    storageLimitReached
                                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                        : "bg-gradient-to-r from-blue-600 to-emerald-600 text-white hover:shadow-md"
                                }`}
                            >
                                Upload File
                                <input
                                    type="file"
                                    className="hidden"
                                    onChange={handleUploadFile}
                                    disabled={storageLimitReached}
                                />
                            </label>
                            <button
                                disabled={storageLimitReached}
                                onClick={() => setShowCreateFolder(true)}
                                className={`px-5 py-2.5 rounded-lg font-semibold transition ${
                                    storageLimitReached
                                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                }`}
                            >
                                Create Folder
                            </button>
                        </div>
                    </div>
                )}

                {/* Grid View Folders - only show when not inside a folder */}
                {!selectedFolderId && viewMode === "grid" && filteredFolders.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 mb-6">
                        {filteredFolders.map((folder) => (
                            <div
                                key={folder.folder_id}
                                className={`relative group bg-white border rounded-xl p-4 hover:shadow-md transition cursor-pointer ${
                                    dragOverFolderId === folder.folder_id
                                        ? "border-blue-500 ring-2 ring-blue-200"
                                        : ""
                                }`}
                                onClick={() => enterFolder(folder.folder_id)}
                                onDragOver={(e) => handleDragOver(e, folder.folder_id)}
                                onDragLeave={handleDragLeave}
                                onDrop={(e) => handleDrop(e, folder.folder_id)}
                            >
                                <div className="absolute top-2 right-2">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setMenuOpenFolder(
                                                menuOpenFolder === folder.folder_id
                                                    ? null
                                                    : folder.folder_id
                                            );
                                        }}
                                        className="p-1.5 rounded hover:bg-gray-100 opacity-0 group-hover:opacity-100 transition"
                                    >
                                        <MoreVertical className="w-4 h-4 text-gray-500" />
                                    </button>

                                    {menuOpenFolder === folder.folder_id && (
                                        <div className="absolute right-0 top-8 w-36 bg-white border rounded-lg shadow-lg py-1 z-10">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleRenameFolder(folder);
                                                }}
                                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                            >
                                                <Pencil className="w-4 h-4" />
                                                Rename
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDeleteFolder(folder);
                                                }}
                                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                                Delete
                                            </button>
                                        </div>
                                    )}
                                </div>

                                <div className="w-full h-24 rounded-lg bg-gradient-to-br from-blue-600 to-emerald-600 flex items-center justify-center mb-3">
                                    <Folder className="w-10 h-10 text-white" />
                                </div>

                                <h3 className="font-semibold text-gray-900 truncate text-sm">
                                    {folder.name}
                                </h3>

                                <p className="text-xs text-gray-600 mt-1">
                                    {folder.file_count} files • {formatFileSize(folder.total_size)}
                                </p>

                                {dragOverFolderId === folder.folder_id && (
                                    <div className="absolute inset-0 bg-blue-50 bg-opacity-50 rounded-xl flex items-center justify-center pointer-events-none">
                                        <Move className="w-8 h-8 text-blue-500" />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {/* Grid View Files */}
                {viewMode === "grid" && filteredFiles.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                        {filteredFiles.map((file) => (
                            <div
                                key={file.document_id}
                                className={`group bg-white border rounded-xl overflow-hidden hover:shadow-md transition ${
                                    selectedFileId === file.document_id ? "ring-2 ring-blue-500" : ""
                                }`}
                                draggable
                                onDragStart={(e) => handleDragStart(e, file)}
                            >
                                <div className="w-full h-28 bg-gray-100 flex items-center justify-center mb-3 overflow-hidden">
                                    {isImage(file.file_mime_type) ? (
                                        <img
                                            src={file.file_url}
                                            alt={file.file_name}
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).style.display = "none";
                                                (e.target as HTMLImageElement).nextElementSibling?.classList.remove("hidden");
                                            }}
                                        />
                                    ) : null}
                                    <div className={isImage(file.file_mime_type) ? "hidden" : "flex items-center justify-center w-full h-full"}>
                                        {getFileIcon(file.file_mime_type)}
                                    </div>
                                </div>

                                <div className="px-3 pb-3">
                                    <h3 className="font-medium text-gray-900 truncate text-sm">
                                        {file.file_name}
                                    </h3>

                                    <p className="text-xs text-gray-600 mt-1">
                                        {formatFileSize(file.file_size)} • {formatDate(file.created_at)}
                                    </p>

                                    <div className="flex items-center gap-1 mt-2 opacity-0 group-hover:opacity-100 transition">
                                        <a
                                            href={file.file_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="p-1.5 rounded hover:bg-gray-100"
                                            title="View"
                                        >
                                            <Eye className="w-4 h-4 text-gray-500" />
                                        </a>
                                        <a
                                            href={file.file_url}
                                            download={file.file_name}
                                            className="p-1.5 rounded hover:bg-gray-100"
                                            title="Download"
                                        >
                                            <Download className="w-4 h-4 text-gray-500" />
                                        </a>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* List View - only show folders when not inside a folder */}
                {!selectedFolderId && viewMode === "list" && (
                    <div className="bg-white border rounded-xl overflow-hidden">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b">
                                <tr>
                                    <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">
                                        Name
                                    </th>
                                    <th className="text-left px-4 py-3 text-sm font-medium text-gray-600 hidden md:table-cell">
                                        Size
                                    </th>
                                    <th className="text-left px-4 py-3 text-sm font-medium text-gray-600 hidden md:table-cell">
                                        Modified
                                    </th>
                                    <th className="text-right px-4 py-3 text-sm font-medium text-gray-600">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredFolders.map((folder) => (
                                    <tr
                                        key={folder.folder_id}
                                        className={`border-b hover:bg-gray-50 cursor-pointer ${
                                            dragOverFolderId === folder.folder_id
                                                ? "bg-blue-50"
                                                : ""
                                        }`}
                                        onClick={() => enterFolder(folder.folder_id)}
                                        onDragOver={(e) => {
                                            e.preventDefault();
                                            setDragOverFolderId(folder.folder_id);
                                        }}
                                        onDragLeave={() => setDragOverFolderId(null)}
                                        onDrop={(e) => handleDrop(e, folder.folder_id)}
                                    >
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-emerald-600 flex items-center justify-center">
                                                    <Folder className="w-4 h-4 text-white" />
                                                </div>
                                                <span className="font-medium text-gray-900">
                                                    {folder.name}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-600 hidden md:table-cell">
                                            {formatFileSize(folder.total_size)}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-600 hidden md:table-cell">
                                            {formatDate(folder.updated_at)}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleRenameFolder(folder);
                                                    }}
                                                    className="p-1.5 rounded hover:bg-gray-100"
                                                    title="Rename"
                                                >
                                                    <Pencil className="w-4 h-4 text-gray-500" />
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDeleteFolder(folder);
                                                    }}
                                                    className="p-1.5 rounded hover:bg-gray-100"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="w-4 h-4 text-red-500" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}

                                {filteredFiles.map((file) => (
                                    <tr 
                                        key={file.document_id} 
                                        className={`border-b hover:bg-gray-50 ${
                                            selectedFileId === file.document_id ? "bg-blue-50" : ""
                                        }`}
                                        draggable
                                        onDragStart={(e) => handleDragStart(e, file)}
                                    >
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden">
                                                    {isImage(file.file_mime_type) ? (
                                                        <img
                                                            src={file.file_url}
                                                            alt={file.file_name}
                                                            className="w-full h-full object-cover"
                                                            onError={(e) => {
                                                                (e.target as HTMLImageElement).style.display = "none";
                                                                (e.target as HTMLImageElement).nextElementSibling?.classList.remove("hidden");
                                                            }}
                                                        />
                                                    ) : null}
                                                    <div className={isImage(file.file_mime_type) ? "hidden" : "flex items-center justify-center w-full h-full"}>
                                                        {getFileIcon(file.file_mime_type)}
                                                    </div>
                                                </div>
                                                <div>
                                                    <span className="font-medium text-gray-900 block">
                                                        {file.file_name}
                                                    </span>
                                                    <span className="text-xs text-gray-500">
                                                        {file.document_type}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-600 hidden md:table-cell">
                                            {formatFileSize(file.file_size)}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-600 hidden md:table-cell">
                                            {formatDate(file.updated_at)}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <a
                                                    href={file.file_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="p-1.5 rounded hover:bg-gray-100"
                                                    title="View"
                                                >
                                                    <Eye className="w-4 h-4 text-gray-500" />
                                                </a>
                                                <a
                                                    href={file.file_url}
                                                    download={file.file_name}
                                                    className="p-1.5 rounded hover:bg-gray-100"
                                                    title="Download"
                                                >
                                                    <Download className="w-4 h-4 text-gray-500" />
                                                </a>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <CreateFolderModal
                reference_type={reference_type}
                reference_id={reference_id}
                isOpen={showCreateFolder}
                onClose={() => setShowCreateFolder(false)}
                onCreated={() => {
                    fetchFolders();
                }}
                disabled={storageLimitReached}
            />

            <RenameFolderModal
                folder={selectedFolder}
                isOpen={showRenameFolder}
                onClose={() => {
                    setShowRenameFolder(false);
                    setSelectedFolder(null);
                }}
                onRenamed={handleRenameSuccess}
            />
        </div>
    );
}