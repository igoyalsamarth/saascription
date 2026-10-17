import { expect, test } from "bun:test";

import { parseCreateSellerSaasBody } from "./seller-saas";

test("accepts a seller listing and drops a blank icon URL", () => {
  expect(
    parseCreateSellerSaasBody({
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
  });
});

test("rejects an unknown category", () => {
  expect(() =>
    parseCreateSellerSaasBody({ name: "Harbor", categories: ["nope"] }),
  ).toThrow("Unknown category.");
});

test("rejects a one-character name", () => {
  expect(() => parseCreateSellerSaasBody({ name: "A" })).toThrow(
    "Name must be between 2 and 200 characters.",
  );
});
