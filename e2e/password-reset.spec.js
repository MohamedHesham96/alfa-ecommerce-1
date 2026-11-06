const { test, expect } = require("@playwright/test");

const API = "http://localhost:8787";
const SMTP = "http://localhost:3026";

async function messagesFor(request, email) {
  const response = await request.get(
    `${SMTP}/messages?to=${encodeURIComponent(email)}`,
  );
  expect(response.ok()).toBeTruthy();
  return response.json();
}

async function waitForMessage(request, email, subject) {
  let found = null;
  await expect
    .poll(
      async () => {
        const messages = await messagesFor(request, email);
        found = messages.find((message) => message.subject.includes(subject));
        return Boolean(found);
      },
      { timeout: 30_000, intervals: [250, 500, 1000] },
    )
    .toBe(true);
  return found;
}

test("complete forgot-password lifecycle: signup → confirm → reset → login", async ({
  page,
  request,
}) => {
  const suffix = Date.now();
  const username = `e2euser${suffix}`;
  const email = `e2e.${suffix}@example.com`;
  const phone = `01${String(suffix).slice(-9)}`;
  const oldPassword = "oldPassword123";
  const newPassword = "brandNewPassword123";

  const signup = await request.post(`${API}/api/auth/signup`, {
    data: {
      username,
      firstName: "E2E",
      lastName: "User",
      email,
      phone,
      address: "Cairo",
      governorateId: 1,
      password: oldPassword,
      repeatPassword: oldPassword,
    },
  });
  expect(signup.status()).toBe(201);

  // Complete the real confirmation-email flow so the account becomes active.
  const confirmation = await waitForMessage(
    request,
    email,
    "Confirm your email address",
  );
  const confirmLink = confirmation.html.match(
    /https?:\/\/[^"'\s]+confirm-email[^"'\s]*/,
  )?.[0];
  expect(confirmLink).toBeTruthy();
  const confirmResponse = await request.get(confirmLink, { maxRedirects: 0 });
  expect([302, 303]).toContain(confirmResponse.status());

  await request.delete(`${SMTP}/messages`);

  // Request a reset from the actual sign-in UI. The app defaults to Arabic,
  // so switch to English using the real UI control before asserting labels.
  await page.goto("/signin");
  const languageToggle = page.getByRole("button", {
    name: /تغيير اللغة|Change language/,
  });
  if (!(await page.getByText("Forgot Password?").isVisible().catch(() => false))) {
    await languageToggle.click();
  }
  await expect(page.getByText("Forgot Password?")).toBeVisible();
  await page.getByText("Forgot Password?").click();
  await page.locator('#form_email input[type="email"]').fill(email);
  await page.locator('#form_email button[type="submit"]').first().click();
  await expect(
    page.getByText(/reset link has been sent/i),
  ).toBeVisible();

  // The email is real SMTP mail delivered to the test server.
  const resetEmail = await waitForMessage(
    request,
    email,
    "Security Alert: Reset Your Password",
  );
  const resetLink = resetEmail.html.match(
    /https?:\/\/[^"'\s]+forgotpassword\?token=[^"'\s]*/,
  )?.[0];
  expect(resetLink).toBeTruthy();
  expect(resetLink).toContain("/forgotpassword?token=");

  // Open the link from the email and set a new password.
  await page.goto(resetLink);
  await expect(page.getByLabel("New Password")).toBeVisible();
  await page.getByLabel("New Password").fill(newPassword);
  await page.getByLabel("Confirm Password").fill(newPassword);
  await page.getByRole("button", { name: "Save" }).click();
  await expect(
    page.getByRole("status").getByText(/Password updated successfully/i),
  ).toBeVisible();

  await page.getByText("Back to sign in").click();
  await expect(page).toHaveURL(/\/signin$/);

  // The old password must fail and the new password must log in.
  const oldLogin = await request.post(`${API}/api/auth/login`, {
    data: { username, password: oldPassword },
  });
  expect(oldLogin.status()).toBe(401);

  await page.getByPlaceholder("Username").fill(username);
  await page.getByPlaceholder("Password").fill(newPassword);
  await page.getByRole("button", { name: "Login" }).click();

  await page.waitForFunction(() =>
    Boolean(window.localStorage.getItem("accessToken")),
  );
  const accessToken = await page.evaluate(() =>
    window.localStorage.getItem("accessToken"),
  );
  expect(accessToken).toBeTruthy();

  const profile = await request.get(`${API}/api/users`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  expect(profile.status()).toBe(200);
});
