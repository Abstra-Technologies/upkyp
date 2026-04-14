"use client";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import Swal from "sweetalert2";

export default function EditUnitBill() {
  const router = useRouter();
  const { unit_id } = useParams();
  const [step, setStep] = useState(1);
  const [bill, setBill] = useState(null);
  const [loading, setLoading] = useState(true);
  const [propertyRates, setPropertyRates] = useState({
    waterRate: 0,
    electricityRate: 0,
  });
  const [formData, setFormData] = useState({
    water_prev_reading: "",
    water_current_reading: "",
    electricity_prev_reading: "",
    electricity_current_reading: "",
    penalty_amount: "",
    discount_amount: "",
    rent_amount: "",
    assoc_dues: "",
    late_fee: "",
    total_water_amount: "",
    total_electricity_amount: "",
    total_amount_due: "",
  });

  useEffect(() => {
    if (!unit_id) return;

    const fetchCurrentMonthBill = async () => {
      try {
        const res = await fetch(
          `/api/landlord/billing/getUnitBillThisMonth?unit_id=${unit_id}`
        );
        const data = await res.json();

        if (res.ok) {
          setBill(data);
          setFormData({
            water_prev_reading: data.water_prev_reading ?? "",
            water_current_reading: data.water_current_reading ?? "",
            electricity_prev_reading: data.electricity_prev_reading ?? "",
            electricity_current_reading: data.electricity_current_reading ?? "",
            penalty_amount: data.penalty_amount ?? "",
            discount_amount: data.discount_amount ?? "",
            rent_amount: data.rent_amount ?? "",
            assoc_dues: data.assoc_dues ?? "",
            late_fee: data.late_fee ?? "",
            total_water_amount: data.total_water_amount ?? "",
            total_electricity_amount: data.total_electricity_amount ?? "",
            total_amount_due: data.total_amount_due ?? "",
          });
        }
      } catch (error) {
        console.error("Error fetching bill:", error);
      } finally {
        setLoading(false);
      }
    };

    const fetchConcessionaireData = async () => {
      try {
        const res = await fetch(
          `/api/landlord/billing/getUtilityRateThisMonth?unit_id=${unit_id}`
        );
        const concessionaireData = await res.json();

        if (res.ok) {
          setPropertyRates({
            waterRate: concessionaireData.water_rate || 0,
            electricityRate: concessionaireData.electricity_rate || 0,
          });
        }
      } catch (error) {
        console.error("Error fetching concessionaire data:", error);
      }
    };

    fetchCurrentMonthBill();
    fetchConcessionaireData();
  }, [unit_id]);

  // Auto calculate bill
  const calculateBill = () => {
    const waterUsage = Math.max(
      0,
      parseFloat(formData.water_current_reading) -
        parseFloat(formData.water_prev_reading)
    );
    const electricityUsage = Math.max(
      0,
      parseFloat(formData.electricity_current_reading) -
        parseFloat(formData.electricity_prev_reading)
    );

    const totalWaterAmount = (waterUsage * propertyRates.waterRate).toFixed(2);
    const totalElectricityAmount = (
      electricityUsage * propertyRates.electricityRate
    ).toFixed(2);

    const totalAmountDue = (
      parseFloat(totalWaterAmount) +
        parseFloat(totalElectricityAmount) +
        parseFloat(formData.rent_amount) +
        parseFloat(formData.assoc_dues) +
        parseFloat(formData.late_fee) +
        parseFloat(formData.penalty_amount) -
        parseFloat(formData.discount_amount) || 0
    ).toFixed(2);

    setFormData((prevForm) => ({
      ...prevForm,
      total_water_amount: totalWaterAmount,
      total_electricity_amount: totalElectricityAmount,
      total_amount_due: totalAmountDue,
    }));
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });

    const updatedForm = { ...formData, [e.target.name]: e.target.value };
    calculateBill(updatedForm);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch("/api/landlord/billing/updateBilling", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ billing_id: bill.billing_id, ...formData }),
      });

      if (response.ok) {
        Swal.fire({
          icon: "success",
          title: "Success!",
          text: "Billing updated successfully!",
        }).then(() => {
          router.back();
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "Oops...",
          text: "Failed to update billing.",
        });
      }
    } catch (error) {
      console.error("Error updating bill:", error);
    }
  };

  if (loading) return <p>Loading...</p>;
  if (!bill)
    return (
      <p className="text-red-500">No billing record found for this month.</p>
    );

  return (
      <div className="max-w-xl mx-auto p-4 sm:p-6 bg-white rounded-xl shadow-sm">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">
          Edit Billing  {unit_id} {" "}
          {new Date(bill.billing_period).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
          })}
        </h2>

        {/* Progress indicator */}
        <div className="w-full bg-gray-200 rounded-full h-1.5 mb-6">
          <div
            className="bg-blue-500 h-1.5 rounded-full transition-all duration-300 ease-in-out"
            style={{ width: `${(step / 2) * 100}%` }}
          ></div>
        </div>

        {step === 1 && (
          <>
            <div className="bg-gray-50 p-5 rounded-lg mb-6 border border-gray-200 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                <span className="text-blue-500 mr-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </span>
                Concessionaire Rates
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <span className="text-blue-500">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                      />
                    </svg>
                  </span>
                  <p className="text-gray-600">
                    Water Rate:{" "}
                    <span className="font-medium text-gray-800">
                      ₱{propertyRates.waterRate}
                    </span>{" "}
                    per m³
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-yellow-500">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 10V3L4 14h7v7l9-11h-7z"
                      />
                    </svg>
                  </span>
                  <p className="text-gray-600">
                    Electricity Rate:{" "}
                    <span className="font-medium text-gray-800">
                      ₱{propertyRates.electricityRate}
                    </span>{" "}
                    per kWh
                  </p>
                </div>
              </div>
            </div>

            <form className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Water Readings Section */}
                <div className="space-y-4 p-4 rounded-lg border border-blue-100 bg-blue-50">
                  <h3 className="font-medium text-blue-800">
                    Water Meter Readings
                  </h3>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Previous Reading
                    </label>
                    <input
                      name="water_prev_reading"
                      type="number"
                      value={formData.water_prev_reading}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Current Reading
                    </label>
                    <input
                      name="water_current_reading"
                      type="number"
                      value={formData.water_current_reading}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    />
                  </div>
                </div>

                {/* Electricity Readings Section */}
                <div className="space-y-4 p-4 rounded-lg border border-yellow-100 bg-yellow-50">
                  <h3 className="font-medium text-yellow-800">
                    Electricity Meter Readings
                  </h3>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Previous Reading
                    </label>
                    <input
                      name="electricity_prev_reading"
                      type="number"
                      value={formData.electricity_prev_reading}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Current Reading
                    </label>
                    <input
                      name="electricity_current_reading"
                      type="number"
                      value={formData.electricity_current_reading}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* Fixed Charges Section */}
              <div className="space-y-4 p-4 rounded-lg border border-gray-200 bg-gray-50">
                <h3 className="font-medium text-gray-800">Fixed Charges</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Rent Amount
                    </label>
                    <input
                      name="rent_amount"
                      value={formData.rent_amount}
                      disabled
                      className="w-full px-3 py-2 border border-gray-200 rounded-md bg-gray-100 text-gray-700"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Association Dues
                    </label>
                    <input
                      name="assoc_dues"
                      value={formData.assoc_dues}
                      disabled
                      className="w-full px-3 py-2 border border-gray-200 rounded-md bg-gray-100 text-gray-700"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Late Fee
                    </label>
                    <input
                      name="late_fee"
                      value={formData.late_fee}
                      disabled
                      className="w-full px-3 py-2 border border-gray-200 rounded-md bg-gray-100 text-gray-700"
                    />
                  </div>
                </div>
              </div>

              {/* Adjustments Section */}
              <div className="space-y-4 p-4 rounded-lg border border-gray-200 bg-gray-50">
                <h3 className="font-medium text-gray-800">Adjustments</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Penalties
                    </label>
                    <input
                      name="penalty_amount"
                      type="number"
                      value={formData.penalty_amount}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Discounts
                    </label>
                    <input
                      name="discount_amount"
                      type="number"
                      value={formData.discount_amount}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => {
                    calculateBill();
                    setStep(2);
                  }}
                  type="button"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <span className="flex items-center">
                    Next
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 ml-1"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </span>
                </button>
              </div>
            </form>
          </>
        )}

        {step === 2 && (
          <>
            <h3 className="text-xl font-semibold text-gray-800 mb-4">
              Billing Summary
            </h3>

            <div className="rounded-lg overflow-hidden shadow-md mb-6">
              <div className="bg-blue-600 text-white py-4 px-5">
                <h4 className="font-medium text-lg">
                  {new Date(bill.billing_period).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                  })}{" "}
                  Invoice
                </h4>
              </div>

              <div className="divide-y divide-gray-200">
                {/* Water and Electricity Section */}
                <div className="p-5 bg-white">
                  <div className="space-y-3">
                    <div className="flex items-center mb-3">
                      <span className="text-blue-500 mr-2">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                          />
                        </svg>
                      </span>
                      <h4 className="font-medium text-gray-800">Water Usage</h4>
                    </div>
                    <div className="flex justify-between items-center pl-7 text-sm">
                      <p className="text-gray-600">Cost:</p>
                      <p className="font-semibold text-blue-600">
                        ₱{formData.total_water_amount}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3 mt-4">
                    <div className="flex items-center mb-3">
                      <span className="text-yellow-500 mr-2">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13 10V3L4 14h7v7l9-11h-7z"
                          />
                        </svg>
                      </span>
                      <h4 className="font-medium text-gray-800">
                        Electricity Usage
                      </h4>
                    </div>
                    <div className="flex justify-between items-center pl-7 text-sm">
                      <p className="text-gray-600">Cost:</p>
                      <p className="font-semibold text-yellow-600">
                        ₱{formData.total_electricity_amount}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Additional Charges */}
                <div className="p-5 bg-white">
                  <div className="flex items-center mb-3">
                    <span className="text-gray-500 mr-2">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                        />
                      </svg>
                    </span>
                    <h4 className="font-medium text-gray-800">
                      Additional Charges
                    </h4>
                  </div>

                  <div className="space-y-2 pl-7">
                    <div className="flex justify-between items-center text-sm">
                      <p className="text-gray-600">Rent Amount:</p>
                      <p className="font-medium">₱{formData.rent_amount}</p>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <p className="text-gray-600">Association Dues:</p>
                      <p className="font-medium">₱{formData.assoc_dues}</p>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <p className="text-gray-600">Penalties:</p>
                      <p className="font-medium text-red-600">
                        ₱{formData.penalty_amount}
                      </p>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <p className="text-gray-600">Discounts:</p>
                      <p className="font-medium text-green-600">
                        -₱{formData.discount_amount || 0}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Total Amount Due */}
                <div className="p-5 bg-gray-800 text-white">
                  <div className="flex justify-between items-center">
                    <p className="font-bold">Total Amount Due:</p>
                    <p className="font-bold text-xl">
                      ₱{formData.total_amount_due}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-between">
              <button
                onClick={() => setStep(1)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <span className="flex items-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 mr-1"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                  Previous
                </span>
              </button>

              <button
                onClick={handleSubmit}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                <span className="flex items-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 mr-1"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  Update Bill
                </span>
              </button>
            </div>
          </>
        )}
      </div>
  );
}
