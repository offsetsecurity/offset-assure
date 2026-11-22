import { test, expect } from "@playwright/test";
import { signIn, open, watchErrors } from "./support.js";

/**
 * The shared page look: the summary band whose keys filter the list, and the
 * Dashboard's hero. Same shapes as in every Offset product.
 */
test.beforeEach(async ({ page }) => { await signIn(page); });

test("Controls: the summary band's keys filter the register", async ({ page }) => {
  const errors = watchErrors(page);
  await open(page, "controls");
  const keys = page.locator(".sum-keys button");
  expect(await keys.count()).toBeGreaterThanOrEqual(3);
  const all = await page.locator("tbody tr").count();
  await keys.first().click();
  await expect(keys.first()).toHaveAttribute("aria-pressed", "true");
  expect(await page.locator("tbody tr").count()).toBeLessThanOrEqual(all);
  await keys.first().click();
  await expect(keys.first()).toHaveAttribute("aria-pressed", "false");
  expect(errors).toEqual([]);
});

test("Evidence: the age keys filter the list", async ({ page }) => {
  const csrf = (await page.context().cookies()).find((c) => c.name === "offset_csrf")!.value;
  const today = new Date().toISOString().slice(0, 10);
  expect((await page.request.post("/api/v1/evidence", { headers: { "x-csrf-token": csrf }, data: { name: "Page kit fresh evidence", collectedDate: today } })).status()).toBe(201);
  await open(page, "evidence");
  const key = page.locator(".sum-keys button", { hasText: "Fresh" });
  await key.click();
  await expect(key).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("tbody tr", { hasText: "Page kit fresh evidence" })).toBeVisible();
});

test("Dashboard: the hero says where you stand, Up next leads to the plan, and each number leads to its screen", async ({ page }) => {
  await open(page, "dashboard");
  await expect(page.locator(".hero-title")).toBeVisible();
  const cards = page.locator(".kpi");
  expect(await cards.count()).toBeGreaterThanOrEqual(3);
  for (let i = 0; i < await cards.count(); i++) {
    expect(await cards.nth(i).getAttribute("href")).toMatch(/^#\/[a-z]+$/);
  }
  const next = page.locator(".upnext-card").first();
  if (await next.count()) {
    await next.click();
    await expect(page).toHaveURL(/#\/getready/);
  }
});
