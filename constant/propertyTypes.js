import { FaHome, FaBuilding } from "react-icons/fa";
import { MdApartment, MdWarehouse } from "react-icons/md";
import { IoBusiness } from "react-icons/io5";
import { BsBuildings } from "react-icons/bs";

export const PROPERTY_TYPES = [
  { value: "residential", label: "Residential", icon: <FaHome /> },
  { value: "commercial", label: "Commercial", icon: <FaBuilding /> },
  { value: "mixed", label: "Mixed Use", icon: <BsBuildings /> },
];

export const PROPERTY_SUBTYPES = {
  residential: [
    { value: "Apartment", label: "Apartment", icon: <MdApartment /> },
    { value: "House", label: "House", icon: <FaHome /> },
    { value: "Townhouse", label: "Townhouse", icon: <FaBuilding /> },
    { value: "Condominium", label: "Condominium", icon: <FaBuilding /> },
    { value: "Duplex", label: "Duplex", icon: <BsBuildings /> },
    { value: "Dormitory", label: "Dormitory", icon: <FaHome /> },
  ],
  commercial: [
    { value: "Office Space", label: "Office Space", icon: <IoBusiness /> },
    { value: "Warehouse", label: "Warehouse", icon: <MdWarehouse /> },
    { value: "Retail Unit", label: "Retail Unit", icon: <FaBuilding /> },
    { value: "Industrial Space", label: "Industrial Space", icon: <MdWarehouse /> },
  ],
  mixed: [
    { value: "Mixed Use", label: "Mixed Use", icon: <BsBuildings /> },
  ],
};