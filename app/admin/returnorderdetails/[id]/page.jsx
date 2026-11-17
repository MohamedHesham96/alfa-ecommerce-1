import OrderDetailsHeader from "../../orders/OrdersDetails/components/Header";
import Order_Iitems from "../../orders/OrdersDetails/components/Order_Items";
import User_Info from "../../orders/OrdersDetails/components/User_Info";
import UpdateStatus from "../../orders/OrdersDetails/components/UpdateStatus";

export default async function ReturnOrderDetailsPage({ params }) {
  const { id } = await params;

  return (
    <div className="admin-page">
      <OrderDetailsHeader orderId={id} orderType={"return-orders"} />
      <UpdateStatus orderId={id} orderType={"return-orders"} />
      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Order_Iitems orderId={id} orderType={"return-orders"} />
        <User_Info orderId={id} orderType={"return-orders"} />
      </div>
    </div>
  );
}
