"use client";

import Cartpage from "./components/cart";
import SignIn_Form from "../../components/SignIn_Form";
import SignUp_Form from "../../components/SignUp_Form";
import RequireCustomer from "../components/RequireCustomer";
import AuthModal from "../../components/auth/AuthModal";
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
    <RequireCustomer>
      <div>
        <AuthModal
          key={showSignUp ? "signup" : "signin"}
          open={isAuthOpen}
          onClose={closeAuthModal}
          labelledBy={
            showSignUp ? "auth-signup-title" : "auth-signin-title"
          }
        >
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
        </AuthModal>

        <Cartpage setShowSignIn={setShowSignIn} />
      </div>
    </RequireCustomer>
  );
}
