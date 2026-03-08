# Discord Webhook Setup Guide

This guide walks you through setting up a Discord webhook to receive notifications from the Game Claim Workflow.

## Step 1: Create a Discord Server (or use an existing one)

If you don't have a server yet:
1. Open Discord (desktop app or browser)
2. Click the **+** button on the left sidebar
3. Select **Create My Own**
4. Choose **For me and my friends**
5. Name it whatever you like (e.g., "Game Notifications")

## Step 2: Create a Channel for Notifications

1. In your server, click the **+** next to "TEXT CHANNELS"
2. Name it something like `game-claims`
3. Click **Create Channel**

## Step 3: Create the Webhook

1. Right-click the channel you just created -> **Edit Channel**
2. Go to the **Integrations** tab in the left sidebar
3. Click **Webhooks**
4. Click **New Webhook**
5. Give it a name (e.g., "Game Claimer Bot")
6. Optionally set an avatar image
7. Click **Copy Webhook URL**

The URL will look like:
```
https://discord.com/api/webhooks/1234567890/abcdefghijklmnop...
```

## Step 4: Add to Your .env File

1. Copy `.env.example` to `.env` if you haven't already:
   ```bash
   cp .env.example .env
   ```

2. Open `.env` and paste the webhook URL:
   ```
   DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/1234567890/abcdefg...
   ```

## Step 5: Test It

Run the workflow once to verify notifications work:
```bash
npm run start:once
```

You should see messages appear in your Discord channel:
- **Green** embeds for successfully claimed games
- **Red** embeds for errors (with step and error message)
- **Orange** embeds for skipped games
- **Summary** embed at the end of each run

## Notification Types

### Success (Green)
Shows when a game is successfully claimed. Includes platform name and game info.

### Error (Red)
Shows when something goes wrong. Includes:
- **Step**: What the script was doing when it failed
- **Error**: The error message

### Skipped (Orange)
Shows when a game is skipped (already in library, not compatible, etc.)

### Summary (Green/Orange)
Sent at the end of every run. Shows total claimed, skipped, and errors across all platforms.

## Troubleshooting

**No notifications appearing?**
- Check that `DISCORD_WEBHOOK_URL` is set correctly in `.env`
- Make sure there are no extra spaces or quotes around the URL
- Check the console output for `[Discord] No webhook URL configured`

**Getting rate limited?**
- Discord webhooks have a rate limit of 30 requests per minute
- The workflow sends notifications per-game, which shouldn't hit this limit in normal use

**Want to test the webhook manually?**
```bash
curl -H "Content-Type: application/json" \
  -d '{"content": "Test notification from Game Claimer!"}' \
  YOUR_WEBHOOK_URL
```
