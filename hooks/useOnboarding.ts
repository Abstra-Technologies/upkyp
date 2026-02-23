import { driver } from "driver.js";
import "driver.js/dist/driver.css";
import { useEffect, useCallback } from "react";

interface OnboardingOptions {
  tourId: string;
  steps: any[];
  autoStart?: boolean;
  onComplete?: () => void;
  config?: {
    allowClose?: boolean;
    showEndTourButton?: boolean;
  };
}

/**
 * Inject ALL custom Driver.js styles from a single source.
 *
 * IMPORTANT — globals.css must NOT contain any .driver-* or
 * .driverjs-theme-upkyp rules. All onboarding CSS lives here.
 *
 * Driver.js v1.4 internals (from source inspection):
 *   - Overlay is an <svg> with a single <path> using even-odd fill.
 *     The "cutout" is a gap in the path — NOT a separate element.
 *     Never set background on .driver-overlay; it covers the cutout.
 *     Use overlayColor in the JS config instead.
 *   - Popover is rebuilt every step. The factory sets inline
 *     display:none on title if falsy, then display:block if truthy.
 *   - popoverClass from step gets concatenated after global popoverClass.
 *   - Popover object properties: wrapper, arrow, title, description,
 *     footer, previousButton, nextButton, closeButton, footerButtons, progress
 */
