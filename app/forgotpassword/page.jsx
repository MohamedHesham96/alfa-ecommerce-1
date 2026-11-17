import { Suspense } from "react";
import Image from "next/image";
import ForgotPassword from "../components/ForgotPassword_form";

export default function ForgotPasswordPage() {
  return (
    <div className="h-screen">
      <div className="w-full h-screen">
        <div className="h-full flex md:flex-row xs:flex-col">
          <Suspense fallback={<div className="p-10" aria-busy="true">...</div>}>
            <ForgotPassword />
          </Suspense>
          <div className="h-full w-full md:order-2 xs:order-1">
            <Image
              src="/Images/imageSignUp.png"
              alt=""
              width={500}
              height={500}
              priority
              className="h-full w-full"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
