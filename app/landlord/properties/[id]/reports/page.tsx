"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  FileDown,
  Wallet,
  Home,
  Wrench,
  ShieldCheck,
  FileText,
  BarChart3,
} from "lucide-react";
import axios from "axios";
import Swal from "sweetalert2";

export default function PropertyReportsPage() {
  const { id } = useParams();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [propertyName, setPropertyName] = useState("");

  useEffect(() => {
    fetchProperty();
  }, [id]);

  async function fetchProperty() {
    try {
      const res = await axios.get("/api/propertyListing/getPropDetailsById", {
        params: { property_id: id },
      });
      setPropertyName(res.data.property?.property_name || "Property Reports");
    } catch (err) {
      console.error(err);
    }
  }

  const reports = [
    {
      title: "Financial Reports",
      description:
        "Monitor rent collection, payments, and wallet transactions.",
      items: [
        {
          label: "Monthly Rent Collection",
          file: `rent_collection_${id}.pdf`,
          endpoint: `/api/reports/landlord/download?type=rent_collection&property_id=${id}`,
        },
        {
          label: "Outstanding Balances",
          file: `outstanding_balances_${id}.pdf`,
          endpoint: `/api/reports/landlord/download?type=balances&property_id=${id}`,
        },
        {
          label: "Landlord Wallet Transactions",
          file: `wallet_transactions_${id}.csv`,
          endpoint: `/api/reports/landlord/download?type=wallet_txn&property_id=${id}`,
        },
      ],
      icon: <Wallet className="w-5 h-5 text-white" />,
      iconBg: "bg-gradient-to-br from-emerald-500 to-green-600",
      borderColor: "border-emerald-200",
    },
    {
      title: "Occupancy & Lease Reports",
      description: "Track occupancy, vacancies, and expiring leases.",
      items: [
        {
          label: "Occupancy Summary",
          file: `occupancy_${id}.pdf`,
          endpoint: `/api/reports/landlord/download?type=occupancy&property_id=${id}`,
        },
        {
          label: "Expiring Leases (Next 90 Days)",
          file: `lease_expiry_${id}.csv`,
          endpoint: `/api/reports/landlord/download?type=lease_expiry&property_id=${id}`,
        },
      ],
      icon: <Home className="w-5 h-5 text-white" />,
      iconBg: "bg-gradient-to-br from-blue-500 to-blue-600",
      borderColor: "border-blue-200",
    },
    {
      title: "Maintenance Reports",
      description: "View request history and maintenance expenses.",
      items: [
        {
          label: "Maintenance Request Log",
          file: `maintenance_log_${id}.pdf`,
          endpoint: `/api/reports/landlord/download?type=maintenance_log&property_id=${id}`,
        },
        {
          label: "Maintenance Cost Summary",
          file: `maintenance_costs_${id}.csv`,
          endpoint: `/api/reports/landlord/download?type=maintenance_costs&property_id=${id}`,
        },
      ],
      icon: <Wrench className="w-5 h-5 text-white" />,
      iconBg: "bg-gradient-to-br from-orange-500 to-orange-600",
      borderColor: "border-orange-200",
    },
    {
      title: "Compliance & Tax Reports",
      description: "Generate compliance, verification, and tax summaries.",
      items: [
        {
          label: "Tax Summary (Form 2551Q)",
          file: `tax_summary_${id}.pdf`,
          endpoint: `/api/reports/landlord/download?type=tax_summary&property_id=${id}`,
        },
        {
          label: "Property Verification Summary",
          file: `verification_${id}.pdf`,
          endpoint: `/api/reports/landlord/download?type=verification&property_id=${id}`,
        },
      ],
      icon: <ShieldCheck className="w-5 h-5 text-white" />,
      iconBg: "bg-gradient-to-br from-purple-500 to-purple-600",
      borderColor: "border-purple-200",
    },
  ];

  async function handleDownload(report) {
    try {
      setIsLoading(true);
      const response = await axios.get(report.endpoint, {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", report.file);
      document.body.appendChild(link);
      link.click();
      link.remove();
      Swal.fire(
        "Downloaded",
        `${report.label} has been downloaded.`,
        "success"
      );
    } catch (error) {
      console.error(error);
      Swal.fire("Error", "Failed to download report.", "error");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24 md:pb-6">
      <div className="w-full px-4 md:px-6 pt-20 md:pt-6">
        {/* Header */}
        <div className="mb-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-emerald-600 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-gray-900">
                Property Reports
              </h1>
              <p className="text-xs md:text-sm text-gray-600 mt-0.5">
                Download financial, occupancy, maintenance, and compliance
                reports
              </p>
            </div>
          </div>
        </div>

        {/* Reports Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {reports.map((section, idx) => (
            <div
              key={idx}
              className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
            >
              {/* Section Header */}
              <div className="px-5 py-4 border-b border-gray-200 bg-gray-50">
                <div className="flex items-center gap-3 mb-2">
                  <div
                    className={`w-10 h-10 ${section.iconBg} rounded-lg flex items-center justify-center`}
                  >
                    {section.icon}
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-gray-900">
                      {section.title}
                    </h2>
                  </div>
                </div>
                <p className="text-xs md:text-sm text-gray-600">
                  {section.description}
                </p>
              </div>

              {/* Report Items */}
              <div className="p-4">
                <ul className="space-y-3">
                  {section.items.map((r, i) => (
                    <li
                      key={i}
                      className="flex items-center justify-between p-3 bg-gray-50 hover:bg-blue-50 rounded-lg border border-gray-200 hover:border-blue-300 transition-all group"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <FileText className="w-4 h-4 text-gray-400 group-hover:text-blue-600 flex-shrink-0 transition-colors" />
                        <span className="text-sm font-medium text-gray-700 group-hover:text-blue-700 truncate transition-colors">
                          {r.label}
                        </span>
                      </div>
                      <button
                        onClick={() => handleDownload(r)}
                        disabled={isLoading}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0 ml-3"
                      >
                        <FileDown className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Download</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
