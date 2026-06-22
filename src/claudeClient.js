const Anthropic = require('@anthropic-ai/sdk');

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Uses Claude to analyze frames of video and explain the content of the reel
async function explainFrames(base64Frames) {
  const imageBlocks = base64Frames.map((data) => ({
    type: 'image',
    source: { type: 'base64', media_type: 'image/png', data },
  }));

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 500,
    messages: [
      {
        role: 'user',
        content: [
          ...imageBlocks,
          {
            type: 'text',
            text:
              "These are sequential frames from an Instagram reel, in order. Explain what's happening in it: the joke, reference, meme format, or context it assumes the viewer already has. Write for someone outside that specific niche who needs the background filled in. Be concise (under 150 words) and skip filler like 'this reel shows'.",
          },
        ],
      },
    ],
  });

  const textBlock = message.content.find((c) => c.type === 'text');
  return textBlock ? textBlock.text : "Couldn't generate an explanation for this one.";
}

module.exports = { explainFrames };
