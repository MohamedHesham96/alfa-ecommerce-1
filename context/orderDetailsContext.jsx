"use client";

import { createContext, useContext, useState } from "react";

const OrderDetailsContext = createContext(undefined);

export function OrderDetailsProvider({ children }) {
  const [selectedOrderState, setSelectedOrderState] = useState("");
  const [selectedOrderCode, setSelectedOrderCode] = useState("");
  const [selectedOrderDate, setSelectedOrderDate] = useState("");
  const [orderSummary, setOrderSummary] = useState(null);

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
