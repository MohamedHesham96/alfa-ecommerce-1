"use client";
import Cartpage from "./components/cart";
import SignIn_Form from "../../components/SignIn_Form";
import SignUp_Form from "../../components/SignUp_Form";
import { MdCancel } from "react-icons/md";
import { useState } from "react";

export default function Cart() {
  const [showSignUp, setShowSignUp] = useState(false);
  const [showSignin, setShowSignIn] = useState(false);

  const closeAuthModal = () => {
    setShowSignIn(false);
    setShowSignUp(false);
  };

  // The modal must stay visible while either screen (login or registration)
  // is active. Previously it was tied to `showSignin` alone, so switching to
  // the registration screen hid the whole overlay.
  const isAuthOpen = showSignin || showSignUp;

  return (
    <div className="">
      <div
        className={`fixed inset-0 bg-black/40 items-center justify-center z-50 ${isAuthOpen ? "flex" : "hidden"}`}
      >
        <div className=" bg-white rounded-md relative w-full max-w-[480px] my-auto max-h-[90vh] overflow-y-auto">
          <MdCancel
            className="w-6 h-6 cursor-pointer hover:text-red-600 absolute top-2 right-2 "
            onClick={closeAuthModal}
          />
          {showSignin ? (
            <SignIn_Form
              popUp={true}
              setShowSignUp={setShowSignUp}
              setShowSignIn={setShowSignIn}
              setOpenForm={closeAuthModal}
            />
          ) : showSignUp ? (
            <SignUp_Form
              popUp={true}
              setShowSignIn={setShowSignIn}
              setShowSignUp={setShowSignUp}
              setOpenForm={closeAuthModal}
            />
          ) : null}
        </div>
      </div>

      <Cartpage setShowSignIn={setShowSignIn} />
    </div>
  );
}
