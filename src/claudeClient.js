const Anthropic = require('@anthropic-ai/sdk');

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

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
              "These are sequential frames from an Instagram reel, in order. Explain this reel using this 3 sentence format. Sentence 1: Briefly explain the topic of this reel (ex: This reel is about a common github command called git push.). Sentence 2: Fill in the context required to understand this reel that someone unfamiliar with the topic would need to know. Sentence 3: Explain how the context ties in to the content of the reel. Keep your response to this format, with no filler words or titles, just a block of text that explains the reel."
          },
        ],
      },
    ],
  });

  const textBlock = message.content.find((c) => c.type === 'text');
  return textBlock ? textBlock.text : "Couldn't generate an explanation for this one.";
}

module.exports = { explainFrames };


