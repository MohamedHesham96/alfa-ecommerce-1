"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { FaHeart, FaUser } from "react-icons/fa";
import { IoLocationSharp } from "react-icons/io5";
import { MdEmail, MdLock, MdPhoneEnabled } from "react-icons/md";
import { PiSignOutBold } from "react-icons/pi";
import { useLanguage } from "../../../../context/LanguageContext";
import { RiShoppingBag4Fill } from "react-icons/ri";
import { TbTruckReturn } from "react-icons/tb";
import Select from "react-select";
import { getRequest, putRequest, logoutRequest } from "../../../../utils/requestsUtils";
import ResetPasswordForm from "./ResetPasswordForm";
export default function Profile() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [username, setUsername] = useState("");
  const [phone, setPhone] = useState("");
  const [governorateId, setGovernorateId] = useState("");
  const [governorate, setGovernorate] = useState("");
  const navigate = useRouter();
  const { t, locale } = useLanguage();
  const [governorates, setGovernorates] = useState([]);
  const [value, setValue] = useState();
  const [isFormOpen, setIsFormOpen] = useState(false);



  const getUserData = useCallback(async () => {
try{
const responce = await getRequest("/api/users")
    console.log(responce)
    const resData = responce.data
    setFirstName(resData.firstName)
    setLastName(resData.lastName)
    setUsername(resData.username)
    setPhone(resData.phone)
    setAddress(resData.address)
    setEmail(resData.email)
    setGovernorateId(resData.governorate.governorateId)
    setGovernorate(locale === "ar" ? resData.governorate.nameAr
      : resData.governorate.nameEn)
} catch(error){
  
}
    
  }, [locale])
  const updateProfile = async (e) => {
    e.preventDefault();
    try {
      const res = await putRequest(`/api/users`, {
        username: username,
        firstName: firstName,
        lastName: lastName,
        phone: phone,
        address: address,
        governorateId: value ? value.value : null,
      }, t("message"));
      getUserData()
    } catch (err) { }
  };
  const getGovernorate = useCallback(async () => {
    try {
      const res = await getRequest("/api/public/governorates");

      const formatted = res.data.map((item) => ({
        value: item.governorateId,
        label:
          localStorage.getItem("lang") === "ar" ? item.nameAr : item.nameEn,
      }));

      setGovernorates(formatted);

      const selectedGovernorate = formatted.find(
        (item) => item.value === Number(governorateId),
      );

      if (selectedGovernorate) {
        setGovernorate(selectedGovernorate);
        setValue(selectedGovernorate);
      }
    } catch (error) {
      console.error("Error loading governorates:", error);
    }
  }, [governorateId]);

  useEffect(() => {
    if (governorateId) {
      getGovernorate();
    }
  }, [governorateId, getGovernorate]);
  useEffect(() => {
    getUserData()
  }, [getUserData]);
  return (
    <div className="p-10">
      <ResetPasswordForm isFormOpen={isFormOpen} setIsFormOpen={setIsFormOpen} />

      <div className="flex xs:flex-col md:flex-row  h-full gap-10 justify-between">
        <div className="bg-white md:w-[50%] xl:w-[30%] min-w-0 min-h-[350px] h-auto flex   flex-col gap-3   p-7 rounded-3xl">
          <div className="flex items-center bg-red-600 p-2 rounded-md text-white gap-3 cursor-pointer">
            <span className="text-xl">
              <FaUser />
            </span>
            <span className="">{t("personalAccount")} </span>
          </div>
          <Link href="/user/ordershistory">
            <div className="flex items-center hover:bg-red-600 p-2 rounded-md hover:text-white text-gray-600 gap-3 cursor-pointer">
              <span className="text-2xl">
                <RiShoppingBag4Fill />
              </span>
              <span> {t("orderHistory")} </span>
            </div>
          </Link>
          <Link href="/user/returnorders">
            <div className="flex items-center hover:bg-red-600 p-2 rounded-md hover:text-white text-gray-600 gap-3 cursor-pointer">
              <span className="text-2xl">
                <TbTruckReturn />
              </span>
              <span> {t("returns")} </span>
            </div>
          </Link>
          <Link href="/user/wishlist">
            <div className="flex items-center hover:bg-red-600 p-2 rounded-md hover:text-white text-gray-600 gap-3 cursor-pointer">
              <span className="text-xl">
                <FaHeart />
              </span>
              <span> {t("wishlist")} </span>
            </div>
          </Link>
          <hr className="my-5"></hr>
          <div className="flex justify-start cursor-pointer hover:scale-105 duration-200 items-center gap-1  text-red-600">
            <span>
              <PiSignOutBold />
            </span>
            <span
              onClick={async () => {
                await logoutRequest();
                localStorage.setItem("id", "");
                localStorage.setItem("accessToken", "");
                localStorage.setItem("refreshToken", "");
                localStorage.setItem("firstName", "");
                localStorage.setItem("role", "");
       
                navigate.push("/");
              }}
            >
              {t("logout")}
            </span>
          </div>
        </div>
        <div className="w-full flex flex-col gap-5 min-w-0">
          <div className="w-full  bg-white rounded-3xl p-5">
            <div className="flex w-full flex-col gap-7">
              <div className="flex justify-between w-full">
                <span className="text-xl font-semibold">
                  {firstName + " " + lastName}
                </span>
                {/* <span className="bg-red-200 px-3 py-2 text-xs font-semibold text-red-700 rounded-md">
                  {t("unverifiedAccount")}
                </span> */}
              </div>

              <div className="flex md:flex-row xs:flex-col gap-5 text-gray-600">
                <span className="flex items-center gap-1">
                  <MdEmail />
                  {email}
                </span>
                <span className="flex items-center gap-1">
                  <MdPhoneEnabled />
                  {phone}
                </span>
                <span className="flex items-center gap-1">
                  <IoLocationSharp />
                  {address}
                </span>
              </div>
            </div>
          </div>

          <div className="w-full  bg-white rounded-3xl">
            <div className="p-7  font-semibold">
              <span className=""> {t("editPersonalInfo")} </span>
            </div>
            <hr></hr>
            <form className="p-7" onSubmit={updateProfile}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="flex flex-col gap-3">
                  <label className="text-xs font-semibold text-gray-500">
                    {t("firstName")}
                  </label>
                  <input
                    type="text"
                    value={firstName}
                    className="bg-slate-50 outline-none  p-2 rounded-lg border "
                    onChange={(e) => setFirstName(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-3">
                  <label className="text-xs font-semibold text-gray-500">
                    {t("lastName")}
                  </label>
                  <input
                    type="text"
                    value={lastName}
                    className="bg-slate-50 outline-none  p-2 rounded-lg border "
                    onChange={(e) => setLastName(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-3">
                  <label className="text-xs font-semibold text-gray-500">
                    {t("username")}
                  </label>
                  <input
                    type="text"
                    value={username}
                    className="bg-slate-50  outline-none p-2 rounded-lg border "
                    onChange={(e) => setUsername(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-3">
                  <label className="text-xs font-semibold text-gray-500">
                    {t("phoneNumber")}
                  </label>
                  <input
                    type="text"
                    value={phone}
                    className="bg-slate-50 outline-none p-2 rounded-lg border "
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-3">
                  <label className="text-xs font-semibold text-gray-500">
                    {t("governorate")}
                  </label>
                  <div className="bg-slate-50 rounded-lg border">
                    <Select
                      options={governorates}
                      value={value}
                      onChange={setValue}
                      isSearchable={false}
                      placeholder=""
                      styles={{
                        control: (provided) => ({
                          ...provided,
                          border: "none",
                          boxShadow: "none",
                          background: "#f8fafc",
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
                <div className="flex flex-col gap-3">
                  <label className="text-xs font-semibold text-gray-500">
                    {t("address")}
                  </label>
                  <input
                    type="text"
                    value={address}
                    className="bg-slate-50  outline-none p-2 rounded-lg border "
                    onChange={(e) => setAddress(e.target.value)}
                  />
                </div>

              </div>

              <div className="mt-10 flex items-center gap-5">
                <button
                  type="submit"
                  className="px-5 py-2 text-white bg-red-600 hover:bg-red-700 hover:scale-105 duration-150 rounded-md text-sm font-semibold"
                >
                  {t("saveChanges")}
                </button>
                <button className="text-gray-600 font-semibold text-sm"></button>
              </div>
            </form>
          </div>
          <div className="w-full min-h-[100px] h-auto bg-white rounded-3xl mb-10">
            <div className="p-5 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <span className="p-3 text-xl rounded-full text-gray-600 bg-gray-100">
                  <MdLock />
                </span>
                <span>{t("password")} </span>
              </div>
              <button
                className="text-red-500 text-sm font-semibold"
                onClick={() => {
                  setIsFormOpen(true)
                }}
              >
                {t("updatePassword")}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
