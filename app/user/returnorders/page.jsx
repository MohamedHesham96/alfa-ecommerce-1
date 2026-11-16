import ReturnOrders from "./components/returnOrdersHistory"
import RequireAuth from "../components/RequireAuth";
import RequireCustomer from "../components/RequireCustomer";

export default function OrdersHistoryPage() {  

return(
<RequireAuth>
  <RequireCustomer>
    <div className="w-full md:p-10 xs:p-5">
      <ReturnOrders/>
    </div>
  </RequireCustomer>
</RequireAuth>
)}