import OrdersHistory from "./components/ordersHistory"
import RequireAuth from "../components/RequireAuth";
import RequireCustomer from "../components/RequireCustomer";

export default function OrdersHistoryPage() {  

return(
<RequireAuth>
  <RequireCustomer>
    <div className="w-full py-6 md:py-8">
      <OrdersHistory/>
    </div>
  </RequireCustomer>
</RequireAuth>
)}