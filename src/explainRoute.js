const express = require('express');
const router = express.Router();
const { processReelFromPublicUrl } = require('./videoProcessor');

function requireApiKey(req, res, next) {
  if (req.headers['x-api-key'] !== process.env.API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

router.post('/', requireApiKey, async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: 'url is required' });

  try {
    const explanation = await processReelFromPublicUrl(url);
    res.json({ explanation });
  } catch (err) {
    console.error('Error processing reel:', err);
    res.status(500).json({ error: 'Failed to process reel' });
  }
});

module.exports = router;
