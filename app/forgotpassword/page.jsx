import { Suspense } from "react";
import ForgotPassword from "../components/ForgotPassword_form";
import AuthLoading from "../components/auth/AuthLoading";

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={<AuthLoading />}>
      <ForgotPassword />
    </Suspense>
  );
}
