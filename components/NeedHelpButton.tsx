"use client";

import Script from "next/script";

/**
 * Elfsight "Telegram Chat" widget — floating "Need Help?" button, bottom-right
 * on every storefront page, opens the /medicalbot Telegram bot. The widget
 * itself (styling, position, which bot it opens) is configured in the
 * Elfsight dashboard, not here — this just mounts their loader script + the
 * app's placeholder div.
 */
export default function NeedHelpButton() {
  return (
    <>
      <Script src="https://elfsightcdn.com/platform.js" strategy="lazyOnload" />
      <div
        className="elfsight-app-ac7576c3-7a21-4c8e-aee0-dd7133ff3c51"
        data-elfsight-app-lazy
      />
    </>
  );
}
