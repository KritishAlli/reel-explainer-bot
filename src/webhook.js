const express = require('express');
const router = express.Router();
const { processReel } = require('./videoProcessor');
const { sendMessage } = require('./instagramSend');

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
  console.log('Webhook POST received:', JSON.stringify(req.body));
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

      console.log(`Received reel from ${senderId}`);
      await sendMessage(senderId, "Got it, give me a moment to watch this.");

      const explanation = await processReel(videoUrl);
      await sendMessage(senderId, explanation);
    } else if (messagingEvent.message?.text) {
      await sendMessage(senderId, "Send me a reel and I'll explain what's going on in it.");
    }
  } catch (err) {
    console.error('Error handling webhook event:', err);
  }
});

module.exports = router;
