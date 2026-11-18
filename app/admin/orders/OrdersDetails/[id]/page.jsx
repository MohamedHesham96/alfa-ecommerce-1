import OrderDetailsHeader from "../components/Header";
import Order_Iitems from "../components/Order_Items";
import OrderStatusHistory from "../components/Order_Status_History";
import User_Info from "../components/User_Info";

export default async function OrderDetailsPage({ params }) {
  const { id } = await params;

  return (
    <div className="admin-page !gap-3">
      <OrderDetailsHeader orderId={id} orderType={"orders"} />
      <div className="grid items-start gap-3 xl:grid-cols-[minmax(0,1fr)_340px]">
        <Order_Iitems orderId={id} orderType={"orders"} />
        <User_Info orderId={id} orderType={"orders"} />
      </div>
      <OrderStatusHistory orderId={id} />
    </div>
  );
}
