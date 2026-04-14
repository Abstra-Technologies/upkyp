"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    TextField,
    TableSortLabel,
    CircularProgress,
} from "@mui/material";
import LoadingScreen from "../../../../components/loadingScreen";
import SideNavAdmin from "../../../../components/navigation/sidebar-admin";

export default function PropertyList() {
    const [properties, setProperties] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });

    const router = useRouter();

    useEffect(() => {
        async function fetchProperties() {
            try {
                const res = await fetch("/api/systemadmin/propertyListings/getAllProperties");
                const data = await res.json();

                if (!data.properties.length) {
                    setError("No properties found.");
                } else {
                    setProperties(data.properties);
                }
            } catch (err) {
                setError("Failed to load properties.");
            }
            setLoading(false);
        }

        fetchProperties();
    }, []);

    // Handle sorting logic
    const requestSort = (key) => {
        let direction = "asc";
        if (sortConfig.key === key && sortConfig.direction === "asc") {
            direction = "desc";
        }
        setSortConfig({ key, direction });
    };

    // Apply filtering and sorting
    const filteredAndSortedProperties = properties
        .filter(
            (property) =>
                property.property_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                property.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (property.verification_status &&
                    property.verification_status.toLowerCase().includes(searchTerm.toLowerCase()))
        )
        .sort((a, b) => {
            if (!sortConfig.key) return 0;

            const aValue = a[sortConfig.key];
            const bValue = b[sortConfig.key];

            if (aValue < bValue) {
                return sortConfig.direction === "asc" ? -1 : 1;
            }
            if (aValue > bValue) {
                return sortConfig.direction === "asc" ? 1 : -1;
            }
            return 0;
        });

    if (loading) return <LoadingScreen />;

    return (
        <div className="bg-gray-50 min-h-screen flex">
            <SideNavAdmin />
            <div className="flex-1 px-4 sm:px-6 lg:px-8 py-8">
                <h1 className="text-2xl font-bold text-blue-600">Property Listings</h1>
                <p className="mt-1 text-sm text-gray-500">
                    Manage and view all property listings in your system.
                </p>

                {/* Search Bar */}
                <div className="mt-4">
                    <TextField
                        label="Search properties..."
                        variant="outlined"
                        fullWidth
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                {error ? (
                    <div className="mt-8 bg-red-50 border border-red-200 rounded-md p-4">
                        <h3 className="text-sm font-medium text-red-800">{error}</h3>
                    </div>
                ) : (
                    <div className="mt-8">
                        <TableContainer component={Paper}>
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        {[
                                            { key: "property_id", label: "ID" },
                                            { key: "property_name", label: "Name" },
                                            { key: "city", label: "City" },
                                            { key: "verification_status", label: "Status" },
                                            { key: "actions", label: "Actions" },
                                        ].map((column) => (
                                            <TableCell key={column.key} align="center">
                                                {column.key !== "actions" ? (
                                                    <TableSortLabel
                                                        active={sortConfig.key === column.key}
                                                        direction={sortConfig.key === column.key ? sortConfig.direction : "asc"}
                                                        onClick={() => requestSort(column.key)}
                                                    >
                                                        {column.label}
                                                    </TableSortLabel>
                                                ) : (
                                                    column.label
                                                )}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                </TableHead>

                                <TableBody>
                                    {filteredAndSortedProperties.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} align="center">
                                                No properties match your search criteria.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        filteredAndSortedProperties.map((property) => (
                                            <TableRow key={property.property_id} hover>
                                                <TableCell align="center">{property.property_id}</TableCell>
                                                <TableCell align="center">{property.property_name}</TableCell>
                                                <TableCell align="center">{property.city}</TableCell>
                                                <TableCell align="center">
                                                    <StatusBadge status={property.verification_status} />
                                                </TableCell>
                                                <TableCell align="center">
                                                    <button
                                                        onClick={() => router.push(`./details/${property.property_id}`)}
                                                        className="text-blue-600 hover:text-blue-900"
                                                    >
                                                        View Details
                                                    </button>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </div>
                )}
            </div>
        </div>
    );
}

const StatusBadge = ({ status }) => {
    let color = "default";

    switch (status) {
        case "Verified":
            color = "success";
            break;
        case "Rejected":
            color = "error";
            break;
        case "In Review":
            color = "info";
            break;
        default:
            color = "warning";
    }

    return (
        <span
            className={`px-3 py-1 rounded-full text-xs font-medium ${
                color === "success"
                    ? "bg-green-100 text-green-800"
                    : color === "error"
                        ? "bg-red-100 text-red-800"
                        : color === "info"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-gray-100 text-gray-800"
            }`}
        >
      {status || "Pending"}
    </span>
    );
};
