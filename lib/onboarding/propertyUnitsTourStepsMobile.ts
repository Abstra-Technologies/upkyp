export const propertyUnitsTourStepsMobile = [
  // ─── WELCOME ───────────────────────────────────────────────────────────
  {
    popover: {
      title: "",
      description: `
        <div style="margin: -12px -12px 0 -12px;">
          <div style="
            padding: 40px 24px 28px 24px;
            background: linear-gradient(135deg, #1d4ed8 0%, #0f766e 100%);
            text-align: center;
            border-radius: 14px 14px 0 0;
            position: relative;
          ">
            <div style="
              width: 72px;
              height: 72px;
              background: rgba(255,255,255,0.15);
              border-radius: 20px;
              display: flex;
              align-items: center;
              justify-content: center;
              margin: 0 auto 16px auto;
              border: 1px solid rgba(255,255,255,0.25);
              padding: 10px;
            ">
              <img src="/upkeep_blue.png" alt="UpKyp" style="width: 100%; height: 100%; object-fit: contain; filter: brightness(0) invert(1);" />
            </div>
            <h2 style="color: #ffffff; font-size: 22px; font-weight: 800; margin: 0 0 6px 0; letter-spacing: -0.3px;">Property Management</h2>
            <p style="color: rgba(255,255,255,0.8); font-size: 13px; margin: 0;">Let's walk you through your property</p>
          </div>
          <div style="padding: 20px 20px 8px 20px; text-align: center;">
            <p style="color: #374151; font-size: 14px; line-height: 1.7; margin: 0 0 16px 0;">
              This is your <strong>property management hub</strong>. From here you can manage units, handle leases, track payments, and configure everything for this property.
            </p>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 4px;">
              <div style="background: #eff6ff; border-radius: 10px; padding: 10px; font-size: 12px; color: #1d4ed8; font-weight: 600;">🏠 Units</div>
              <div style="background: #ecfdf5; border-radius: 10px; padding: 10px; font-size: 12px; color: #0f766e; font-weight: 600;">📋 Leases</div>
              <div style="background: #faf5ff; border-radius: 10px; padding: 10px; font-size: 12px; color: #7c3aed; font-weight: 600;">💳 Billing</div>
              <div style="background: #fff7ed; border-radius: 10px; padding: 10px; font-size: 12px; color: #c2410c; font-weight: 600;">📊 Financials</div>
            </div>
          </div>
        </div>
      `,
      side: "over",
      align: "center",
      popoverClass: "driverjs-theme-upkyp driverjs-welcome",
    },
  },

  // ─── MOBILE HEADER ─────────────────────────────────────────────────────
  {
    element: "#prop-mobile-header",
    popover: {
      title: "🏢 Property Header",
      description:
        "Shows the current property name and location. Tap the back arrow to return to your property listings.",
      side: "bottom",
      align: "start",
    },
  },

  // ─── HAMBURGER MENU ────────────────────────────────────────────────────
  {
    element: "#prop-mobile-menu-btn",
    popover: {
      title: "☰ Property Menu",
      description:
        "Tap here to access all property sections — Edit Property, House Policy, Active Lease, Prospectives, Assets, Billing, Payments, PDC Management, Financials, Utilities, and Configuration.",
      side: "bottom",
      align: "end",
    },
  },

  // ─── UNITS PAGE SECTIONS ───────────────────────────────────────────────
  {
    element: "#units-action-buttons",
    popover: {
      title: "⚡ Unit Actions",
      description:
        "Add a unit, bulk import, or invite an existing tenant directly.",
      side: "bottom",
      align: "end",
    },
  },
  {
    element: "#units-list",
    popover: {
      title: "📋 Units List",
      description:
        "All your units are listed here with rent amount and publish status. Toggle between Published (visible to tenants) and Hidden. Tap View to see the unit's Meter readings, Analytics, and Lease History.",
      side: "top",
      align: "start",
    },
  },

  // ─── DONE ──────────────────────────────────────────────────────────────
  {
    popover: {
      title: "🎉 You're ready!",
      description:
        "You now know your way around this property. Start by adding your first unit, then set up billing and invite a tenant. Tap the Show Guide button anytime to replay this tour.",
      side: "over",
      align: "center",
    },
  },
];
