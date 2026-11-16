import { render, screen, waitFor } from "@testing-library/react";

jest.mock("../app/admin/services/systemConfigurationService", () => ({
  fetchSystemSettingsAccess: jest.fn(),
}));

import {
  SystemSettingsAccessProvider,
  useSystemSettingsAccess,
} from "../app/admin/context/SystemSettingsAccessContext";
import { fetchSystemSettingsAccess } from "../app/admin/services/systemConfigurationService";

function Probe() {
  const { status, canAccess, canEdit } = useSystemSettingsAccess();
  return (
    <div>
      <span data-testid="status">{status}</span>
      <span data-testid="access">{String(canAccess)}</span>
      <span data-testid="edit">{String(canEdit)}</span>
    </div>
  );
}

function renderProvider() {
  return render(
    <SystemSettingsAccessProvider>
      <Probe />
    </SystemSettingsAccessProvider>,
  );
}

describe("system settings access provider", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    localStorage.setItem("role", "ADMIN");
  });

  it("uses the backend capability response and ignores stale localStorage flags", async () => {
    localStorage.setItem("systemSettingsAccess", "true");
    fetchSystemSettingsAccess.mockResolvedValue({
      internalAdmin: false,
      clientAdmin: true,
      canAccessSettings: true,
      canEditSettings: false,
      visibleSettingCount: 2,
    });

    renderProvider();

    await waitFor(() =>
      expect(screen.getByTestId("status")).toHaveTextContent("ready"),
    );
    expect(screen.getByTestId("access")).toHaveTextContent("true");
    expect(screen.getByTestId("edit")).toHaveTextContent("false");
  });

  it("fails closed when the capability request fails", async () => {
    fetchSystemSettingsAccess.mockRejectedValue(new Error("forbidden"));

    renderProvider();

    await waitFor(() =>
      expect(screen.getByTestId("status")).toHaveTextContent("ready"),
    );
    expect(screen.getByTestId("access")).toHaveTextContent("false");
    expect(screen.getByTestId("edit")).toHaveTextContent("false");
  });

  it("does not call the admin endpoint for a non-admin session", async () => {
    localStorage.setItem("role", "USER");

    renderProvider();

    await waitFor(() =>
      expect(screen.getByTestId("status")).toHaveTextContent("ready"),
    );
    expect(fetchSystemSettingsAccess).not.toHaveBeenCalled();
    expect(screen.getByTestId("access")).toHaveTextContent("false");
  });
});
