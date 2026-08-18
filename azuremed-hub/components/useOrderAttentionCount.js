"use client";

import { useCallback, useEffect, useState } from "react";

/** Live count of storefront orders that still require staff/admin action. */
export default function useOrderAttentionCount(endpoint, adminView = false) {
  const [count, setCount] = useState(0);

  const refresh = useCallback(() => {
    fetch(endpoint, { cache: "no-store" })
      .then((response) => response.json())
      .then((result) => {
        if (!result.success || !Array.isArray(result.data)) return;
        const pendingCount = result.data.filter((order) => {
          if (adminView && order.source !== "Storefront") return false;
          return order.status === "pending" || order.payment_status === "pending_review";
        }).length;
        setCount(pendingCount);
      })
      .catch(() => {});
  }, [adminView, endpoint]);

  useEffect(() => {
    refresh();
    const intervalId = window.setInterval(refresh, 5000);
    return () => window.clearInterval(intervalId);
  }, [refresh]);

  return count;
}
