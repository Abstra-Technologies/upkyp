"use client";

import HTMLFlipBook from "react-pageflip";
import {Component} from "react";
import CoverPage from "@/components/digital_passport/cover";
import InfoPage from "@/components/digital_passport/InfoPage";
import useAuthStore from "@/zustand/authStore";




export default function HestiaRentPassport() {
    const { user } = useAuthStore();

    // @ts-ignore
    return (
        <div className="flex justify-center items-center min-h-screen bg-gray-100">
            <HTMLFlipBook
                width={400}
                height={600}
                size="fixed"
                minWidth={315}
                maxWidth={1000}
                minHeight={420}
                maxHeight={1350}
                maxShadowOpacity={0.5}
                showCover={true}
                mobileScrollSupport={true}
                className="shadow-lg" style={undefined} children={undefined} startPage={0} drawShadow={false}
                >
                <div className="page1"><CoverPage /></div>
                <div className="page2"><InfoPage /></div>



            </HTMLFlipBook>
        </div>
    );
}
