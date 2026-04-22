"use client";

import { useState, useEffect } from "react";

interface Property {
    property_id: string;
    property_name: string;
}

interface PropertyFilterProps {
    landlordId: string;
    onChange: (propertyId: string) => void;
}

export function PropertyFilter({ landlordId, onChange }: PropertyFilterProps) {
    const [properties, setProperties] = useState<Property[]>([]);
    const [selected, setSelected] = useState<string>("all");

    useEffect(() => {
        fetch(`/api/landlord/properties/getAllPropertieName`)
            .then((res) => res.json())
            .then((data) => setProperties(data))
            .catch((err) => console.error("Error fetching properties:", err));
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setSelected(e.target.value);
        onChange(e.target.value);
    };

    return (
        <div className="mb-4">
            <label className="block text-sm font-medium text-gray-600 mb-1">Select Property</label>
            <select
                value={selected}
                onChange={handleChange}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full"
            >
                <option value="all">All Properties</option>
                {properties.map((p) => (
                    <option key={p.property_id} value={p.property_id}>
                        {p.property_name}
                    </option>
                ))}
            </select>
        </div>
    );
}