const injectCustomStyles = () => {
  const styleId = "upkyp-driver-styles";

  const existingStyle = document.getElementById(styleId);
  if (existingStyle) existingStyle.remove();

  const styles = document.createElement("style");
  styles.id = styleId;
  styles.textContent = `
 
    .driver-overlay {
      background: none !important;
      background-color: transparent !important;
    }

    /* ========================================
       HIGHLIGHTED ELEMENT
    ======================================== */
    .driver-active-element {
      border-radius: 8px;
    }

    /* ========================================
       WELCOME STEP — centered, no title bar
    ======================================== */
    .driver-popover.driverjs-theme-upkyp.driverjs-welcome {
      max-width: 380px !important;
      padding: 0 !important;
      overflow: hidden !important;
    }

    .driver-popover.driverjs-theme-upkyp.driverjs-welcome .driver-popover-title {
      display: none !important;
    }

    .driver-popover.driverjs-theme-upkyp.driverjs-welcome .driver-popover-description {
      padding: 0 !important;
    }

    .driver-popover.driverjs-theme-upkyp.driverjs-welcome .driver-popover-close-btn {
      position: absolute !important;
      top: 12px !important;
      right: 12px !important;
      background: rgba(255,255,255,0.2) !important;
      border: 1px solid rgba(255,255,255,0.35) !important;
      color: #ffffff !important;
      -webkit-text-fill-color: #ffffff !important;
      z-index: 10 !important;
    }

    .driver-popover.driverjs-theme-upkyp.driverjs-welcome .driver-popover-close-btn:hover {
      background: rgba(255,255,255,0.35) !important;
      color: #ffffff !important;
      -webkit-text-fill-color: #ffffff !important;
    }

    .driver-popover.driverjs-theme-upkyp.driverjs-welcome .driver-popover-footer {
      padding: 12px 16px 16px 16px !important;
    }

    /* ========================================
       POPOVER — base container
    ======================================== */
    .driver-popover.driverjs-theme-upkyp {
      background: #ffffff !important;
      border: 1px solid #e5e7eb !important;
      border-radius: 16px !important;
      box-shadow: 0 25px 50px rgba(0, 0, 0, 0.25) !important;
      padding: 0 !important;
      max-width: 340px !important;
      overflow: hidden !important;
    }

    /* ========================================
       TITLE
       Key: reset -webkit-text-fill-color and
       background-clip to prevent any gradient-text
       technique from making the title invisible.
    ======================================== */
    .driver-popover.driverjs-theme-upkyp .driver-popover-title {
      display: block !important;
      font-size: 15px !important;
      font-weight: 700 !important;
      color: #111827 !important;
      -webkit-text-fill-color: #111827 !important;
      background: #ffffff !important;
      background-clip: padding-box !important;
      -webkit-background-clip: padding-box !important;
      padding: 16px 40px 8px 16px !important;
      margin: 0 !important;
      border-bottom: 1px solid #f3f4f6 !important;
      line-height: 1.4 !important;
    }

    /* ========================================
       DESCRIPTION
    ======================================== */
    .driver-popover.driverjs-theme-upkyp .driver-popover-description {
      font-size: 14px !important;
      line-height: 1.6 !important;
      color: #4b5563 !important;
      -webkit-text-fill-color: #4b5563 !important;
      padding: 12px 16px !important;
      margin: 0 !important;
    }

    /* ========================================
       PROGRESS TEXT
    ======================================== */
    .driver-popover.driverjs-theme-upkyp .driver-popover-progress-text {
      font-size: 12px !important;
      font-weight: 600 !important;
      color: #9ca3af !important;
      -webkit-text-fill-color: #9ca3af !important;
      padding: 0 !important;
      white-space: nowrap !important;
      flex-shrink: 0 !important;
    }

    /* ========================================
       FOOTER
    ======================================== */
    .driver-popover.driverjs-theme-upkyp .driver-popover-footer {
      padding: 8px 12px 12px 12px !important;
      background: #f9fafb !important;
      border-top: 1px solid #f3f4f6 !important;
      display: flex !important;
      align-items: center !important;
      justify-content: space-between !important;
      gap: 6px !important;
      flex-wrap: nowrap !important;
      min-height: 44px !important;
    }

    /* ========================================
       BUTTONS — shared
    ======================================== */
    .driver-popover.driverjs-theme-upkyp .driver-popover-footer button {
      border: none !important;
      border-radius: 8px !important;
      padding: 7px 12px !important;
      font-size: 12px !important;
      font-weight: 600 !important;
      cursor: pointer !important;
      transition: all 0.2s ease !important;
      white-space: nowrap !important;
      flex-shrink: 0 !important;
    }

    /* Previous */
    .driver-popover.driverjs-theme-upkyp .driver-popover-prev-btn {
      background: #f3f4f6 !important;
      color: #6b7280 !important;
      -webkit-text-fill-color: #6b7280 !important;
    }

    .driver-popover.driverjs-theme-upkyp .driver-popover-prev-btn:hover {
      background: #e5e7eb !important;
      color: #374151 !important;
      -webkit-text-fill-color: #374151 !important;
    }

    /* Next / Done */
    .driver-popover.driverjs-theme-upkyp .driver-popover-next-btn {
      background: linear-gradient(135deg, #3b82f6 0%, #10b981 100%) !important;
      color: white !important;
      -webkit-text-fill-color: white !important;
      box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3) !important;
    }

    .driver-popover.driverjs-theme-upkyp .driver-popover-next-btn:hover {
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4) !important;
    }

    /* Close */
    .driver-popover.driverjs-theme-upkyp .driver-popover-close-btn {
      position: absolute !important;
      top: 12px !important;
      right: 12px !important;
      width: 24px !important;
      height: 24px !important;
      padding: 0 !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      background: white !important;
      border: 1px solid #e5e7eb !important;
      border-radius: 6px !important;
      color: #9ca3af !important;
      -webkit-text-fill-color: #9ca3af !important;
      font-size: 14px !important;
      z-index: 10 !important;
    }

    .driver-popover.driverjs-theme-upkyp .driver-popover-close-btn:hover {
      background: #fef2f2 !important;
      border-color: #fecaca !important;
      color: #ef4444 !important;
      -webkit-text-fill-color: #ef4444 !important;
    }

    /* ========================================
       NAV BUTTONS WRAPPER
    ======================================== */
    .driver-popover.driverjs-theme-upkyp .driver-popover-navigation-btns {
      display: flex !important;
      gap: 4px !important;
      flex-grow: 1 !important;
      justify-content: flex-end !important;
    }

    /* ========================================
       ARROWS
    ======================================== */
    .driver-popover.driverjs-theme-upkyp .driver-popover-arrow-side-left {
      border-left-color: #ffffff !important;
    }

    .driver-popover.driverjs-theme-upkyp .driver-popover-arrow-side-right {
      border-right-color: #ffffff !important;
    }

    .driver-popover.driverjs-theme-upkyp .driver-popover-arrow-side-top {
      border-top-color: #ffffff !important;
    }

    .driver-popover.driverjs-theme-upkyp .driver-popover-arrow-side-bottom {
      border-bottom-color: #ffffff !important;
    }

    /* ========================================
       MOBILE
    ======================================== */
    @media (max-width: 640px) {
      .driver-popover.driverjs-theme-upkyp {
        max-width: 90vw !important;
      }

      .driver-popover.driverjs-theme-upkyp .driver-popover-title {
        font-size: 14px !important;
      }

      .driver-popover.driverjs-theme-upkyp .driver-popover-description {
        font-size: 13px !important;
      }
    }
  `;
  document.head.appendChild(styles);
};

