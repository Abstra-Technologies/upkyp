'use client';
import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { 
  FaMapMarkerAlt, 
  FaEye, 
  FaTimes, 
  FaHome,
  FaRuler,
  FaCouch,
  FaBed 
} from 'react-icons/fa';
import { MdVerified } from 'react-icons/md';
import { BsImageAlt } from 'react-icons/bs';

const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then(mod => mod.Marker), { ssr: false });
const Popup = dynamic(() => import('react-leaflet').then(mod => mod.Popup), { ssr: false });
import { useMap } from 'react-leaflet';

import 'leaflet/dist/leaflet.css';
import axios from 'axios';

// Center map to user's location
function FlyToUserLocation({ coords }) {
    const map = useMap();
    useEffect(() => {
        if (coords) {
            map.setView([coords.lat, coords.lng], 13);
        }
    }, [coords]);
    return null;
}

export default function PropertyMapPage() {
    const [userCoords, setUserCoords] = useState(null);
    const [properties, setProperties] = useState([]);
    const [selectedProperty, setSelectedProperty] = useState(null);
    const [selectedPropertyUnits, setSelectedPropertyUnits] = useState([]);
    const [userIcon, setUserIcon] = useState(null);
    const [propertyIcon, setPropertyIcon] = useState(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const L = require('leaflet');

            // Fix leaflet marker icons
            delete L.Icon.Default.prototype._getIconUrl;
            L.Icon.Default.mergeOptions({
                iconRetinaUrl: '/leaflet/marker-icon-2x.png',
                iconUrl: '/marker.png',
                shadowUrl: '/leaflet/marker-shadow.png',
            });

            // User location icon
            const userLocationIcon = new L.Icon({
                iconUrl: "/upkeep_blue_marker.png",
                iconSize: [50,50],
                iconAnchor: [16, 32],
                popupAnchor: [0, -32],
                className: 'animate-pulse',
            });
            setUserIcon(userLocationIcon);

            // Property marker icon
            const propIcon = new L.Icon({
                iconUrl: '/marker.png',
                iconSize: [25, 41],
                iconAnchor: [12, 41],
                popupAnchor: [1, -34],
            });
            setPropertyIcon(propIcon);
        }
    }, []);

    useEffect(() => {
        return () => {
            const containers = document.getElementsByClassName("leaflet-container");
            for (let i = 0; i < containers.length; i++) {
                containers[i]._leaflet_id = null;
            }
        };
    }, []);


    // Get user location
    useEffect(() => {
        if (typeof window !== 'undefined' && navigator.geolocation) {
            navigator.geolocation.getCurrentPosition((pos) => {
                setUserCoords({
                    lat: pos.coords.latitude,
                    lng: pos.coords.longitude,
                });
            });
        }
    }, []);

    // Load properties
    useEffect(() => {
        axios.get('/api/properties/findRent')
            .then((res) => {
                setProperties(res.data);
                setLoading(false);
            })
            .catch((err) => {
                console.error('Failed to fetch properties', err);
                setLoading(false);
            });
    }, []);

    // Fetch property units when a property is selected
    const handlePropertyClick = async (property) => {
        try {
            setSelectedProperty(property);
            const response = await axios.get(`/api/properties/findRent/viewPropertyDetails?id=${property.property_id}`);
            setSelectedPropertyUnits(response.data.units || []);
        } catch (error) {
            console.error('Failed to fetch property units:', error);
            setSelectedPropertyUnits([]);
        }
    };

    const handleViewUnitDetails = (unitId) => {
        router.push(`/pages/find-rent/${selectedProperty.property_id}/${unitId}`);
    };

    const handleViewPropertyDetails = () => {
        router.push(`/pages/find-rent/${selectedProperty.property_id}`);
    };

    const defaultCenter = userCoords || { lat: 14.5995, lng: 120.9842 };

    if (loading) {
        return (
            <div className="w-full h-[calc(100vh-64px)] flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
                    <p className="text-lg text-gray-600">Loading map...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full h-[calc(100vh-64px)] relative">
            {/* Map Container */}
            <MapContainer 
                center={defaultCenter} 
                zoom={13} 
                style={{ height: '100%', width: '100%' }}
            >
                <TileLayer
                    attribution='&copy; OpenStreetMap contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {/* User Location Marker */}
                {userCoords && userIcon && (
                    <Marker position={[userCoords.lat, userCoords.lng]} icon={userIcon}>
                        <Popup>
                            <div className="text-center p-2">
                                <strong>📍 You are here</strong>
                            </div>
                        </Popup>
                    </Marker>
                )}

                {/* Property Markers */}
                {properties
                    .filter(
                        (property) =>
                            !isNaN(parseFloat(property.latitude)) &&
                            !isNaN(parseFloat(property.longitude))
                    )
                    .map((property) => (
                        <Marker
                            key={property.property_id}
                            position={[parseFloat(property.latitude), parseFloat(property.longitude)]}
                            icon={propertyIcon}
                            eventHandlers={{
                                click: () => handlePropertyClick(property),
                            }}
                        >
                            <Popup>
                                <div className="w-64 p-2">
                                    <div className="flex items-center mb-2">
                                        <h3 className="font-bold text-gray-800 flex-1">
                                            {property.property_name}
                                        </h3>
                                        <MdVerified className="text-blue-500 ml-2" />
                                    </div>
                                    
                                    <p className="text-sm text-gray-600 mb-2">
                                        {property.street}, {property.city}, {property.province}
                                    </p>
                                    
                                    <p className="text-lg font-bold text-blue-600 mb-3">
                                        ₱{Math.round(property.rent_amount).toLocaleString()}/month
                                    </p>
                                    
                                    <button
                                        onClick={() => handlePropertyClick(property)}
                                        className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium"
                                    >
                                        View Units
                                    </button>
                                </div>
                            </Popup>
                        </Marker>
                    ))}

                <FlyToUserLocation coords={userCoords} />
            </MapContainer>

            {/* Property Details Sidebar */}
            {selectedProperty && (
                <div className="absolute top-0 right-0 w-80 h-full bg-white shadow-lg z-[1000] overflow-y-auto">
                    <div className="p-4 border-b border-gray-200 bg-blue-50">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-lg font-bold text-gray-800 flex items-center">
                                    {selectedProperty.property_name}
                                    <MdVerified className="text-blue-500 ml-2" />
                                </h2>
                                <p className="text-sm text-gray-600">
                                    {selectedProperty.city}, {selectedProperty.province}
                                </p>
                            </div>
                            <button
                                onClick={() => setSelectedProperty(null)}
                                className="text-gray-500 hover:text-gray-700 p-1"
                            >
                                <FaTimes />
                            </button>
                        </div>
                    </div>

                    <div className="p-4">
                        {/* Property Image */}
                        {selectedProperty.property_photo ? (
                            <div className="relative h-40 rounded-lg overflow-hidden mb-4">
                                <Image
                                    src={selectedProperty.property_photo}
                                    alt={selectedProperty.property_name}
                                    fill
                                    className="object-cover"
                                />
                            </div>
                        ) : (
                            <div className="h-40 bg-gray-100 rounded-lg flex items-center justify-center mb-4">
                                <BsImageAlt className="text-3xl text-gray-400" />
                            </div>
                        )}

                        {/* Property Info */}
                        <div className="mb-4">
                            <div className="flex items-center gap-2 mb-2">
                                <FaHome className="text-blue-500" />
                                <span className="font-medium">Property Type:</span>
                                <span className="text-gray-600 capitalize">
                                    {selectedProperty.property_type}
                                </span>
                            </div>
                            
                            {selectedProperty.flexipay_enabled === 1 && (
                                <div className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-600 text-xs rounded-full mb-3">
                                    <span>FlexiPay Available</span>
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                            )}
                        </div>

                        {/* View Property Button */}
                        <button
                            onClick={handleViewPropertyDetails}
                            className="w-full py-2 mb-4 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200 transition font-medium"
                        >
                            View Property Details
                        </button>

                        {/* Units List */}
                        <div>
                            <h3 className="font-bold text-gray-800 mb-3">Available Units</h3>
                            
                            {selectedPropertyUnits.length === 0 ? (
                                <p className="text-gray-500 text-center py-4">Loading units...</p>
                            ) : (
                                <div className="space-y-3">
                                    {selectedPropertyUnits.map((unit) => {
                                        const isOccupied = unit.status === "occupied";
                                        return (
                                            <div
                                                key={unit.unit_id}
                                                className={`border rounded-lg p-3 ${
                                                    isOccupied 
                                                        ? "border-red-200 bg-red-50" 
                                                        : "border-green-200 bg-green-50"
                                                }`}
                                            >
                                                <div className="flex justify-between items-start mb-2">
                                                    <h4 className="font-semibold text-gray-800">
                                                        Unit {unit.unit_name}
                                                    </h4>
                                                    <span
                                                        className={`px-2 py-1 text-xs rounded-full ${
                                                            isOccupied
                                                                ? "bg-red-100 text-red-600"
                                                                : "bg-green-100 text-green-600"
                                                        }`}
                                                    >
                                                        {isOccupied ? "Occupied" : "Available"}
                                                    </span>
                                                </div>

                                                <div className="space-y-1 text-sm text-gray-600 mb-3">
                                                    <div className="flex items-center gap-2">
                                                        <FaRuler className="text-gray-400" />
                                                        <span>{unit.unit_size} sqm</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <FaCouch className="text-gray-400" />
                                                        <span className="capitalize">
                                                            {unit.furnish.replace(/_/g, ' ')}
                                                        </span>
                                                    </div>
                                                    {unit.bed_spacing !== 0 && (
                                                        <div className="flex items-center gap-2">
                                                            <FaBed className="text-gray-400" />
                                                            <span>{unit.avail_beds} beds available</span>
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="flex justify-between items-center">
                                                    <span className="font-bold text-blue-600">
                                                        ₱{unit.rent_amount.toLocaleString()}/month
                                                    </span>
                                                    <button
                                                        onClick={() => handleViewUnitDetails(unit.unit_id)}
                                                        className={`px-3 py-1 text-xs rounded-lg font-medium flex items-center gap-1 ${
                                                            isOccupied
                                                                ? "bg-gray-200 text-gray-600"
                                                                : "bg-blue-600 text-white hover:bg-blue-700"
                                                        }`}
                                                    >
                                                        <FaEye />
                                                        View Details
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Map Controls/Legend */}
            <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg p-4 z-[1000]">
                <h3 className="font-bold text-gray-800 mb-2">Map Legend</h3>
                <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                        <span>Your Location</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <FaMapMarkerAlt className="text-red-500" />
                        <span>Properties</span>
                    </div>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                    Click on property markers to view units
                </p>
            </div>
        </div>
    );
}