import { fireEvent, render, screen } from "@testing-library/react";

import HeaderAccountChip from "../app/user/components/HeaderAccountChip";
import { LanguageProvider } from "../context/LanguageContext";

function renderChip(overrides = {}) {
  const onClick = jest.fn();

  render(
    <LanguageProvider>
      <HeaderAccountChip
        isAdmin={false}
        hasSession
        username="medo"
        addressLabel="البيت"
        addressMeta="القاهرة"
        addressTitle="البيت - العبور - القاهرة"
        onClick={onClick}
        {...overrides}
      />
    </LanguageProvider>,
  );

  return { onClick };
}

describe("header account chip", () => {
  it("shows the greeting, name, default address and its governorate", () => {
    const { onClick } = renderChip();

    expect(screen.getByText("مرحبا")).toBeInTheDocument();
    expect(screen.getByText("medo")).toBeInTheDocument();
    expect(screen.getByText("العنوان الافتراضي")).toBeInTheDocument();
    expect(screen.getByText("البيت · القاهرة")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button"));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("keeps the plain account chip when no default address is available", () => {
    renderChip({
      addressLabel: "",
      addressMeta: "",
      addressTitle: "",
    });

    expect(screen.getByText("medo")).toBeInTheDocument();
    expect(screen.queryByText("العنوان الافتراضي")).not.toBeInTheDocument();
  });

  it("shows the sign-in label for guests without an address section", () => {
    renderChip({
      hasSession: false,
      username: null,
      addressLabel: "",
      addressMeta: "",
      addressTitle: "",
    });

    expect(
      screen.getByRole("button", { name: "تسجيل الدخول / تسجيل" }),
    ).toBeInTheDocument();
  });
});
