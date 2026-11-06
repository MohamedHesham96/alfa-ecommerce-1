import OrderDetailsHeader from "../../orders/OrdersDetails/components/Header";
import Order_Iitems from "../../orders/OrdersDetails/components/Order_Items";
import User_Info from "../../orders/OrdersDetails/components/User_Info";
import UpdateStatus from "../../orders/OrdersDetails/components/UpdateStatus";
export default async function ReturnOrderDetailsPage({params}) {
  const { id } = await params;

  return (
    <div className="h-full p-5 ">
      <div className=" relative">
        <OrderDetailsHeader orderId={id} orderType={"return-orders"} />
        <UpdateStatus orderId={id} orderType={"return-orders"} />
        <div className="flex md:flex-row xs:flex-col gap-5 md:justify-between items-start mt-7">
          <Order_Iitems orderId={id} orderType={"return-orders"}/>
          <User_Info orderId={id} orderType={"return-orders"} />
        </div>
      </div>
    </div>
  );
}
