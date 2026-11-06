import ReturnOrderDetails from'../components/returnOrderDetails'
import RequireAuth from "../../components/RequireAuth";

export default async function ReturnOrderDetailsPage({params}) {
  const { id } = await params;

return(
<RequireAuth>
  <div className=''>
      <ReturnOrderDetails returnOrderId={id}/>
  </div>
</RequireAuth>
)}