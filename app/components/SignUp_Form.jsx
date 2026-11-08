"use client";
import { MdEmail, MdLanguage } from "react-icons/md";
import { FaEyeSlash, FaLocationDot, FaUserLarge } from "react-icons/fa6";
import { useState, useRef, useEffect, useCallback } from "react";
import axios from "axios";
import Image from "next/image";
import { useLanguage } from "../../context/LanguageContext";
import { useFeature } from "../../context/AppConfigContext";
import { FaEye, FaPhone } from "react-icons/fa";
import Link from "next/link";
import Select from "react-select";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import { resolveLanguage } from "../../utils/languageUtils";
import { clearUserScopedCaches } from "../../lib/pwa/client";

export default function SignUp({ popUp, setShowSignIn, setShowSignUp, setOpenForm }) {
  const navigate = useRouter();
  const { t } = useLanguage();
  const [username, setUsername] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState(null);
  const [address, setAddress] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { locale, setLocale } = useLanguage("ar");
  const registrationEnabled = useFeature(
    "features.customerRegistration.enabled",
  );
  const input_passwordRef = useRef();
  const input_confirmPasswordRef = useRef();
  const [governorates, setGovernorates] = useState([]);
  const [value, setValue] = useState(null);
const router = useRouter();

  const getGovernorate = useCallback(async () => {
    const res = await axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/public/governorates`);
    const formatted = res.data.data.map((item) => ({
      value: item.governorateId,
      label: locale === "ar" ? item.nameAr : item.nameEn,
    }));

    setGovernorates(formatted);
  }, [locale]);
  useEffect(() => {
    getGovernorate();
  }, [getGovernorate]);
  const handleSignUp = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      if (popUp) {
        const response = await axios.post(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/auth/signup`,
          {
            username: username,
            password: password,
            email: email,
            firstName: firstName,
            lastName: lastName,
            repeatPassword: confirmPassword,
            address: address,
            phone: phoneNumber,
            language: locale,
            governorateId: value.value,
          },
          {},
        );
        // localStorage.setItem("accessToken", response.data.accessToken);
        // console.log("accessToken", response.data.accessToken);
        if (response.data.success) {
          const response = await axios.post(
            `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/auth/login`,
            {
              username: username,
              password: password,
            },
            {},
          );
          localStorage.setItem("accessToken", response.data.accessToken);
          localStorage.setItem("refreshToken", response.data.refreshToken);
          localStorage.setItem("id", response.data.userDetails.userId);
          localStorage.setItem(
            "firstName",
            response.data.userDetails.firstName,
          );
          localStorage.setItem("lastName", response.data.userDetails.lastName);
          localStorage.setItem("address", response.data.userDetails.address);
          localStorage.setItem("phone", response.data.userDetails.phone);
          localStorage.setItem("email", response.data.userDetails.email);
          localStorage.setItem("username", response.data.userDetails.username);
          const language = resolveLanguage(response.data.userDetails.language);
          localStorage.setItem("lang", language);
          setLocale(language);
          localStorage.setItem("role", response.data.userDetails.role);
          localStorage.setItem(
            "systemSettingsAccess",
            String(response.data.userDetails.systemSettingsAccess === true),
          );
          localStorage.setItem(
            "governorateId",
            response.data.userDetails.governorate.governorateId,
          );
          await clearUserScopedCaches().catch(() => {});

router.refresh();
setOpenForm?.(false)
}
      } else {
        const response = await axios.post(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/auth/signup`,
          {
            username: username,
            password: password,
            email: email,
            firstName: firstName,
            lastName: lastName,
            repeatPassword: confirmPassword,
            address: address,
            phone: phoneNumber,
            language: locale,
            governorateId: value.value,
          },
          {},
        );
        localStorage.setItem("accessToken", response.data.accessToken);
        navigate.push("/signin");
      }
    } catch (err) {
      toast.error(err.response?.data?.error.message || "");
    } finally {
      setLoading(false);
    }
  };

  if (!registrationEnabled) {
    return (
      <div className="flex min-h-[320px] w-full items-center justify-center p-8 text-center md:order-1 xs:order-2">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">
            {locale === "ar"
              ? "التسجيل غير متاح حاليًا لهذا المتجر."
              : "Registration is currently unavailable for this store."}
          </h2>
          <p className="mt-2 text-sm text-gray-500">
            {locale === "ar"
              ? "يمكنك تسجيل الدخول إذا كان لديك حساب بالفعل."
              : "You can still sign in if you already have an account."}
          </p>
        </div>
      </div>
    );
  }

  return (
    // <div className=w-full h-full flex justify-center items-center">
    <div className=" h-full w-full p-10  md:order-1 xs:order-2">
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
        <div className="">
          <h3 className="text-4xl my-3 ">{t("create_account")} </h3>
          <h4 className="text-sm  text-gray-500">
            {t("signupWelcomeMessage")}
          </h4>
        </div>
       <button
          type="button"
          onClick={() => {
            const newLocale = locale === "ar" ? "en" : "ar";
            setLocale(newLocale);
          }}
        >
          <MdLanguage className="w-6 h-6 text-red-600" />
        </button>
      </div>

      <div className="flex justify-center items-center  mt-5">
        <div className="flex flex-col gap-3 w-full justify-center items-center">
          <form
            className="flex flex-col  gap-2 w-[90%]"
            onSubmit={handleSignUp}
          >
           <div className="flex gap-5 flex-wrap">
              <div className="flex flex-col gap-2  w-full ">
                <label className="text-gray-500 text-sm ">
                  {t("firstName")}
                </label>
                <div className=" flex w-full px-2 rounded-md  border h-10 items-center gap-3 shadow-md">
                  <input
                    className=" w-full px-3 outline-none"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                  />
                  <span className="text-sm text-gray-600">
                    <FaUserLarge />
                  </span>
                </div>
              </div>
              <div className="flex flex-col gap-2 w-full ">
                <label className="text-gray-500 text-sm">{t("lastName")}</label>
                <div className=" flex w-full px-2 rounded-md  border h-10 items-center gap-3 shadow-md">
                  <input
                    className=" w-full px-3 outline-none"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                  />
                  <span className="text-sm text-gray-600">
                    <FaUserLarge />
                  </span>
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-gray-500 text-sm">{t("email")}</label>
              <div className=" flex w-full px-2 rounded-md  border h-10 items-center gap-3  shadow-md">
                <input
                  className=" w-full px-3 outline-none"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  type="email"
                />
                <span className="text-base  text-gray-600">
                  <MdEmail />
                </span>
              </div>
            </div>
            <div className="flex gap-5 flex-wrap">
              <div className="flex flex-col gap-2 w-full">
                <label className="text-gray-500 text-sm">{t("username")}</label>
                <div className=" flex w-full px-2 rounded-md  border h-10 items-center gap-3 shadow-md">
                  <input
                    className=" w-full px-3 outline-none"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    type="text"
                  />
                  <span className="text-sm text-gray-600">
                    <FaUserLarge />
                  </span>
                </div>
              </div>
              <div className="flex flex-col gap-2 w-full">
                <label className="text-gray-500 text-sm">
                  {" "}
                  {t("phoneNumber")}
                </label>
                <div className=" flex w-full px-2 rounded-md  border h-10 items-center gap-3 shadow-md">
                  <input
                    className=" w-full px-3 outline-none"
                    value={phoneNumber}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, "");
                      setPhoneNumber(value);
                    }}
                    required
                    placeholder="01XXXXXXXXX"
                    pattern="^01[0125][0-9]{8}$"
                    type="tel"
                  />
                  <span className="text-sm text-gray-600">
                    <FaPhone />
                  </span>
                </div>
              </div>
            </div>
            <div className="flex gap-5 flex-wrap">
              <div className="flex flex-col gap-3 w-full">
                <label className="text-xs font-semibold text-gray-500">
                  {t("governorate")}
                </label>
                <div className="rounded-md  border h-10 items-center gap-3 shadow-md">
                  <Select
                    options={governorates}
                    value={value}
                    onChange={setValue}
                    isSearchable={false}
                    required
                    placeholder={t("selectGovernorate")}
                    styles={{
                      control: (provided) => ({
                        ...provided,
                        border: "none",
                        boxShadow: "none",
                        background: "transparent",
                        fontWeight: "600",
                        height: "100%",
                        width: "100%",
                      }),
                      option: (provided) => ({
                        ...provided,
                        // backgroundColor: '#b91c1c',
                        color: "white",
                        fontSize: "18px",
                        fontWeight: "600",
                      }),
                      input: (base) => ({
                        ...base,
                        color: "#374151",
                      }),
                      option: (base, state) => ({
                        ...base,
                        backgroundColor: state.isSelected
                          ? "#dc2626"
                          : state.isFocused
                            ? "#fee2e2"
                            : "#ffffff",
                        color: state.isSelected ? "#ffffff" : "#374151",
                        cursor: "pointer",
                        padding: "10px",
                        "&:hover": {
                          backgroundColor: state.isSelected
                            ? "#dc2626"
                            : "#fee2e2",
                        },
                      }),
                    }}
                  />
                </div>
              </div>
              <div className="flex flex-col gap-2 w-full">
                <label className="text-gray-500 text-sm">{t("address")}</label>
                <div className=" flex w-full px-2 rounded-md  border h-10 items-center gap-3 shadow-md">
                  <input
                    className=" w-full px-3 outline-none"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    required
                  />
                  <span className="text-base  text-gray-600">
                    <FaLocationDot />
                  </span>
                </div>
              </div>
            </div>
            {/* <div className="flex flex-col gap-2">
              <label className="text-gray-500 text-sm"> {t("address")} </label>
              <div className=" flex w-full px-2 rounded-md  border h-10 items-center gap-3 shadow-md">
                <input
                  className=" w-full px-3 outline-none"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  required
                  type="text"
                />
                <span className="text-base  text-gray-600">
                  <FaLocationDot />
                </span>
              </div>
            </div> */}
            <div className=" flex items-center gap-5 flex-wrap">
              <div className="flex flex-col gap-2 w-full">
                <label className="text-gray-500 text-sm">{t("password")}</label>
                <div className=" flex w-full px-2 rounded-md  border h-10 items-center gap-3 shadow-md">
                  <input
                    ref={input_passwordRef}
                    className=" w-full px-3 outline-none"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    type="password"
                  />
                  <span className="text-base text-gray-600">
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
              </div>
              <div className="flex flex-col gap-2 w-full">
                <label className="text-gray-500 text-sm">
                  {t("confirmPassword")}
                </label>
                <div className=" flex w-full px-2 rounded-md  border h-10 items-center gap-3 shadow-md">
                  <input
                    ref={input_confirmPasswordRef}
                    className=" w-full px-3 outline-none"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    type="password"
                  />
                  <span className=" text-gray-600">
                    <FaEyeSlash
                      id="eyeSlash_confPass"
                      // className={
                      //   input_confirmPasswordRef.current.type === "text"
                      //     ? "hidden"
                      //     : "block"
                      // }
                      onClick={() => {
                        input_confirmPasswordRef.current.type = "text";
                        const eyeSlash =
                          document.querySelector("#eyeSlash_confPass");
                        eyeSlash.classList.add("hidden");
                        const eye = document.querySelector("#eye_confPass");
                        eye.classList.remove("hidden");
                      }}
                    />
                    <FaEye
                      id="eye_confPass"
                      className="hidden"
                      //   input_confirmPasswordRef.current.type === "password"
                      //     ? "hidden"
                      //     : "block"
                      // }
                      onClick={() => {
                        input_confirmPasswordRef.current.type = "password";
                        const eyeSlash =
                          document.querySelector("#eyeSlash_confPass");
                        eyeSlash.classList.remove("hidden");
                        const eye = document.querySelector("#eye_confPass");
                        eye.classList.add("hidden");
                      }}
                    />
                  </span>
                </div>
              </div>
            </div>
            <hr className="h-1 my-5"></hr>
            <button
              type="submit"
              className="bg-red-600 text-white rounded-md h-10 "
            >
              {loading ? t("loggingIn") : t("create_account")}
            </button>
          </form>
          {popUp ? (
            <button
              type="button"
              className="flex justify-center items-center text-sm text-gray-500"
              onClick={() => {
                setShowSignIn(true);
                setShowSignUp?.(false);
              }}
            >
              {t("login")}
            </button>
          ) : (
            <Link
              href="/signin"
              className="flex justify-center items-center text-sm text-gray-500"
            >
              {t("login")}
            </Link>
          )}
        </div>
      </div>
    </div>

    // </div>
  );
}
