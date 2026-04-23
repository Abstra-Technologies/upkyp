"use client";

import { useState, useEffect } from "react";
import { X, Pencil } from "lucide-react";
import axios from "axios";
import Swal from "sweetalert2";

interface Folder {
    folder_id: number;
    name: string;
}

interface Props {
    folder: Folder | null;
    isOpen: boolean;
    onClose: () => void;
    onRenamed?: () => void;
}

export default function RenameFolderModal({
    folder,
    isOpen,
    onClose,
    onRenamed,
}: Props) {
    const [name, setName] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (folder?.name) {
            setName(folder.name);
        }
    }, [folder]);

    if (!isOpen || !folder) return null;

    const handleRename = async () => {
        if (!name.trim()) {
            Swal.fire("Folder name required", "", "warning");
            return;
        }

        if (name.trim() === folder.name) {
            onClose();
            return;
        }

        try {
            setLoading(true);

            await axios.patch(`/api/landlord/documents/folders/${folder.folder_id}`, {
                name: name.trim(),
            });

            Swal.fire("Renamed", "Folder renamed successfully", "success");
            onRenamed?.();
            onClose();
        } catch (err: any) {
            Swal.fire(
                "Error",
                err?.response?.data?.message || "Failed to rename folder",
                "error"
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-white w-full max-w-md rounded-xl shadow-lg border">
                <div className="flex items-center justify-between px-5 py-4 border-b">
                    <div className="flex items-center gap-2">
                        <Pencil className="w-5 h-5 text-blue-600" />
                        <h2 className="font-semibold text-gray-800">Rename Folder</h2>
                    </div>

                    <button onClick={onClose}>
                        <X className="w-5 h-5 text-gray-500 hover:text-gray-700" />
                    </button>
                </div>

                <div className="p-5 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Folder name
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Enter new folder name"
                            className="w-full rounded-lg border px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        />
                    </div>
                </div>

                <div className="flex justify-end gap-2 px-5 py-4 border-t">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm rounded-lg border text-gray-600 hover:bg-gray-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleRename}
                        disabled={loading}
                        className={`px-4 py-2 text-sm rounded-lg font-semibold transition ${
                            loading
                                ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                                : "bg-gradient-to-r from-blue-600 to-emerald-600 text-white hover:shadow-md"
                        }`}
                    >
                        {loading ? "Saving..." : "Save"}
                    </button>
                </div>
            </div>
        </div>
    );
}