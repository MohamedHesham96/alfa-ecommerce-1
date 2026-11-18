import { AUTH_USERNAME_PATTERN } from "../app/components/auth/authValidation";

describe("AUTH_USERNAME_PATTERN", () => {
  it.each([
    "john",
    "john.doe",
    "john_doe-99",
    "A1b",
    "hesham-mohamed11",
    "john123",
    "a12",
  ])("accepts %s", (username) => {
    expect(AUTH_USERNAME_PATTERN.test(username)).toBe(true);
  });

  it.each([
    "123",
    "1234567890",
    "123john",
    "1john",
    "1a2",
    "12.34",
    "123_456",
    "123-456",
    "123.456_789",
    "ab",
    "a".repeat(31),
    " john",
    "john ",
    "john doe",
    "_john",
    "john-",
    ".john",
    "john@doe",
    "john$",
  ])("rejects %s", (username) => {
    expect(AUTH_USERNAME_PATTERN.test(username)).toBe(false);
  });
});
