import { expect, test } from "bun:test";

import { isAdminFlag, parseSellerSaasBody } from "./seller-saas";

test("accepts a seller listing and drops a blank icon URL", () => {
  expect(
    parseSellerSaasBody({
      name: " Harbor ",
      websiteUrl: "https://harbor.example",
      iconUrl: "",
      categories: ["security", "security"],
    }),
  ).toEqual({
    name: "Harbor",
    websiteUrl: "https://harbor.example",
    iconUrl: null,
    categories: ["security"],
    packages: [],
  });
});

test("accepts one custom category and maps a known label to its slug", () => {
  expect(
    parseSellerSaasBody({
      name: "Harbor",
      categories: ["Engineering", " Customer success "],
    }).categories,
  ).toEqual(["engineering", "Customer success"]);
});

test("rejects a second custom category", () => {
  expect(() =>
    parseSellerSaasBody({
      name: "Harbor",
      categories: ["People ops", "Legal"],
    }),
  ).toThrow("Add at most one custom category.");
});

test("rejects a category made only of symbols", () => {
  expect(() =>
    parseSellerSaasBody({ name: "Harbor", categories: ["@@@"] }),
  ).toThrow("Enter a category using letters, numbers, and spaces");
});

test("accepts package prices in cents", () => {
  expect(
    parseSellerSaasBody({
      name: "Harbor",
      packages: [
        { name: " Pro ", amountCents: 2900, billingInterval: "monthly" },
        { name: "Team", amountCents: 0, billingInterval: "yearly" },
      ],
    }).packages,
  ).toEqual([
    {
      name: "Pro",
      amountCents: 2900,
      currency: "USD",
      billingInterval: "monthly",
    },
    {
      name: "Team",
      amountCents: 0,
      currency: "USD",
      billingInterval: "yearly",
    },
  ]);
});

test("rejects a price that is not whole cents", () => {
  expect(() =>
    parseSellerSaasBody({
      name: "Harbor",
      packages: [
        { name: "Pro", amountCents: 29.5, billingInterval: "monthly" },
      ],
    }),
  ).toThrow("Each price must be zero or a positive amount in cents.");
});

test("rejects a one-character name", () => {
  expect(() => parseSellerSaasBody({ name: "A" })).toThrow(
    "Name must be between 2 and 200 characters.",
  );
});

test("treats the users.admin flag as a boolean", () => {
  expect(isAdminFlag(1)).toBe(true);
  expect(isAdminFlag(true)).toBe(true);
  expect(isAdminFlag(0)).toBe(false);
  expect(isAdminFlag(null)).toBe(false);
});
