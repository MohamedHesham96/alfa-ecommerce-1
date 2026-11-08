"use client";
import { MdEmail, MdLanguage } from "react-icons/md";
import { FaEyeSlash, FaUserLarge } from "react-icons/fa6";
import { useState, useRef, useEffect } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useLanguage } from "../../context/LanguageContext";
import { useFeature } from "../../context/AppConfigContext";
import Link from "next/link";
import { FaEye } from "react-icons/fa";
import { toast } from "react-toastify";
import { reportApiFailure } from "../../utils/connectivityStore";
import { resolveLanguage } from "../../utils/languageUtils";
import { postRequest } from "../../utils/requestsUtils";
import { clearUserScopedCaches } from "../../lib/pwa/client";

export default function SignIn({ popUp, setShowSignUp, setShowSignIn,setOpenForm }) {
  const navigate = useRouter();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [forgotSuccess, setForgotSuccess] = useState("");
  const { locale, setLocale } = useLanguage();
  const { t } = useLanguage();
  const registrationEnabled = useFeature(
    "features.customerRegistration.enabled",
  );
  const input_passwordRef = useRef();
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/auth/login`,
        {
          username: username,
          password: password,
        },
        {},
      );
      // console.log(response.data);
      toast.success(response.data.message);

      localStorage.setItem("accessToken", response.data.accessToken);
      localStorage.setItem("refreshToken", response.data.refreshToken);
      localStorage.setItem("id", response.data.userDetails.userId);
      localStorage.setItem("firstName", response.data.userDetails.firstName);

      const language = resolveLanguage(response.data.userDetails.language);
      localStorage.setItem("lang", language);
      setLocale(language);
      localStorage.setItem("role", response.data.userDetails.role);
      localStorage.setItem(
        "systemSettingsAccess",
        String(response.data.userDetails.systemSettingsAccess === true),
      );
      const governorateId =
        response.data.userDetails.governorate?.governorateId;
      if (governorateId !== undefined && governorateId !== null) {
        localStorage.setItem("governorateId", governorateId);
      } else {
        localStorage.removeItem("governorateId");
      }

      // A different account may be signing in on this device. Drop any
      // previously cached page/API data before navigating.
      await clearUserScopedCaches().catch(() => {});

      if (response.data.userDetails.role === "ADMIN") {
        navigate.replace("/admin/Dashboard");
      } else if (popUp) {
        router.refresh();
        setOpenForm?.(false)
      } else {
        navigate.replace("/");
      }
    } catch (error) {
      reportApiFailure(error);
      const message = error?.response?.data?.error?.message;
      if (message) toast.error(message);
    } finally {
      setLoading(false);
    }
  };
  const handleSendForgotPasswordEmail = async (e) => {
    e.preventDefault();
    setError(null);
    setForgotSuccess("");

    try {
      setLoading(true);
      await postRequest("/api/auth/forgot-password", { email }, "", true);
      setForgotSuccess(
        t("forgotPasswordEmailSent") ||
          "If an account with that email exists, a reset link has been sent.",
      );
    } catch (err) {
      const message = err?.response?.data?.error?.message;
      if (message) toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-10 w-full h-full md:order-1 xs:order-2">
      {loading && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <Image
            src="/Images/logo.png"
            alt=""
            className="w-[100px] h-[100px]  border-t-transparent rounded-full animate-pulse"
            width={100}
            height={100}
            priority
          />
        </div>
      )}
      <div className="flex justify-between">
        <div id="welcome_section" className="">
          <h3 className="text-4xl my-3 ">{t("welcomeBack")}</h3>
          <h4 className="text-sm text-gray-500">{t("welcomeMessage")}</h4>
        </div>
        <div id="forgot_password_section" className="hidden">
          <h3 className="text-3xl my-3 font-semibold">
            {t("إعادة تعين كلمة المرور")}
          </h3>
          <h4 className="text-xl text-gray-500 ">
            {t(
              "سيتم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني إذا كان مسجلاً لدينا",
            )}
          </h4>
        </div>
       <button
          type="button"
          aria-label={
            locale === "ar" ? "تغيير اللغة إلى الإنجليزية" : "Change language to Arabic"
          }
          onClick={() => {
            const newLocale = locale === "ar" ? "en" : "ar";
            setLocale(newLocale);
          }}
        >
          <MdLanguage className="w-6 h-6 text-red-600" />
        </button>
      </div>
      <div className="flex justify-center items-center  mt-20">
        <div className="flex flex-col gap-7 w-[80%]">
          <form
            id="form_login"
            className="flex flex-col gap-6"
            onSubmit={handleLogin}
          >
            <div className="flex w-full px-2 rounded-md h-10 border items-center gap-3 shadow-md">
              {/* <label className="text-gray-500">Email Address</label>    */}
              <input
                className=" w-full px-3 outline-none"
                placeholder={t("username")}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
              <span className="text-xl text-gray-700">
                <FaUserLarge />
              </span>
            </div>

            <div className="flex w-full px-2 rounded-md h-10 border items-center gap-3 shadow-md">
              {/* <label className="text-gray-500">Email Address</label>    */}
              <input
                ref={input_passwordRef}
                className=" w-full px-3 outline-none"
                placeholder={t("password")}
                type="password"
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <span className="text-xl text-gray-700 cursor-pointer">
                <FaEyeSlash
                  id="eyeSlash"
                  // className={input_passwordRef.current.type === "text"? "hidden" : "block"
                  // }
                  onClick={() => {
                    input_passwordRef.current.type = "text";
                    const eyeSlash = document.querySelector("#eyeSlash");
                    eyeSlash.classList.add("hidden");
                    const eye = document.querySelector("#eye");
                    eye.classList.remove("hidden");
                  }}
                />
                <FaEye
                  id="eye"
                  className="hidden"
                  //   input_passwordRef.current.type === "password"
                  //     ? "hidden"
                  //     : "block"
                  // }
                  onClick={() => {
                    input_passwordRef.current.type = "password";
                    const eyeSlash = document.querySelector("#eyeSlash");
                    eyeSlash.classList.remove("hidden");
                    const eye = document.querySelector("#eye");
                    eye.classList.add("hidden");
                  }}
                />
              </span>
            </div>
            <span
              className="text-red-500 text-sm flex justify-start items-start cursor-pointer"
              onClick={() => {
                const welcome_section =
                  document.querySelector("#welcome_section");
                const forgot_password_section = document.querySelector(
                  "#forgot_password_section",
                );
                const form_email = document.querySelector("#form_email");
                const form_login = document.querySelector("#form_login");
                form_email.classList.remove("hidden");
                form_login.classList.add("hidden");
                welcome_section.classList.add("hidden");
                forgot_password_section.classList.remove("hidden");
              }}
            >
              {t("forgotPassword")}
            </span>
            <hr />
            <button
              type="submit"
              className="bg-red-600 hover:bg-red-700 text-white rounded-md h-10 "
            >
              {loading ? t("loggingIn") : t("login")}
            </button>
            {registrationEnabled ? (
              <div>
                {popUp ? (
                  <button
                    type="button"
                    className="text-center w-full text-sm text-gray-500"
                    onClick={() => {
                      setShowSignUp(true);
                      setShowSignIn(false);
                    }}
                  >
                    {t("createNewAccount")}
                  </button>
                ) : (
                  <Link
                    href="/signup"
                    className="block text-center w-full text-sm text-gray-500"
                  >
                    {t("createNewAccount")}
                  </Link>
                )}
              </div>
            ) : null}
          </form>
          <form
            id="form_email"
            className="hidden w-full "
            onSubmit={handleSendForgotPasswordEmail}
          >
            <div className="flex w-full px-2 rounded-md h-10 border items-center gap-3">
              <input
                className=" w-full px-3 outline-none"
                placeholder={t("email")}
                type="email"
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <span className="text-xl text-gray-700">
                <MdEmail />
              </span>
            </div>
            {forgotSuccess ? (
              <p role="status" className="text-sm text-green-700">
                {forgotSuccess}
              </p>
            ) : null}
            <div className="my-10 flex gap-5">
              <button
                type="submit"
                className="bg-red-600 text-white rounded-md w-full h-10 shadow hover:bg-red-700"
              >
                {loading ? t("sending") : t("send")}
              </button>
              <button
                type="button"
                className="bg-white text-red-600 border-red-600 border rounded-md w-full h-10  hover:bg-red-600 shadow hover:text-white"
                onClick={() => {
                  const welcome_section =
                    document.querySelector("#welcome_section");
                  const forgot_password_section = document.querySelector(
                    "#forgot_password_section",
                  );
                  const form_email = document.querySelector("#form_email");
                  const form_login = document.querySelector("#form_login");
                  form_email.classList.add("hidden");
                  form_login.classList.remove("hidden");
                  welcome_section.classList.remove("hidden");
                  forgot_password_section.classList.add("hidden");
                }}
              >
                {t("cancel")}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
