"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import axios from "axios";
import Swal from "sweetalert2";
import { BackButton } from "@/components/navigation/backButton";

import "react-quill-new/dist/quill.snow.css";

/* ================= QUILL SETUP (PUT IT HERE) ================= */

const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false });

const quillModules = {
    toolbar: [
        [{ font: [] }],
        [{ header: [1, 2, 3, 4, 5, 6, false] }],

        ["bold", "italic", "underline", "strike"],
        [{ color: [] }, { background: [] }],

        [{ script: "sub" }, { script: "super" }],
        [{ list: "ordered" }, { list: "bullet" }],
        [{ indent: "-1" }, { indent: "+1" }],
        [{ align: [] }],

        ["link", "image", "video"],
        ["blockquote", "code-block"],

        ["clean"],
    ],
};

const quillFormats = [
    "font",
    "header",
    "bold",
    "italic",
    "underline",
    "strike",
    "color",
    "background",
    "script",
    "list",
    "bullet",
    "indent",
    "align",
    "link",
    "image",
    "video",
    "blockquote",
    "code-block",
];

/* ================= PAGE ================= */

export default function HousePolicyPage() {
    const { id } = useParams();
    const property_id = id;

    const [policy, setPolicy] = useState("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!property_id) return;

        const fetchPolicy = async () => {
            try {
                const res = await axios.get("/api/landlord/properties/policy", {
                    params: { property_id },
                });
                setPolicy(res.data.policy || "");
            } catch {
                Swal.fire("Error", "Failed to load house policy", "error");
            } finally {
                setLoading(false);
            }
        };

        fetchPolicy();
    }, [property_id]);

    const handleSave = async () => {
        try {
            setSaving(true);
            await axios.post("/api/landlord/properties/policy", { property_id, policy });
            Swal.fire("Saved", "House policy updated successfully", "success");
        } catch {
            Swal.fire("Error", "Failed to save policy", "error");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 sm:p-6">
            <div className="mb-6">
                <BackButton label="Back to Property" />
            </div>

            <div className="bg-white rounded-2xl shadow-lg border p-4 sm:p-6">
                <h1 className="text-2xl font-bold text-gray-800 mb-1">
                    House Rules & Policies
                </h1>
                <p className="text-sm text-gray-500 mb-6">
                    Define rules and guidelines tenants must follow.
                </p>

                {loading ? (
                    <div className="text-gray-500">Loading policy...</div>
                ) : (
                    <>
                        <div className="border rounded-xl overflow-hidden">
                            {/* Quill configuration */}
                            <ReactQuill
                                theme="snow"
                                value={policy}
                                onChange={setPolicy}
                                modules={quillModules}
                                formats={quillFormats}
                                placeholder="Write your house rules here..."
                            />

                        </div>

                        <div className="flex justify-end pt-4 border-t mt-4">
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="px-6 py-2 rounded-lg font-semibold text-white
                           bg-gradient-to-r from-blue-600 to-emerald-600
                           hover:from-blue-700 hover:to-emerald-700
                           disabled:opacity-50"
                            >
                                {saving ? "Saving..." : "Save Policy"}
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
