import OrderDetailsHeader from "../components/Header";
import Order_Iitems from "../components/Order_Items";
import User_Info from "../components/User_Info";
import UpdateStatus from "../components/UpdateStatus"
export default async function OrderDetailsPage({params}) {

    const { id } = await params;

  return (
    <div className="h-full p-5 ">
          <div className=" relative">
            <OrderDetailsHeader orderId={id} orderType={'orders'} />
            <UpdateStatus orderId={id} orderType={"orders"}/>
            <div className="flex md:flex-row xs:flex-col gap-5 md:justify-between items-start mt-7">
              <Order_Iitems orderId={id} orderType={"orders"} />
              <User_Info orderId={id} orderType={"orders"}/>
            </div>
          </div>
        </div>
   
  )

}