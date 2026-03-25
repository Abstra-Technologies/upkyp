import { FaDog, FaSmoking, FaUtensils, FaClock, FaUserFriends, FaFemale,FaMale   } from "react-icons/fa";
import { PiStudentBold } from "react-icons/pi";

export const PROPERTY_PREFERENCES = [
  { key: "petFriendly", label: "Pets Allowed", icon: FaDog },
  { key: "smokingAllowed", label: "Smoking Allowed", icon: FaSmoking },
  { key: "hasCurfew", label: "Has Curfew", icon: FaClock },
  { key: "visitorsAllowed", label: "Visitors Allowed", icon: FaUserFriends },
    { key: "femaleOnly", label: "Female Only", icon: FaFemale  },
    { key: "maleOnly", label: "Male Only", icon: FaMale   },
    { key: "studentsOnly", label: "Students Only", icon: PiStudentBold  },

    { key: "visitorsAllowed", label: "Visitors Allowed", icon: FaUserFriends },

];
