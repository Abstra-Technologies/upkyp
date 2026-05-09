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
              width: 64px;
              height: 64px;
              background: rgba(255,255,255,0.15);
              border-radius: 18px;
              display: flex;
              align-items: center;
              justify-content: center;
              margin: 0 auto 14px auto;
              border: 1px solid rgba(255,255,255,0.25);
            ">
              <span style="font-size: 32px;">🏢</span>
            </div>
            <h2 style="color: #ffffff; font-size: 20px; font-weight: 800; margin: 0 0 6px 0; letter-spacing: -0.3px;">Property Management</h2>
            <p style="color: rgba(255,255,255,0.8); font-size: 12px; margin: 0;">Let's walk you through your property</p>
          </div>
          <div style="padding: 18px 16px 8px 16px; text-align: center;">
            <p style="color: #374151; font-size: 13px; line-height: 1.6; margin: 0 0 14px 0;">
              This is your <strong>property management hub</strong>. Manage units, leases, payments, and settings from here.
            </p>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin-bottom: 4px;">
              <div style="background: #eff6ff; border-radius: 8px; padding: 8px; font-size: 11px; color: #1d4ed8; font-weight: 600;">🏠 Units</div>
              <div style="background: #ecfdf5; border-radius: 8px; padding: 8px; font-size: 11px; color: #0f766e; font-weight: 600;">📋 Leases</div>
              <div style="background: #faf5ff; border-radius: 8px; padding: 8px; font-size: 11px; color: #7c3aed; font-weight: 600;">💳 Billing</div>
              <div style="background: #fff7ed; border-radius: 8px; padding: 8px; font-size: 11px; color: #c2410c; font-weight: 600;">📊 Financials</div>
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
      description: "Shows the current property name and location. Tap the back arrow to return to your property listings.",
      side: "bottom",
      align: "start",
    },
  },

  // ─── HAMBURGER MENU ────────────────────────────────────────────────────
  {
    element: "#prop-mobile-menu-btn",
    popover: {
      title: "☰ Property Menu",
      description: "Tap here to access all property sections. Let's explore the key features.",
      side: "bottom",
      align: "end",
    },
  },

  // ─── STEP 1: UNITS ─────────────────────────────────────────────────────
  {
    element: "#prop-nav-units",
    popover: {
      title: "🏠 Units",
      description: "View and manage all units under this property. This is where you'll add, edit, and track your rental units.",
      side: "right",
      align: "start",
    },
  },

  // ─── STEP 2: ACTIVE LEASE ──────────────────────────────────────────────
  {
    element: "#prop-nav-active-lease",
    popover: {
      title: "📜 Active Lease",
      description: "Manage all active lease agreements, track tenant status, and handle lease renewals or extensions.",
      side: "right",
      align: "start",
    },
  },

  // ─── STEP 3: CONFIGURATION ─────────────────────────────────────────────
  {
    element: "#prop-nav-configuration",
    popover: {
      title: "⚙️ Configuration",
      description: "Set up billing due dates, utility types, late payment penalties, and other property-specific settings.",
      side: "right",
      align: "start",
    },
  },

  // ─── UNITS PAGE: QUICK ACTIONS ──────────────────────────────────────────
  {
    element: "#units-action-buttons",
    popover: {
      title: "⚡ Quick Actions",
      description: "Add a unit, bulk import, invite tenants, or view active leases and utility costs at a glance.",
      side: "top",
      align: "center",
    },
  },

  // ─── UNITS PAGE: UNITS LIST ─────────────────────────────────────────────
  {
    element: "#units-list",
    popover: {
      title: "📋 Units List",
      description: "All your units are listed here with rent amount and publish status. Toggle between Published (visible to tenants) and Hidden. Click View to see Meter readings, Analytics, and Lease History.",
      side: "top",
      align: "start",
    },
  },

  // ─── DONE ──────────────────────────────────────────────────────────────
  {
    popover: {
      title: "🎉 You're ready!",
      description: "You now know your way around this property. Start by adding your first unit, then set up billing and invite a tenant. Tap 'Show Guide' anytime to replay this tour.",
      side: "over",
      align: "center",
    },
  },
];