
//  to be removed.
"use client";
import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import Link from "next/link";
import axios from "axios";
import LoadingScreen from "@/components/loadingScreen";
import Swal from "sweetalert2";

export default function ViewUnits() {
  const { property_id } = useParams();
  const [units, setUnits] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [billingData, setBillingData] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [hasBillingForMonth, setHasBillingForMonth] = useState(false);

  const [billingForm, setBillingForm] = useState({
    billingPeriod: "",
    electricityTotal: "",
    electricityRate: "",
    waterTotal: "",
    waterRate: "",
  });

  useEffect(() => {
    if (!property_id) return;

    async function fetchData() {
      try {
        setLoading(true);

        // const res = await axios.get(`/api/landlord/billing/getUnitDetails`, {
        //   params: { property_id },
        //   headers: { "Cache-Control": "no-cache" },
        // });

        const unitBillingPromises = res.data.map(async (unit) => {
          try {
            const billingRes = await axios.get(
              `/api/landlord/billing/getUnitDetails/billingStatus`,
              {
                params: { unit_id: unit.unit_id },
              }
            );

            return {
              ...unit,
              hasBillForThisMonth: billingRes.data.hasBillForThisMonth,
            };
          } catch (error) {
            console.error(
              `Error fetching billing for unit ${unit.unit_id}:`,
              error
            );
            return { ...unit, hasBillForThisMonth: false };
          }
        });

        const unitsWithBillingStatus = await Promise.all(unitBillingPromises);

        setUnits(unitsWithBillingStatus);
        
      } catch (error) {
        console.error(
          "Failed to fetch units:",
          error.response?.data || error.message
        );
      } finally {
        setLoading(false);
      }
    }

    async function fetchBillingData() {
      try {
        const response = await axios.get(
          `/api/landlord/billing/checkBillingStatus`,
          {
            params: { property_id },
          }
        );

        if (response.data.billingData && response.data.billingData.length > 0) {
          setBillingData(response.data.billingData);
          setHasBillingForMonth(true);
          setBillingForm({
            billingPeriod: response.data.billingData[0]?.billing_period || "",
            electricityTotal:
              response.data.billingData.find(
                (b) => b.utility_type === "electricity"
              )?.total_billed_amount || "",
            electricityRate:
              response.data.billingData.find(
                (b) => b.utility_type === "electricity"
              )?.rate_consumed || "",
            waterTotal:
              response.data.billingData.find((b) => b.utility_type === "water")
                ?.total_billed_amount || "",
            waterRate:
              response.data.billingData.find((b) => b.utility_type === "water")
                ?.rate_consumed || "",
          });
        } else {
          setBillingData(null);
          setHasBillingForMonth(false);
        }
      } catch (error) {
        console.error(
          "Failed to fetch billing data:",
          error.response?.data || error.message
        );
      }
    }
    
    fetchBillingData();
    fetchData();
  }, [property_id]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setBillingForm({ ...billingForm, [name]: value });
  };

  const handleSaveOrUpdateBilling = async (e) => {
    e.preventDefault();
    try {
      const url = hasBillingForMonth
        ? "/api/landlord/billing/updateConcessionaireBilling"
        : "/api/landlord/billing/saveConcessionaireBilling";

      const response = await axios({
        method: hasBillingForMonth ? "PUT" : "POST",
        url: url,
        data: {
          property_id,
          ...billingForm,
        },
      });

      await Swal.fire({
        icon: "success",
        title: "Success!",
        text: hasBillingForMonth
          ? "Billing information updated successfully."
          : "Billing information saved successfully.",
        confirmButtonColor: "#3085d6",
        confirmButtonText: "OK",
      });

      setIsEditing(false);
      setIsModalOpen(false);
      window.location.reload();
    } catch (error) {
      console.error(
        "Error saving billing:",
        error.response?.data || error.message
      );
      Swal.fire({
        icon: "error",
        title: "Error!",
        text: "Failed to save billing. Please try again.",
        confirmButtonColor: "#d33",
        confirmButtonText: "OK",
      });
    }
  };

  if (loading) {
    return <LoadingScreen />;
  }

  return (
      <div className="p-6 max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
            Units in Property {property_id}
          </h1>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-indigo-600 text-white px-4 py-2.5 rounded-md shadow hover:bg-indigo-700 transition-colors flex items-center gap-2"
          >
            <span>Property Utility</span>
          </button>
        </div>
  
        {/* Unit Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {units.length > 0 ? (
            units.map((unit) => (
              <div
                key={unit.unit_id}
                className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start mb-3">
                  <h2 className="text-xl font-semibold text-gray-800">
                    {unit.unit_name}
                  </h2>
                  <span className={`text-sm px-2.5 py-1 rounded-full ${
                    unit.hasBillForThisMonth
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }`}>
                    {unit.hasBillForThisMonth ? "Billed" : "Unbilled"}
                  </span>
                </div>
                
                <div className="space-y-1 mb-4">
                  <p className="text-gray-600 flex items-center gap-2">
                    <span className="text-gray-500">Size:</span> 
                    <span className="font-medium">{unit.unit_size} sqm</span>
                  </p>
                  <p className="text-gray-600 flex items-center gap-2">
                    <span className="text-gray-500">Rent:</span> 
                    <span className="font-medium">₱{unit.rent_amount}</span>
                  </p>
                </div>
                
                <div className="mt-5 grid grid-cols-2 gap-3">
                  <Link href={`/landlord/billing/billingHistory/${unit.unit_id}`} className="col-span-2">
                    <button className="w-full bg-gray-100 text-gray-700 px-4 py-2 rounded-md border border-gray-300 hover:bg-gray-200 transition-colors font-medium">
                      Billing History
                    </button>
                  </Link>
                  
                  <Link href={`/landlord/billing/payments/${unit.unit_id}`} className="col-span-2">
                    <button className="w-full bg-blue-50 text-blue-700 px-4 py-2 rounded-md border border-blue-200 hover:bg-blue-100 transition-colors font-medium">
                      View Payments
                    </button>
                  </Link>
                  
                  {unit.hasBillForThisMonth ? (
                    <Link href={`/landlord/billing/editUnitBill/${unit.unit_id}`} className="col-span-2">
                      <button className="w-full bg-amber-50 text-amber-700 px-4 py-2 rounded-md border border-amber-200 hover:bg-amber-100 transition-colors font-medium">
                        Edit Unit Bill
                      </button>
                    </Link>
                  ) : (
                    <Link href={`/landlord/billing/createUnitBill/${unit.unit_id}`} className="col-span-2">
                      <button className="w-full bg-green-50 text-green-700 px-4 py-2 rounded-md border border-green-200 hover:bg-green-100 transition-colors font-medium">
                        Create Unit Bill
                      </button>
                    </Link>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full py-12 text-center bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-gray-500 font-medium">No units found for this property.</p>
            </div>
          )}
        </div>
  
        {isModalOpen && (
          <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
              <div className="p-5 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-800">
                  Property Utility
                </h2>
              </div>
              
              <div className="p-5">
                {billingData ? (
                  <div className="mb-6 p-4 bg-green-50 rounded-md border border-green-200">
                    <h3 className="font-medium text-green-700 mb-2">Billing set for this month</h3>
                    <p className="text-gray-700 mb-3">Period: <span className="font-medium">{billingForm?.billingPeriod}</span></p>
                    
                    <div className="grid grid-cols-2 gap-4 mt-3">
                      <div className="p-3 bg-white rounded-md border border-gray-200">
                        <h4 className="text-sm uppercase text-gray-500 font-semibold mb-2">Electricity</h4>
                        <p className="text-gray-800 font-medium">₱{billingData.find(b => b.utility_type === "electricity")?.total_billed_amount || "N/A"}</p>
                        <p className="text-xs text-gray-500 mt-1">{billingData.find(b => b.utility_type === "electricity")?.rate_consumed || "N/A"} kWh</p>
                      </div>
                      
                      <div className="p-3 bg-white rounded-md border border-gray-200">
                        <h4 className="text-sm uppercase text-gray-500 font-semibold mb-2">Water</h4>
                        <p className="text-gray-800 font-medium">₱{billingData.find(b => b.utility_type === "water")?.total_billed_amount || "N/A"}</p>
                        <p className="text-xs text-gray-500 mt-1">{billingData.find(b => b.utility_type === "water")?.rate_consumed || "N/A"} cu. meters</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="mb-6 p-4 bg-gray-50 rounded-md border border-gray-200">
                    <p className="text-gray-600 text-center">
                      No billing data found for this month
                    </p>
                  </div>
                )}
                
                <form className="space-y-5" onSubmit={handleSaveOrUpdateBilling}>
                  <div>
                    <label className="block text-gray-700 text-sm font-medium mb-1">
                      Billing Period
                    </label>
                    <input
                      name="billingPeriod"
                      value={billingForm.billingPeriod}
                      onChange={handleInputChange}
                      type="date"
                      className="w-full border border-gray-300 rounded-md p-2.5 focus:ring-2 focus:ring-indigo-300 focus:border-indigo-500 outline-none"
                    />
                  </div>
                  
                  <div className="p-4 bg-blue-50 rounded-md border border-blue-100">
                    <h3 className="text-md font-semibold text-blue-800 mb-3">
                      Electricity
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-gray-700 text-sm font-medium mb-1">
                          Total Amount Billed
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₱</span>
                          <input
                            type="number"
                            name="electricityTotal"
                            value={billingForm.electricityTotal}
                            onChange={handleInputChange}
                            className="w-full border border-gray-300 rounded-md p-2.5 pl-7 focus:ring-2 focus:ring-indigo-300 focus:border-indigo-500 outline-none"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-gray-700 text-sm font-medium mb-1">
                          Rate this month (kWh)
                        </label>
                        <input
                          type="number"
                          name="electricityRate"
                          value={billingForm.electricityRate}
                          onChange={handleInputChange}
                          className="w-full border border-gray-300 rounded-md p-2.5 focus:ring-2 focus:ring-indigo-300 focus:border-indigo-500 outline-none"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-cyan-50 rounded-md border border-cyan-100">
                    <h3 className="text-md font-semibold text-cyan-800 mb-3">
                      Water
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-gray-700 text-sm font-medium mb-1">
                          Total Amount Billed
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₱</span>
                          <input
                            type="number"
                            name="waterTotal"
                            value={billingForm.waterTotal}
                            onChange={handleInputChange}
                            className="w-full border border-gray-300 rounded-md p-2.5 pl-7 focus:ring-2 focus:ring-indigo-300 focus:border-indigo-500 outline-none"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-gray-700 text-sm font-medium mb-1">
                          Rate this month (cu. meters)
                        </label>
                        <input
                          type="number"
                          name="waterRate"
                          value={billingForm.waterRate}
                          onChange={handleInputChange}
                          className="w-full border border-gray-300 rounded-md p-2.5 focus:ring-2 focus:ring-indigo-300 focus:border-indigo-500 outline-none"
                        />
                      </div>
                    </div>
                  </div>
                </form>
              </div>
              
              <div className="p-5 border-t border-gray-200 flex justify-end gap-3">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveOrUpdateBilling}
                  className="px-5 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
                >
                  {isEditing ? "Update Utility Info" : "Save Utility Info"}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
  );
}
