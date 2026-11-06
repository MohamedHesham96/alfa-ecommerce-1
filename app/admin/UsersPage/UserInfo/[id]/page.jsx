import UserInfo from "../../components/userInfo";
export default async function UsersPage({ params }) {
  const { id } = await params;
  return (
    <div className=" p-5 ">
      <div className=" w-full ">
        <UserInfo userId={id} />
      </div>
    </div>
  );
}