export const useOnboarding = ({
  tourId,
  steps,
  autoStart = false,
  onComplete,
  config = {},
}: OnboardingOptions) => {
  useEffect(() => {
    injectCustomStyles();
  }, []);

  const { allowClose = true, showEndTourButton = false } = config;

  const startTour = useCallback(() => {
    const driverObj = driver({
      showProgress: true,
      showButtons: ["next", "previous", "close"],
      steps: steps,
      onDestroyed: () => {
        localStorage.setItem(`onboarding_${tourId}`, "true");
        if (onComplete) onComplete();
      },
      animate: true,
      popoverClass: "driverjs-theme-upkyp",
      progressText: "{{current}} of {{total}}",
      nextBtnText: "Next →",
      prevBtnText: "← Back",
      doneBtnText: "Done",
      allowClose,
      overlayColor: "rgba(0, 0, 0, 0.5)",
      stagePadding: 8,
      stageRadius: 12,
      onPopoverRender: (popover, { state }) => {
        const isWelcomeStep =
          state.activeStep?.popover?.popoverClass?.includes("driverjs-welcome");

        if (!isWelcomeStep) {
          // Remove stale welcome class
          popover.wrapper.classList.remove("driverjs-welcome");

          // Force title visible with inline styles as nuclear option
          if (popover.title) {
            const hasTitle = state.activeStep?.popover?.title;
            if (hasTitle) {
              popover.title.style.setProperty("display", "block", "important");
              popover.title.style.setProperty("color", "#111827", "important");
              popover.title.style.setProperty(
                "-webkit-text-fill-color",
                "#111827",
                "important",
              );
              popover.title.style.setProperty(
                "background",
                "#ffffff",
                "important",
              );
              popover.title.style.setProperty(
                "background-clip",
                "padding-box",
                "important",
              );
              popover.title.style.setProperty(
                "-webkit-background-clip",
                "padding-box",
                "important",
              );
            }
          }
        }

        // End Tour button
        if (showEndTourButton) {
          const footer = popover.footer;
          if (!footer || footer.querySelector(".driver-end-tour-btn")) return;

          const endBtn = document.createElement("button");
          endBtn.innerText = "End Tour";
          endBtn.className = "driver-end-tour-btn";
          endBtn.style.cssText = `
            background: transparent;
            border: 1px solid #e5e7eb;
            color: #9ca3af;
            border-radius: 8px;
            padding: 8px 12px;
            font-size: 12px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s ease;
            margin-right: auto;
            white-space: nowrap;
            line-height: 1;
            flex-shrink: 0;
          `;
          endBtn.onmouseenter = () => {
            endBtn.style.background = "#fef2f2";
            endBtn.style.borderColor = "#fecaca";
            endBtn.style.color = "#ef4444";
          };
          endBtn.onmouseleave = () => {
            endBtn.style.background = "transparent";
            endBtn.style.borderColor = "#e5e7eb";
            endBtn.style.color = "#9ca3af";
          };
          endBtn.onclick = () => driverObj.destroy();
          footer.insertBefore(endBtn, footer.firstChild);
        }
      },
      smoothScroll: true,
      allowKeyboardControl: true,
    });

    driverObj.drive();
  }, [steps, tourId, onComplete, allowClose, showEndTourButton]);

  useEffect(() => {
    const hasSeenTour = localStorage.getItem(`onboarding_${tourId}`);

    if (!hasSeenTour && autoStart) {
      const timer = setTimeout(() => {
        startTour();
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [autoStart, tourId, startTour]);

  const resetTour = useCallback(() => {
    localStorage.removeItem(`onboarding_${tourId}`);
  }, [tourId]);

  return { startTour, resetTour };
};
