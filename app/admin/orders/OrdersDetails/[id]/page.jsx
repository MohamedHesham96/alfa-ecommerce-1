import OrderDetailsHeader from "../components/Header";
import Order_Iitems from "../components/Order_Items";
import User_Info from "../components/User_Info";
import UpdateStatus from "../components/UpdateStatus";

export default async function OrderDetailsPage({ params }) {
  const { id } = await params;

  return (
    <div className="admin-page">
      <OrderDetailsHeader orderId={id} orderType={"orders"} />
      <UpdateStatus orderId={id} orderType={"orders"} />
      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Order_Iitems orderId={id} orderType={"orders"} />
        <User_Info orderId={id} orderType={"orders"} />
      </div>
    </div>
  );
}
