"use client";

import { formatCurrency } from "@/utils/formatter/formatters";
import { useSubscriptionStore } from "@/zustand/subscriptionStore";

interface CheckoutPanelProps {
    onCheckout: () => void;
    onCancel: () => void;
}

export default function CheckoutPanel({ onCheckout, onCancel }: CheckoutPanelProps) {
    const { selectedPlan } = useSubscriptionStore();

    if (!selectedPlan) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">Checkout</h2>
                    <button 
                        onClick={onCancel}
                        className="text-gray-400 hover:text-gray-600 text-sm"
                    >
                        Cancel
                    </button>
                </div>

                <div className="space-y-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                        <h3 className="font-semibold text-lg">{selectedPlan.name}</h3>
                        {selectedPlan.bandRange && (
                            <p className="text-sm text-gray-500">
                                Unit range: {selectedPlan.bandRange}
                            </p>
                        )}
                    </div>

                    <div className="space-y-2 border-t pt-4">
                        <div className="flex justify-between text-gray-600">
                            <span>Plan Price</span>
                            <span>{formatCurrency(selectedPlan.price)}</span>
                        </div>
                        
                        <div className="flex justify-between font-bold text-lg">
                            <span>Total Due</span>
                            <span>{formatCurrency(selectedPlan.proratedAmount || selectedPlan.price)}</span>
                        </div>
                    </div>

                    <button
                        onClick={onCheckout}
                        className="w-full py-3 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition"
                    >
                        Proceed to Checkout
                    </button>
                </div>
            </div>
        </div>
    );
}