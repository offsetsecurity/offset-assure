import { test, expect } from "@playwright/test";
import { signIn, open, watchErrors } from "./support.js";

/**
 * Settings is one page of cards with "On this page" beside it, and a register
 * opens with chips that count and filter.
 */
test.beforeEach(async ({ page }) => { await signIn(page); });

test("Settings: every section is a card on one page, and On this page takes you to it", async ({ page }) => {
  const errors = watchErrors(page);
  await page.setViewportSize({ width: 1440, height: 900 });
  await open(page, "settings");
  for (const name of ["Updates", "Outgoing email", "Daily digest"]) {
    await expect(page.locator(".settings-stack h2", { hasText: name }).first(), name).toBeVisible();
  }
  const nav = page.locator(".settings-nav a");
  // The list is read from the page itself, a moment after the sections have drawn.
  await expect.poll(() => nav.count(), { timeout: 8000 }).toBeGreaterThanOrEqual(4);
  await nav.filter({ hasText: "Daily digest" }).click();
  await expect.poll(async () => (await page.locator(".settings-stack h2", { hasText: "Daily digest" }).first().boundingBox())!.y, { timeout: 8000 }).toBeLessThan(300);
  expect(errors).toEqual([]);
});

test("A register shows its statuses as chips with counts, and a chip filters the rows", async ({ page }) => {
  const csrf = (await page.context().cookies()).find((c) => c.name === "offset_csrf")!.value;
  for (const [title, status] of [["Chip test open", "Open"], ["Chip test done", "Done"]] as const) {
    expect((await page.request.post("/api/v1/tasks", { headers: { "x-csrf-token": csrf }, data: { title, status } })).status()).toBe(201);
  }
  await open(page, "tasks");
  const chips = page.locator(".reg-chips button");
  await expect(chips.first()).toContainText("All");
  expect(await chips.count()).toBeGreaterThanOrEqual(2);
  const all = await page.locator("tbody tr").count();
  await chips.nth(1).click();
  await expect(chips.nth(1)).toHaveAttribute("aria-pressed", "true");
  expect(await page.locator("tbody tr").count()).toBeLessThanOrEqual(all);
  await chips.first().click();
  await expect(page.locator("tbody tr")).toHaveCount(all);
});
