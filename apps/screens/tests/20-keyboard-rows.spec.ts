import { test, expect } from "@playwright/test";
import { signIn, open, watchErrors } from "./support.js";

/**
 * A record in a list opens from the keyboard as well as the mouse: Tab
 * reaches the row, Enter or Space opens it, Escape closes it (WCAG 2.1.1).
 */
test.beforeEach(async ({ page }) => { await signIn(page); });

test("Keyboard: a risk row opens with Enter and closes with Escape", async ({ page }) => {
  const errors = watchErrors(page);
  await open(page, "risks");
  const csrf = (await page.context().cookies()).find((c) => c.name === "offset_csrf")!.value;
  expect((await page.request.post("/api/v1/risks", { headers: { "x-csrf-token": csrf }, data: { title: "A risk to open by keyboard", likelihood: 2, impact: 2 } })).status()).toBe(201);
  await page.reload();
  const row = page.locator(".content tbody tr.clickable", { hasText: "A risk to open by keyboard" });
  await expect(row).toHaveAttribute("tabindex", "0");
  await row.focus();
  await page.keyboard.press("Enter");
  await expect(page.locator(".modal")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.locator(".modal")).toHaveCount(0);
  expect(errors).toEqual([]);
});

test("Keyboard: a requirement opens with Space from its title cell", async ({ page }) => {
  await open(page, "controls");
  const cell = page.locator("tbody td.clickable").first();
  await expect(cell).toHaveAttribute("tabindex", "0");
  await cell.focus();
  await page.keyboard.press(" ");
  await expect(page.locator(".modal")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.locator(".modal")).toHaveCount(0);
});

test("Keyboard: typing in a field inside a row does not open the record", async ({ page }) => {
  await open(page, "controls");
  const owner = page.locator("tbody input.owner-input").first();
  if (await owner.count() === 0) test.skip(true, "No owner field on this screen");
  await owner.focus();
  await page.keyboard.press(" ");
  await expect(page.locator(".modal")).toHaveCount(0);
});
