// components/payout/PayoutModal.tsx
"use client";

export default function PayoutModal({
                                        open,
                                        onClose,
                                        properties,
                                    }: any) {
    if (!open) return null;

    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
            <div className="bg-white p-6 rounded-xl w-full max-w-md">
                <h2 className="font-bold mb-4">Assigned Properties</h2>

                {properties.length === 0 ? (
                    <p className="text-sm text-gray-500">No properties</p>
                ) : (
                    properties.map((p: any) => (
                        <div key={p.property_id} className="border p-2 rounded">
                            {p.property_name}
                        </div>
                    ))
                )}

                <button onClick={onClose} className="mt-4 w-full">
                    Close
                </button>
            </div>
        </div>
    );
}