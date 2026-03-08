import type { Page } from "puppeteer";
import { waitAndClick, fillField, delay } from "../utils.js";
import { config } from "../config.js";

const SELECTORS = {
  clickHereLink: `//a[text()='here']`,
  copyCodeInput: "[data-a-target='copy-code-input'] input",
  gameCodeField: "input#primedeal_game_code",
  emailField: "input#primedeal_email",
  emailValidateField: "input#primedeal_email_validate",
  submitButton: "input#submitbutton",
};

export async function claimLegacyGame(page: Page): Promise<void> {
  // Click "here" link to go to Legacy Games
  await waitAndClick(page, SELECTORS.clickHereLink, { xpath: true });
  console.log("[Legacy] Clicked 'here' link");

  await delay(3000);

  // Copy the redeem code
  const codeInput = await page.$(SELECTORS.copyCodeInput);
  if (!codeInput) throw new Error("Could not find redeem code input");
  const legacyCode = await codeInput.evaluate((el) => (el as HTMLInputElement).value);
  if (!legacyCode) throw new Error("Redeem code is empty");
  console.log(`[Legacy] Copied redeem code: ${legacyCode}`);

  // Switch to the Legacy Games tab
  const pages = await page.browser().pages();
  const legacyPage = pages[pages.length - 1];
  if (!legacyPage || legacyPage === page) throw new Error("Legacy Games tab not found");
  await legacyPage.bringToFront();
  console.log("[Legacy] Switched to Legacy Games tab");

  await delay(2000);

  // Fill the code
  await fillField(legacyPage, SELECTORS.gameCodeField, legacyCode, { timeout: 5000 });
  console.log("[Legacy] Filled game code");

  // Fill email
  const email = config.credentials.legacyGamesEmail;
  if (!email) throw new Error("LEGACY_GAMES_EMAIL not configured in .env");
  await fillField(legacyPage, SELECTORS.emailField, email, { timeout: 5000 });
  console.log("[Legacy] Filled email");

  // Fill confirm email
  await fillField(legacyPage, SELECTORS.emailValidateField, email, { timeout: 5000 });
  console.log("[Legacy] Filled confirm email");

  // Click submit
  await waitAndClick(legacyPage, SELECTORS.submitButton, { timeout: 5000 });
  console.log("[Legacy] Clicked submit");

  await delay(3000);

  // Switch back to main tab
  await page.bringToFront();
}
