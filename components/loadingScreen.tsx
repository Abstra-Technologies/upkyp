"use client";

import { motion } from "framer-motion";

const LoadingScreen = ({ message = "Loading…" }) => {
    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden bg-white">

            {/* CENTER CONTENT */}
            <div className="relative z-10 flex flex-col items-center text-center px-4 sm:px-6">

                {/* LOGO */}
                <motion.div
                    className="relative mb-4 sm:mb-6"
                    animate={{
                        scale: [1, 1.05, 1],
                        opacity: [0.96, 1, 0.96],
                    }}
                    transition={{
                        duration: 1.8,
                        repeat: Infinity,
                        ease: "easeInOut",
                    }}
                >
                    <img
                        src="/upkyp_violet.png"
                        alt="Upkyp"
                        className="
              w-[clamp(3.5rem,12vw,6rem)]
              h-[clamp(3.5rem,12vw,6rem)]
              object-contain
              drop-shadow-[0_4px_12px_rgba(0,0,0,0.12)]
            "
                    />

                    {/* HALO (SOFT, NOT FLASHY) */}
                    <motion.div
                        className="absolute inset-0 -z-10 rounded-full blur-2xl
                       bg-gradient-to-br from-blue-400/30 to-emerald-400/30"
                        animate={{
                            opacity: [0.15, 0.28, 0.15],
                            scale: [1, 1.18, 1],
                        }}
                        transition={{
                            duration: 3.5,
                            repeat: Infinity,
                            ease: "easeInOut",
                        }}
                    />
                </motion.div>

                {/* BRAND */}
                <div>
                    <h1 className="text-xl sm:text-2xl md:text-3xl typographica font-semibold text-gray-900 tracking-tight mb-2 sm:mb-4">
                        Upkyp
                        <span className="block mt-0.5 text-xs sm:text-sm md:text-base font-medium text-gray-500">
                            Connect More. Manage Less.
                        </span>
                    </h1>
                </div>

                {/* LOADING DOTS */}
                <div className="flex gap-1.5 mt-3 sm:mt-4">
                    {[0, 1, 2].map((i) => (
                        <motion.div
                            key={i}
                            className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-blue-500"
                            animate={{
                                scale: [1, 1.4, 1],
                                opacity: [0.4, 1, 0.4],
                            }}
                            transition={{
                                duration: 1.2,
                                repeat: Infinity,
                                delay: i * 0.2,
                                ease: "easeInOut",
                            }}
                        />
                    ))}
                </div>

                {/* LOADING TEXT */}
                <motion.p
                    className="text-[10px] sm:text-xs md:text-sm text-gray-500 font-medium mt-2"
                    animate={{ opacity: [0.4, 1, 0.4] }}
                    transition={{ duration: 1.8, repeat: Infinity }}
                >
                    {message}
                </motion.p>
            </div>

            {/* FOOTER BRANDING */}
            <div className="absolute bottom-4 sm:bottom-6 z-10 flex flex-col items-center gap-1 px-4">
                <img
                    src="https://res.cloudinary.com/dptmeluy0/image/upload/v1764504569/abstra_dark_rvu7id.png"
                    alt="Myojin Information Technologies"
                    className="w-20 sm:w-28 opacity-70"
                />
                <p className="text-[9px] sm:text-[11px] text-gray-400 font-medium">
                    Myojin Information Technology Solutions | Property Management Platform
                </p>
            </div>
        </div>
    );
};

export default LoadingScreen;
