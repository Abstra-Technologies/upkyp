"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { Plus, Pencil, Trash2, Power } from "lucide-react";
import { useRouter } from "next/navigation";

type Plan = {
    plan_id: number;
    plan_code: string;
    name: string;
    price: number;
    billing_cycle: "monthly" | "yearly" | "lifetime";
    is_active: number;
};

export default function AdminPlansPage() {
    const [plans, setPlans] = useState<Plan[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    const [form, setForm] = useState({
        plan_code: "",
        name: "",
        price: "",
        billing_cycle: "monthly",
    });

    const [editingId, setEditingId] = useState<number | null>(null);

    // Fetch plans
    const fetchPlans = async () => {
        try {
            const res = await axios.get("/api/systemadmin/subscription_programs/getPlans");
            setPlans(res.data);
        } catch (err) {
            Swal.fire("Error", "Failed to load plans", "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPlans();
    }, []);

    const resetForm = () => {
        setForm({
            plan_code: "",
            name: "",
            price: "",
            billing_cycle: "monthly",
        });
        setEditingId(null);
    };

    const handleSubmit = async () => {
        if (!form.plan_code || !form.name) {
            Swal.fire("Error", "Plan code and name required", "error");
            return;
        }

        try {
            if (editingId) {
                await axios.put(`/api/admin/plans/${editingId}`, form);
                Swal.fire("Updated", "Plan updated successfully", "success");
            } else {
                await axios.post("/api/systemadmin/subscription_programs/add-plan", form);
                Swal.fire("Created", "Plan created successfully", "success");
            }

            resetForm();
            fetchPlans();
        } catch (err: any) {
            Swal.fire("Error", err.response?.data?.error || "Failed", "error");
        }
    };

    const handleDelete = async (id: number) => {
        const confirm = await Swal.fire({
            title: "Delete Plan?",
            text: "This cannot be undone.",
            icon: "warning",
            showCancelButton: true,
        });

        if (!confirm.isConfirmed) return;

        try {
            await axios.delete(`/api/admin/plans/${id}`);
            Swal.fire("Deleted", "Plan removed", "success");
            fetchPlans();
        } catch {
            Swal.fire("Error", "Delete failed", "error");
        }
    };

    const toggleActive = async (plan: Plan) => {
        try {
            await axios.patch(`/api/admin/plans/${plan.plan_id}/toggle`);
            fetchPlans();
        } catch {
            Swal.fire("Error", "Failed to toggle status", "error");
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-6xl mx-auto">

                {/* HEADER */}
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold text-gray-800">
                        Plan Management
                    </h1>
                </div>

                {/* CREATE / EDIT FORM */}
                <div className="bg-white p-6 rounded-xl shadow-md mb-8">
                    <h2 className="font-semibold text-lg mb-4">
                        {editingId ? "Edit Plan" : "Create Plan"}
                    </h2>

                    <div className="grid md:grid-cols-4 gap-4">
                        <input
                            type="text"
                            placeholder="Plan Code (BETA)"
                            value={form.plan_code}
                            onChange={(e) =>
                                setForm({ ...form, plan_code: e.target.value.toUpperCase() })
                            }
                            className="border p-2 rounded-lg"
                        />

                        <input
                            type="text"
                            placeholder="Plan Name"
                            value={form.name}
                            onChange={(e) =>
                                setForm({ ...form, name: e.target.value })
                            }
                            className="border p-2 rounded-lg"
                        />

                        <input
                            type="number"
                            placeholder="Price"
                            value={form.price}
                            onChange={(e) =>
                                setForm({ ...form, price: e.target.value })
                            }
                            className="border p-2 rounded-lg"
                        />

                        <select
                            value={form.billing_cycle}
                            onChange={(e) =>
                                setForm({ ...form, billing_cycle: e.target.value })
                            }
                            className="border p-2 rounded-lg"
                        >
                            <option value="monthly">Monthly</option>
                            <option value="yearly">Yearly</option>
                            <option value="lifetime">Lifetime</option>
                        </select>
                    </div>

                    <div className="flex gap-3 mt-4">
                        <button
                            onClick={handleSubmit}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                        >
                            <Plus size={16} />
                            {editingId ? "Update" : "Create"}
                        </button>

                        {editingId && (
                            <button
                                onClick={resetForm}
                                className="bg-gray-300 px-4 py-2 rounded-lg"
                            >
                                Cancel
                            </button>
                        )}
                    </div>
                </div>

                {/* PLAN TABLE */}
                <div className="bg-white rounded-xl shadow-md overflow-hidden">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-100">
                        <tr>
                            <th className="p-3 text-left">Code</th>
                            <th className="p-3 text-left">Name</th>
                            <th className="p-3 text-left">Price</th>
                            <th className="p-3 text-left">Billing</th>
                            <th className="p-3 text-left">Status</th>
                            <th className="p-3 text-right">Actions</th>
                        </tr>
                        </thead>

                        <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={6} className="p-4 text-center">
                                    Loading...
                                </td>
                            </tr>
                        ) : (
                            plans.map((plan) => (
                                <tr key={plan.plan_id} className="border-t">
                                    <td className="p-3 font-semibold">
                                        {plan.plan_code}
                                    </td>
                                    <td className="p-3">{plan.name}</td>
                                    <td className="p-3">₱{plan.price}</td>
                                    <td className="p-3 capitalize">
                                        {plan.billing_cycle}
                                    </td>
                                    <td className="p-3">
                      <span
                          className={`px-2 py-1 rounded text-xs ${
                              plan.is_active
                                  ? "bg-green-100 text-green-700"
                                  : "bg-red-100 text-red-600"
                          }`}
                      >
                        {plan.is_active ? "Active" : "Inactive"}
                      </span>
                                    </td>

                                    <td className="p-3 flex justify-end gap-2">
                                        <button
                                            onClick={() => router.push(`/pages/system_admin/subscription_plans/${plan?.plan_id}`)}
                                            className="text-blue-600"
                                        >
                                            <Pencil size={16} />
                                        </button>

                                        <button
                                            onClick={() => toggleActive(plan)}
                                            className="text-yellow-600"
                                        >
                                            <Power size={16} />
                                        </button>

                                        <button
                                            onClick={() => handleDelete(plan.plan_id)}
                                            className="text-red-600"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                        </tbody>
                    </table>
                </div>

            </div>
        </div>
    );
}
