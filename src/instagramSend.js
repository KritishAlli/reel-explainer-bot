const axios = require('axios');

const GRAPH_API_VERSION = 'v21.0';

async function sendMessage(recipientId, text) {
  // graph.instagram.com is used for the standalone Instagram Login flow (no Facebook Page).
  // If you're on the Facebook Login for Business flow instead, swap this back to
  // graph.facebook.com/{version}/me/messages
  const url = `https://graph.instagram.com/${GRAPH_API_VERSION}/${process.env.IG_ID}/messages?access_token=${process.env.PAGE_ACCESS_TOKEN}`;

  // Instagram DM text has a length cap, so split long explanations into chunks
  const chunks = text.match(/[\s\S]{1,950}/g) || [text];

  for (const chunk of chunks) {
    try {
      await axios.post(url, {
        recipient: { id: recipientId },
        message: { text: chunk },
      });
    } catch (err) {
      console.error('Failed to send message:', err.response?.data || err.message);
    }
  }
}

module.exports = { sendMessage };
