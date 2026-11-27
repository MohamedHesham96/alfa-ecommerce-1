import ReturnOrders from "./components/returnOrdersHistory"
import RequireAuth from "../components/RequireAuth";
import RequireCustomer from "../components/RequireCustomer";

export default function OrdersHistoryPage() {  

return(
<RequireAuth>
  <RequireCustomer>
    <div className="w-full py-6 md:py-8">
      <ReturnOrders/>
    </div>
  </RequireCustomer>
</RequireAuth>
)}