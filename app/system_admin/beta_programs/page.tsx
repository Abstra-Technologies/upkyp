"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import useSWR, { mutate } from "swr";
import axios from "axios";
import Swal from "sweetalert2";
import { Search, Users, ShieldCheck, Clock, XCircle, Eye } from "lucide-react";

import AdminLayout from "@/components/navigation/sidebar-admin";
import useAuthStore from "@/zustand/authStore";
import { formatDate } from "@/utils/formatter/formatters";

const fetcher = (url: string) => axios.get(url).then((res) => res.data);

export default function BetaProgramsPage() {
  const router = useRouter();
  const { admin, fetchSession } = useAuthStore();

  const [search, setSearch] = useState("");
  const [selectedApplicant, setSelectedApplicant] = useState<any>(null);

  /* ===============================
       FIX: Check auth only ONCE on mount
    =============================== */
  useEffect(() => {
    if (!admin) {
      fetchSession().catch(() => {
        // If fetchSession fails (401), redirect to login
        router.push("/system_admin/login");
      });
    }
  }, []); // 👈 Empty dependency array = runs only once

  /* ===============================
       FIX: Redirect if admin logs out
    =============================== */
  useEffect(() => {
    if (admin === null) {
      router.push("/system_admin/login");
    }
  }, [admin]); // 👈 Watch for admin changes (like logout)

  const { data, isLoading } = useSWR(
    "/api/systemadmin/beta-program/users",
    fetcher
  );

  const applicants = data?.users || [];

  /* Rest of your code stays the same... */
  const filteredApplicants = useMemo(() => {
    if (!search) return applicants;
    const q = search.toLowerCase();
    return applicants.filter(
      (a: any) =>
        a.full_name.toLowerCase().includes(q) ||
        a.email.toLowerCase().includes(q) ||
        a.region.toLowerCase().includes(q) ||
        a.city.toLowerCase().includes(q)
    );
  }, [applicants, search]);

  const handleApprove = async (applicant: any) => {
    const confirm = await Swal.fire({
      title: "Approve Beta Applicant?",
      text: "This landlord will receive 60 days of BETA access.",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Approve",
      confirmButtonColor: "#16a34a",
    });

    if (!confirm.isConfirmed) return;

    await axios.patch("/api/systemadmin/beta-program/decision/approve", {
      beta_id: applicant.beta_id,
      landlord_id: applicant.landlord_id,
      admin_id: admin.admin_id,
    });

    Swal.fire("Approved", "BETA access granted.", "success");
    mutate("/api/systemadmin/beta-program/users");
  };

  const handleReject = async (applicant: any) => {
    const { value: rejection_reason } = await Swal.fire({
      title: "Reject Beta Application",
      input: "textarea",
      inputLabel: "Rejection Reason",
      inputPlaceholder: "Explain why this application was rejected…",
      showCancelButton: true,
      confirmButtonText: "Reject",
      confirmButtonColor: "#dc2626",
      inputValidator: (value) => {
        if (!value) return "Rejection reason is required";
      },
    });

    if (!rejection_reason) return;

    await axios.patch("/api/systemadmin/beta-program/decision/reject", {
      beta_id: applicant.beta_id,
      admin_id: admin.admin_id,
      rejection_reason,
    });

    Swal.fire("Rejected", "Application rejected.", "success");
    mutate("/api/systemadmin/beta-program/users");
  };

  // Don't render if not authenticated
  if (!admin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 bg-gradient-to-br from-gray-50 to-gray-100">
      {/* HEADER */}
      <div className="mb-6 flex items-center gap-3">
        <div className="p-3 rounded-xl bg-gradient-to-br from-blue-600 to-emerald-600 text-white">
          <Users className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Beta Program Applicants
          </h1>
          <p className="text-sm text-gray-500">
            Admin review and approval of landlord beta access
          </p>
        </div>
      </div>

      {/* SEARCH */}
      <div className="mb-4 max-w-sm relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search name, email, region, city"
          className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
        />
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-2xl shadow border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr className="text-left text-gray-600">
              <th className="px-4 py-3">Applicant</th>
              <th className="px-4 py-3">Location</th>
              <th className="px-4 py-3">Portfolio</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Applied</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>

          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={6} className="p-6 text-center text-gray-500">
                  Loading beta applicants…
                </td>
              </tr>
            )}

            {!isLoading && filteredApplicants.length === 0 && (
              <tr>
                <td colSpan={6} className="p-6 text-center text-gray-500">
                  No beta applicants found
                </td>
              </tr>
            )}

            {filteredApplicants.map((applicant: any) => (
              <tr key={applicant.beta_id} className="border-b hover:bg-gray-50">
                {/* Applicant */}
                <td className="px-4 py-3">
                  <div className="font-semibold">{applicant.full_name}</div>
                  <div className="text-xs text-gray-500">{applicant.email}</div>
                </td>

                {/* Location */}
                <td className="px-4 py-3 text-gray-600">
                  {applicant.city}, {applicant.province}
                </td>

                {/* Portfolio */}
                <td className="px-4 py-3 text-gray-600">
                  {applicant.properties_count} properties · avg{" "}
                  {applicant.avg_units_per_property} units
                </td>

                {/* Status */}
                <td className="px-4 py-3">
                  {applicant.status === "approved" && (
                    <span className="badge-green inline-flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" />
                      Approved
                    </span>
                  )}
                  {applicant.status === "pending" && (
                    <span className="badge-yellow inline-flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Pending
                    </span>
                  )}
                  {applicant.status === "rejected" && (
                    <span className="badge-red inline-flex items-center gap-1">
                      <XCircle className="w-3 h-3" />
                      Rejected
                    </span>
                  )}
                </td>

                {/* Applied */}
                <td className="px-4 py-3 text-gray-600">
                  {formatDate(applicant.applied_at)}
                </td>

                {/* Actions */}
                <td className="px-4 py-3 flex gap-2">
                  <button
                    onClick={() => setSelectedApplicant(applicant)}
                    className="px-2 py-1 text-xs rounded bg-gray-100 hover:bg-gray-200"
                  >
                    <Eye className="w-4 h-4" />
                  </button>

                  {applicant.status === "pending" && (
                    <>
                      <button
                        onClick={() => handleApprove(applicant)}
                        className="px-3 py-1 text-xs rounded bg-green-600 text-white hover:bg-green-700"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleReject(applicant)}
                        className="px-3 py-1 text-xs rounded bg-red-600 text-white hover:bg-red-700"
                      >
                        Reject
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* DETAILS MODAL */}
      {selectedApplicant && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-lg p-6">
            <h2 className="text-lg font-bold mb-4">Beta Applicant Details</h2>

            <ul className="space-y-2 text-sm">
              <li>
                <strong>Name:</strong> {selectedApplicant.full_name}
              </li>
              <li>
                <strong>Email:</strong> {selectedApplicant.email}
              </li>
              <li>
                <strong>Landlord ID:</strong> {selectedApplicant.landlord_id}
              </li>
              <li>
                <strong>Region:</strong> {selectedApplicant.region}
              </li>
              <li>
                <strong>City:</strong> {selectedApplicant.city}
              </li>
              <li>
                <strong>Properties:</strong>{" "}
                {selectedApplicant.properties_count}
              </li>
              <li>
                <strong>Avg Units / Property:</strong>{" "}
                {selectedApplicant.avg_units_per_property}
              </li>
              <li>
                <strong>Status:</strong> {selectedApplicant.status}
              </li>
            </ul>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setSelectedApplicant(null)}
                className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
