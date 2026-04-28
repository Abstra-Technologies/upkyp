import { FaBuilding, FaWarehouse, FaHome, FaCity, FaHotel, FaHouseUser, FaUniversity } from "react-icons/fa";
import { BsFillBuildingsFill } from "react-icons/bs";

export const PROPERTY_TYPES = [
  { value: "apartment", label: "Apartment", icon: <FaBuilding /> },
  { value: "duplex", label: "Duplex", icon: <FaCity /> },
  { value: "townhouse", label: "Townhouse", icon: <FaHouseUser /> },
  { value: "house", label: "House", icon: <FaHome /> },
  { value: "warehouse", label: "Warehouse", icon: <FaWarehouse /> },
  { value: "office_space", label: "Office Space", icon: <FaUniversity /> },
  { value: "dormitory", label: "Dormitory", icon: <FaHotel /> },
  { value: "mix_property", label: "Mixed Property", icon: <BsFillBuildingsFill /> },

];