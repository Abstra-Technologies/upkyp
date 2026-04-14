"use client";

import { useParams } from "next/navigation";
import ProfilePageAdmin from "../../../../components/adminProfile";
import { useState, useEffect } from "react";
import axios from "axios";

export default function AdminProfile() {
    return (
        <ProfilePageAdmin />
    );
}
