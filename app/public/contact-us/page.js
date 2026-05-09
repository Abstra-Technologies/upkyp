import {
  Facebook,
  Twitter,
  Linkedin,
  Mail,
  Phone,
  MapPin,
  Clock,
} from "lucide-react";
import Image from "next/image";
import Page_footer from "@/components/navigation/page_footer";

export default function Contact() {
  return (
    <>
      <div className="relative min-h-screen bg-gradient-to-br from-blue-900 via-emerald-700 to-emerald-500 overflow-hidden">
        {/* Background Image */}
        <Image
          src="/images/hero-section.jpeg"
          alt="Contact background"
          fill
          priority
          className="object-cover brightness-75"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/80 via-emerald-800/70 to-emerald-600/70" />

        {/* Subtle pattern overlay */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.015]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />

        {/* Main Content */}
        <main className="relative z-10 flex items-center justify-center min-h-screen px-4 sm:px-6 lg:px-8 py-16">
          <div className="w-full max-w-2xl">
            {/* Header */}
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 px-4 py-2 rounded-full mb-6">
                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                <span className="text-white text-sm font-medium">
                  We're here to help
                </span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-4 drop-shadow-lg">
                Get in Touch
              </h1>
              <p className="text-lg text-blue-50/90 max-w-2xl mx-auto">
                Have questions about Upkyp? Our team is ready to assist you with
                property management solutions.
              </p>
            </div>

            {/* Contact Card */}
            <div className="bg-white/90 backdrop-blur-lg rounded-2xl shadow-2xl p-8 sm:p-10 lg:p-12 border border-white/30">
              <h2 className="text-2xl font-bold text-gray-800 mb-8 flex items-center gap-2">
                <Mail className="text-blue-600" size={24} />
                Contact Information
              </h2>

              <div className="space-y-6">
                {/* Email */}
                <div className="group">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                    Email
                  </p>
                  <a
                    href="mailto:abstra.technologies@gmail.com"
                    className="text-lg text-gray-700 hover:text-blue-600 transition-colors flex items-center gap-3"
                  >
                    <Mail
                      size={20}
                      className="text-gray-400 group-hover:text-blue-600 transition-colors"
                    />
                    abstra.technologies@gmail.com
                  </a>
                </div>

                {/* Phone */}
                <div className="group">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                    Phone
                  </p>
                  <a
                    href="tel:+639213218888"
                    className="text-lg text-gray-700 hover:text-blue-600 transition-colors flex items-center gap-3"
                  >
                    <Phone
                      size={20}
                      className="text-gray-400 group-hover:text-blue-600 transition-colors"
                    />
                    +63 921 321 8888
                  </a>
                </div>

                {/* Location */}
                <div className="group">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                    Location
                  </p>
                  <div className="text-lg text-gray-700 flex items-center gap-3">
                    <MapPin size={20} className="text-gray-400" />
                    Manila City, Philippines
                  </div>
                </div>

                {/* Business Hours */}
                <div className="group">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                    Business Hours
                  </p>
                  <div className="text-lg text-gray-700 flex items-center gap-3">
                    <Clock size={20} className="text-gray-400" />
                    Monday - Friday, 9AM - 6PM PHT
                  </div>
                </div>
              </div>

              {/* Divider */}
              <div className="my-8 border-t border-gray-200" />

              {/* Social Media */}
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-4">
                  Follow Us
                </p>
                <div className="flex gap-3">
                  <a
                    href="https://facebook.com/example"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center w-12 h-12 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white transition-all duration-300 hover:scale-110"
                  >
                    <Facebook size={22} />
                  </a>
                  <a
                    href="https://twitter.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center w-12 h-12 rounded-xl bg-blue-50 text-blue-400 hover:bg-blue-400 hover:text-white transition-all duration-300 hover:scale-110"
                  >
                    <Twitter size={22} />
                  </a>
                  <a
                    href="https://linkedin.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center w-12 h-12 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-700 hover:text-white transition-all duration-300 hover:scale-110"
                  >
                    <Linkedin size={22} />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </main>

        <Page_footer />
      </div>
    </>
  );
}
