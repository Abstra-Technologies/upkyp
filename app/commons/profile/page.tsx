"use client";

import ProfilePage from "@/components/Commons/profilePage";

export default function UserProfiles() {
  return (
    <div className="flex min-h-screen">
      <main className="w-full max-w-[100vw] overflow-x-hidden">
        <ProfilePage />
      </main>
    </div>
  );
}