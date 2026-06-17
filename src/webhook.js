const express = require('express');
const router = express.Router();
const { processReel } = require('./videoProcessor');
const { sendMessage } = require('./instagramSend');

const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const RATE_LIMIT_MAX = 5;
const MAX_CONCURRENT = 3;

// Map of senderId -> array of timestamps for recent requests
const userRequestLog = new Map();
let activeRequests = 0;

function isRateLimited(senderId) {
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW_MS;
  const timestamps = (userRequestLog.get(senderId) || []).filter((t) => t > windowStart);
  if (timestamps.length >= RATE_LIMIT_MAX) return true;
  timestamps.push(now);
  userRequestLog.set(senderId, timestamps);
  return false;
}

// Meta calls this once with a GET request when you set up the webhook,
// to confirm you control this endpoint.
router.get('/', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === process.env.VERIFY_TOKEN) {
    console.log('Webhook verified successfully');
    return res.status(200).send(challenge);
  }
  console.log('Webhook verification failed');
  res.sendStatus(403);
});

// Real events land here as POST requests
router.post('/', async (req, res) => {
  // Respond immediately so Meta doesn't retry/timeout. Actual work happens after.
  res.status(200).send('EVENT_RECEIVED');

  try {
    const entry = req.body.entry?.[0];
    const messagingEvent = entry?.messaging?.[0];
    if (!messagingEvent) return;

    const senderId = messagingEvent.sender?.id;
    const attachment = messagingEvent.message?.attachments?.[0];

    if (!senderId) return;

    if (attachment && (attachment.type === 'video' || attachment.type === 'ig_reel' || attachment.type === 'reel')) {
      const videoUrl = attachment.payload?.url;
      if (!videoUrl) {
        await sendMessage(senderId, "I couldn't find a video in that, can you resend the reel?");
        return;
      }

      if (isRateLimited(senderId)) {
        console.log(`Rate limited: ${senderId}`);
        await sendMessage(senderId, "You've sent a lot of reels recently — try again in an hour.");
        return;
      }

      if (activeRequests >= MAX_CONCURRENT) {
        console.log(`Concurrency limit reached, dropping request from ${senderId}`);
        await sendMessage(senderId, "I'm swamped right now, try again in a minute.");
        return;
      }

      console.log(`Received reel from ${senderId}`);
      await sendMessage(senderId, "Got it, give me a moment to watch this.");

      activeRequests++;
      try {
        const explanation = await processReel(videoUrl);
        await sendMessage(senderId, explanation);
      } finally {
        activeRequests--;
      }
    } else if (messagingEvent.message?.text) {
      await sendMessage(senderId, "Send me a reel and I'll explain what's going on in it.");
    }
  } catch (err) {
    console.error('Error handling webhook event:', err);
  }
});

module.exports = router;
