"use client";

import {
  BuildingIcon,
  UsersIcon,
  LightbulbIcon,
  ArrowRightIcon,
} from "lucide-react";
import Page_footer from "../../../components/navigation/page_footer";
import Image from "next/image";
import Link from "next/link";

export default function About() {
  return (
    <div className="relative min-h-screen bg-gradient-to-br from-blue-900 via-emerald-700 to-emerald-500 overflow-hidden">
      {/* Background Image */}
      <Image
        src="/images/hero-section.jpeg"
        alt="About Upkyp"
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
      <main className="relative z-10 px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
        {/* Hero Section */}
        <div className="max-w-7xl mx-auto text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 px-4 py-2 rounded-full mb-6">
            <BuildingIcon className="w-4 h-4 text-emerald-300" />
            <span className="text-white text-sm font-medium">About Upkyp</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 drop-shadow-lg">
            Simplifying Property Management
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-lime-300 to-emerald-400 mt-2">
              For Everyone
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-blue-50/90 max-w-3xl mx-auto">
            Upkyp makes property management effortless for landlords and creates
            a seamless experience for tenants.
          </p>
        </div>

        {/* Mission Card */}
        <div className="max-w-5xl mx-auto mb-16">
          <div className="bg-white/90 backdrop-blur-lg rounded-2xl shadow-2xl p-8 sm:p-10 lg:p-12 border border-white/30">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-2xl mb-6">
                <BuildingIcon className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-gray-800 mb-6">
                Our Mission
              </h2>
              <p className="text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed">
                At Upkyp, we're dedicated to providing top-tier property
                management solutions that simplify billing and lease management.
                We believe that managing rental properties shouldn't be
                complicated, and we're here to make it easier for everyone
                involved.
              </p>
            </div>
          </div>
        </div>

        {/* Values Section */}
        <div className="max-w-6xl mx-auto mb-16">
          <h2 className="text-3xl font-bold text-center text-white mb-12 drop-shadow-lg">
            What Makes Upkyp Different
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {/* Value 1 */}
            <div className="bg-white/90 backdrop-blur-lg p-8 rounded-2xl shadow-xl border border-white/30 hover:shadow-2xl transition-all duration-300 hover:scale-105">
              <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl mb-4">
                <UsersIcon className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">
                Built for Both Sides
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Unlike other platforms, Upkyp is designed with both landlords
                and tenants in mind, creating a balanced system that benefits
                the entire rental relationship.
              </p>
            </div>

            {/* Value 2 */}
            <div className="bg-white/90 backdrop-blur-lg p-8 rounded-2xl shadow-xl border border-white/30 hover:shadow-2xl transition-all duration-300 hover:scale-105">
              <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl mb-4">
                <LightbulbIcon className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">
                Smart Solutions
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Upkyp uses innovative technology to automate tedious tasks,
                generate insights, and help property owners make better
                decisions with less effort.
              </p>
            </div>

            {/* Value 3 */}
            <div className="bg-white/90 backdrop-blur-lg p-8 rounded-2xl shadow-xl border border-white/30 hover:shadow-2xl transition-all duration-300 hover:scale-105">
              <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-blue-600 to-emerald-600 rounded-xl mb-4">
                <ArrowRightIcon className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">
                Simplified Workflow
              </h3>
              <p className="text-gray-600 leading-relaxed">
                We've streamlined every process - from tenant applications to
                lease signing, payment collection, and maintenance requests -
                all in one intuitive platform.
              </p>
            </div>
          </div>
        </div>

        {/* Story Section */}
        <div className="max-w-5xl mx-auto mb-16">
          <div className="bg-white/90 backdrop-blur-lg rounded-2xl shadow-2xl p-8 sm:p-10 lg:p-12 border border-white/30">
            <h2 className="text-3xl font-bold text-gray-800 mb-6">
              The Upkyp Story
            </h2>
            <div className="space-y-4 text-gray-600 leading-relaxed">
              <p>
                Upkyp was founded by a group of Benildean Information Systems
                (IS) students as part of their thesis project. During their
                research, they identified the growing challenges faced by
                tenants and landlords in the Philippines— from communication
                gaps to inefficient rental management.
              </p>
              <p>
                What started as an academic project quickly evolved into a
                full-fledged business idea. Upkyp is designed to bridge the gap
                between landlords and tenants by providing a streamlined,
                user-friendly platform that simplifies property management,
                billing, and communication—making renting easier and more
                efficient for everyone.
              </p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="max-w-4xl mx-auto">
          <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl shadow-2xl p-8 sm:p-10 lg:p-12 text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4 drop-shadow-lg">
              Ready to transform your rental experience?
            </h2>
            <p className="text-lg sm:text-xl text-blue-50/90 mb-8 max-w-2xl mx-auto">
              Join the Upkyp community and discover a better way to manage
              properties.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link
                href="/pages/auth/selectRole"
                className="bg-white text-blue-600 hover:bg-blue-50 font-semibold py-3 px-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
              >
                Get Started with Upkyp
              </Link>
              <Link
                href="/pages/find-rent"
                className="bg-transparent text-white border-2 border-white hover:bg-white/10 font-semibold py-3 px-8 rounded-xl transition-all duration-300 hover:scale-105"
              >
                Browse Properties
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Page_footer />
    </div>
  );
}
