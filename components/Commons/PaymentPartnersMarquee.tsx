"use client";

import Image from "next/image";

const PARTNERS = [
    {
        name: "Xendit",
        logo: "https://res.cloudinary.com/dptmeluy0/image/upload/v1770697315/Xendit_colorbg_2x_zeyfzn.png",
    },
    {
        name: "Maya",
        logo: "https://res.cloudinary.com/dptmeluy0/image/upload/v1770695913/maya_blejpd.jpg",
    },
    {
        name: "Visa",
        logo: "https://res.cloudinary.com/dptmeluy0/image/upload/v1770696300/VISA-Logo-2000_mlif2b.png",
    },
    {
        name: "Mastercard",
        logo: "https://res.cloudinary.com/dptmeluy0/image/upload/v1770696331/1280px-MasterCard_Logo.svg_hll6pb.png",
    },
    {
        name: "JCB",
        logo: "https://res.cloudinary.com/dptmeluy0/image/upload/v1770696384/JCB-logo-EmblemColor_whnqrc.png",
    },
    {
        name: "Grab Pay",
        logo: "https://res.cloudinary.com/dptmeluy0/image/upload/v1770696520/grabpay_horizontal-logo_brandlogos.net_cdivk-scaled_q6pia1.png",
    },
    {
        name: "G-Cash",
        logo: "https://res.cloudinary.com/dptmeluy0/image/upload/v1770696620/GCash_logo_horizontal_o9bk4n.png",
    },
    {
        name: "Maya",
        logo: "https://res.cloudinary.com/dptmeluy0/image/upload/v1770695913/maya_blejpd.jpg",
    },
    {
        name: "QR PH",
        logo: "https://res.cloudinary.com/dptmeluy0/image/upload/v1770696715/QR_Ph_Logo_txzjlv.jpg",
    },
    {
        name: "BPI",
        logo: "https://res.cloudinary.com/dptmeluy0/image/upload/v1770696743/BPI-New-Logo-2024-Insert-v2_ydabxb.jpg",
    },
    // {
    //     name: "Union Bank",
    //     logo: "https://res.cloudinary.com/dptmeluy0/image/upload/v1770696800/UnionBank-jpg_xoqkb3.webp",
    // },
    // {
    //     name: "China Bank",
    //     logo: "https://res.cloudinary.com/dptmeluy0/image/upload/v1770696849/Chinabank_hnkog3.png",
    // },
    {
        name: "RCBC",
        logo: "https://res.cloudinary.com/dptmeluy0/image/upload/v1770696901/RCBC-3-scaled-1_gvpwvq.jpg",
    },
    {
        name: "PESONET",
        logo: "https://res.cloudinary.com/dptmeluy0/image/upload/v1770696949/pesonet-logo_zy7o09.jpg",
    },
    {
        name: "MetroBank",
        logo: "https://res.cloudinary.com/dptmeluy0/image/upload/v1770696989/Metrobank_2018_02_01_18_46_06_euomsy.jpg",
    },
    // {
    //     name: "Security Bank",
    //     logo: "https://res.cloudinary.com/dptmeluy0/image/upload/v1770697031/The_Security_Bank_Logo_1_dntncm.jpg",
    // },
    // {
    //     name: "PNB",
    //     logo: "https://res.cloudinary.com/dptmeluy0/image/upload/v1770697071/328-3289781_philippine-national-bank-president-reynaldo-a-pnb-life-insurance-logo_ft8jrc.jpg",
    // },
];

export default function PaymentPartnersMarquee() {
    return (
        <div className="w-full overflow-hidden">
            {/* Glass Wrapper */}
            <div className="relative backdrop-blur-lg bg-white/5 border border-white/15">
                {/* Headline */}
                <p className="py-2 text-center text-[11px] sm:text-sm font-medium text-white/80 tracking-wide">
                    Pay your rent more conveniently through our partner channels
                </p>

                {/* Marquee */}
                <div className="relative overflow-hidden">
                    <div className="marquee flex items-center">
                        {/* Loop A */}
                        <div className="marquee__group">
                            {PARTNERS.map((partner, index) => (
                                <div
                                    key={`a-${index}`}
                                    className="flex items-center justify-center px-4 sm:px-8"
                                >
                                    <Image
                                        src={partner.logo}
                                        alt={partner.name}
                                        width={120}
                                        height={50}
                                        className="h-6 sm:h-8 md:h-9 w-auto object-contain opacity-80 hover:opacity-100 transition-opacity duration-300"
                                        sizes="120px"
                                        priority={index < 6}
                                    />
                                </div>
                            ))}
                        </div>

                        {/* Loop B */}
                        <div className="marquee__group">
                            {PARTNERS.map((partner, index) => (
                                <div
                                    key={`b-${index}`}
                                    className="flex items-center justify-center px-4 sm:px-8"
                                >
                                    <Image
                                        src={partner.logo}
                                        alt={partner.name}
                                        width={120}
                                        height={50}
                                        className="h-6 sm:h-8 md:h-9 w-auto object-contain opacity-80 hover:opacity-100 transition-opacity duration-300"
                                        sizes="120px"
                                        priority={index < 6}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}