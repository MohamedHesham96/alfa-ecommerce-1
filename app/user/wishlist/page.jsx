import WishList from "./components/WishList";
import RequireCustomer from "../components/RequireCustomer";

export default function WishListpage() {
  return (
    <RequireCustomer>
      <div className="">
        <WishList />
      </div>
    </RequireCustomer>
  );
}
