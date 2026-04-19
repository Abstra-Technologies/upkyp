import Image from "next/image";

const PARTNERS = [
    { name: "Maya", logo: "https://res.cloudinary.com/dptmeluy0/image/upload/v1776579276/Maya_logo.svg_udbksl.png" },
    { name: "Visa", logo: "https://res.cloudinary.com/dptmeluy0/image/upload/v1770696300/VISA-Logo-2000_mlif2b.png" },
    { name: "Mastercard", logo: "https://res.cloudinary.com/dptmeluy0/image/upload/v1770696331/1280px-MasterCard_Logo.svg_hll6pb.png" },
    { name: "JCB", logo: "https://res.cloudinary.com/dptmeluy0/image/upload/v1770696384/JCB-logo-EmblemColor_whnqrc.png" },
    { name: "Grab Pay", logo: "https://res.cloudinary.com/dptmeluy0/image/upload/v1776579073/grabpay_logo-horizontal_white_ndwztl.png" },
    { name: "GCash", logo: "https://res.cloudinary.com/dptmeluy0/image/upload/v1770696620/GCash_logo_horizontal_o9bk4n.png" },
    { name: "QR PH", logo: "https://res.cloudinary.com/dptmeluy0/image/upload/v1776579719/qrph_lhoktn.png" },
    { name: "PESONet", logo: "https://res.cloudinary.com/dptmeluy0/image/upload/v1776579400/PESONet-logobase.net_asgxwm.svg" },
];

export default function PaymentPartnersBar() {
    return (
        <div className="w-full px-3 sm:px-4">
            <div className="
                hidden sm:block
                max-w-6xl mx-auto
                border border-white/20
                bg-white/10
                backdrop-blur-xl
                rounded-xl sm:rounded-2xl
                shadow-lg shadow-black/5
                px-4 sm:px-6
                py-3 sm:py-4
                text-center
            ">

                {/* Label + Badge */}
                <p className="flex items-center justify-center gap-2 text-center text-[11px] sm:text-xs text-white/80 mb-3 tracking-wide">
                    <span className="leading-tight">
                        Secure payments and disbursements supported through trusted partners. Powered by: Xendit Platform
                    </span>
                </p>

                {/* Logos - Centered */}
                <div className="
                    flex items-center justify-center
                    gap-4 sm:gap-6
                    flex-wrap
                    px-1
                ">
                    {PARTNERS.map((partner) => (
                        <div
                            key={partner.name}
                            className="
                                flex-shrink-0
                                px-2 sm:px-3 py-1
                                bg-white/10
                                rounded-md
                                backdrop-blur-sm
                                border border-white/10
                                hover:bg-white/20
                                transition-all duration-200
                            "
                        >
                            <Image
                                src={partner.logo}
                                alt={partner.name}
                                width={80}
                                height={32}
                                className="
                                    h-4 sm:h-5 md:h-6
                                    w-auto object-contain
                                    opacity-80 hover:opacity-100
                                    transition-opacity duration-200
                                "
                            />
                        </div>
                    ))}
                </div>

            </div>
        </div>
    );
}