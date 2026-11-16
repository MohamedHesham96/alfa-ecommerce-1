import OrderDetails from'../components/OrderDetails'
import RequireAuth from "../../components/RequireAuth";
import RequireCustomer from "../../components/RequireCustomer";



export default async function OrderDetailsPage({params}) {
  const { id } = await params;

return(
<RequireAuth>
  <RequireCustomer>
    <div className=''>
      <OrderDetails orderId={id}/>
    </div>
  </RequireCustomer>
</RequireAuth>
)}