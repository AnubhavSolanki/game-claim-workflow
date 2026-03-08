import { config } from "./config.js";

interface EmbedField {
  name: string;
  value: string;
  inline?: boolean;
}

interface DiscordEmbed {
  title: string;
  description?: string;
  color: number;
  fields?: EmbedField[];
  timestamp?: string;
  footer?: { text: string };
}

const Colors = {
  SUCCESS: 0x00ff00,
  ERROR: 0xff0000,
  INFO: 0x0099ff,
  WARNING: 0xffaa00,
} as const;

async function sendWebhook(embeds: DiscordEmbed[]): Promise<void> {
  const { webhookUrl } = config.discord;
  if (!webhookUrl) {
    console.log("[Discord] No webhook URL configured, skipping notification");
    return;
  }

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: "Game Claimer",
        embeds,
      }),
    });

    if (!response.ok) {
      console.error(`[Discord] Webhook failed: ${response.status} ${response.statusText}`);
    }
  } catch (error) {
    console.error("[Discord] Failed to send notification:", error);
  }
}

export async function notifySuccess(platform: string, message: string): Promise<void> {
  console.log(`[${platform}] SUCCESS: ${message}`);
  await sendWebhook([
    {
      title: `${platform} - Success`,
      description: message,
      color: Colors.SUCCESS,
      timestamp: new Date().toISOString(),
    },
  ]);
}

export async function notifyError(
  platform: string,
  step: string,
  error: unknown,
  screenshotBase64?: string
): Promise<void> {
  const errorMessage = error instanceof Error ? error.message : String(error);
  console.error(`[${platform}] ERROR at "${step}": ${errorMessage}`);

  const embed: DiscordEmbed = {
    title: `${platform} - Error`,
    color: Colors.ERROR,
    fields: [
      { name: "Step", value: step, inline: true },
      { name: "Error", value: errorMessage.slice(0, 1024) },
    ],
    timestamp: new Date().toISOString(),
  };

  await sendWebhook([embed]);

  if (screenshotBase64) {
    console.log(`[${platform}] Screenshot captured for error at "${step}"`);
  }
}

export async function notifySkip(platform: string, reason: string): Promise<void> {
  console.log(`[${platform}] SKIP: ${reason}`);
  await sendWebhook([
    {
      title: `${platform} - Skipped`,
      description: reason,
      color: Colors.WARNING,
      timestamp: new Date().toISOString(),
    },
  ]);
}

export interface ClaimResult {
  platform: string;
  claimed: string[];
  skipped: string[];
  errors: string[];
}

export async function notifySummary(results: ClaimResult[]): Promise<void> {
  const fields: EmbedField[] = [];

  for (const r of results) {
    const parts: string[] = [];
    if (r.claimed.length > 0) parts.push(`Claimed: ${r.claimed.join(", ")}`);
    if (r.skipped.length > 0) parts.push(`Skipped: ${r.skipped.join(", ")}`);
    if (r.errors.length > 0) parts.push(`Errors: ${r.errors.join(", ")}`);
    if (parts.length === 0) parts.push("No games found");

    fields.push({
      name: r.platform,
      value: parts.join("\n"),
    });
  }

  const totalClaimed = results.reduce((sum, r) => sum + r.claimed.length, 0);
  const totalErrors = results.reduce((sum, r) => sum + r.errors.length, 0);
  const color = totalErrors > 0 ? Colors.WARNING : Colors.SUCCESS;

  console.log(`[Summary] Claimed: ${totalClaimed}, Errors: ${totalErrors}`);
  await sendWebhook([
    {
      title: "Game Claim Run Complete",
      description: `Claimed **${totalClaimed}** game(s)${totalErrors > 0 ? `, **${totalErrors}** error(s)` : ""}`,
      color,
      fields,
      timestamp: new Date().toISOString(),
      footer: { text: "Game Claim Workflow" },
    },
  ]);
}
