import { render, screen } from "@testing-library/react";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
}));

jest.mock("../context/LanguageContext", () => ({
  useLanguage: () => ({
    t: (key) => key,
  }),
}));

jest.mock("../app/components/forbidden/ForbiddenScreen", () => ({
  __esModule: true,
  default: ({ title }) => (
    <div data-testid="sales-report-disabled">{title}</div>
  ),
}));

import { AppConfigProvider } from "../context/AppConfigContext";
import SalesReportFeatureGate from "../app/admin/Reports/Sales/SalesReportFeatureGate";

function renderGate(config) {
  return render(
    <AppConfigProvider initialConfig={config}>
      <SalesReportFeatureGate>
        <div data-testid="sales-report-content">report</div>
      </SalesReportFeatureGate>
    </AppConfigProvider>,
  );
}

describe("sales report feature gate", () => {
  it("shows the disabled screen and hides report content when disabled", () => {
    renderGate({ "features.salesReport.enabled": false });

    expect(screen.getByTestId("sales-report-disabled")).toBeInTheDocument();
    expect(screen.queryByTestId("sales-report-content")).not.toBeInTheDocument();
  });

  it("renders report content when enabled", () => {
    renderGate({ "features.salesReport.enabled": true });

    expect(screen.getByTestId("sales-report-content")).toBeInTheDocument();
    expect(screen.queryByTestId("sales-report-disabled")).not.toBeInTheDocument();
  });
});
