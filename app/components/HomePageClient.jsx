"use client";
import { useRouter } from "next/navigation";
import Header from "../user/components/Header";
import Footer from "../user/components/Footer";
import BottomNav from "../user/components/BottomNav";
import Menu from "../user/components/Menu";
import { MenuOpenProvider } from "../../context/MenuOpenContext";
import { FaWhatsapp } from "react-icons/fa6";
import { getRequest } from "../../utils/requestsUtils";
import { useEffect, useState } from "react";
import Image from "next/image";
import HomePage from "../user/home/page";

export default function HomePageClient({
  children,
  initialSliderImages = [],
  initialCategories = [],
  initialOffers = [],
  initialContact = null,
}) {
  const router = useRouter();
  const [contact, setContact] = useState(initialContact);
  const [role, setRole] = useState();

  useEffect(() => {
    if (initialContact) return undefined;
    let cancelled = false;
    getRequest("/api/public/contact")
      .then((response) => {
        if (!cancelled) setContact(response?.data || null);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [initialContact]);

  useEffect(() => {
    setRole(localStorage.role);
  }, [role]);

  useEffect(() => {
    const currentRole =
      typeof window !== "undefined" ? localStorage.getItem("role") : null;
    if (currentRole === "ADMIN") {
      router.replace("/admin/Dashboard");
    }
  }, [router]);

  return (
    <>
      {role === "ADMIN" ? (
        <div className="flex h-screen w-full items-center justify-center text-center">
          <div>
            <div className="mb-20 flex items-center justify-center">
              <Image
                src="/Images/logo.png"
                width={200}
                height={200}
                alt="شعار ألفا جروب"
                className="flex items-center justify-center"
              />
            </div>
            <h1 className="text-2xl font-semibold">
              You are not authorized to view this page
            </h1>
          </div>
        </div>
      ) : (
        <MenuOpenProvider>
          <div className="w-full">
            <Header />
            <main className="mx-auto w-full min-w-0 max-w-[1500px] overflow-x-clip pb-20 sm:pb-0">
              {children}
              <HomePage
                initialSliderImages={initialSliderImages}
                initialCategories={initialCategories}
                initialOffers={initialOffers}
              />
            </main>

            {contact?.whatsappURL ? (
              <a
                href={contact.whatsappURL}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="واتساب"
                className="fixed bottom-[5.5rem] right-5 z-40 sm:bottom-14"
              >
                <FaWhatsapp className="rounded-xl bg-green-500 p-1 text-5xl text-white drop-shadow-lg duration-300 hover:scale-110" />
              </a>
            ) : null}
            <footer id="footer" className="w-full bg-white pb-20 sm:pb-0">
              <Footer initialContact={contact} />
            </footer>
            <BottomNav />
            <Menu />
          </div>
        </MenuOpenProvider>
      )}
    </>
  );
}
