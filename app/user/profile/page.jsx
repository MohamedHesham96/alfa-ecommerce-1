import Profile from "./components/Profile"
import RequireAuth from "../components/RequireAuth";
import RequireCustomer from "../components/RequireCustomer";

export default function ProfilePage() {  

return(
<RequireAuth>
  <RequireCustomer>
    <div className=" relative ">
      <div>
        <Profile/>
      </div>
    </div>
  </RequireCustomer>
</RequireAuth>
)}