"use client";
import { useCallback, useEffect, useState } from "react";

import { useLanguage } from "../../../../context/LanguageContext.js";
import { postRequest, putRequest } from "../../../../utils/requestsUtils.js";
import { getRequest } from "../../../../utils/requestsUtils.js";
import { useIdContext } from "../../../../context/idContext";
import { useRefresh } from "../../../../context/refreshContext.jsx";
import AdminModal from "../../components/ui/AdminModal";
import FormField from "../../components/ui/FormField";

export default function AdminForm({ isFormOpen, setIsFormOpen }) {
  const [adminUser, setAdminUser] = useState({
    f_name: "",
    l_name: "",
    username: "",
    password: "",
    confirmPassword: "",
  });

  const [loading, setLoading] = useState();
  const { t } = useLanguage();
  const { triggerRefresh } = useRefresh();
  const { selectedAdminId, setSelectedAdminId } = useIdContext();
  const isEditMode = selectedAdminId !== null;

  const addAdminUser = async () => {
    try {
      setLoading(true);

      await postRequest(
        "/api/admin/users",
        {
          firstName: adminUser.f_name,
          lastName: adminUser.l_name,
          username: adminUser.username,
          password: adminUser.password,
          repeatPassword: adminUser.confirmPassword,
          role: "ADMIN",
        },
        t("message"),
      );
      triggerRefresh();
      setSelectedAdminId(null);
    } catch (error) {
      console.error("Error adding admin user:", error);
    } finally {
      setLoading(false);
    }
  };

  const AdminData = useCallback(async () => {
    try {
      if (selectedAdminId !== null) {
        setLoading(true);

        const res = await getRequest(`/api/admin/users/${selectedAdminId}`);
        const resData = res.data;
        setAdminUser((prev) => ({
          ...prev,
          l_name: resData.lastName,
          f_name: resData.firstName,
          username: resData.username,
        }));
      } else {
        setAdminUser({
          f_name: "",
          l_name: "",
          username: "",
          password: "",
          confirmPassword: "",
        });
      }
    } catch (error) {
      console.error("Error fetching admin data:", error);
    } finally {
      setLoading(false);
    }
  }, [selectedAdminId]);

  const updateAdmin = async () => {
    try {
      setLoading(true);
      setIsFormOpen(false);
      await putRequest(
        `/api/admin/users/${selectedAdminId}`,
        {
          firstName: adminUser.f_name,
          lastName: adminUser.l_name,
          username: adminUser.username,
          password: adminUser.password,
          repeatPassword: adminUser.confirmPassword,
        },
        t("message"),
      );
      triggerRefresh();
      setSelectedAdminId(null);
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    AdminData();
  }, [AdminData]);

  return (
    <div id="add-admin-form">
      {loading && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-[var(--admin-overlay-strong)]/55 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-3 rounded-2xl bg-[var(--admin-surface)] px-8 py-6 shadow-2xl">
            <span className="admin-spinner !h-7 !w-7" />
            <p className="text-sm font-semibold text-[var(--admin-ink-soft)]">
              {t("loading")}
            </p>
          </div>
        </div>
      )}
      <AdminModal
        open={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setSelectedAdminId(null);
        }}
        title={isEditMode ? t("edit_admin") : t("add_admin")}
        description={t("admins_description")}
        size="md"
        closeLabel={t("close")}
        footer={
          <>
            <button
              type="button"
              className="admin-btn admin-btn-secondary"
              onClick={() => {
                setIsFormOpen(false);
                setSelectedAdminId(null);
              }}
            >
              {t("cancel")}
            </button>
            <button
              type="submit"
              form="admin-account-form"
              id={isEditMode ? "btn-edit" : "btn-save"}
              className="admin-btn admin-btn-primary"
              onClick={() => {
                if (isEditMode) updateAdmin();
                else addAdminUser();
              }}
              disabled={loading}
            >
              {isEditMode ? t("save-changes") : t("save")}
            </button>
          </>
        }
      >
        <form
          id="admin-account-form"
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault();
          }}
        >
          <section className="admin-form-section">
            <div className="admin-form-section-header">
              <div>
                <h3 className="admin-form-section-title">
                  {t("section_identity")}
                </h3>
                <p className="admin-form-section-description">
                  {t("section_identity_description")}
                </p>
              </div>
            </div>
            <div className="admin-form-grid admin-form-grid-2">
              <FormField label={t("first_name")} htmlFor="admin-first-name" required>
                <input
                  id="admin-first-name"
                  type="text"
                  value={adminUser.f_name}
                  onChange={(e) =>
                    setAdminUser((prev) => ({
                      ...prev,
                      f_name: e.target.value,
                    }))
                  }
                  required
                  className="admin-input"
                />
              </FormField>
              <FormField label={t("last_name")} htmlFor="admin-last-name">
                <input
                  id="admin-last-name"
                  type="text"
                  value={adminUser.l_name}
                  onChange={(e) =>
                    setAdminUser((prev) => ({
                      ...prev,
                      l_name: e.target.value,
                    }))
                  }
                  className="admin-input"
                />
              </FormField>
              <FormField
                label={t("username")}
                htmlFor="admin-username"
                className="md:col-span-2"
              >
                <input
                  id="admin-username"
                  type="text"
                  value={adminUser.username}
                  onChange={(e) =>
                    setAdminUser((prev) => ({
                      ...prev,
                      username: e.target.value,
                    }))
                  }
                  className="admin-input"
                />
              </FormField>
            </div>
          </section>

          <section className="admin-form-section">
            <div className="admin-form-section-header">
              <div>
                <h3 className="admin-form-section-title">
                  {t("section_security")}
                </h3>
                <p className="admin-form-section-description">
                  {t("section_security_description")}
                </p>
              </div>
            </div>
            <div className="admin-form-grid admin-form-grid-2">
              <FormField label={t("password")} htmlFor="admin-password">
                <input
                  id="admin-password"
                  type="password"
                  value={adminUser.password}
                  onChange={(e) =>
                    setAdminUser((prev) => ({
                      ...prev,
                      password: e.target.value,
                    }))
                  }
                  className="admin-input"
                  autoComplete="new-password"
                />
              </FormField>
              <FormField
                label={t("confirm_password")}
                htmlFor="admin-confirm-password"
              >
                <input
                  id="admin-confirm-password"
                  type="password"
                  value={adminUser.confirmPassword}
                  onChange={(e) =>
                    setAdminUser((prev) => ({
                      ...prev,
                      confirmPassword: e.target.value,
                    }))
                  }
                  className="admin-input"
                  autoComplete="new-password"
                />
              </FormField>
            </div>
          </section>
        </form>
      </AdminModal>
    </div>
  );
}
