"use client";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function BillingHistory() {
  const { unit_id } = useParams();
  const router = useRouter();
  const [billingHistory, setBillingHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState({
    key: "billing_period",
    direction: "desc",
  });
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    if (!unit_id) return;

    async function fetchBillingHistory() {
      try {
        const res = await fetch(
          `/api/landlord/billing/getBillingHistory?unit_id=${unit_id}`
        );
        const data = await res.json();

        if (res.ok) {
          setBillingHistory(data);
        } else {
          setError(data.message || "Failed to fetch billing history.");
        }
      } catch (err) {
        setError("Error fetching billing history.");
      } finally {
        setLoading(false);
      }
    }

    fetchBillingHistory();
  }, [unit_id]);

  // Sort function
  const sortedBillingHistory = [...(billingHistory || [])].sort((a, b) => {
    if (a[sortConfig.key] < b[sortConfig.key]) {
      return sortConfig.direction === "asc" ? -1 : 1;
    }
    if (a[sortConfig.key] > b[sortConfig.key]) {
      return sortConfig.direction === "asc" ? 1 : -1;
    }
    return 0;
  });

  // Request sort
  const requestSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  // Get sort direction indicator
  const getSortDirectionIndicator = (key) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === "asc" ? "▲" : "▼";
  };

  // Filter function
  const filteredBillingHistory = sortedBillingHistory.filter((bill) => {
    const matchesSearch =
      bill.total_amount_due.toString().includes(searchTerm) ||
      formatDate(bill.billing_period).includes(searchTerm) ||
      formatDate(bill.due_date).includes(searchTerm) ||
      bill.status.toLowerCase().includes(searchTerm.toLowerCase());

    if (filter === "all") return matchesSearch;
    return bill.status === filter && matchesSearch;
  });

  // Helper function to format dates
  const formatDate = (dateString) => {
    if (!dateString) return "—";
    return new Date(dateString).toISOString().split("T")[0];
  };

  // Helper function to get status classes
  const getStatusClasses = (status) => {
    switch (status) {
      case "paid":
        return "bg-green-100 text-green-800";
      case "overdue":
        return "bg-red-100 text-red-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Loading state
  if (loading) {
    return (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
    );
  }

  // Error state
  if (error) {
    return (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 my-6 mx-6 rounded">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-red-500"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
    );
  }

  // Empty state
  if (billingHistory.length === 0) {
    return (
        <div className="flex flex-col items-center justify-center h-64 p-6">
          <svg
            className="h-16 w-16 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <h3 className="mt-2 text-lg font-medium text-gray-900">
            No billing records
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            No billing records found for this unit.
          </p>
        </div>
    );
  }

  return (
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div className="flex items-center mb-4 md:mb-0">
            <button
              onClick={() => router.back()}
              className="mr-4 p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors duration-200"
              aria-label="Go back"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-gray-600"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
              Billing History
            </h1>
          </div>

          {/* Summary Cards */}
          <div className="flex space-x-4">
            <div className="bg-blue-50 rounded-lg px-4 py-2 flex items-center">
              <div className="rounded-full bg-blue-100 h-8 w-8 flex items-center justify-center mr-2">
                <svg
                  className="h-4 w-4 text-blue-600"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M10 2a8 8 0 100 16 8 8 0 000-16zm0 14a6 6 0 110-12 6 6 0 010 12z" />
                  <path d="M10 4a1 1 0 00-1 1v4a1 1 0 00.293.707l2.5 2.5a1 1 0 001.414-1.414L10.5 8.5V5a1 1 0 00-1-1z" />
                </svg>
              </div>
              <div>
                <p className="text-xs text-blue-600 font-medium">
                  Total Records
                </p>
                <p className="text-lg font-semibold text-blue-800">
                  {billingHistory.length}
                </p>
              </div>
            </div>
            <div className="bg-green-50 rounded-lg px-4 py-2 flex items-center">
              <div className="rounded-full bg-green-100 h-8 w-8 flex items-center justify-center mr-2">
                <svg
                  className="h-4 w-4 text-green-600"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div>
                <p className="text-xs text-green-600 font-medium">Paid</p>
                <p className="text-lg font-semibold text-green-800">
                  {
                    billingHistory.filter((bill) => bill.status === "paid")
                      .length
                  }
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-hidden bg-white shadow-md rounded-lg border border-gray-200">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <th
                    className="px-6 py-3 cursor-pointer hover:bg-gray-100"
                    onClick={() => requestSort("billing_period")}
                  >
                    <div className="flex items-center">
                      Billing Period
                      <span className="ml-1">
                        {getSortDirectionIndicator("billing_period")}
                      </span>
                    </div>
                  </th>
                  <th
                    className="px-6 py-3 cursor-pointer hover:bg-gray-100"
                    onClick={() => requestSort("total_amount_due")}
                  >
                    <div className="flex items-center">
                      Total Amount
                      <span className="ml-1">
                        {getSortDirectionIndicator("total_amount_due")}
                      </span>
                    </div>
                  </th>
                  <th
                    className="px-6 py-3 cursor-pointer hover:bg-gray-100"
                    onClick={() => requestSort("status")}
                  >
                    <div className="flex items-center">
                      Status
                      <span className="ml-1">
                        {getSortDirectionIndicator("status")}
                      </span>
                    </div>
                  </th>
                  <th
                    className="px-6 py-3 cursor-pointer hover:bg-gray-100"
                    onClick={() => requestSort("due_date")}
                  >
                    <div className="flex items-center">
                      Due Date
                      <span className="ml-1">
                        {getSortDirectionIndicator("due_date")}
                      </span>
                    </div>
                  </th>
                  <th
                    className="px-6 py-3 cursor-pointer hover:bg-gray-100"
                    onClick={() => requestSort("created_at")}
                  >
                    <div className="flex items-center">
                      Created On
                      <span className="ml-1">
                        {getSortDirectionIndicator("created_at")}
                      </span>
                    </div>
                  </th>
                  <th
                    className="px-6 py-3 cursor-pointer hover:bg-gray-100"
                    onClick={() => requestSort("paid_at")}
                  >
                    <div className="flex items-center">
                      Transaction Date
                      <span className="ml-1">
                        {getSortDirectionIndicator("paid_at")}
                      </span>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredBillingHistory.map((bill) => (
                  <tr
                    key={bill.billing_id}
                    className="hover:bg-gray-50 transition-colors duration-150"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">
                        {formatDate(bill.billing_period)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-semibold text-gray-900">
                        ₱{Number(bill.total_amount_due).toLocaleString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusClasses(
                          bill.status
                        )}`}
                      >
                        {bill.status.charAt(0).toUpperCase() +
                          bill.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-700">
                      {formatDate(bill.due_date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                      {formatDate(bill.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                      {bill.status === "paid" ? (
                        <div className="text-green-600">
                          {formatDate(bill.paid_at)}
                        </div>
                      ) : (
                        <div className="text-gray-400">—</div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Empty results message */}
          {filteredBillingHistory.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <svg
                className="h-12 w-12 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                No results found
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Try adjusting your search or filter to find what you're looking
                for.
              </p>
              <button
                onClick={() => {
                  setSearchTerm("");
                  setFilter("all");
                }}
                className="mt-3 text-sm font-medium text-blue-600 hover:text-blue-500"
              >
                Clear filters
              </button>
            </div>
          )}

          {/* Pagination placeholder - can be implemented if needed */}
          <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing{" "}
                <span className="font-medium">
                  {filteredBillingHistory.length}
                </span>{" "}
                of <span className="font-medium">{billingHistory.length}</span>{" "}
                records
              </div>
            </div>
          </div>
        </div>
      </div>
  );
}
