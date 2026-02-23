export const inviteTenantTourSteps = [
  // ─── WELCOME ───────────────────────────────────────────────────────────
  {
    popover: {
      title: "👋 Have an Active Tenant?",
      description:
        "If someone is already renting your unit, you can invite them to Upkyp so they can pay rent, submit maintenance requests, and manage their lease — all online.",
      side: "over",
      align: "center",
    },
  },

  // ─── EMAIL ─────────────────────────────────────────────────────────────
  {
    element: "#invite-tenant-email",
    popover: {
      title: "📧 Tenant Email",
      description:
        "Enter your tenant's email. They'll receive an invite to create their Upkyp account.",
      side: "bottom",
      align: "start",
    },
  },

  // ─── UNIT ──────────────────────────────────────────────────────────────
  {
    element: "#invite-tenant-unit",
    popover: {
      title: "🏠 Select Unit",
      description: "Choose which unit this tenant will be assigned to.",
      side: "bottom",
      align: "start",
    },
  },

  // ─── LEASE DATES ───────────────────────────────────────────────────────
  {
    element: "#invite-tenant-dates-toggle",
    popover: {
      title: "📅 Lease Dates",
      description:
        "Set the lease start and end dates now, or skip and do it later during agreement setup.",
      side: "top",
      align: "start",
    },
  },

  // ─── DONE ──────────────────────────────────────────────────────────────
  {
    element: "#invite-tenant-submit",
    popover: {
      title: "✉️ Send the Invite",
      description:
        "Hit Send Invitation and your tenant will receive an email to join Upkyp.",
      side: "top",
      align: "center",
    },
  },
];
