/**
 * @jest-environment node
 */
import { NextRequest } from "next/server";
import { proxy } from "../proxy";

describe("proxy server action guard", () => {
  it("rejects a malformed Next-Action header before it reaches the App Router", async () => {
    const request = new NextRequest("http://localhost/", {
      method: "POST",
      headers: { "next-action": "x" },
    });

    const response = await proxy(request);

    expect(response.status).toBe(400);
  });

  it("lets a valid-format Server Action id through", async () => {
    const request = new NextRequest("http://localhost/", {
      method: "POST",
      headers: { "next-action": "0".repeat(42) },
    });

    const response = await proxy(request);

    expect(response.status).toBe(200);
    expect(response.headers.get("x-middleware-next")).toBe("1");
  });

  it("lets normal requests through", async () => {
    const request = new NextRequest("http://localhost/");
    const response = await proxy(request);

    expect(response.status).toBe(200);
    expect(response.headers.get("x-middleware-next")).toBe("1");
  });
});
