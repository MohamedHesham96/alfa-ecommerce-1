import OrderDetails from'../components/OrderDetails'
import RequireAuth from "../../components/RequireAuth";



export default async function OrderDetailsPage({params}) {
  const { id } = await params;

return(
<RequireAuth>
  <div className=''>
      <OrderDetails orderId={id}/>
  </div>
</RequireAuth>
)}