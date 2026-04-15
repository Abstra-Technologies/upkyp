"use client";

import { useDropzone } from "react-dropzone";
import useEditPropertyStore from "@/zustand/property/useEditPropertyStore";
import axios from "axios";
import Swal from "sweetalert2";
import { Camera, X, AlertCircle } from "lucide-react";
import { filterValidFiles } from "@/utils/file/fileValidation";

export default function PhotosSection() {
    const { photos, setPhotos, propertyId } = useEditPropertyStore();

    /* =========================
       DROP HANDLER
    ========================= */
    const onDrop = (acceptedFiles: File[]) => {
        const { valid, invalid } = filterValidFiles(acceptedFiles, 20);

        if (invalid.length > 0) {
            Swal.fire({
                icon: "error",
                title: "File too large",
                text: `${invalid.length} file(s) exceed 20MB limit`,
            });
        }

        const newFiles = valid.map((file) => ({
            file,
            preview: URL.createObjectURL(file),
            isNew: true,
        }));

        setPhotos((prev) => [...prev, ...newFiles]);
    };

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { "image/*": [] },
        multiple: true,
    });

    /* =========================
       REMOVE PHOTO
    ========================= */
    const removePhoto = async (photo: any) => {
        try {
            // 🔥 STORED PHOTO (API DELETE)
            if (!photo.isNew && photo.photo_id) {

                if (!propertyId) {
                    await Swal.fire("Error", "Missing property ID", "error");
                    return;
                }

                await axios.delete("/api/propertyListing/deletPropertyPhotos", {
                    data: {
                        photo_id: photo.photo_id,
                        property_id: propertyId,
                    },
                });

                setPhotos((prev) =>
                    prev.filter((p) => p.photo_id !== photo.photo_id)
                );

                return;
            }

            // 🔥 NEW PHOTO (LOCAL REMOVE)
            setPhotos((prev) =>
                prev.filter((p) => p.preview !== photo.preview)
            );

        } catch (err) {
            console.error(err);
            Swal.fire("Error", "Failed to delete photo", "error");
        }
    };

    /* =========================
       UI
    ========================= */
    return (
        <div className="space-y-3">

            {/* UPLOAD */}
            <div>
                <label className="text-sm font-semibold">Property Photos</label>

                <div
                    {...getRootProps()}
                    className={`
            mt-2
            border border-dashed
            rounded-lg
            px-4 py-5
            text-center
            cursor-pointer
            transition-all
            ${
                        isDragActive
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-300 bg-gray-100 hover:bg-gray-200"
                    }
          `}
                >
                    <input {...getInputProps()} />

                    <div className="flex flex-col items-center gap-1.5">
                        <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                            <Camera className="text-white w-5 h-5" />
                        </div>

                        <p className="text-sm font-medium">
                            {isDragActive ? "Drop images" : "Upload photos"}
                        </p>

                        <p className="text-[11px] text-gray-500">
                            Max 20MB per image
                        </p>
                    </div>
                </div>
            </div>

            {/* GRID */}
            {photos.length > 0 ? (
                <div>

                    {/* HEADER */}
                    <div className="flex justify-between items-center mb-1">
                        <p className="text-xs font-semibold">
                            {photos.length} photo{photos.length !== 1 && "s"}
                        </p>

                        {photos.length < 3 && (
                            <p className="text-[10px] text-amber-600 flex items-center gap-1">
                                <AlertCircle className="w-3 h-3" />
                                Min 3 photos
                            </p>
                        )}
                    </div>

                    {/* GRID */}
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5">
                        {photos.map((photo, index) => (
                            <div
                                key={photo.photo_id ?? photo.preview}
                                className="
                  relative
                  group
                  aspect-square
                  rounded-md
                  overflow-hidden
                  border
                "
                            >
                                {/* IMAGE */}
                                <img
                                    src={photo.preview}
                                    onError={(e) => (e.currentTarget.style.display = "none")}
                                    className="w-full h-full object-cover"
                                />

                                {/* DELETE BUTTON */}
                                <button
                                    onClick={() => removePhoto(photo)}
                                    className="
                    absolute top-1 right-1
                    bg-red-500 text-white
                    p-1
                    rounded-md
                    opacity-100 sm:opacity-0 sm:group-hover:opacity-100
                  "
                                >
                                    <X className="w-3 h-3" />
                                </button>

                                {/* INDEX */}
                                <div className="absolute bottom-1 left-1 text-[9px] bg-black/60 text-white px-1.5 rounded">
                                    {index + 1}
                                </div>

                                {/* NEW BADGE */}
                                {photo.isNew && (
                                    <div className="absolute top-1 left-1 text-[9px] bg-green-500 text-white px-1.5 rounded">
                                        New
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <p className="text-xs text-gray-400 text-center">
                    No photos uploaded yet
                </p>
            )}
        </div>
    );
}