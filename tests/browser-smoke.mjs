import { chromium } from "@playwright/test";
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";

await mkdir("test-results", { recursive: true });
const browser = await chromium.launch({ channel: "chrome", headless: true });
try {
  for (const width of [375, 430, 1440]) {
    const page = await browser.newPage({ viewport: { width, height: 900 } });
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto("http://localhost:3000/login", { waitUntil: "networkidle" });
    await page.getByRole("heading", { name: "Selamat pulang." }).waitFor();
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    await page.screenshot({ path: `test-results/login-${width}-light.png`, fullPage: true });
    await page.getByRole("button", { name: "Ganti mode terang atau gelap" }).click();
    await page.waitForFunction(() => document.documentElement.classList.contains("dark"));
    await page.screenshot({ path: `test-results/login-${width}-dark.png`, fullPage: true });
    await page.goto("http://localhost:3000/profile");
    assert.match(page.url(), /\/login/);
    await page.goto("http://localhost:3000/onboarding?token=bad");
    await page.getByRole("alert").filter({ hasText: "Link undangan tidak valid" }).waitFor();
    assert.deepEqual(errors, []);
    await page.close();
  }
  console.info("Browser smoke passed: 375/430/1440px, light/dark, protection, invalid onboarding.");
} finally {
  await browser.close();
}
