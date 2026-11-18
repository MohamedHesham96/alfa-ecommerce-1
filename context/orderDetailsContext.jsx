"use client";

import { createContext, useCallback, useContext, useState } from "react";

const OrderDetailsContext = createContext(undefined);

export function OrderDetailsProvider({ children }) {
  const [selectedOrderState, setSelectedOrderState] = useState("");
  const [selectedOrderCode, setSelectedOrderCode] = useState("");
  const [selectedOrderDate, setSelectedOrderDate] = useState("");
  const [orderSummary, setOrderSummary] = useState(null);
  // Incremented after a successful status change so the history section can
  // refetch immediately without coupling the two components.
  const [historyRefreshKey, setHistoryRefreshKey] = useState(0);

  const refreshOrderHistory = useCallback(() => {
    setHistoryRefreshKey((key) => key + 1);
  }, []);

  return (
    <OrderDetailsContext.Provider
      value={{
        selectedOrderState,
        setSelectedOrderState,
        selectedOrderCode,
        setSelectedOrderCode,
        selectedOrderDate,
        setSelectedOrderDate,
        orderSummary,
        setOrderSummary,
        historyRefreshKey,
        refreshOrderHistory,
      }}
    >
      {children}
    </OrderDetailsContext.Provider>
  );
}

export function useOrderDetailsContext() {
  const context = useContext(OrderDetailsContext);
  if (!context) {
    throw new Error("useOrderDetailsContext must be used within OrderDetailsProvider");
  }
  return context;
}
