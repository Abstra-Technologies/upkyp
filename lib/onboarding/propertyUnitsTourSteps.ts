export const propertyUnitsTourSteps = [
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
            ">
              <span style="font-size: 36px;">🏢</span>
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

  // ─── STEP 1: UNITS ─────────────────────────────────────────────────────
  {
    element: "#prop-nav-units",
    popover: {
      title: "🏠 Units",
      description: "View and manage all units under this property. This is where you'll add, edit, and track your rental units.",
      side: "right",
      align: "start",
    },
    // Expand Operations section before moving to Active Lease
    onNextClick: () => {
      const btn = document.querySelector('[data-nav-section="operations"]') as HTMLElement;
      if (btn) {
        const isCollapsed = btn.getAttribute('aria-expanded') === 'false';
        if (isCollapsed) btn.click();
      }
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
    // Expand Utilities & Settings section before moving to Configuration
    onNextClick: () => {
      const btn = document.querySelector('[data-nav-section="utilities-&-settings"]') as HTMLElement;
      if (btn) {
        const isCollapsed = btn.getAttribute('aria-expanded') === 'false';
        if (isCollapsed) btn.click();
      }
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
    // Expand Property Setup section before moving to Edit Property
    onNextClick: () => {
      const btn = document.querySelector('[data-nav-section="property-setup"]') as HTMLElement;
      if (btn) {
        const isCollapsed = btn.getAttribute('aria-expanded') === 'false';
        if (isCollapsed) btn.click();
      }
    },
  },

  // ─── STEP 4: EDIT PROPERTY ──────────────────────────────────────────────
  {
    element: "#prop-nav-edit",
    popover: {
      title: "✏️ Edit Property",
      description: "Update your property's name, address, amenities, and photos.",
      side: "right",
      align: "start",
    },
    // Property Setup section is already expanded
  },

  // ─── STEP 5: HOUSE POLICY ──────────────────────────────────────────────
  {
    element: "#prop-nav-policy",
    popover: {
      title: "📋 House Policy",
      description: "Write the house rules tenants of this property must follow.",
      side: "right",
      align: "start",
    },
    // Expand Operations section before moving to Prospectives
    onNextClick: () => {
      const btn = document.querySelector('[data-nav-section="operations"]') as HTMLElement;
      if (btn) {
        const isCollapsed = btn.getAttribute('aria-expanded') === 'false';
        if (isCollapsed) btn.click();
      }
    },
  },

  // ─── STEP 6: PROSPECTIVES ──────────────────────────────────────────────
  {
    element: "#prop-nav-prospectives",
    popover: {
      title: "👥 Prospectives",
      description: "Review tenant applicants and their AI-powered screening reports.",
      side: "right",
      align: "start",
    },
    // Operations section is already expanded
  },

  // ─── STEP 7: ASSETS ────────────────────────────────────────────────────
  {
    element: "#prop-nav-assets",
    popover: {
      title: "🔧 Assets",
      description: "Track physical assets assigned to this property or its units.",
      side: "right",
      align: "start",
    },
    // Expand Finance section before moving to Payments
    onNextClick: () => {
      const btn = document.querySelector('[data-nav-section="finance"]') as HTMLElement;
      if (btn) {
        const isCollapsed = btn.getAttribute('aria-expanded') === 'false';
        if (isCollapsed) btn.click();
      }
    },
  },

  // ─── STEP 8: PAYMENTS ──────────────────────────────────────────────────
  {
    element: "#prop-nav-payments",
    popover: {
      title: "💰 Payments",
      description: "Full payment history for all units in this property.",
      side: "right",
      align: "start",
    },
    // Finance section is already expanded
  },

  // ─── STEP 9: FINANCIALS ────────────────────────────────────────────────
  {
    element: "#prop-nav-finance",
    popover: {
      title: "📊 Financials",
      description: "Monitor gross and net operating income with monthly trends.",
      side: "right",
      align: "start",
    },
    // Expand Utilities & Settings section before moving to Utilities
    onNextClick: () => {
      const btn = document.querySelector('[data-nav-section="utilities-&-settings"]') as HTMLElement;
      if (btn) {
        const isCollapsed = btn.getAttribute('aria-expanded') === 'false';
        if (isCollapsed) btn.click();
      }
    },
  },

  // ─── STEP 10: UTILITIES ────────────────────────────────────────────────
  {
    element: "#prop-nav-utilities",
    popover: {
      title: "⚡ Utilities",
      description: "View historical water and electricity costs per billing period.",
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
      side: "bottom",
      align: "end",
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
      title: "🎉 You're all set!",
      description: "You're now familiar with your property dashboard. Start by adding your first unit, then set up billing and invite your tenant. Click 'Show Guide' anytime for a quick refresher.",
      side: "over",
      align: "center",
    },
  },
];