import UserInfo from "../../components/userInfo";

export default async function UsersPage({ params }) {
  const { id } = await params;

  return <UserInfo userId={id} />;
}
