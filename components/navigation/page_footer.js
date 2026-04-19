import Link from "next/link";
import {
  FaFacebookF,
  FaTwitter,
  FaInstagram,
  FaLinkedinIn,
} from "react-icons/fa";

const Page_footer = () => {
  // Social links mapping
  const socialLinks = [
    {
      icon: FaFacebookF,
      href: "https://www.facebook.com/profile.php?id=61577142699570",
    },
    { icon: FaTwitter, href: "https://twitter.com/upkyp" },
    { icon: FaInstagram, href: "https://www.instagram.com/upkypp/" },
    { icon: FaLinkedinIn, href: "https://www.linkedin.com/company/\n" +
            "abstra-technologies-corporation\n" },
  ];

  return (
    <footer className="bg-gradient-to-r from-blue-600 to-emerald-600 text-white relative overflow-hidden">
      {/* Decorative blurred circles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -right-24 w-80 h-80 bg-white/5 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-white/5 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* TOP: Logo + description + social */}
          <div className="flex flex-col items-center text-center mb-8 sm:mb-12">

              {/* Logo + Kanso */}
              <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                  <Link
                      href="/"
                      className="text-3xl sm:text-4xl font-bold select-none hover:scale-105 transition-transform duration-200"
                  >
                      Upkyp
                  </Link>

                  {/* Kanso Logo */}
                  <div className="bg-white px-1.5 py-0.5 rounded-md flex items-center justify-center">
                      <img
                          src="https://res.cloudinary.com/dptmeluy0/image/upload/v1776576592/upkyp_stack_qrnjuy.png"
                          alt="Kanso Labs"
                          className="h-4 sm:h-5 w-auto object-contain"
                      />
                  </div>
              </div>

              <p className="text-white/90 text-xs sm:text-sm max-w-md leading-relaxed mb-4 sm:mb-6 px-4">
                  Finding your perfect rental property has never been easier. Your
                  trusted partner in modern property management.
              </p>

              <div className="flex space-x-3 sm:space-x-4">
                  {socialLinks.map((social, index) => {
                      const Icon = social.icon;
                      return (
                          <Link
                              key={index}
                              href={social.href}
                              target="_blank"
                              rel="noopener noreferrer"
                              aria-label={`Link to ${social.href}`}
                              className="w-9 h-9 sm:w-10 sm:h-10 bg-white/10 hover:bg-white/20 rounded-lg flex items-center justify-center transition-all duration-200 hover:scale-110 border border-white/20 backdrop-blur-sm"
                          >
                              <Icon className="text-white text-xs sm:text-sm" />
                          </Link>
                      );
                  })}
              </div>
          </div>
        {/* LINK SECTIONS — 2 columns on mobile, 4 on large */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-10 text-center sm:text-left mb-8 sm:mb-0">
          {/* Product */}
          <div>
            <h3 className="text-xs sm:text-sm font-semibold uppercase tracking-wider mb-2 sm:mb-3">
              Product
            </h3>
            <ul className="space-y-1.5 sm:space-y-2">
              <li>
                <Link
                  href="/find-rent"
                  className="text-white/80 hover:text-white text-xs sm:text-sm transition-colors duration-150"
                >
                  Find Rent
                </Link>
              </li>
              <li>
                <Link
                  href="/partner"
                  className="text-white/80 hover:text-white text-xs sm:text-sm transition-colors duration-150"
                >
                  Become a Partner
                </Link>
              </li>
              <li>
                <Link
                  href="/public/download"
                  className="text-white/80 hover:text-white text-xs sm:text-sm transition-colors duration-150"
                >
                  Download App
                </Link>
              </li>
              <li>
                <Link
                  href="/about-us"
                  className="text-white/80 hover:text-white text-xs sm:text-sm transition-colors duration-150"
                >
                  About Us
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-xs sm:text-sm font-semibold uppercase tracking-wider mb-2 sm:mb-3">
              Company
            </h3>
            <ul className="space-y-1.5 sm:space-y-2">
              <li>
                <Link
                  href="/about-us"
                  className="text-white/80 hover:text-white text-xs sm:text-sm transition-colors duration-150"
                >
                  About
                </Link>
              </li>
              <li>
                <Link
                  href="/contact-us"
                  className="text-white/80 hover:text-white text-xs sm:text-sm transition-colors duration-150"
                >
                  Contact
                </Link>
              </li>
              <li>
                <Link
                  href="/public/support"
                  className="text-white/80 hover:text-white text-xs sm:text-sm transition-colors duration-150"
                >
                  Support
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-xs sm:text-sm font-semibold uppercase tracking-wider mb-2 sm:mb-3">
              Legal
            </h3>
            <ul className="space-y-1.5 sm:space-y-2">
              <li>
                <Link
                  href="/public/privacy"
                  className="text-white/80 hover:text-white text-xs sm:text-sm transition-colors duration-150"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  href="/public/terms-services"
                  className="text-white/80 hover:text-white text-xs sm:text-sm transition-colors duration-150"
                >
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link
                  href="/public/eula"
                  className="text-white/80 hover:text-white text-xs sm:text-sm transition-colors duration-150"
                >
                  EULA
                </Link>
              </li>
              <li>
                <Link
                  href="/public/refund"
                  className="text-white/80 hover:text-white text-xs sm:text-sm transition-colors duration-150"
                >
                  Refund Policy
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact — Full width on mobile */}
          <div className="col-span-2 sm:col-span-1">
            <h3 className="text-xs sm:text-sm font-semibold uppercase tracking-wider mb-2 sm:mb-3">
              Contact
            </h3>

            <div className="text-white/80 text-xs sm:text-sm space-y-1.5 sm:space-y-2 leading-relaxed">
              <p>Manila, Philippines</p>
              <p>abstra.technologies@gmail.com</p>
              <p>+63 921 321 88888</p>
            </div>
          </div>
        </div>

        {/* Footer bottom area */}
          <div className="border-t border-white/20 mt-8 sm:mt-12 pt-4 sm:pt-6">
              <div className="flex flex-col md:flex-row justify-between items-center text-center md:text-left gap-4 sm:gap-6">

                  {/* Left Section */}
                  <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4">
                      <p className="text-white/80 text-xs sm:text-sm">
                          © 2025 Upkyp. All rights reserved.
                      </p>

                      {/* Kanso Labs Branding */}
                      <div className="flex items-center gap-2">
                          <div className="bg-white rounded-full p-1 flex items-center justify-center">
                              <img
                                  src="https://res.cloudinary.com/dptmeluy0/image/upload/v1776576592/upkyp_stack_qrnjuy.png"
                                  alt="Kanso Labs"
                                  className="h-4 sm:h-5 w-auto opacity-80 hover:opacity-100 transition-opacity duration-150"
                              />
                          </div>

                          <span className="text-white/60 text-xs sm:text-sm">
    by Kanso Labs
  </span>
                      </div>
                  </div>

                  {/* Right Section */}
                  <div className="flex items-center space-x-4 sm:space-x-6">
                      <Link
                          href="/privacy-policy"
                          className="text-white/80 hover:text-white text-xs sm:text-sm transition-colors duration-150"
                      >
                          Privacy Policy
                      </Link>
                      <span className="text-white/40">·</span>
                      <Link
                          href="/public/terms-services"
                          className="text-white/80 hover:text-white text-xs sm:text-sm transition-colors duration-150"
                      >
                          Terms of Service
                      </Link>
                  </div>
              </div>
          </div>
          {/* Huge Background Watermark */}
          <div className="pointer-events-none absolute inset-0 flex items-end justify-center overflow-hidden">
              <h1
                  className="
      font-extrabold tracking-tight
      text-white/5
      select-none
      whitespace-nowrap
      leading-none
      text-[20vw] sm:text-[15vw] lg:text-[12vw]
      translate-y-100
    "
              >
                  Kanso Labs
              </h1>
          </div>
      </div>
    </footer>
  );
};

export default Page_footer;
