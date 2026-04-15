import Image from "next/image";

const PARTNERS = [
    { name: "Xendit", logo: "https://res.cloudinary.com/dptmeluy0/image/upload/v1770697315/Xendit_colorbg_2x_zeyfzn.png" },
    { name: "Maya", logo: "https://res.cloudinary.com/dptmeluy0/image/upload/v1770695913/maya_blejpd.jpg" },
    { name: "Visa", logo: "https://res.cloudinary.com/dptmeluy0/image/upload/v1770696300/VISA-Logo-2000_mlif2b.png" },
    { name: "Mastercard", logo: "https://res.cloudinary.com/dptmeluy0/image/upload/v1770696331/1280px-MasterCard_Logo.svg_hll6pb.png" },
    { name: "JCB", logo: "https://res.cloudinary.com/dptmeluy0/image/upload/v1770696384/JCB-logo-EmblemColor_whnqrc.png" },
    { name: "Grab Pay", logo: "https://res.cloudinary.com/dptmeluy0/image/upload/v1770696520/grabpay_horizontal-logo_brandlogos.net_cdivk-scaled_q6pia1.png" },
    { name: "GCash", logo: "https://res.cloudinary.com/dptmeluy0/image/upload/v1770696620/GCash_logo_horizontal_o9bk4n.png" },
    { name: "QR PH", logo: "https://res.cloudinary.com/dptmeluy0/image/upload/v1770696715/QR_Ph_Logo_txzjlv.jpg" },
    { name: "BPI", logo: "https://res.cloudinary.com/dptmeluy0/image/upload/v1770696743/BPI-New-Logo-2024-Insert-v2_ydabxb.jpg" },
    { name: "RCBC", logo: "https://res.cloudinary.com/dptmeluy0/image/upload/v1770696901/RCBC-3-scaled-1_gvpwvq.jpg" },
    { name: "PESONET", logo: "https://res.cloudinary.com/dptmeluy0/image/upload/v1770696949/pesonet-logo_zy7o09.jpg" },
    { name: "MetroBank", logo: "https://res.cloudinary.com/dptmeluy0/image/upload/v1770696989/Metrobank_2018_02_01_18_46_06_euomsy.jpg" },
];

export default function PaymentPartnersBar() {
    return (
        <div className="w-full border-b border-gray-200/60 bg-white/70 backdrop-blur-md">
            <div className="max-w-7xl mx-auto px-4 py-2">

                {/* Label */}
                <p className="text-center text-xs text-gray-500 mb-2 tracking-wide">
                    Secure payments and disbursements supported through trusted partners
                </p>

                {/* Logos */}
                <div className="flex flex-wrap justify-center items-center gap-x-4 gap-y-2 sm:gap-x-6">
                    {PARTNERS.map((partner) => (
                        <Image
                            key={partner.name}
                            src={partner.logo}
                            alt={partner.name}
                            width={80}
                            height={32}
                            className="h-5 sm:h-6 w-auto object-contain opacity-80 hover:opacity-100 transition-opacity duration-200"
                        />
                    ))}
                </div>

            </div>
        </div>
    );
}