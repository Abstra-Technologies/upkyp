import {
    FaPowerOff,
    FaMotorcycle,
    FaGamepad,
    FaWifi,
    FaShieldAlt,
    FaFireExtinguisher,
    FaUtensils,
    FaPaw,
    FaConciergeBell,
    FaTruckMoving,
    FaWater,
    FaSmokingBan,
    FaDoorClosed
} from "react-icons/fa";

import {
    MdDirectionsCar,
    MdPool,
    MdFitnessCenter,
    MdSchool,
    MdElevator,
    MdLocalLaundryService,
    MdBalcony,
    MdAcUnit,
    MdMeetingRoom,
    MdKitchen,
    MdOutlineSecurity,
    MdOutlineStore,
    MdOutlineDeck
} from "react-icons/md";

import { GiPoolTableCorner } from "react-icons/gi";
import { LuCctv } from "react-icons/lu";
import { IoIosBicycle } from "react-icons/io";
import { PiSolarRoof } from "react-icons/pi";

export const AMENITIES_LIST = [
    // 🏊 Lifestyle
    { name: "Pool", icon: <MdPool /> },
    { name: "Gym", icon: <MdFitnessCenter /> },
    { name: "Game Room", icon: <FaGamepad /> },
    { name: "Pool Tables", icon: <GiPoolTableCorner /> },
    { name: "Rooftop Deck", icon: <PiSolarRoof /> },

    // 🧠 Work / Study
    { name: "Study Hub", icon: <MdSchool /> },
    { name: "Co-working Space", icon: <MdMeetingRoom /> },

    // 🚗 Parking
    { name: "Car Parking", icon: <MdDirectionsCar /> },
    { name: "Motorcycle Parking", icon: <FaMotorcycle /> },
    { name: "Bicycle Parking", icon: <IoIosBicycle /> },

    // 🔐 Security
    { name: "CCTV Surveillance", icon: <LuCctv /> },
    { name: "24/7 Security", icon: <FaShieldAlt /> },
    { name: "Fire Safety System", icon: <FaFireExtinguisher /> },
    { name: "Gated Community", icon: <MdOutlineSecurity /> },

    // ⚡ Utilities
    { name: "Elevator", icon: <MdElevator /> },
    { name: "Service Elevator", icon: <FaTruckMoving /> },
    { name: "Emergency Power/Generator", icon: <FaPowerOff /> },
    { name: "Air Conditioning", icon: <MdAcUnit /> },
    { name: "High-Speed Internet / WiFi", icon: <FaWifi /> },
    { name: "Water Supply", icon: <FaWater /> },

    // 🧺 Convenience
    { name: "Laundry Area", icon: <MdLocalLaundryService /> },
    { name: "Balcony", icon: <MdBalcony /> },
    { name: "Kitchen Area", icon: <FaUtensils /> },
    { name: "Built-in Kitchen", icon: <MdKitchen /> },
    { name: "Storage Room", icon: <FaDoorClosed /> },

    // 🏢 Services / Commercial
    { name: "Reception / Lobby", icon: <FaConciergeBell /> },
    { name: "Convenience Store", icon: <MdOutlineStore /> },

    // 🌿 Outdoor / Extras
    { name: "Garden / Open Space", icon: <MdOutlineDeck /> },

    // 🐾 Policies
    { name: "Pet-Friendly", icon: <FaPaw /> },
    { name: "Non-Smoking Property", icon: <FaSmokingBan /> },
];