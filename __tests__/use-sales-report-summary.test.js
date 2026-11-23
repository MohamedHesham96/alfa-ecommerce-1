import { act, renderHook, waitFor } from "@testing-library/react";

import { useSalesReportSummary } from "../app/admin/Reports/Sales/useSalesReportSummary";

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((done, fail) => {
    resolve = done;
    reject = fail;
  });
  return { promise, resolve, reject };
}

function filters(startDate) {
  return { datePreset: "CUSTOM", fromDate: startDate, toDate: startDate };
}

describe("useSalesReportSummary", () => {
  test("does not expose the previous summary while the next filters load", async () => {
    const requests = [];
    const request = jest.fn((nextFilters) => {
      const pending = deferred();
      requests.push({ filters: nextFilters, pending });
      return pending.promise;
    });

    const { result, rerender } = renderHook(
      ({ applied }) =>
        useSalesReportSummary({ filters: applied, enabled: true, request }),
      { initialProps: { applied: filters("2026-10-01") } },
    );

    expect(result.current.summary).toBeNull();
    expect(result.current.loading).toBe(true);

    await act(async () => {
      requests[0].pending.resolve({ range: { startDate: "2026-10-01" } });
    });
    expect(result.current.summary.range.startDate).toBe("2026-10-01");
    expect(result.current.loading).toBe(false);

    rerender({ applied: filters("2026-11-01") });

    expect(result.current.summary).toBeNull();
    expect(result.current.loading).toBe(true);
    expect(result.current.error).toBe(false);
  });

  test("ignores an older response after newer filters have rendered", async () => {
    const requests = [];
    const request = jest.fn((nextFilters) => {
      const pending = deferred();
      requests.push({ filters: nextFilters, pending });
      return pending.promise;
    });

    const { result, rerender } = renderHook(
      ({ applied }) =>
        useSalesReportSummary({ filters: applied, enabled: true, request }),
      { initialProps: { applied: filters("2026-10-01") } },
    );

    rerender({ applied: filters("2026-11-01") });

    await act(async () => {
      requests[1].pending.resolve({ range: { startDate: "2026-11-01" } });
    });
    await act(async () => {
      requests[0].pending.resolve({ range: { startDate: "2026-10-01" } });
    });

    expect(result.current.summary.range.startDate).toBe("2026-11-01");
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(false);
  });

  test("clears the summary and exposes an error when the current request fails", async () => {
    const request = jest.fn(() => Promise.reject(new Error("network down")));
    const applied = filters("2026-11-01");

    const { result } = renderHook(() =>
      useSalesReportSummary({
        filters: applied,
        enabled: true,
        request,
      }),
    );

    await waitFor(() => {
      expect(result.current.error).toBe(true);
    });
    expect(result.current.summary).toBeNull();
    expect(result.current.loading).toBe(false);
  });

  test("an older failure cannot clear a newer successful summary", async () => {
    const requests = [];
    const request = jest.fn((nextFilters) => {
      const pending = deferred();
      requests.push({ filters: nextFilters, pending });
      return pending.promise;
    });

    const { result, rerender } = renderHook(
      ({ applied }) =>
        useSalesReportSummary({ filters: applied, enabled: true, request }),
      { initialProps: { applied: filters("2026-10-01") } },
    );

    rerender({ applied: filters("2026-11-01") });

    await act(async () => {
      requests[1].pending.resolve({ range: { startDate: "2026-11-01" } });
    });
    await act(async () => {
      requests[0].pending.reject(new Error("old request failed"));
    });

    expect(result.current.summary.range.startDate).toBe("2026-11-01");
    expect(result.current.error).toBe(false);
    expect(result.current.loading).toBe(false);
  });

  test("does not request or report loading before the report is enabled", () => {
    const request = jest.fn();
    const applied = filters("2026-11-01");

    const { result } = renderHook(() =>
      useSalesReportSummary({
        filters: applied,
        enabled: false,
        request,
      }),
    );

    expect(request).not.toHaveBeenCalled();
    expect(result.current.summary).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(false);
  });
});
