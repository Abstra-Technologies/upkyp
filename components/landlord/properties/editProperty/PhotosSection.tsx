"use client";

import { useDropzone } from "react-dropzone";
import useEditPropertyStore from "@/zustand/property/useEditPropertyStore";
import axios from "axios";
import { Camera, X, AlertCircle } from "lucide-react";

export default function PhotosSection() {
    const { photos, setPhotos } = useEditPropertyStore();

    const onDrop = (acceptedFiles) => {
        const newFiles = acceptedFiles.map((file) => ({
            file,
            preview: URL.createObjectURL(file),
            isNew: true,
        }));

        setPhotos([...photos, ...newFiles]);
    };

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { "image/*": [] },
        multiple: true,
    });

    const removePhoto = async (photo) => {
        try {
            if (!photo.isNew && photo.photo_id) {
                await axios.delete("/api/propertyListing/deletPropertyPhotos", {
                    data: { photo_id: photo.photo_id },
                });

                setPhotos((prev) =>
                    prev.filter((p) => p.photo_id !== photo.photo_id)
                );
                return;
            }

            setPhotos((prev) =>
                prev.filter((p) => p.preview !== photo.preview)
            );
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="space-y-4">

            {/* UPLOAD */}
            <div>
                <label className="text-sm font-semibold">Property Photos</label>

                <div
                    {...getRootProps()}
                    className={`mt-2 border-2 border-dashed p-6 rounded-xl text-center cursor-pointer ${
                        isDragActive
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-300 bg-gray-50"
                    }`}
                >
                    <input {...getInputProps()} />

                    <div className="flex flex-col items-center gap-2">
                        <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
                            <Camera className="text-white w-6 h-6" />
                        </div>

                        <p className="text-sm font-semibold">
                            {isDragActive ? "Drop images here" : "Upload photos"}
                        </p>

                        <p className="text-xs text-gray-500">
                            Drag & drop or click to browse
                        </p>
                    </div>
                </div>
            </div>

            {/* GRID */}
            {photos.length > 0 && (
                <div>

                    {/* HEADER */}
                    <div className="flex justify-between items-center mb-2">
                        <p className="text-sm font-semibold">
                            {photos.length} photo{photos.length !== 1 && "s"}
                        </p>

                        {photos.length < 3 && (
                            <p className="text-xs text-amber-600 flex items-center gap-1">
                                <AlertCircle className="w-3 h-3" />
                                Add at least 3 photos
                            </p>
                        )}
                    </div>

                    {/* GRID */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                        {photos.map((photo, index) => (
                            <div
                                key={photo.photo_id ?? photo.preview}
                                className="relative group aspect-square rounded-xl overflow-hidden border"
                            >
                                <img
                                    src={photo.preview}
                                    className="w-full h-full object-cover"
                                />

                                {/* DELETE */}
                                <button
                                    onClick={() => removePhoto(photo)}
                                    className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-lg opacity-0 group-hover:opacity-100"
                                >
                                    <X className="w-4 h-4" />
                                </button>

                                {/* INDEX */}
                                <div className="absolute bottom-2 left-2 text-xs bg-black/50 text-white px-2 rounded">
                                    {index + 1}
                                </div>

                                {/* NEW BADGE */}
                                {photo.isNew && (
                                    <div className="absolute top-2 left-2 text-xs bg-green-500 text-white px-2 rounded">
                                        New
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}