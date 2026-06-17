# Reel Explainer Bot

An Instagram bot: send it a reel via DM, it watches the frames and replies with an explanation (jokes, references, subculture context you might be missing).

## How it works

1. Someone sends a reel to your Instagram account's DMs.
2. Meta sends a webhook event to your server with a URL pointing to the video.
3. The server downloads the video, pulls out ~6 frames with ffmpeg.
4. The frames go to Claude's API with a prompt asking for an explanation.
5. The bot replies in the same DM thread with the explanation.

Note: this version only looks at visual frames, not audio. Reels where the joke is purely spoken/in the audio (not visible on screen) won't be explained well yet. That's a natural v2 addition (e.g. via a speech-to-text API) if you want it later.

## Step 1: Convert your Instagram account

In the Instagram app: Settings → Account type and tools → Switch to professional account → choose Business or Creator. This is required; personal accounts can't use the Messaging API.

## Step 2: Create a Meta Developer app

1. Go to https://developers.facebook.com/ and log in with the Facebook account linked to your Instagram.
2. Create a new app, type "Business."
3. In the app dashboard, add the "Instagram" product (under Graph API / Messaging).
4. Connect your Instagram Business account to the app when prompted.

## Step 3: Get an access token

In the app dashboard, under Instagram → API setup, generate an access token for your account. Make sure it includes the `instagram_manage_messages` permission. Copy this token — you'll need it for `PAGE_ACCESS_TOKEN`.

While your app is in development mode, this token only works for accounts you've explicitly added as a "tester" in the app's Roles settings (you can add your own account so you can test with yourself).

## Step 4: Get an Anthropic API key

Go to https://console.anthropic.com/ → API Keys → create one. Copy it for `ANTHROPIC_API_KEY`. Note this is billed separately from any Claude.ai subscription — pay-as-you-go based on usage.

## Step 5: Set up the project locally (optional, for testing)

```bash
npm install
cp .env.example .env
# fill in .env with your values
npm start
```

## Step 6: Deploy

Push this folder to a GitHub repo, then:

**Railway**: New Project → Deploy from GitHub repo → select your repo → in the Variables tab, add the same values from `.env.example` → deploy. Railway gives you a public URL like `https://yourapp.up.railway.app`.

**Render**: New → Web Service → connect your repo → Build command `npm install`, Start command `npm start` → add the same environment variables → deploy.

Either way, note the public URL — you'll need it next.

## Step 7: Subscribe the webhook

1. In the Meta app dashboard, go to Instagram → Webhooks (or Configuration).
2. Click "Edit Subscription" for the messages field.
3. Callback URL: `https://your-deployed-url.com/webhook`
4. Verify Token: whatever you set as `VERIFY_TOKEN` in your environment variables — must match exactly.
5. Subscribe to the `messages` field at minimum.

Meta will immediately send a verification GET request to your callback URL. If your server is deployed and the token matches, this succeeds automatically.

## Step 8: Test it

From an account added as a tester (likely your own), send a reel via DM to your Instagram business account. You should get an acknowledgment message, then the explanation a few seconds later (frame extraction + Claude's response take a moment).

## Step 9: Going public (optional)

While in development mode, only tester accounts can message the bot. To let anyone use it, submit the app for App Review and request the `instagram_manage_messages` permission for production use — Meta will review your use case before approving.

## Costs to be aware of

- Anthropic API charges per request, scaled by number of images sent and response length. Sending 6 frames per reel is a deliberate balance between explanation quality and cost.
- Free tiers on Railway/Render have monthly usage caps — fine for personal/light use, but check current limits if this gets heavy traffic.
