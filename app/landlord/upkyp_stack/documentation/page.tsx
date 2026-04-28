
import Link from "next/link";

export default function ApiDocsPage() {
    const apis = [
        {
            name: "Billing API",
            description: "Create and manage tenant billing records.",
            href: "/upkyp_stack/docs/billing",
        },
        {
            name: "Units API",
            description: "Retrieve and manage property units.",
            href: "/upkyp_stack/docs/units",
        },
        {
            name: "Tenant API",
            description: "Access tenant data and profiles.",
            href: "/upkyp_stack/docs/tenant",
        },
    ];

    return (
        <div className="px-5 py-6 md:p-8 max-w-5xl mx-auto">

            {/* HEADER */}
            <div className="mb-8">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                    API Documentation
                </h1>
                <p className="text-gray-500 mt-2 text-sm md:text-base">
                    Explore available APIs in Upkyp Stack.
                </p>
            </div>

            {/* API LIST */}
            <div className="grid sm:grid-cols-2 gap-4">
                {apis.map((api) => (
                    <Link
                        key={api.name}
                        href={api.href}
                        className="p-5 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md hover:border-blue-200 transition group"
                    >
                        <h2 className="font-semibold text-gray-800 group-hover:text-blue-600">
                            {api.name}
                        </h2>

                        <p className="text-sm text-gray-500 mt-1">
                            {api.description}
                        </p>

                        <span className="text-xs text-emerald-600 mt-3 inline-block">
              View Docs →
            </span>
                    </Link>
                ))}
            </div>
        </div>
    );
}