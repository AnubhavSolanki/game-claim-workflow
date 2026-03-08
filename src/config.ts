import dotenv from "dotenv";
import path from "path";

dotenv.config();

export const config = {
  chrome: {
    userDataDir: path.resolve(process.env.CHROME_USER_DATA_DIR || "./chrome-data"),
    headless: process.env.HEADLESS === "true",
    executablePath: process.env.CHROME_EXECUTABLE_PATH || "",
  },
  platforms: {
    amazon: process.env.ENABLE_AMAZON !== "false",
    epic: process.env.ENABLE_EPIC !== "false",
  },
  credentials: {
    legacyGamesEmail: process.env.LEGACY_GAMES_EMAIL || "",
  },
  discord: {
    webhookUrl: process.env.DISCORD_WEBHOOK_URL || "",
  },
  schedule: {
    cron: process.env.CRON_SCHEDULE || "0 14 * * *",
    runOnce: process.argv.includes("--once"),
  },
};
