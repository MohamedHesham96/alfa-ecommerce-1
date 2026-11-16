import OrdersHistory from "./components/ordersHistory"
import RequireAuth from "../components/RequireAuth";
import RequireCustomer from "../components/RequireCustomer";

export default function OrdersHistoryPage() {  

return(
<RequireAuth>
  <RequireCustomer>
    <div className="w-full p-5">
      <OrdersHistory/>
    </div>
  </RequireCustomer>
</RequireAuth>
)}