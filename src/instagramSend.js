const axios = require('axios');

const GRAPH_API_VERSION = 'v21.0';

async function sendMessage(recipientId, text) {
  const url = `https://graph.facebook.com/${GRAPH_API_VERSION}/me/messages?access_token=${process.env.PAGE_ACCESS_TOKEN}`;

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
