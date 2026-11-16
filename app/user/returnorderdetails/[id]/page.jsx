import ReturnOrderDetails from'../components/returnOrderDetails'
import RequireAuth from "../../components/RequireAuth";
import RequireCustomer from "../../components/RequireCustomer";

export default async function ReturnOrderDetailsPage({params}) {
  const { id } = await params;

return(
<RequireAuth>
  <RequireCustomer>
    <div className=''>
      <ReturnOrderDetails returnOrderId={id}/>
    </div>
  </RequireCustomer>
</RequireAuth>
)}