"use client";

export default function ConfigRequiredModal({
                                                configModal,
                                                setConfigModal,
                                                router,
                                                property_id,
                                            }: any) {
    if (!configModal) return null;

    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white w-11/12 max-w-md p-6 rounded-xl shadow-xl">
                <h2 className="text-lg font-bold text-gray-900">
                    Property Configuration Required
                </h2>

                <p className="text-sm text-gray-600 mt-2">
                    Billing features are locked until this property's configuration is set.
                </p>

                <div className="flex justify-end mt-5 gap-2">
                    <button
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold"
                        onClick={() => setConfigModal(false)}
                    >
                        Close
                    </button>

                    <button
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold"
                        onClick={() =>
                            router.push(
                                `/landlord/properties/${property_id}/configurations?id=${property_id}`
                            )
                        }
                    >
                        Go to Configuration
                    </button>
                </div>
            </div>
        </div>
    );
}
