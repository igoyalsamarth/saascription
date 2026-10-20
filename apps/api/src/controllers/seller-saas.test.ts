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
    websiteUrl: "harbor.example",
    iconUrl: null,
    categories: ["security"],
    packages: [],
  });
});

test("keeps a bare domain, strips https, and rejects http", () => {
  expect(
    parseSellerSaasBody({
      name: "Harbor",
      websiteUrl: "harbor.example",
      categories: ["security"],
    }).websiteUrl,
  ).toBe("harbor.example");
  expect(() =>
    parseSellerSaasBody({
      name: "Harbor",
      websiteUrl: "http://harbor.example",
      categories: ["security"],
    }),
  ).toThrow("http:// addresses are not allowed.");
  expect(
    parseSellerSaasBody({
      name: "Harbor",
      websiteUrl: "HTTPS://harbor.example/pricing",
      categories: ["security"],
    }).websiteUrl,
  ).toBe("harbor.example/pricing");
});

test("accepts one custom category and maps a known label to its slug", () => {
  expect(
    parseSellerSaasBody({
      name: "Harbor",
      categories: ["Engineering", " Customer success "],
    }).categories,
  ).toEqual(["engineering", "Customer success"]);
});

test("accepts more than one custom category beside a listed one", () => {
  expect(
    parseSellerSaasBody({
      name: "Harbor",
      categories: ["design", "People ops", "Legal", "people ops"],
    }).categories,
  ).toEqual(["design", "People ops", "Legal"]);
});

test("rejects categories that are only custom", () => {
  expect(() =>
    parseSellerSaasBody({
      name: "Harbor",
      categories: ["People ops"],
    }),
  ).toThrow("Choose at least one category from the list.");
});

test("rejects more than three categories", () => {
  expect(() =>
    parseSellerSaasBody({
      name: "Harbor",
      categories: ["engineering", "design", "People ops", "Legal"],
    }),
  ).toThrow("Choose at most 3 categories.");
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
      categories: ["security"],
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
      categories: ["security"],
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
