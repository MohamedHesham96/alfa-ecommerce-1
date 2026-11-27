import { render, screen, within } from "@testing-library/react";

import About from "../app/user/about/components/About";
import { LanguageProvider } from "../context/LanguageContext";

function renderAbout() {
  return render(
    <LanguageProvider>
      <About />
    </LanguageProvider>,
  );
}

describe("about page", () => {
  it("keeps both policy anchors and renders the policy text as structured content", () => {
    renderAbout();

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "تمكين",
    );

    const guarantee = document.querySelector("#Guarantee_Policy");
    expect(guarantee).toBeInTheDocument();
    expect(
      within(guarantee).getByText("الشاشات: ضمان لمدة سنتين."),
    ).toBeInTheDocument();
    expect(
      within(guarantee).getByText("لا يشمل الضمان الحالات التالية:"),
    ).toBeInTheDocument();
    expect(within(guarantee).getByText("الفحص:")).toBeInTheDocument();

    const returnPolicy = document.querySelector("#Return_Policy");
    expect(returnPolicy).toBeInTheDocument();
    expect(
      within(returnPolicy).getByText("مدة طلب الاسترجاع أو الاستبدال"),
    ).toBeInTheDocument();
    expect(within(returnPolicy).getByText("استرداد المبلغ")).toBeInTheDocument();
    expect(
      within(returnPolicy).getByText("الاستبدال"),
    ).toBeInTheDocument();
  });

  it("links the policy shortcuts to the matching anchors", () => {
    renderAbout();

    const guaranteeLinks = screen.getAllByRole("link", {
      name: "سياسة الضمان",
    });
    expect(
      guaranteeLinks.some(
        (link) => link.getAttribute("href") === "#Guarantee_Policy",
      ),
    ).toBe(true);

    const returnLinks = screen.getAllByRole("link", {
      name: "سياسة الاسترجاع",
    });
    expect(
      returnLinks.some(
        (link) => link.getAttribute("href") === "#Return_Policy",
      ),
    ).toBe(true);
  });
});
